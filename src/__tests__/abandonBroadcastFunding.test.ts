/**
 * An explicit exit for a funding transfer that failed after it was broadcast.
 *
 * Such a record points at a txid and still names its Fireblocks transfer, so createBond
 * refuses to fund the bond again and renewBond refuses to renew into it. If the txid never
 * confirms, nothing could clear the record. abandonBroadcastFunding clears it, but only when
 * Fireblocks still reports the transfer terminal, the indexer does not know the txid, and
 * nothing sits at the lock address.
 */

import { TransactionStateEnum } from "@fireblocks/ts-sdk";
import { StacksSDK } from "../StacksSDK";

const { InMemoryLockRecordStore } = jest.requireActual(
  "../staking/bonds/unlock-bytes-store",
);

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const LOCK_ADDRESS = "bcrt1qlockaddress";
const BOND_INDEX = 4;
const BROADCAST_TXID = "cd".repeat(32);
const FB_ID = "fb-failed-after-broadcast";
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
  amountSats: BigInt(100_000),
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

const realFetch = global.fetch;
const lockAddressHolds = (
  utxos: Array<{ txid: string; vout: number }>,
  status = 200,
) => {
  global.fetch = (async () =>
    new Response(JSON.stringify(utxos), {
      status,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
};

const makeSdk = async (
  record: Record<string, unknown> | null = failedAfterBroadcastRecord(),
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
  lockAddressHolds([]);
  return sdk;
};

const readRecord = (sdk: any) =>
  sdk.lockRecordStore.loadRecord(BOOT_ADDR, BOND_INDEX);

afterEach(() => {
  global.fetch = realFetch;
});

describe("abandonBroadcastFunding — all three checks hold", () => {
  it("clears the pointer, records the transfer as abandoned and advances the generation in one write", async () => {
    const sdk = await makeSdk();
    const saves = jest.spyOn(sdk.lockRecordStore, "saveRecord");

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    expect(res.success).toBe(true);
    expect(res.abandonedFireblocksId).toBe(FB_ID);
    expect(res.btcTxid).toBe(BROADCAST_TXID);
    expect(saves).toHaveBeenCalledTimes(1);
    const after = await readRecord(sdk);
    expect(after.btcTxid).toBeUndefined();
    expect(after.vout).toBeUndefined();
    expect(after.fireblocksId).toBeUndefined();
    expect(after.abandonedFireblocksIds).toEqual(["fb-older", FB_ID]);
    expect(after.fundingGeneration).toBe(2);
    expect(after.stage).toBe("lock-fixed");
    // The lock parameters stay: createBond re-funds this same lock.
    expect(after.lockAddress).toBe(LOCK_ADDRESS);
  });
});

describe("abandonBroadcastFunding — refuses and writes nothing", () => {
  const expectUntouched = async (sdk: any, res: any) => {
    expect(res.success).toBe(false);
    expect(await readRecord(sdk)).toEqual(failedAfterBroadcastRecord());
  };

  it.each([
    [
      "the transfer is no longer terminal in Fireblocks",
      TransactionStateEnum.Broadcasting,
    ],
    ["the transfer completed in Fireblocks", TransactionStateEnum.Completed],
  ])("when %s", async (_label, status) => {
    const sdk = await makeSdk();
    sdk.fireblocksService.getTransferState.mockResolvedValue({
      status,
      txHash: BROADCAST_TXID,
    });

    await expectUntouched(sdk, await sdk.abandonBroadcastFunding(BOND_INDEX));
  });

  it("when the Fireblocks status cannot be read", async () => {
    const sdk = await makeSdk();
    sdk.fireblocksService.getTransferState.mockRejectedValue(
      new Error("fireblocks 503"),
    );

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    await expectUntouched(sdk, res);
    expect(res.error).toMatch(/UNKNOWN/);
  });

  it("when the indexer knows the txid", async () => {
    const sdk = await makeSdk();
    sdk.getBtcTxStatus.mockResolvedValue({
      success: true,
      data: { found: true },
    });

    const res = await sdk.abandonBroadcastFunding(BOND_INDEX);

    await expectUntouched(sdk, res);
    expect(res.error).toMatch(/resumeBondRegistration/);
  });

  it("when the indexer cannot be read", async () => {
    const sdk = await makeSdk();
    sdk.getBtcTxStatus.mockResolvedValue({
      success: false,
      error: "esplora 503",
    });

    await expectUntouched(sdk, await sdk.abandonBroadcastFunding(BOND_INDEX));
  });

  it("when anything sits at the lock address", async () => {
    const sdk = await makeSdk();
    lockAddressHolds([{ txid: "ef".repeat(32), vout: 0 }]);

    await expectUntouched(sdk, await sdk.abandonBroadcastFunding(BOND_INDEX));
  });

  it("when the lock address cannot be read", async () => {
    const sdk = await makeSdk();
    lockAddressHolds([], 503);

    await expectUntouched(sdk, await sdk.abandonBroadcastFunding(BOND_INDEX));
  });

  it("when the record does not name the transfer that produced its txid", async () => {
    const record = failedAfterBroadcastRecord();
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
