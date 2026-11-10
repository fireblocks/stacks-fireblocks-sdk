/**
 * An explicit exit for a funding transfer that failed after it was broadcast.
 *
 * Such a record points at a txid and still names its Fireblocks transfer, so createBond
 * refuses to fund the bond again and renewBond refuses to renew into it. If the txid never
 * confirms, nothing could clear the record. abandonBroadcastFunding clears it.
 *
 * One indexer's "not found" is not proof a transaction is dead: it can be evicted from that
 * indexer while other nodes still relay it, and a re-fund would then put a second output on
 * the lock. So the record is cleared only once the txid has stayed missing for
 * ABANDON_MISSING_WAIT_BLOCKS, and only for the transfer that produced exactly that txid.
 */

import { TransactionStateEnum } from "@fireblocks/ts-sdk";
import { StacksSDK } from "../StacksSDK";
import { ABANDON_MISSING_WAIT_BLOCKS } from "../utils/constants";

const { InMemoryLockRecordStore } = jest.requireActual(
  "../staking/bonds/unlock-bytes-store",
);

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const LOCK_ADDRESS = "bcrt1qlockaddress";
const BOND_INDEX = 4;
const BROADCAST_TXID = "cd".repeat(32);
const FB_ID = "fb-failed-after-broadcast";
const AMOUNT_SATS = 100_000;
const FIRST_MISSING_AT = 1_000;
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const failedAfterBroadcastRecord = (over: Record<string, unknown> = {}) => ({
  bondIndex: BOND_INDEX,
  unlockBytes: new Uint8Array([1, 2, 3]),
  lockAddress: LOCK_ADDRESS,
  unlockHeight: 900,
  amountSats: BigInt(AMOUNT_SATS),
  isL1Lock: true,
  fundingExternalId: "bond-fund-abc",
  fundingGeneration: 1,
  abandonedFireblocksIds: ["fb-older"],
  btcTxid: BROADCAST_TXID,
  vout: 0,
  fireblocksId: FB_ID,
  stage: "btc-broadcast",
  ...over,
});

/** A record whose txid has already been missing for the full wait. */
const waitedOut = (over: Record<string, unknown> = {}) =>
  failedAfterBroadcastRecord({
    fundingMissingSince: { txid: BROADCAST_TXID, height: FIRST_MISSING_AT },
    ...over,
  });

