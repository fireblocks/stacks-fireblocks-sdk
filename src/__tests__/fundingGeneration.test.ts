/**
 * Renewable funding external id (issue 205).
 *
 * The funding external id was derived from vault + network + bondIndex + lockAddress
 * alone. That determinism is what makes Fireblocks de-duplicate a retry, but it also
 * means a TERMINALLY failed transfer permanently consumes the id: the same enrollment
 * can never be funded again, because every retry re-derives the id Fireblocks has
 * already rejected.
 *
 * A generation in the derived material makes the id renewable. It may only advance on a
 * typed terminal status, and only in the same write that abandons the dead attempt — an
 * advance on a false terminal, or one that is not atomic with clearing the Fireblocks id,
 * authorises a SECOND Bitcoin transfer to the same lock.
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
const FB_ID = "fireblocks-tx-id-gen";
const AMOUNT_SATS = BigInt(100_000);
const MANAGER = `${BOOT_ADDR}.signer-manager`;

/** The external id createBond handed to Fireblocks on the Nth funding attempt. */
const externalIdOfCall = (mock: jest.Mock, call: number): string =>
  mock.mock.calls[call][4];

const terminalError = () =>
  new FireblocksTransferError(`Transfer ${FB_ID} reached terminal status`, {
    operation: "TRANSFER",
    status: TransactionStateEnum.Rejected,
    subStatus: "REJECTED_BY_POLICY",
    vendorId: FB_ID,
  });

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
    resolveBitcoinTransactionByExternalId: jest.fn(),
  };
  sdk.setLockRecordStore(new InMemoryLockRecordStore());
  return sdk;
}

const readRecord = (sdk: any) =>
  sdk.lockRecordStore.loadRecord(sdk.address, BOND_INDEX);

/** Fireblocks accepts the transfer (id persisted via onSubmitted), then it dies. */
const acceptThenFail = (error: Error) =>
  jest.fn().mockImplementation(async (..._args: any[]) => {
    await _args[5]?.(FB_ID);
    throw error;
  });

/** Fireblocks never accepts it — no id is assigned, nothing to resume. */
const rejectBeforeAccept = (error: Error) =>
  jest.fn().mockImplementation(async () => {
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

describe("funding external id — renewal after a terminal failure", () => {
  it("derives a NEW external id on the attempt after a terminal failure", async () => {
    const sdk = makeSdk();
    const create = acceptThenFail(terminalError());
    sdk.fireblocksService.createBitcoinTransaction = create;

    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);
    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(create).toHaveBeenCalledTimes(2);
    // Without renewal the retry re-derives the consumed id and can never be funded.
    expect(externalIdOfCall(create, 1)).not.toBe(externalIdOfCall(create, 0));
  });

  it("keeps the SAME external id after a non-terminal failure, so Fireblocks de-duplicates", async () => {
    const sdk = makeSdk();
    // Rejected before acceptance: no Fireblocks id, so the retry funds fresh again.
    const create = rejectBeforeAccept(new Error("ECONNRESET"));
    sdk.fireblocksService.createBitcoinTransaction = create;

    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);
    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    expect(create).toHaveBeenCalledTimes(2);
    // This is the assertion that prevents a double transfer: a transient failure must
    // NOT advance the generation, or the retry escapes Fireblocks' de-duplication.
    expect(externalIdOfCall(create, 1)).toBe(externalIdOfCall(create, 0));
  });

  it("advances the generation in the same write that clears the Fireblocks id", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction =
      acceptThenFail(terminalError());

    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    const after = await readRecord(sdk);
    expect(after.fundingGeneration).toBe(1);
    // Non-atomic advance = a retry derives a fresh id while the dead transfer still
    // looks in flight, which is the double-funding case.
    expect(after.fireblocksId).toBeUndefined();
  });

  it("leaves the generation untouched on a non-terminal failure", async () => {
    const sdk = makeSdk();
    sdk.fireblocksService.createBitcoinTransaction = acceptThenFail(
      new Error("ECONNRESET"),
    );

    await sdk.createBond(BOND_INDEX, AMOUNT_SATS, MANAGER);

    const after = await readRecord(sdk);
    expect(after.fundingGeneration ?? 0).toBe(0);
    // The transfer may still land, so the pointer to it survives.
    expect(after.fireblocksId).toBe(FB_ID);
  });

  it("derives the pre-existing id for a record written before generations existed", () => {
    const sdk = makeSdk();
    // Back-compat: an in-flight bond funded by an older build has no generation, and
    // must keep deriving the id Fireblocks already holds.
    const withoutGeneration = sdk.deriveFundingExternalId(
      BOND_INDEX,
      LOCK_ADDRESS,
    );
    const atGenerationZero = sdk.deriveFundingExternalId(
      BOND_INDEX,
      LOCK_ADDRESS,
      0,
    );
    expect(withoutGeneration).toBe(atGenerationZero);
  });
});
