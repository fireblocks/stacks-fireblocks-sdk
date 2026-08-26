/**
 * Proves the CALLDATA the SDK actually puts on the wire for the two paths where a mistake
 * moves money somewhere the customer did not choose, and does so silently:
 *
 *  (d) carry-forward — a rotation must RE-SUPPLY the committed reward destination. Passing
 *      `none` makes the signer manager map-delete the pox-addr, reverting the staker to
 *      sBTC-to-principal. This is the original FBS-148 defect.
 *  (e) the clear signal — `rewardBtcAddress: null` must produce `none` and genuinely remove
 *      the entry. If null did NOT clear, a customer who switched to sBTC would keep
 *      receiving BTC at an address they believe they removed.
 *
 * Both were previously "true by construction". These assert on the Clarity argument handed
 * to the contract call, so the claim is checked rather than reasoned about.
 */

jest.mock("../services/fireblocks.service", () => ({
  FireblocksService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchBondMembership: jest.fn(),
    fetchEligibleUpdateBondRegistration: jest.fn(),
  };
});

import { StacksSDK } from "../StacksSDK";
import { fetchBondMembership, fetchEligibleUpdateBondRegistration } from "@stacks/bitcoin-staking";
import { poxAddressToTuple } from "@stacks/stacking";
import { Cl, serializeCVBytes } from "@stacks/transactions";

const { InMemoryLockRecordStore } = jest.requireActual("../staking/bonds/unlock-bytes-store");

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const FAKE_INLINE_PEM = ["-----BEGIN", "PRIVATE KEY-----", "not-a-key", "-----END", "PRIVATE KEY-----"].join(" ");
const BOND_INDEX = 3;
const OLD_MANAGER = `${BOOT_ADDR}.old-manager`;
const NEW_MANAGER = `${BOOT_ADDR}.new-manager`;
// Published BIP-173 test vector (not a secret).
const REWARD_ADDR = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";
const MAX_FEE = BigInt(5000);

/** Captures the args handed to the contract call, then aborts before signing/broadcast. */
function makeSdk(): { sdk: any; captured: { args?: any[] } } {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  sdk.signerManagerAllowedError = jest.fn().mockReturnValue(undefined);
  sdk.resolveNonce = jest.fn().mockResolvedValue(BigInt(1));
  sdk.setLockRecordStore(new InMemoryLockRecordStore());

  const captured: { args?: any[] } = {};
  sdk.buildPox5Call = jest.fn(async (_fn: string, args: any[]) => {
    captured.args = args;
    throw new Error("stop-before-signing");
  });
  return { sdk, captured };
}

async function seedRecordWithReward(sdk: any) {
  await sdk.lockRecordStore.saveRecord(sdk.address, BOND_INDEX, {
    bondIndex: BOND_INDEX,
    unlockBytes: new Uint8Array([1]),
    lockAddress: "lock-addr",
    unlockHeight: 900,
    amountSats: BigInt(100_000),
    isL1Lock: true,
    signerManager: OLD_MANAGER,
    rewardBtcAddress: REWARD_ADDR,
    rewardMaxFeeSats: MAX_FEE,
  });
}

/** The exact bytes the contract should receive for this destination. */
const expectedCalldataHex = (): string => {
  const tuple = Cl.tuple({ "pox-addr": poxAddressToTuple(REWARD_ADDR), "max-fee": Cl.uint(MAX_FEE) });
  return Buffer.from(serializeCVBytes(tuple)).toString("hex");
};

beforeEach(() => {
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue({ bondIndex: BOND_INDEX });
  (fetchEligibleUpdateBondRegistration as jest.Mock).mockReset().mockResolvedValue({ ok: true });
});

describe("updateBondRegistration — the calldata actually sent", () => {
  it("(d) RE-SUPPLIES the committed destination when the caller changes nothing", async () => {
    const { sdk, captured } = makeSdk();
    await seedRecordWithReward(sdk);

    await sdk.updateBondRegistration(NEW_MANAGER, OLD_MANAGER, { nonce: BigInt(1) });

    const calldataArg = captured.args![2];
    // Must be `(some <buff>)`, NOT `none` — none is the map-delete branch.
    expect(calldataArg.type).toBe("some");
    const hex: string = calldataArg.value.value.replace(/^0x/, "");
    // ...and the buffer must be exactly this destination's pox-addr tuple.
    expect(hex).toBe(expectedCalldataHex());
  });

  it("(e) sends `none` when the caller passes rewardBtcAddress: null", async () => {
    const { sdk, captured } = makeSdk();
    await seedRecordWithReward(sdk);

    await sdk.updateBondRegistration(NEW_MANAGER, OLD_MANAGER, {
      nonce: BigInt(1),
      rewardBtcAddress: null,
    });

    // `none` is what makes the manager map-delete the pox-addr — the intended clear.
    expect(captured.args![2].type).toBe("none");
  });

  it("(e) a null clear does not merely fall back to the persisted address", async () => {
    // The specific regression: `??` treats null as nullish, so a naive carry-forward would
    // resurrect the stored address and the customer would keep receiving BTC after opting out.
    const { sdk, captured } = makeSdk();
    await seedRecordWithReward(sdk);

    await sdk.updateBondRegistration(NEW_MANAGER, OLD_MANAGER, {
      nonce: BigInt(1),
      rewardBtcAddress: null,
    });

    const calldataArg = captured.args![2];
    expect(calldataArg.type).not.toBe("some");
    expect(JSON.stringify(calldataArg)).not.toContain(expectedCalldataHex());
  });

  it("sends an explicitly supplied destination in preference to the stored one", async () => {
    const { sdk, captured } = makeSdk();
    await seedRecordWithReward(sdk);
    const other = "tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7";

    await sdk.updateBondRegistration(NEW_MANAGER, OLD_MANAGER, {
      nonce: BigInt(1),
      rewardBtcAddress: other,
      rewardMaxFeeSats: BigInt(9999),
    });

    const calldataArg = captured.args![2];
    expect(calldataArg.type).toBe("some");
    const expectedOther = Buffer.from(
      serializeCVBytes(Cl.tuple({ "pox-addr": poxAddressToTuple(other), "max-fee": Cl.uint(BigInt(9999)) })),
    ).toString("hex");
    expect(calldataArg.value.value.replace(/^0x/, "")).toBe(expectedOther);
  });
});
