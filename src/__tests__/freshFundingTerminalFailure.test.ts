/**
 * Terminal-failure handling on createBond's FRESH funding path (issue 206).
 *
 * The resume branch (hasInFlightFireblocks) returns a structured dead-end and strips the
 * Fireblocks id when a transfer terminally fails. The fresh-funding branch handled only
 * the duplicate-external-id case and rethrew everything else, so a terminal failure on a
 * first attempt surfaced as an opaque throw with the id still recorded — the operator got
 * no instruction, and the consumed external id was invisible.
 */

jest.mock("../services/fireblocks.service", () => {
  // The REAL static classifiers: this path's correctness depends on typed terminal
  // detection, so a stubbed matcher would assert nothing about production behaviour.
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
const FB_ID = "fireblocks-tx-id-fresh";
const AMOUNT_SATS = BigInt(100_000);
const MANAGER = `${BOOT_ADDR}.signer-manager`;

const terminalError = (status: TransactionStateEnum, subStatus?: string) =>
  new FireblocksTransferError(
    `Transfer ${FB_ID} reached terminal status ${status}`,
    {
      operation: "TRANSFER",
      status,
      subStatus,
      vendorId: FB_ID,
    },
  );

function makeSdk(): any {
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
    createBitcoinTransaction: jest.fn(),
    awaitBitcoinTransaction: jest.fn(),
    findBitcoinTransactionByExternalId: jest.fn(),
  };
  sdk.setLockRecordStore(new InMemoryLockRecordStore());
  return sdk;
}

/** A terminal failure for a specific transfer, as Fireblocks reports it. */
const terminalErrorFor = (vendorId: string, status: TransactionStateEnum) =>
  new FireblocksTransferError(`Transfer ${vendorId} reached terminal status ${status}`, {
    operation: "TRANSFER",
    status,
    vendorId,
  });

/** A promise plus the handles to settle it from outside, for ordering concurrent calls. */
const deferred = <T>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const until = async (cond: () => boolean) => {
  for (let i = 0; i < 200 && !cond(); i++) await new Promise((r) => setImmediate(r));
  if (!cond()) throw new Error("condition never became true");
};

const readRecord = (sdk: any) =>
  sdk.lockRecordStore.loadRecord(sdk.address, BOND_INDEX);

/** Fireblocks accepts the transfer (id assigned, persisted via onSubmitted), then it dies. */
const acceptThenFail = (error: Error) =>
  jest.fn().mockImplementation(async (..._args: any[]) => {
    const onSubmitted = _args[5];
    await onSubmitted?.(FB_ID);
    throw error;
  });

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
  (fetchAccountStatus as jest.Mock).mockReset().mockResolvedValue({
    balance: BigInt(1_000_000_000),
    locked: BigInt(0),
  });
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
  (fetchCallReadOnlyFunction as jest.Mock).mockReset().mockResolvedValue({
    type: "ok",
    value: { type: "buffer", value: OUTPUT_SCRIPT_HEX },
  });
  (fetchConstructLockupOutputScript as jest.Mock)
    .mockReset()
    .mockResolvedValue(OUTPUT_SCRIPT);
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue(null);
});

describe("createBond — a funding transfer that FAILED after it was broadcast", () => {
  // Fireblocks reports FAILED for transfers that reached the network, e.g.
  // DROPPED_BY_BLOCKCHAIN or DOUBLE_SPENDING. Such a transaction can still confirm.
  const BROADCAST_TXID = "cd".repeat(32);
  const failedAfterBroadcast = () =>
    new FireblocksTransferError(`Transfer ${FB_ID} reached terminal status FAILED (DOUBLE_SPENDING)`, {
      operation: "TRANSFER",
      status: TransactionStateEnum.Failed,
      subStatus: "DOUBLE_SPENDING",
      vendorId: FB_ID,
      txHash: BROADCAST_TXID,
    });

  it("does not advance the funding generation", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(failedAfterBroadcast());

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.success).toBe(false);
    expect((await readRecord(sdk)).fundingGeneration ?? 0).toBe(0);
  });

  it("points the record at the broadcast transaction and names it", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(failedAfterBroadcast());

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect((await readRecord(sdk)).btcTxid).toBe(BROADCAST_TXID);
    expect(res.error).toContain(BROADCAST_TXID);
    expect(res.error).not.toMatch(/re-fund/i);
  });

  it("does not open a second transfer on retry", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(failedAfterBroadcast());
    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);
    // The broadcast transaction is not (yet) visible on-chain.
    sdk.getBtcTxStatus = jest.fn().mockResolvedValue({ success: true, data: { found: false } });

    const retry = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(retry.success).toBe(false);
    expect(sdk.fireblocksService.createBitcoinTransaction).toHaveBeenCalledTimes(1);
  });
});

