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

jest.mock("../services/fireblocks.service", () => {
  // The REAL terminal classifier: it reads the typed vendor status, and the abandon path
  // keys on the vendor id that only a typed error carries.
  const actual = jest.requireActual("../services/fireblocks.service");
  return {
    FireblocksService: Object.assign(
      jest.fn().mockImplementation(() => ({})),
      {
        isTerminalTransferFailure: actual.FireblocksService.isTerminalTransferFailure,
        isDuplicateExternalIdError: () => false,
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
import { getPublicKey } from "@noble/secp256k1";
import * as btc from "@scure/btc-signer";
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

const { InMemoryLockRecordStore } = jest.requireActual("../staking/bonds/unlock-bytes-store");

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const FAKE_INLINE_PEM = ["-----BEGIN", "PRIVATE KEY-----", "not-a-key", "-----END", "PRIVATE KEY-----"].join(" ");

const BOND_INDEX = 4;
// Opaque identifiers — never decoded on this path, so no address-shaped literals are needed.
const LOCK_ADDRESS = "lock-address-under-test";
const OUTPUT_SCRIPT = new Uint8Array([0x00, 0x20, ...new Array(32).fill(0xab)]);
const OUTPUT_SCRIPT_HEX = Buffer.from(OUTPUT_SCRIPT).toString("hex");
const FB_ID = "fireblocks-tx-id-1";

/** The in-flight transfer reaching a terminal status, as Fireblocks reports it. */
const inFlightRejected = () =>
  new FireblocksTransferError(`Transfer ${FB_ID} reached terminal status REJECTED`, {
    operation: "TRANSFER",
    status: TransactionStateEnum.Rejected,
    vendorId: FB_ID,
  });
const AMOUNT_SATS = BigInt(100_000);
const GOOD_TXID = "ab".repeat(32);

function makeSdk(opts: { realOverwriteGuard?: boolean } = {}): any {
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
  if (!opts.realOverwriteGuard) sdk.nativeRecordOverwriteGuard = jest.fn().mockResolvedValue(undefined);
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

  it("keeps the generation fields and abandoned ids when it rewrites the next bond's record", async () => {
    // Review item 10. A record already exists for the next bond — e.g. an earlier createBond
    // whose funding was abandoned. renewBond rebuilt it from scratch, so the generations reset
    // to 0 (a later createBond re-derives a consumed external id) and the abandoned ids —
    // the operator's only pointer to the dead transfers — were lost.
    const sdk = makeSdk();
    await sdk.lockRecordStore.saveRecord(sdk.address, NEXT_BOND, {
      bondIndex: NEXT_BOND,
      unlockBytes: new Uint8Array([1, 2, 3]),
      lockAddress: LOCK_ADDRESS,
      unlockHeight: 900,
      amountSats: AMOUNT_SATS,
      isL1Lock: true,
      btcTxid: GOOD_TXID,
      fundingGeneration: 2,
      registrationGeneration: 1,
      abandonedFireblocksIds: ["fb-dead-1", "fb-dead-2"],
    });
    // Resume path: the recorded re-lock still exists, so no BTC is spent.
    sdk.getBtcTxStatus = jest.fn().mockResolvedValue({ success: true, data: { found: true } });
    sdk.waitForBtcConfirmations = jest.fn().mockResolvedValue({ blockHash: "bh" });
    sdk.assembleLockupProof = jest.fn().mockResolvedValue({ outputIndex: 0 });
    // Stop right after the record write: the proof preflight refuses.
    (fetchEligibleRegisterForBond as jest.Mock).mockResolvedValue({ ok: false, reasons: [] });

    await sdk.renewBond(NEXT_BOND, MANAGER, {
      rewardBtcAddress: "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
      rewardMaxFeeSats: BigInt(5_000),
    });

    expect(sdk.assembleLockupProof).toHaveBeenCalled();
    const after = await sdk.lockRecordStore.loadRecord(sdk.address, NEXT_BOND);
    expect(after.fundingGeneration).toBe(2);
    expect(after.registrationGeneration).toBe(1);
    expect(after.abandonedFireblocksIds).toEqual(["fb-dead-1", "fb-dead-2"]);
  });
});

describe("renewBond — over a next-bond record whose createBond funding transfer is live", () => {
  const NEXT_BOND = 5;
  const MANAGER = `${BOOT_ADDR}.signer-manager`;
  const REWARD = {
    rewardBtcAddress: "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
    rewardMaxFeeSats: BigInt(5_000),
  };

  const seed = (sdk: any, over: Record<string, unknown>) =>
    sdk.lockRecordStore.saveRecord(sdk.address, NEXT_BOND, {
      bondIndex: NEXT_BOND,
      unlockBytes: new Uint8Array([1, 2, 3]),
      lockAddress: LOCK_ADDRESS,
      unlockHeight: 900,
      amountSats: AMOUNT_SATS,
      isL1Lock: true,
      fundingExternalId: "ext-id-next",
      ...over,
    });

  // renewBond spends the current lock into the next one. A refusal must happen before that.
  const sdkWithSpendSpy = (opts: { realOverwriteGuard?: boolean } = {}) => {
    const sdk = makeSdk(opts);
    sdk.deriveLock = jest.fn().mockResolvedValue(null);
    return sdk;
  };

  it.each([
    ["a transfer awaiting approval", { fireblocksId: FB_ID, stage: "funding-requested" }],
    ["a funding request whose transfer id was never saved", { stage: "funding-requested" }],
  ])("refuses over %s and points at resumeBondRegistration", async (_label, over) => {
    const sdk = sdkWithSpendSpy();
    await seed(sdk, over);

    const res = await sdk.renewBond(NEXT_BOND, MANAGER, REWARD);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/resumeBondRegistration/);
    expect(sdk.deriveLock).not.toHaveBeenCalled();
    const after = await sdk.lockRecordStore.loadRecord(sdk.address, NEXT_BOND);
    expect(after.fireblocksId).toBe((over as any).fireblocksId);
    expect(after.stage).toBe("funding-requested");
  });

  it("refuses to rebuild over a recorded funding tx that is not visible while its transfer id is on the record", async () => {
    // A transfer broadcast and then reported failed leaves its txid and Fireblocks id on the
    // record. Rebuilding over the txid would drop the id of a transfer that can still land.
    const sdk = sdkWithSpendSpy();
    await seed(sdk, { btcTxid: GOOD_TXID, fireblocksId: FB_ID, stage: "btc-broadcast" });
    sdk.getBtcTxStatus = jest.fn().mockResolvedValue({ success: true, data: { found: false } });

    const res = await sdk.renewBond(NEXT_BOND, MANAGER, REWARD);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/resumeBondRegistration/);
    expect(sdk.deriveLock).not.toHaveBeenCalled();
    expect((await sdk.lockRecordStore.loadRecord(sdk.address, NEXT_BOND)).fireblocksId).toBe(FB_ID);
  });

  it("refuses over a visible funding tx whose record names its createBond transfer", async () => {
    // Resuming it would register createBond's output for the next bond in place of the
    // re-lock, leaving the current lock unspent.
    const sdk = sdkWithSpendSpy();
    await seed(sdk, { btcTxid: GOOD_TXID, fireblocksId: FB_ID, stage: "btc-broadcast" });
    sdk.getBtcTxStatus = jest.fn().mockResolvedValue({ success: true, data: { found: true } });
    sdk.waitForBtcConfirmations = jest.fn();

    const res = await sdk.renewBond(NEXT_BOND, MANAGER, REWARD);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/resumeBondRegistration/);
    expect(sdk.waitForBtcConfirmations).not.toHaveBeenCalled();
    expect(sdk.deriveLock).not.toHaveBeenCalled();
  });

  it("refuses through the real overwrite guard, which exempts the same lock address", async () => {
    const sdk = sdkWithSpendSpy({ realOverwriteGuard: true });
    await seed(sdk, { fireblocksId: FB_ID, stage: "funding-requested" });

    const res = await sdk.renewBond(NEXT_BOND, MANAGER, REWARD);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/resumeBondRegistration/);
    expect(sdk.deriveLock).not.toHaveBeenCalled();
  });

  it.each([
    ["confirmed", "btc-confirmed"],
    ["registration submitted", "registration-submitted"],
    ["registration confirmed", "registration-confirmed"],
  ])("refuses over a createBond funding that is %s, where the record no longer names its transfer", async (_label, stage) => {
    // createBond writes fireblocksId only until the Bitcoin confirms; from then on the record
    // carries the txid and fundingExternalId alone. Resuming it would register createBond's
    // output in place of the re-lock and leave the current lock unspent.
    const sdk = sdkWithSpendSpy();
    await seed(sdk, { btcTxid: GOOD_TXID, vout: 0, stage });
    sdk.getBtcTxStatus = jest.fn().mockResolvedValue({ success: true, data: { found: true } });
    sdk.waitForBtcConfirmations = jest.fn();
    sdk.assembleLockupProof = jest.fn();

    const res = await sdk.renewBond(NEXT_BOND, MANAGER, REWARD);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/resumeBondRegistration/);
    expect(res.error).toContain(GOOD_TXID);
    expect(res.error).not.toMatch(/transfer id not recorded/);
    expect(sdk.waitForBtcConfirmations).not.toHaveBeenCalled();
    expect(sdk.assembleLockupProof).not.toHaveBeenCalled();
    expect(sdk.deriveLock).not.toHaveBeenCalled();
  });

  it("does not refuse over a createBond record whose funding was abandoned", async () => {
    // Nothing is pending and no Bitcoin was committed: the record only keeps the generation
    // and the abandoned ids. Refusing here would be permanent.
    const sdk = sdkWithSpendSpy();
    await seed(sdk, { stage: "lock-fixed", fundingGeneration: 1, abandonedFireblocksIds: ["fb-dead"] });

    await sdk.renewBond(NEXT_BOND, MANAGER, REWARD);

    expect(sdk.deriveLock).toHaveBeenCalled();
  });

  it("still rebuilds over a dead txid that came from an earlier renewBond", async () => {
    // renewBond records no Fireblocks transfer and no funding external id, so nothing live can
    // be dropped.
    const sdk = sdkWithSpendSpy();
    await seed(sdk, { btcTxid: GOOD_TXID, stage: "btc-broadcast", fundingExternalId: undefined });
    sdk.getBtcTxStatus = jest.fn().mockResolvedValue({ success: true, data: { found: false } });

    await sdk.renewBond(NEXT_BOND, MANAGER, REWARD);

    expect(sdk.deriveLock).toHaveBeenCalled();
  });
});

