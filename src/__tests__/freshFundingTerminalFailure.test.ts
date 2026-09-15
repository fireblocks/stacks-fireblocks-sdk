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
    expect(res.error).toMatch(/opts\.btcTxid/);
    expect(res.error).toMatch(/bond-fund-/);
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
    expect(res.error).toMatch(/opts\.btcTxid/);
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
    // Second attempt derives a new external id (generation advanced) and also dies.
    sdk.fireblocksService.createBitcoinTransaction = jest
      .fn()
      .mockImplementation(async (..._args: any[]) => {
        await _args[5]?.("fireblocks-tx-id-second");
        throw terminalError(TransactionStateEnum.Failed);
      });
    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    const after = await readRecord(sdk);
    expect(after.abandonedFireblocksIds).toEqual([
      FB_ID,
      "fireblocks-tx-id-second",
    ]);
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