describe("createBond — terminal failure on the FRESH funding path", () => {
  it("returns the structured dead-end instead of rethrowing opaquely", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(
      terminalError(TransactionStateEnum.Rejected, "REJECTED_BY_POLICY"),
    );

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/terminally failed/i);
    // The operator needs to be told the id is spent and how to recover.
    expect(res.error).toMatch(/retry createBond/i);
    expect(res.error).toMatch(/bond-fund-/);
  });

  it("directs the operator to retry this bond index once the generation advanced", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(
      terminalError(TransactionStateEnum.Rejected, "REJECTED_BY_POLICY"),
    );

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(await readRecord(sdk)).toMatchObject({ fundingGeneration: 1 });
    expect(res.error).toMatch(/retry createBond/i);
    expect(res.error).not.toMatch(/different bond index/i);
  });

  it("keeps the dead-end advice when the generation advance could NOT be persisted", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(
      terminalError(TransactionStateEnum.Rejected, "REJECTED_BY_POLICY"),
    );
    const store = sdk.lockRecordStore;
    const realSave = store.saveRecord.bind(store);
    // Fails only the abandon write (the sole save that advances past generation 0): the
    // funding-intent saves that precede it must land, or the terminal path is never reached.
    store.saveRecord = jest.fn(async (addr: string, idx: number, rec: any) => {
      if ((rec.fundingGeneration ?? 0) > 0) throw new Error("disk full");
      return realSave(addr, idx, rec);
    });

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.error).toMatch(/different bond index/i);
    expect(res.error).not.toMatch(/retry createBond/i);
  });

  it("drops the Fireblocks id so the btcTxid recovery path is not blocked", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(
      terminalError(TransactionStateEnum.Failed),
    );

    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    const after = await readRecord(sdk);
    // onSubmitted persisted it; a terminally failed transfer can never yield a txid, so
    // leaving it recorded would make the caller-btcTxid guard refuse the prescribed recovery.
    expect(after.fireblocksId).toBeUndefined();
    expect(after.lockAddress).toBe(LOCK_ADDRESS);
    expect(after.fundingExternalId).toEqual(
      expect.stringContaining("bond-fund-"),
    );
  });

  it("handles a terminal transfer surfaced by duplicate-external-id resolution", async () => {
    const sdk = makeSdk();
    // A prior submit consumed the id before onSubmitted persisted it; resolving that
    // transfer reveals it terminally failed. Same dead-end, reached by a third path.
    const dupErr = Object.assign(
      new Error("code 1438: duplicate externalTxId"),
      {
        code: 1438,
      },
    );
    sdk.fireblocksService.createBitcoinTransaction = jest
      .fn()
      .mockRejectedValue(dupErr);
    sdk.fireblocksService.findBitcoinTransactionByExternalId = jest
      .fn()
      .mockResolvedValue(FB_ID);
    sdk.fireblocksService.awaitBitcoinTransaction = jest
      .fn()
      .mockRejectedValue(terminalError(TransactionStateEnum.Rejected));

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/terminally failed/i);
    expect(res.error).toMatch(/retry createBond/i);
  });

  it("persists the terminal vendor id separately from the in-flight slot", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(
      terminalError(TransactionStateEnum.Rejected),
    );

    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    const after = await readRecord(sdk);
    // The in-flight slot must be clear — a terminal transfer can never yield a txid.
    expect(after.fireblocksId).toBeUndefined();
    // ...but the id itself must survive durably, not only inside an error string, or the
    // operator has nothing to look up in Fireblocks.
    expect(after.abandonedFireblocksIds).toContain(FB_ID);
  });

  it("records each abandoned id, not just the most recent", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(
      terminalError(TransactionStateEnum.Rejected),
    );

    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);
    // Second attempt derives a new external id (generation advanced) and also dies. Its
    // error names ITS OWN transfer: an error naming the first transfer would be a stale
    // failure, which must not abandon this one.
    sdk.fireblocksService.createBitcoinTransaction = jest
      .fn()
      .mockImplementation(async (..._args: any[]) => {
        await _args[5]?.("fireblocks-tx-id-second");
        throw terminalErrorFor("fireblocks-tx-id-second", TransactionStateEnum.Failed);
      });
    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    const after = await readRecord(sdk);
    expect(after.abandonedFireblocksIds).toEqual([
      FB_ID,
      "fireblocks-tx-id-second",
    ]);
  });

  it("a stale failure from an overlapping call does not abandon the transfer that replaced it", async () => {
    // Two overlapping createBond calls (an HTTP retry is enough) both await transfer A.
    // A is rejected; call 1 abandons it and a retry opens B. Call 2 then receives A's
    // rejection. Abandoning whatever the record holds would clear B — still live — and
    // advance the generation again, so the next retry opens C and two transfers land.
    const sdk = makeSdk();

    // Leave A in flight: accepted (id persisted), then the confirmation poll dies.
    sdk.fireblocksService.createBitcoinTransaction = jest
      .fn()
      .mockImplementation(async (..._args: any[]) => {
        await _args[5]?.(FB_ID);
        throw new Error("ECONNRESET");
      });
    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);
    expect((await readRecord(sdk)).fireblocksId).toBe(FB_ID);

    const a1 = deferred<string>();
    const a2 = deferred<string>();
    sdk.fireblocksService.awaitBitcoinTransaction = jest
      .fn()
      .mockImplementationOnce(() => a1.promise)
      .mockImplementationOnce(() => a2.promise);

    const call1 = sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);
    const call2 = sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);
    await until(() => sdk.fireblocksService.awaitBitcoinTransaction.mock.calls.length === 2);

    a1.reject(terminalErrorFor(FB_ID, TransactionStateEnum.Rejected));
    await call1;

    // A retry opens B, which Fireblocks accepts and is still processing.
    let bAccepted = false;
    sdk.fireblocksService.createBitcoinTransaction = jest
      .fn()
      .mockImplementation(async (..._args: any[]) => {
        await _args[5]?.("fireblocks-tx-id-B");
        bAccepted = true;
        return new Promise(() => {});
      });
    void sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);
    await until(() => bAccepted);

    a2.reject(terminalErrorFor(FB_ID, TransactionStateEnum.Rejected));
    const stale = await call2;

    const after = await readRecord(sdk);
    expect(after.fireblocksId).toBe("fireblocks-tx-id-B");
    expect(after.fundingGeneration).toBe(1);
    expect(after.abandonedFireblocksIds).toEqual([FB_ID]);
    expect(stale.success).toBe(false);
    expect(stale.error).not.toMatch(/derive a fresh external id/);
  });

  it("reports a funding transfer still awaiting approval as a field, not as a failure string", async () => {
    // Review item 4: the poll gave up while the transfer sat in PENDING_AUTHORIZATION.
    // The app could only tell that from a failure by parsing "…timed out…" out of error.
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(
      terminalErrorFor(FB_ID, TransactionStateEnum.PendingAuthorization),
    );

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.success).toBe(false);
    expect(res.pendingApproval).toBe(true);
    expect(res.pendingFireblocksId).toBe(FB_ID);
    expect(res.pendingFireblocksStatus).toBe(TransactionStateEnum.PendingAuthorization);
    expect(res.error).not.toMatch(/^Failed to create bond/);
  });

  it("reports a machine-paced stall with its id, but not as an approval", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(
      terminalErrorFor(FB_ID, TransactionStateEnum.PendingSignature),
    );

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.pendingApproval).toBeUndefined();
    expect(res.pendingFireblocksId).toBe(FB_ID);
    expect(res.pendingFireblocksStatus).toBe(TransactionStateEnum.PendingSignature);
  });

  it("does not report a terminal failure as pending", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(
      terminalErrorFor(FB_ID, TransactionStateEnum.Rejected),
    );

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.pendingApproval).toBeUndefined();
    expect(res.pendingFireblocksId).toBeUndefined();
  });

  it("persists the resolved id BEFORE polling it, so a timeout still leaves a pointer", async () => {
    const sdk = makeSdk();
    const dupErr = Object.assign(
      new Error("code 1438: duplicate externalTxId"),
      {
        code: 1438,
      },
    );
    sdk.fireblocksService.createBitcoinTransaction = jest
      .fn()
      .mockRejectedValue(dupErr);
    // Lookup succeeds; the poll then fails NON-terminally (the transfer may still land).
    sdk.fireblocksService.findBitcoinTransactionByExternalId = jest
      .fn()
      .mockResolvedValue(FB_ID);
    sdk.fireblocksService.awaitBitcoinTransaction = jest
      .fn()
      .mockRejectedValue(new Error("ECONNRESET"));

    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    const after = await readRecord(sdk);
    // Without splitting lookup from polling, the id was discovered and then thrown away.
    expect(after.fireblocksId).toBe(FB_ID);
  });

  it("still rethrows a NON-terminal failure so a later retry can resume the transfer", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(
      new Error("ECONNRESET"),
    );

    const res = await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(res.success).toBe(false);
    expect(res.error ?? "").not.toMatch(/terminally failed/i);
    // The transfer may still land, so the pointer to it must survive.
    const after = await readRecord(sdk);
    expect(after.fireblocksId).toBe(FB_ID);
  });
});
