/**
 * `getBondPosition` must not report "no position" over recoverable Bitcoin (FBS-21).
 *
 * On-chain bond membership is mutable: maturity drops it, `announce-l1-early-exit`
 * zeroes it, and a later registration overwrites it. The durable lock record is not.
 * `getBondPosition` — the natural "where am I?" call — stopped at `bond: null` the
 * moment membership was absent, which reads as "you have no position" to a staker whose
 * BTC is still sitting in an unspent lock UTXO awaiting recovery.
 *
 * `getHistoricalBondPosition(bondIndex)` already answers this, but only for a caller who
 * already knows the index — which is exactly what the absent membership no longer tells
 * them. The fallback closes that gap.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchPoxInfo: jest.fn(),
    fetchBondMembership: jest.fn(),
    fetchStakerInfo: jest.fn(),
    fetchEarned: jest.fn(),
    fetchAccountStatus: jest.fn(),
    bondPeriodToRewardCycle: jest.fn(),
    bondPhaseRanges: jest.fn(),
  };
});

import { StacksSDK } from "../StacksSDK";
import {
  fetchPoxInfo as fetchPox5Info,
  fetchBondMembership,
  fetchStakerInfo,
  fetchEarned,
  fetchAccountStatus,
  bondPeriodToRewardCycle,
  bondPhaseRanges,
} from "@stacks/bitcoin-staking";

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const MANAGER = `${BOOT_ADDR}.signer-manager`;
const BTC_TXID = "ab".repeat(32);
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const l1Record = (bondIndex: number, over: Record<string, unknown> = {}) => ({
  bondIndex,
  unlockBytes: new Uint8Array([1, 2, 3]),
  lockAddress: `tb1qlock${bondIndex}`,
  unlockHeight: 900,
  amountSats: BigInt(120_000),
  isL1Lock: true,
  signerManager: MANAGER,
  btcTxid: BTC_TXID,
  vout: 0,
  ...over,
});

/** What getHistoricalBondPosition returns for a lock whose UTXO is still unspent. */
const stillLocked = (bondIndex: number) => ({
  success: true,
  data: {
    bond_index: bondIndex,
    amount_sats: "120000",
    amount_btc: "0.00120000",
    lock_address: `tb1qlock${bondIndex}`,
    unlock_height: 900,
    btc_txid: BTC_TXID,
    vout: 0,
    still_locked: true,
    recovered: false,
    matured: true,
  },
});

const recovered = (bondIndex: number) => ({
  success: true,
  data: {
    ...stillLocked(bondIndex).data,
    still_locked: false,
    recovered: true,
  },
});

/** Esplora unreadable: indeterminate, which is NOT recovered. */
const indeterminate = (bondIndex: number) => ({
  success: true,
  data: {
    ...stillLocked(bondIndex).data,
    still_locked: null,
    recovered: null,
    matured: null,
  },
});

const makeSdk = (store: Record<string, unknown> = {}): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  sdk.lockRecordStore = {
    loadRecord: jest.fn().mockResolvedValue(null),
    saveRecord: jest.fn(),
    listRecords: jest.fn().mockResolvedValue([]),
    ...store,
  };
  sdk.getHistoricalBondPosition = jest
    .fn()
    .mockImplementation(async (i: number) => stillLocked(i));
  return sdk;
};

beforeEach(() => {
  (fetchPox5Info as jest.Mock).mockReset().mockResolvedValue({
    rewardCycleId: 12,
    currentBurnchainBlockHeight: 900,
    contractId: "SP000.pox-5",
  });
  (bondPeriodToRewardCycle as jest.Mock).mockReset().mockReturnValue(10);
  (bondPhaseRanges as jest.Mock).mockReset().mockReturnValue([]);
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue(undefined);
  (fetchStakerInfo as jest.Mock)
    .mockReset()
    .mockResolvedValue({ staked: false });
  (fetchEarned as jest.Mock).mockReset().mockResolvedValue(BigInt(0));
  (fetchAccountStatus as jest.Mock)
    .mockReset()
    .mockResolvedValue({ unlockHeight: 0 });
});