const realFetch = global.fetch;
const lockAddressHolds = (
  utxos: Array<{ txid: string; vout: number; value: number }>,
  status = 200,
) => {
  global.fetch = (async () =>
    new Response(JSON.stringify(utxos), {
      status,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
};

const makeSdk = async (
  record: Record<string, unknown> | null = waitedOut(),
  tipHeight: number | null = FIRST_MISSING_AT + ABANDON_MISSING_WAIT_BLOCKS,
): Promise<any> => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.setLockRecordStore(new InMemoryLockRecordStore());
  if (record)
    await sdk.lockRecordStore.saveRecord(BOOT_ADDR, BOND_INDEX, record);
  sdk.fireblocksService = {
    getTransferState: jest.fn().mockResolvedValue({
      status: TransactionStateEnum.Failed,
      subStatus: "DROPPED_BY_BLOCKCHAIN",
      txHash: BROADCAST_TXID,
    }),
  };
  sdk.getBtcTxStatus = jest
    .fn()
    .mockResolvedValue({ success: true, data: { found: false } });
  sdk.readBtcTipHeight = jest.fn().mockResolvedValue(tipHeight);
  lockAddressHolds([]);
  return sdk;
};

const readRecord = (sdk: any) =>
  sdk.lockRecordStore.loadRecord(BOOT_ADDR, BOND_INDEX);

afterEach(() => {
  global.fetch = realFetch;
});

describe("abandonBroadcastFunding — every check holds and the wait has passed", () => {
  it("clears the pointer, remembers the txid, records the transfer as abandoned and advances the generation in one write", async () => {
    const sdk = await makeSdk();
    const writes = jest.spyOn(sdk.lockRecordStore, "updateRecord");

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    expect(res.success).toBe(true);
    expect(res.abandonedFireblocksId).toBe(FB_ID);
    expect(res.btcTxid).toBe(BROADCAST_TXID);
    expect(writes).toHaveBeenCalledTimes(1);
    const after = await readRecord(sdk);
    expect(after.btcTxid).toBeUndefined();
    expect(after.vout).toBeUndefined();
    expect(after.fireblocksId).toBeUndefined();
    expect(after.fundingMissingSince).toBeUndefined();
    expect(after.abandonedFireblocksIds).toEqual(["fb-older", FB_ID]);
    // Kept so a later re-fund can check the abandoned transaction has not come back.
    expect(after.abandonedBtcTxids).toEqual([BROADCAST_TXID]);
    expect(after.fundingGeneration).toBe(2);
    expect(after.stage).toBe("lock-fixed");
    expect(after.lockAddress).toBe(LOCK_ADDRESS);
  });

  it("is not blocked by an output at the lock smaller than the bond", async () => {
    // Anyone can send dust to the lock address; that must not keep the record stuck.
    const sdk = await makeSdk();
    lockAddressHolds([{ txid: "ef".repeat(32), vout: 0, value: 546 }]);

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    expect(res.success).toBe(true);
  });
});

describe("abandonBroadcastFunding — waits before treating a missing txid as dead", () => {
  it("records when the txid was first seen missing and refuses until the wait has passed", async () => {
    const sdk = await makeSdk(failedAfterBroadcastRecord(), 5_000);

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    expect(res.success).toBe(false);
    expect(res.abandonableFromHeight).toBe(5_000 + ABANDON_MISSING_WAIT_BLOCKS);
    expect(res.error).toContain(String(5_000 + ABANDON_MISSING_WAIT_BLOCKS));
    const after = await readRecord(sdk);
    expect(after.fundingMissingSince).toEqual({ txid: BROADCAST_TXID, height: 5_000 });
    expect(after.btcTxid).toBe(BROADCAST_TXID);
    expect(after.fireblocksId).toBe(FB_ID);
  });

  it("keeps refusing, without moving the start, until the wait has passed", async () => {
    const sdk = await makeSdk(waitedOut(), FIRST_MISSING_AT + ABANDON_MISSING_WAIT_BLOCKS - 1);

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    expect(res.success).toBe(false);
    expect(res.abandonableFromHeight).toBe(FIRST_MISSING_AT + ABANDON_MISSING_WAIT_BLOCKS);
    expect((await readRecord(sdk)).fundingMissingSince).toEqual({ txid: BROADCAST_TXID, height: FIRST_MISSING_AT });
  });

  it("restarts the wait if the txid shows up again", async () => {
    const sdk = await makeSdk();
    sdk.getBtcTxStatus.mockResolvedValue({ success: true, data: { found: true } });

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/resumeBondRegistration/);
    expect((await readRecord(sdk)).fundingMissingSince).toBeUndefined();
  });

  it("starts a fresh wait when the recorded start belongs to a different txid", async () => {
    const sdk = await makeSdk(
      failedAfterBroadcastRecord({ fundingMissingSince: { txid: "aa".repeat(32), height: 1 } }),
      5_000,
    );

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    expect(res.success).toBe(false);
    expect((await readRecord(sdk)).fundingMissingSince).toEqual({ txid: BROADCAST_TXID, height: 5_000 });
  });
});

describe("abandonBroadcastFunding — refuses and writes nothing", () => {
  const expectUntouched = async (sdk: any, res: any, record = waitedOut()) => {
    expect(res.success).toBe(false);
    expect(await readRecord(sdk)).toEqual(record);
  };

  it.each([
    ["the transfer is no longer terminal in Fireblocks", TransactionStateEnum.Broadcasting],
    ["the transfer completed in Fireblocks", TransactionStateEnum.Completed],
  ])("when %s", async (_label, status) => {
    const sdk = await makeSdk();
    sdk.fireblocksService.getTransferState.mockResolvedValue({ status, txHash: BROADCAST_TXID });

    await expectUntouched(sdk, await sdk.abandonBroadcastFunding(BOND_INDEX));
  });

  it.each([
    ["reports a txid other than the recorded one", "ab".repeat(32)],
    ["reports no txid", undefined],
  ])("when the transfer %s", async (_label, txHash) => {
    // The record is cleared only for the transfer that produced exactly that txid.
    const sdk = await makeSdk();
    sdk.fireblocksService.getTransferState.mockResolvedValue({
      status: TransactionStateEnum.Failed,
      subStatus: "DROPPED_BY_BLOCKCHAIN",
      ...(txHash ? { txHash } : {}),
    });

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    await expectUntouched(sdk, res);
    expect(sdk.getBtcTxStatus).not.toHaveBeenCalled();
  });

  it("when the transfer failed as DOUBLE_SPENDING", async () => {
    // It lost to another transaction spending the same coins, which may be one of ours
    // paying this lock; until that winner is known, re-funding could double the bond.
    const sdk = await makeSdk();
    sdk.fireblocksService.getTransferState.mockResolvedValue({
      status: TransactionStateEnum.Failed,
      subStatus: "DOUBLE_SPENDING",
      txHash: BROADCAST_TXID,
    });

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    await expectUntouched(sdk, res);
    expect(res.error).toMatch(/DOUBLE_SPENDING/);
  });

  it.each([["btc-confirmed"], ["proof-built"], ["registration-submitted"], ["registration-confirmed"]])(
    "when the record has reached %s",
    async (stage) => {
      // Past confirmation the Bitcoin is locked; clearing would erase a funded bond's outpoint.
      const record = waitedOut({ stage });
      const sdk = await makeSdk(record);

      const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

      await expectUntouched(sdk, res, record);
      expect(sdk.fireblocksService.getTransferState).not.toHaveBeenCalled();
    },
  );

  it("when the Fireblocks status cannot be read", async () => {
    const sdk = await makeSdk();
    sdk.fireblocksService.getTransferState.mockRejectedValue(new Error("fireblocks 503"));

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    await expectUntouched(sdk, res);
    expect(res.error).toMatch(/UNKNOWN/);
  });

  it("when the indexer cannot be read", async () => {
    const sdk = await makeSdk();
    sdk.getBtcTxStatus.mockResolvedValue({ success: false, error: "esplora 503" });

    await expectUntouched(sdk, await sdk.abandonBroadcastFunding(BOND_INDEX));
  });

  it("when an output at least as large as the bond sits at the lock address", async () => {
    const sdk = await makeSdk();
    lockAddressHolds([{ txid: "ef".repeat(32), vout: 0, value: AMOUNT_SATS }]);

    await expectUntouched(sdk, await sdk.abandonBroadcastFunding(BOND_INDEX));
  });

  it("when the lock address cannot be read", async () => {
    const sdk = await makeSdk();
    lockAddressHolds([], 503);

    await expectUntouched(sdk, await sdk.abandonBroadcastFunding(BOND_INDEX));
  });

  it("when the Bitcoin tip height cannot be read", async () => {
    const sdk = await makeSdk(waitedOut(), null);

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    await expectUntouched(sdk, res);
    expect(res.error).toMatch(/UNKNOWN/);
  });

  it("when the record does not name the transfer that produced its txid", async () => {
    const record = waitedOut();
    delete (record as any).fireblocksId;
    const sdk = await makeSdk(record);

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    expect(res.success).toBe(false);
    expect(sdk.fireblocksService.getTransferState).not.toHaveBeenCalled();
  });

  it("when there is no record", async () => {
    const sdk = await makeSdk(null);

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    expect(res.success).toBe(false);
  });
});
