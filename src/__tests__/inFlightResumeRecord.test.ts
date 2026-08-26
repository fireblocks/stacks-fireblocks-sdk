/**
 * Regression tests for the in-flight funding resume ([L-2], 2026-08-24 review).
 *
 * createBond's pre-funding save rebuilt the lock record from scratch, so on the
 * hasInFlightFireblocks path it dropped `fireblocksId` and regressed `stage` to
 * "lock-fixed". If the resume then died inside awaitBitcoinTransaction (30-minute
 * deadline, transient read error, crash), the only durable pointer to a transfer
 * Fireblocks had already ACCEPTED was gone, and two guards silently disarmed with it:
 * nativeRecordOverwriteGuard only refuses at stage "funding-requested", and the
 * amount-mismatch check keys off hasInFlightFireblocks.
 *
 * Because the id now survives, the terminal-failure branch must strip it before
 * returning — otherwise the caller-btcTxid guard refuses exactly the `opts.btcTxid`
 * recovery that branch's own error message prescribes.
 */

jest.mock("../services/fireblocks.service", () => ({
  FireblocksService: Object.assign(
    jest.fn().mockImplementation(() => ({})),
    {
      // Static helpers the funding branches call.
      isTerminalTransferFailure: (e: unknown) =>
        /terminally-failed/.test((e as Error)?.message ?? ""),
      isDuplicateExternalIdError: () => false,
    },
  ),
}));

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

import { StacksSDK } from "../StacksSDK";
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

const { InMemoryLockRecordStore } = jest.requireActual("../staking/bonds/unlock-bytes-store");

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const FAKE_INLINE_PEM = ["-----BEGIN", "PRIVATE KEY-----", "not-a-key", "-----END", "PRIVATE KEY-----"].join(" ");

const BOND_INDEX = 4;
// Opaque identifiers — never decoded on this path, so no address-shaped literals are needed.
const LOCK_ADDRESS = "lock-address-under-test";
const OUTPUT_SCRIPT = new Uint8Array([0x00, 0x20, ...new Array(32).fill(0xab)]);
const OUTPUT_SCRIPT_HEX = Buffer.from(OUTPUT_SCRIPT).toString("hex");
const FB_ID = "fireblocks-tx-id-1";
const AMOUNT_SATS = BigInt(100_000);
const GOOD_TXID = "ab".repeat(32);

function makeSdk(): any {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  // Gates that reach the network or policy config, and are not what these tests exercise.
  sdk.assertDurableLockStore = jest.fn().mockResolvedValue(undefined);
  sdk.signerManagerAllowedError = jest.fn().mockReturnValue(undefined);
  sdk.nativeRecordOverwriteGuard = jest.fn().mockResolvedValue(undefined);
  sdk.resolveBondStxAmount = jest.fn().mockReturnValue({ amountUstx: BigInt(1_000) });
  sdk.fireblocksService = { awaitBitcoinTransaction: jest.fn() };
  sdk.setLockRecordStore(new InMemoryLockRecordStore());
  return sdk;
}

/** Seeds the record a crashed first attempt leaves behind: id assigned, txid never recorded. */
async function seedInFlightRecord(sdk: any) {
  await sdk.lockRecordStore.saveRecord(sdk.address, BOND_INDEX, {
    bondIndex: BOND_INDEX,
    unlockBytes: new Uint8Array([1, 2, 3]),
    lockAddress: LOCK_ADDRESS,
    unlockHeight: 900,
    amountSats: AMOUNT_SATS,
    isL1Lock: true,
    fundingExternalId: "ext-id-1",
    fireblocksId: FB_ID,
    stage: "funding-requested",
  });
}

const readRecord = (sdk: any) => sdk.lockRecordStore.loadRecord(sdk.address, BOND_INDEX);

beforeEach(() => {
  (fetchBondAllowance as jest.Mock).mockReset().mockResolvedValue(BigInt(10_000_000));
  (fetchPoxInfo as jest.Mock).mockReset().mockResolvedValue({ rewardCycleId: 10 });
  (fetchBond as jest.Mock).mockReset().mockResolvedValue({
    stxValueRatio: BigInt(1),
    minUstxRatioBps: BigInt(1),
    earlyUnlockBytes: "aabb",
  });
  (minUstxForSatsAmount as jest.Mock).mockReset().mockReturnValue(BigInt(1_000));
  (fetchAccountStatus as jest.Mock).mockReset().mockResolvedValue({
    balance: BigInt(1_000_000_000),
    locked: BigInt(0),
  });
  (fetchEligibleRegisterForBond as jest.Mock).mockReset().mockResolvedValue({ ok: true });
  (firstPox5RewardCycle as jest.Mock).mockReset().mockReturnValue(1);
  (bondPeriodToRewardCycle as jest.Mock).mockReset().mockReturnValue(12);
  (buildRegisterMetadata as jest.Mock).mockReset().mockReturnValue({
    unlockBytes: new Uint8Array([1, 2, 3]),
    lockAddress: LOCK_ADDRESS,
    unlockHeight: 900,
    outputScript: OUTPUT_SCRIPT,
  });
  // The contract cross-check must agree with the metadata or createBond bails before funding.
  (fetchCallReadOnlyFunction as jest.Mock).mockReset().mockResolvedValue({
    type: "ok",
    value: { type: "buffer", value: OUTPUT_SCRIPT_HEX },
  });
  (fetchConstructLockupOutputScript as jest.Mock).mockReset().mockResolvedValue(OUTPUT_SCRIPT);
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue(null);
});