describe("getBondPosition — historical fallback when membership is absent", () => {
  it("surfaces a still-locked bond rather than reporting no position", async () => {
    const sdk = makeSdk({
      listRecords: jest.fn().mockResolvedValue([l1Record(4)]),
    });

    const res = await sdk.getBondPosition();

    expect(res.success).toBe(true);
    // bond stays null: there genuinely is no live membership on chain.
    expect(res.data.bond).toBeNull();
    expect(res.data.historical_bonds).toHaveLength(1);
    expect(res.data.historical_bonds[0].bond_index).toBe(4);
    expect(res.data.historical_bonds[0].still_locked).toBe(true);
  });

  it("omits a bond whose BTC is confirmed recovered", async () => {
    const sdk = makeSdk({
      listRecords: jest.fn().mockResolvedValue([l1Record(4)]),
    });
    sdk.getHistoricalBondPosition = jest
      .fn()
      .mockImplementation(async (i: number) => recovered(i));

    const res = await sdk.getBondPosition();

    // A fully recovered bond is finished — reporting it would be noise on every call.
    expect(res.data.historical_bonds).toHaveLength(0);
  });

  it("includes a bond whose Bitcoin state is indeterminate", async () => {
    const sdk = makeSdk({
      listRecords: jest.fn().mockResolvedValue([l1Record(4)]),
    });
    sdk.getHistoricalBondPosition = jest
      .fn()
      .mockImplementation(async (i: number) => indeterminate(i));

    const res = await sdk.getBondPosition();

    // recovered:null is UNKNOWN, not recovered — dropping it would hide possibly-live BTC.
    expect(res.data.historical_bonds).toHaveLength(1);
    expect(res.data.historical_bonds[0].recovered).toBeNull();
  });

  it("skips sBTC-backed records, which hold no recoverable Bitcoin", async () => {
    const sdk = makeSdk({
      listRecords: jest
        .fn()
        .mockResolvedValue([l1Record(4, { isL1Lock: false })]),
    });

    const res = await sdk.getBondPosition();

    expect(res.data.historical_bonds).toHaveLength(0);
    expect(sdk.getHistoricalBondPosition).not.toHaveBeenCalled();
  });

  it("flags an unenumerable store instead of reporting an empty history", async () => {
    const sdk = makeSdk({ listRecords: undefined });

    const res = await sdk.getBondPosition();

    // Without enumeration nothing is known — an empty list would read as "no BTC
    // anywhere", which is the same absence-vs-unknown confusion this call had already.
    expect(res.data.historical_lookup_failed).toBe(true);
    expect(res.data.historical_bonds).toBeUndefined();
  });

  it("flags a throwing store rather than swallowing it", async () => {
    const sdk = makeSdk({
      listRecords: jest.fn().mockRejectedValue(new Error("store down")),
    });

    const res = await sdk.getBondPosition();

    expect(res.data.historical_lookup_failed).toBe(true);
  });

  it("flags a per-record lookup failure while still reporting the records that resolved", async () => {
    const sdk = makeSdk({
      listRecords: jest.fn().mockResolvedValue([l1Record(4), l1Record(6)]),
    });
    sdk.getHistoricalBondPosition = jest
      .fn()
      .mockImplementation(async (i: number) =>
        i === 6
          ? { success: false, error: "Bond 6 not found" }
          : stillLocked(i),
      );

    const res = await sdk.getBondPosition();

    // Dropping bond 6 silently would under-report committed BTC on exactly the call a
    // staker uses to find it.
    expect(res.data.historical_bonds).toHaveLength(1);
    expect(res.data.historical_lookup_failed).toBe(true);
  });

  it("reports an empty history, unflagged, when the store has no records", async () => {
    const sdk = makeSdk({ listRecords: jest.fn().mockResolvedValue([]) });

    const res = await sdk.getBondPosition();

    expect(res.data.historical_bonds).toHaveLength(0);
    expect(res.data.historical_lookup_failed).toBeUndefined();
  });

  it("does not run the historical lookup when a live membership exists", async () => {
    const sdk = makeSdk({
      listRecords: jest.fn().mockResolvedValue([l1Record(4)]),
    });
    (fetchBondMembership as jest.Mock).mockResolvedValue({
      bondIndex: 4,
      signer: MANAGER,
      isL1Lock: false,
      amountUstx: BigInt(1_000),
      amountSats: BigInt(120_000),
    });

    const res = await sdk.getBondPosition();

    expect(res.data.bond).not.toBeNull();
    // The live path must not pay for N extra chain round trips per call.
    expect(sdk.lockRecordStore.listRecords).not.toHaveBeenCalled();
    expect(res.data.historical_bonds).toBeUndefined();
  });
});
