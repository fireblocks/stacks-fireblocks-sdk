/**
 * A deterministic external id for the register-for-bond signing request (review F4).
 *
 * The funding leg derives its id, so a retry reuses it and Fireblocks de-duplicates. The
 * register leg passed `undefined` unless the caller supplied `opts.externalId` — and the
 * desktop app supplies none — so Fireblocks assigned a fresh id and every retry after an
 * approval timeout opened a SECOND signing request for the same registration. Under a
 * 1-of-N approval rule that is another item for a human to act on, and only one of the
 * two can ever be used.
 *
 * The id is keyed on the nonce because the signature covers a nonce-dependent sighash: a
 * different nonce is a genuinely different signing request and must not resolve to the
 * earlier one.
 */

jest.mock("../services/fireblocks.service", () => {
  const actual = jest.requireActual("../services/fireblocks.service");
  return {
    FireblocksService: Object.assign(
      jest.fn().mockImplementation(() => ({})),
      {
        isTerminalTransferFailure:
          actual.FireblocksService.isTerminalTransferFailure,
        isDuplicateExternalIdError:
          actual.FireblocksService.isDuplicateExternalIdError,
      },
    ),
  };
});

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchBondAllowance: jest.fn(),
    fetchPoxInfo: jest.fn(),
    fetchBond: jest.fn(),
    minUstxForSatsAmount: jest.fn(),
    fetchAccountStatus: jest.fn(),
    fetchEligibleRegisterForBond: jest.fn(),
    firstPox5RewardCycle: jest.fn(),
    buildRegisterMetadata: jest.fn(),
    bondPeriodToRewardCycle: jest.fn(),
    fetchConstructLockupOutputScript: jest.fn(),
    fetchBondMembership: jest.fn(),
  };
});

jest.mock("@stacks/transactions", () => {
  const actual = jest.requireActual("@stacks/transactions");
  return { ...actual, fetchCallReadOnlyFunction: jest.fn() };
});

import { TransactionStateEnum } from "@fireblocks/ts-sdk";
import { StacksSDK } from "../StacksSDK";
import { FireblocksTransferError } from "../utils/FireblocksSigner";
import {
  fetchBondAllowance,
  fetchPoxInfo,
  fetchBond,
  minUstxForSatsAmount,
  fetchAccountStatus,
  fetchEligibleRegisterForBond,
  firstPox5RewardCycle,
  buildRegisterMetadata,
  bondPeriodToRewardCycle,
  fetchConstructLockupOutputScript,
  fetchBondMembership,
} from "@stacks/bitcoin-staking";
import { fetchCallReadOnlyFunction } from "@stacks/transactions";

const { InMemoryLockRecordStore } = jest.requireActual(
  "../staking/bonds/unlock-bytes-store",
);

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const BOND_INDEX = 4;
const LOCK_ADDRESS = "lock-address-under-test";
const OUTPUT_SCRIPT = new Uint8Array([0x00, 0x20, ...new Array(32).fill(0xab)]);
const OUTPUT_SCRIPT_HEX = Buffer.from(OUTPUT_SCRIPT).toString("hex");
const AMOUNT_SATS = BigInt(100_000);
const MANAGER = `${BOOT_ADDR}.signer-manager`;
const BTC_TXID = "ab".repeat(32);

const terminalSigningError = () =>
  new FireblocksTransferError(
    "Signing request fb-raw-1 reached terminal status REJECTED",
    {
      operation: "RAW",
      status: TransactionStateEnum.Rejected,
      subStatus: "REJECTED_BY_POLICY",
      vendorId: "fb-raw-1",
    },
  );

function makeSdk(nonce = 1): any {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  sdk.assertDurableLockStore = jest.fn().mockResolvedValue(undefined);
  sdk.signerManagerAllowedError = jest.fn().mockReturnValue(undefined);
  sdk.nativeRecordOverwriteGuard = jest.fn().mockResolvedValue(undefined);
  sdk.resolveBondStxAmount = jest
    .fn()
    .mockReturnValue({ amountUstx: BigInt(1_000) });
  sdk.fireblocksService = {
    createBitcoinTransaction: jest
      .fn()
      .mockImplementation(async (..._a: any[]) => ({
        fireblocksId: "fb-1",
        btcTxid: BTC_TXID,
      })),
  };
  sdk.setLockRecordStore(new InMemoryLockRecordStore());

  // Past funding, straight to the register step.
  // A retry resumes the recorded funding, which verifies the txid still exists.
  sdk.getBtcTxStatus = jest
    .fn()
    .mockResolvedValue({ success: true, data: { found: true } });
  sdk.waitForBtcConfirmations = jest
    .fn()
    .mockResolvedValue({ blockHash: "bh" });
  sdk.assembleLockupProof = jest.fn().mockResolvedValue({ outputIndex: 0 });
  sdk.custodyRefundPostConditions = jest
    .fn()
    .mockResolvedValue({ conditions: [], custodiedSats: BigInt(0) });
  sdk.runNonceExclusive = jest.fn(async (fn: any) => fn());
  sdk.resolveNonce = jest.fn().mockResolvedValue(BigInt(nonce));
  sdk.buildRegisterForBondTx = jest.fn().mockResolvedValue({});
  sdk.revalidateRegisterForBond = jest.fn().mockResolvedValue(undefined);
  sdk.pox5SignAndBroadcast = jest.fn().mockResolvedValue({ txid: "stx-tx" });
  sdk.waitForTxSettlement = jest
    .fn()
    .mockResolvedValue({ success: true, data: { tx_status: "success" } });
  return sdk;
}