/**
 * renewBond resolved the carry-forward reward destination behind
 * fetchBondMembership(...).catch(() => null), so a transient RPC error looked exactly like
 * "no membership": the renewal proceeded, re-locked BTC and registered with `none` — which
 * makes the signer manager map-delete the pox-addr and silently revert the staker to
 * sBTC-to-principal payouts. That read must fail CLOSED, like the record read beside it.
 */
describe("renewBond — reward carry-forward must fail closed", () => {
  const NEXT_BOND = 5;
  const MANAGER = `${BOOT_ADDR}.signer-manager`;

  it("refuses to renew when the bond-membership read fails and no destination was supplied", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock).mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.renewBond(NEXT_BOND, MANAGER);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/could not be read/i);
    expect(res.error).toMatch(/UNKNOWN/);
    // The refusal must be explicit about no Bitcoin having moved.
    expect(res.error).toMatch(/refusing to re-lock btc/i);
  });

  it("does NOT fail closed when the caller supplies the destination explicitly", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock).mockRejectedValue(new Error("hiro 503"));
    // Stop the run right after the reward resolution — we only assert it got past it.
    sdk.getBtcTxStatus = jest.fn().mockRejectedValue(new Error("stop-after-reward-resolution"));

    const res = await sdk.renewBond(NEXT_BOND, MANAGER, {
      rewardBtcAddress: "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
      rewardMaxFeeSats: BigInt(5_000),
    });

    // With the value supplied, no record is consulted, so the failed membership read is
    // irrelevant and must not produce the fail-closed refusal.
    expect(res.error ?? "").not.toMatch(/could not be read/i);
  });
});

describe("createBond — in-flight Fireblocks funding resume", () => {
  it("keeps fireblocksId and the reached stage when the resume fails mid-poll", async () => {
    const sdk = makeSdk();
    await seedInFlightRecord(sdk);
    // A NON-terminal failure: the transfer may still land, so the pointer must survive.
    sdk.fireblocksService.awaitBitcoinTransaction.mockRejectedValue(
      new Error("Timeout waiting for transaction"),
    );

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, `${BOOT_ADDR}.signer-manager`);
    expect(res.success).toBe(false);

    const after = await readRecord(sdk);
    // Before the fix this was undefined and the stage had regressed to "lock-fixed".
    expect(after.fireblocksId).toBe(FB_ID);
    expect(after.stage).toBe("funding-requested");
    // It must have resumed the SAME transfer rather than starting a new one.
    expect(sdk.fireblocksService.awaitBitcoinTransaction).toHaveBeenCalledWith(FB_ID);
  });

  it("still refuses a retry at a DIFFERENT amount after the failed resume", async () => {
    // The amount-mismatch guard keys off hasInFlightFireblocks, which is only true while
    // fireblocksId is in the record. When the id was dropped, this guard was skipped and a
    // retry at another amount fell through to a FRESH funding call — double-funding the
    // lock the earlier transfer may still land on.
    const sdk = makeSdk();
    await seedInFlightRecord(sdk);
    sdk.fireblocksService.awaitBitcoinTransaction.mockRejectedValue(new Error("Timeout waiting"));
    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, `${BOOT_ADDR}.signer-manager`);

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS * BigInt(2), `${BOOT_ADDR}.signer-manager`);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/prior funding attempt/i);
    expect(res.error).toContain(FB_ID);
  });

  it("drops fireblocksId on a TERMINAL failure so the btcTxid recovery path stays open", async () => {
    const sdk = makeSdk();
    await seedInFlightRecord(sdk);
    sdk.fireblocksService.awaitBitcoinTransaction.mockRejectedValue(
      new Error("transfer terminally-failed: REJECTED"),
    );

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, `${BOOT_ADDR}.signer-manager`);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/terminally failed/i);
    expect(res.error).toMatch(/opts\.btcTxid/);

    const after = await readRecord(sdk);
    // The external id is kept for diagnostics. It is DERIVED from (vault, network, bond,
    // lock address) rather than carried over, which is what makes a retry reuse the same
    // id and lets Fireblocks de-duplicate it.
    expect(after.fundingExternalId).toEqual(expect.stringContaining("bond-fund-"));
    expect(after.lockAddress).toBe(LOCK_ADDRESS);
    // ...but the Fireblocks id must be gone, or hasInFlightFireblocks stays true and the
    // caller-btcTxid guard blocks the recovery this branch's error message prescribes.
    expect(after.fireblocksId).toBeUndefined();
  });

  it("after a terminal failure, a retry WITH opts.btcTxid is accepted (not refused as in-flight)", async () => {
    const sdk = makeSdk();
    await seedInFlightRecord(sdk);
    sdk.fireblocksService.awaitBitcoinTransaction.mockRejectedValue(
      new Error("transfer terminally-failed: REJECTED"),
    );
    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, `${BOOT_ADDR}.signer-manager`);

    // The operator resolves the transfer in Fireblocks and retries with the real txid.
    // Stop the run immediately after the funding step — the confirmation wait would
    // otherwise poll Esplora for up to 90 minutes, and it is not what this asserts.
    sdk.waitForBtcConfirmations = jest.fn().mockRejectedValue(new Error("stop-after-funding"));

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, `${BOOT_ADDR}.signer-manager`, {
      btcTxid: GOOD_TXID,
    });

    // It must NOT be the in-flight refusal — that is the bug this guards against.
    expect(res.error ?? "").not.toMatch(/in-flight Fireblocks funding transfer/);
    const after = await readRecord(sdk);
    expect(after.btcTxid).toBe(GOOD_TXID);
  });
});