/**
 * Review item 9. When the recorded funding tx is not visible on Esplora, the error told the
 * operator to "retry with opts.btcTxid set to the actual funding txid" — and createBond
 * refuses any btcTxid that differs from the recorded one. Following the advice was a
 * guaranteed refusal. The refusal is deliberate (overwriting the recorded pointer can strand
 * already-committed Bitcoin); the advice was what was wrong.
 */
describe("createBond — a recorded funding tx that is not visible", () => {
  const seedRecordedFunding = (sdk: any) =>
    sdk.lockRecordStore.saveRecord(sdk.address, BOND_INDEX, {
      bondIndex: BOND_INDEX,
      unlockBytes: new Uint8Array([1, 2, 3]),
      lockAddress: LOCK_ADDRESS,
      unlockHeight: 900,
      amountSats: AMOUNT_SATS,
      isL1Lock: true,
      btcTxid: GOOD_TXID,
      stage: "btc-broadcast",
    });

  it("does not prescribe the btcTxid retry that createBond refuses", async () => {
    const sdk = makeSdk();
    await seedRecordedFunding(sdk);
    sdk.getBtcTxStatus = jest.fn().mockResolvedValue({ success: true, data: { found: false } });

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, `${BOOT_ADDR}.signer-manager`);

    expect(res.success).toBe(false);
    expect(res.error).not.toMatch(/retry with opts\.btcTxid/i);
    // What is true: a later retry without btcTxid covers indexer lag, and funding again is
    // never the answer.
    expect(res.error).toMatch(/without opts\.btcTxid/i);
    expect(res.error).toMatch(/do not fund/i);
  });

  it("refuses a btcTxid that differs from the recorded one — the refusal the old advice ran into", async () => {
    const sdk = makeSdk();
    await seedRecordedFunding(sdk);

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, `${BOOT_ADDR}.signer-manager`, {
      btcTxid: "cd".repeat(32),
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/refusing to replace it/i);
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
    sdk.fireblocksService.awaitBitcoinTransaction.mockRejectedValue(inFlightRejected());

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, `${BOOT_ADDR}.signer-manager`);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/terminally failed/i);
    expect(res.error).toMatch(/retry createBond/i);

    const after = await readRecord(sdk);
    // The external id is kept for diagnostics. It is DERIVED from (vault, network, bond,
    // lock address) rather than carried over, which is what makes a retry reuse the same
    // id and lets Fireblocks de-duplicate it.
    expect(after.fundingExternalId).toEqual(expect.stringContaining("bond-fund-"));
    expect(after.lockAddress).toBe(LOCK_ADDRESS);
    // ...but the Fireblocks id must be gone, or hasInFlightFireblocks stays true and the
    // prescribed retry awaits the dead transfer again instead of re-funding.
    expect(after.fireblocksId).toBeUndefined();
  });

  it("after a terminal failure, a retry WITH opts.btcTxid is accepted (not refused as in-flight)", async () => {
    const sdk = makeSdk();
    await seedInFlightRecord(sdk);
    sdk.fireblocksService.awaitBitcoinTransaction.mockRejectedValue(inFlightRejected());
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

describe("createBond — eligibility gates after Bitcoin is committed", () => {
  const MANAGER = `${BOOT_ADDR}.signer-manager`;
  const seedFunded = (sdk: any) =>
    sdk.lockRecordStore.saveRecord(sdk.address, BOND_INDEX, {
      bondIndex: BOND_INDEX,
      unlockBytes: new Uint8Array([1, 2, 3]),
      lockAddress: LOCK_ADDRESS,
      unlockHeight: 900,
      amountSats: AMOUNT_SATS,
      isL1Lock: true,
      fundingExternalId: "ext-id-1",
      signerManager: MANAGER,
      btcTxid: GOOD_TXID,
      vout: 0,
      stage: "registration-submitted",
    });

  it("does not say no Bitcoin is committed when the contract gate refuses a funded bond", async () => {
    // e.g. an unsettled register that later landed: resume now meets the account already
    // registered, and must still point at the locked Bitcoin.
    const sdk = makeSdk();
    await seedFunded(sdk);
    (fetchEligibleRegisterForBond as jest.Mock).mockResolvedValue({ ok: false, reasons: [19] });

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.success).toBe(false);
    expect(res.error).not.toMatch(/no BTC committed/i);
    expect(res.error).toMatch(/may already be committed/i);
    expect(res.error).toMatch(/getBondPosition/);
    expect(res.btcTxid).toBe(GOOD_TXID);
    expect(res.vout).toBe(0);
  });

  it("carries the funding pointer when the allowance gate refuses a funded bond", async () => {
    const sdk = makeSdk();
    await seedFunded(sdk);
    (fetchBondAllowance as jest.Mock).mockResolvedValue(BigInt(0));

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/may already be committed/i);
    expect(res.btcTxid).toBe(GOOD_TXID);
  });

  it("names a recorded funding transfer when no txid is recorded yet", async () => {
    const sdk = makeSdk();
    await seedInFlightRecord(sdk);
    (fetchEligibleRegisterForBond as jest.Mock).mockResolvedValue({ ok: false, reasons: [19] });

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.error).not.toMatch(/no BTC committed/i);
    expect(res.error).toContain(FB_ID);
  });

  it("still says no Bitcoin is committed when there is no funding on record", async () => {
    const sdk = makeSdk();
    (fetchEligibleRegisterForBond as jest.Mock).mockResolvedValue({ ok: false, reasons: [19] });

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.error).toMatch(/no BTC committed/i);
    expect(res.btcTxid).toBeUndefined();
  });
});