/** The external id createBond handed to the register signing request. */
const registerIdFrom = (sdk: any): string | undefined =>
  sdk.pox5SignAndBroadcast.mock.calls[0][2];

beforeEach(() => {
  (fetchBondAllowance as jest.Mock)
    .mockReset()
    .mockResolvedValue(BigInt(10_000_000));
  (fetchPoxInfo as jest.Mock)
    .mockReset()
    .mockResolvedValue({ rewardCycleId: 10 });
  (fetchBond as jest.Mock).mockReset().mockResolvedValue({
    stxValueRatio: BigInt(1),
    minUstxRatioBps: BigInt(1),
    earlyUnlockBytes: "aabb",
  });
  (minUstxForSatsAmount as jest.Mock)
    .mockReset()
    .mockReturnValue(BigInt(1_000));
  (fetchAccountStatus as jest.Mock)
    .mockReset()
    .mockResolvedValue({ balance: BigInt(1_000_000_000), locked: BigInt(0) });
  (fetchEligibleRegisterForBond as jest.Mock)
    .mockReset()
    .mockResolvedValue({ ok: true });
  (firstPox5RewardCycle as jest.Mock).mockReset().mockReturnValue(1);
  (bondPeriodToRewardCycle as jest.Mock).mockReset().mockReturnValue(12);
  (buildRegisterMetadata as jest.Mock).mockReset().mockReturnValue({
    unlockBytes: new Uint8Array([1, 2, 3]),
    lockAddress: LOCK_ADDRESS,
    unlockHeight: 900,
    outputScript: OUTPUT_SCRIPT,
  });
  (fetchCallReadOnlyFunction as jest.Mock)
    .mockReset()
    .mockResolvedValue({
      type: "ok",
      value: { type: "buffer", value: OUTPUT_SCRIPT_HEX },
    });
  (fetchConstructLockupOutputScript as jest.Mock)
    .mockReset()
    .mockResolvedValue(OUTPUT_SCRIPT);
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue(null);
});

describe("createBond — register-for-bond external id", () => {
  it("derives an id instead of leaving Fireblocks to assign a random one", async () => {
    const sdk = makeSdk();

    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(registerIdFrom(sdk)).toEqual(
      expect.stringMatching(/^bond-register-[0-9a-f]{40}$/),
    );
  });

  it("derives the SAME id on a retry, so the outstanding request is re-polled", async () => {
    const first = makeSdk();
    await first.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);
    const second = makeSdk();
    await second.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(registerIdFrom(second)).toBe(registerIdFrom(first));
  });

  it("derives a DIFFERENT id at a different nonce", async () => {
    // The signature covers a nonce-dependent sighash, so reusing the id across nonces
    // would resolve to a request whose signature does not authorize this transaction.
    const atOne = makeSdk(1);
    await atOne.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);
    const atTwo = makeSdk(2);
    await atTwo.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(registerIdFrom(atTwo)).not.toBe(registerIdFrom(atOne));
  });

  it("still honours a caller-supplied external id", async () => {
    const sdk = makeSdk();

    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER, {
      externalId: "mine",
    });

    expect(registerIdFrom(sdk)).toBe("mine-register");
  });

  it("advances the registration generation when the signing request terminally fails", async () => {
    // A rejected request consumes its id permanently. Without a generation the derived id
    // would resolve to that dead request on every retry — the #205 wedge, on the L2 leg.
    const sdk = makeSdk();
    sdk.pox5SignAndBroadcast = jest
      .fn()
      .mockRejectedValue(terminalSigningError());

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.success).toBe(false);
    const after = await sdk.lockRecordStore.loadRecord(BOOT_ADDR, BOND_INDEX);
    expect(after.registrationGeneration).toBe(1);
    // The BTC is committed and must stay pointed at.
    expect(res.btcTxid).toBe(BTC_TXID);
  });

  it("derives a fresh id once the generation advanced", async () => {
    const failing = makeSdk();
    failing.pox5SignAndBroadcast = jest
      .fn()
      .mockRejectedValue(terminalSigningError());
    await failing.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);
    const wedgedId = registerIdFrom(failing);

    const retry = makeSdk();
    retry.lockRecordStore = failing.lockRecordStore;
    await retry.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(registerIdFrom(retry)).not.toBe(wedgedId);
  });
});