describe("renewBond — register leg external id", () => {
  const NEXT_BOND = 5;
  const MANAGER = `${BOOT_ADDR}.signer-manager`;
  const REWARD = {
    rewardBtcAddress: "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
    rewardMaxFeeSats: BigInt(5_000),
  };
  const rejected = () =>
    new FireblocksTransferError("Signing request fb-raw-1 reached terminal status REJECTED", {
      operation: "RAW",
      status: TransactionStateEnum.Rejected,
      vendorId: "fb-raw-1",
    });

  /** An earlier renewBond already re-locked; this run resumes straight to the register leg. */
  const sdkAtRegisterLeg = async (over: Record<string, unknown> = {}) => {
    const sdk = makeSdk();
    await sdk.lockRecordStore.saveRecord(sdk.address, NEXT_BOND, {
      bondIndex: NEXT_BOND,
      unlockBytes: new Uint8Array([1, 2, 3]),
      lockAddress: LOCK_ADDRESS,
      unlockHeight: 900,
      amountSats: AMOUNT_SATS,
      isL1Lock: true,
      btcTxid: GOOD_TXID,
      stage: "btc-broadcast",
      ...over,
    });
    sdk.getBtcTxStatus = jest.fn().mockResolvedValue({ success: true, data: { found: true } });
    sdk.waitForBtcConfirmations = jest.fn().mockResolvedValue({ blockHash: "bh" });
    sdk.assembleLockupProof = jest.fn().mockResolvedValue({ outputIndex: 0 });
    sdk.custodyRefundPostConditions = jest.fn().mockResolvedValue({ conditions: [], custodiedSats: BigInt(0) });
    sdk.runNonceExclusive = jest.fn(async (fn: any) => fn());
    sdk.resolveNonce = jest.fn().mockResolvedValue(BigInt(3));
    sdk.buildRegisterForBondTx = jest.fn(async (a: any) => ({ bytes: `nonce:${a.nonce}` }));
    sdk.preSignSigHashOf = jest.fn((tx: any) => tx.bytes);
    sdk.revalidateRegisterForBond = jest.fn().mockResolvedValue(undefined);
    sdk.pox5SignAndBroadcast = jest.fn().mockResolvedValue({ txid: "stx-tx" });
    sdk.waitForTxSettlement = jest.fn().mockResolvedValue({ success: true, data: { tx_status: "success" } });
    return sdk;
  };
  const registerIdFrom = (sdk: any): string | undefined => sdk.pox5SignAndBroadcast.mock.calls[0]?.[2];

  it("derives an id instead of leaving Fireblocks to assign a random one", async () => {
    const sdk = await sdkAtRegisterLeg();

    await sdk.renewBond(NEXT_BOND, MANAGER, REWARD);

    expect(registerIdFrom(sdk)).toEqual(expect.stringMatching(/^bond-register-[0-9a-f]{40}$/));
  });

  it("derives a caller's id with the sighash and generation suffix, and stores the caller id", async () => {
    const sdk = await sdkAtRegisterLeg();

    await sdk.renewBond(NEXT_BOND, MANAGER, { ...REWARD, externalId: "mine" });

    expect(registerIdFrom(sdk)).toEqual(expect.stringMatching(/^mine-register-[0-9a-f]{16}$/));
    expect((await sdk.lockRecordStore.loadRecord(sdk.address, NEXT_BOND)).callerExternalId).toBe("mine");
  });

  it("advances the registration generation when the signing request is rejected", async () => {
    const sdk = await sdkAtRegisterLeg();
    sdk.pox5SignAndBroadcast = jest.fn().mockRejectedValue(rejected());

    const res = await sdk.renewBond(NEXT_BOND, MANAGER, REWARD);

    expect(res.success).toBe(false);
    expect(res.btcTxid).toBe(GOOD_TXID);
    expect((await sdk.lockRecordStore.loadRecord(sdk.address, NEXT_BOND)).registrationGeneration).toBe(1);
  });

  it("tells the operator the Bitcoin is re-locked and a retry keeps the same signing request", async () => {
    // The re-lock is already broadcast, and the register id follows the transaction bytes, so
    // a plain retry resumes this request. "Nothing was broadcast" and "reject this one first"
    // would send the operator to open a second approval.
    const sdk = await sdkAtRegisterLeg();
    sdk.pox5SignAndBroadcast = jest.fn().mockRejectedValue(
      new FireblocksTransferError("Signing request fb-raw-7 timed out after 30m: still PENDING_AUTHORIZATION", {
        operation: "RAW",
        status: TransactionStateEnum.PendingAuthorization,
        vendorId: "fb-raw-7",
      }),
    );

    const res = await sdk.renewBond(NEXT_BOND, MANAGER, REWARD);

    expect(res.pendingFireblocksId).toBe("fb-raw-7");
    expect(res.btcTxid).toBe(GOOD_TXID);
    expect(res.error).not.toMatch(/nothing was broadcast/i);
    expect(res.error).not.toMatch(/reject this one/i);
    expect(res.error).toMatch(/re-locked/i);
    expect(res.error).toMatch(/retry renewBond/i);
    expect(res.error).toMatch(/same signing request/i);
  });

  it("does not claim the Bitcoin is re-locked, nor offer an externalId, when the re-lock's own signature is pending", async () => {
    // The BTC re-lock is signed with a random request id, so a retry cannot rejoin it.
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest.fn(async (fn: any) => fn());
    const sk = Uint8Array.from({ length: 32 }, (_, i) => (i === 31 ? 1 : 0));
    const nextLockAddress = btc.p2wpkh(getPublicKey(sk, true), sdk.btcNetwork).address!;
    (buildRegisterMetadata as jest.Mock).mockReturnValue({
      unlockBytes: new Uint8Array([1, 2, 3]),
      lockAddress: nextLockAddress,
      unlockHeight: 900,
      outputScript: OUTPUT_SCRIPT,
    });
    sdk.deriveLock = jest.fn().mockResolvedValue({
      bondIndex: 4, unlockHeight: 100, lockScript: new Uint8Array([0x51]), lockingAddress: nextLockAddress,
    });
    sdk.readBtcTipHeight = jest.fn().mockResolvedValue(200);
    sdk.findLockUtxo = jest.fn().mockResolvedValue({ txid: GOOD_TXID, vout: 0, value: 100_000 });
    sdk.signBtcSighash = jest.fn().mockRejectedValue(
      new FireblocksTransferError("Signing request fb-raw-8 timed out after 30m: still PENDING_AUTHORIZATION", {
        operation: "RAW",
        status: TransactionStateEnum.PendingAuthorization,
        vendorId: "fb-raw-8",
      }),
    );

    const res = await sdk.renewBond(NEXT_BOND, MANAGER, { ...REWARD, feeSats: BigInt(1_000) });

    expect(res.pendingFireblocksId).toBe("fb-raw-8");
    expect(res.btcTxid).toBeUndefined();
    expect(res.error).toMatch(/nothing was broadcast/i);
    expect(res.error).not.toMatch(/re-locked/i);
    expect(res.error).not.toMatch(/externalId/);
  });

  it("derives a fresh id after a rejection", async () => {
    const first = await sdkAtRegisterLeg();
    first.pox5SignAndBroadcast = jest.fn().mockRejectedValue(rejected());
    await first.renewBond(NEXT_BOND, MANAGER, REWARD);
    const consumed = registerIdFrom(first);

    const retry = await sdkAtRegisterLeg();
    retry.lockRecordStore = first.lockRecordStore;
    await retry.renewBond(NEXT_BOND, MANAGER, REWARD);

    expect(registerIdFrom(retry)).not.toBe(consumed);
  });
});
