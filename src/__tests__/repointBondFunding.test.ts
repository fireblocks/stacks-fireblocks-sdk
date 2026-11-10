/**
 * Pointing a bond's lock record at the Bitcoin transaction that really funds it.
 *
 * A record can lose its funding pointer: the recorded txid was replaced or evicted, or it was
 * abandoned and later came back, or a caller-supplied txid disappeared. createBond then refuses
 * (correctly — it cannot tell a landed funding from a missing one), and without a way to adopt
 * the transaction actually paying the lock the enrollment has no way forward.
 */

import { TransactionStateEnum } from "@fireblocks/ts-sdk";
import { StacksSDK } from "../StacksSDK";

const { InMemoryLockRecordStore } = jest.requireActual(
  "../staking/bonds/unlock-bytes-store",
);

const ADDR = "ST000000000000000000002AMW42H";
const LOCK_ADDRESS = "bcrt1qlockaddress";
const BOND = 4;
const AMOUNT = 100_000;
const RECORDED = "aa".repeat(32);
const ADOPTED = "bb".repeat(32);
const FB_ID = "fb-1";
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const record = (over: Record<string, unknown> = {}) => ({
  bondIndex: BOND,
  unlockBytes: new Uint8Array([1, 2, 3]),
  lockAddress: LOCK_ADDRESS,
  unlockHeight: 900,
  amountSats: BigInt(AMOUNT),
  isL1Lock: true,
  fundingExternalId: "bond-fund-x",
  fundingGeneration: 1,
  btcTxid: RECORDED,
  vout: 0,
  fireblocksId: FB_ID,
  stage: "btc-broadcast",
  fundingMissingSince: { txid: RECORDED, height: 1_000 },
  ...over,
});

const paysLock = (outputs: Array<{ address?: string; value: number }>) => ({
  found: true,
  outputs,
});

const makeSdk = async (
  rec: Record<string, unknown> | null = record(),
): Promise<any> => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = ADDR;
  sdk.setLockRecordStore(new InMemoryLockRecordStore());
  if (rec) await sdk.lockRecordStore.saveRecord(ADDR, BOND, rec);
  sdk.fireblocksService = {
    getTransferState: jest
      .fn()
      .mockResolvedValue({
        status: TransactionStateEnum.Failed,
        txHash: RECORDED,
      }),
  };
  sdk.getBtcTxStatus = jest
    .fn()
    .mockResolvedValue({ success: true, data: { found: false } });
  sdk.readBtcTxOutputs = jest.fn().mockResolvedValue(
    paysLock([
      { address: "bcrt1qchange", value: 5_000 },
      { address: LOCK_ADDRESS, value: AMOUNT },
    ]),
  );
  return sdk;
};

const readRecord = (sdk: any) => sdk.lockRecordStore.loadRecord(ADDR, BOND);

describe("repointBondFunding — adopts the transaction that pays the lock", () => {
  it("points the record at it and keeps the replaced txid and transfer as abandoned", async () => {
    const sdk = await makeSdk();
    const writes = jest.spyOn(sdk.lockRecordStore, "updateRecord");

    const res = await sdk.repointBondFunding(BOND, ADOPTED);

    expect(res.success).toBe(true);
    expect(res.btcTxid).toBe(ADOPTED);
    expect(res.vout).toBe(1);
    expect(res.previousBtcTxid).toBe(RECORDED);
    expect(writes).toHaveBeenCalledTimes(1);
    const after = await readRecord(sdk);
    expect(after.btcTxid).toBe(ADOPTED);
    expect(after.vout).toBe(1);
    expect(after.stage).toBe("btc-broadcast");
    expect(after.fireblocksId).toBeUndefined();
    expect(after.abandonedFireblocksIds).toEqual([FB_ID]);
    // Only unseen, never proven dead: kept so a later funding of this lock checks it.
    expect(after.abandonedBtcTxids).toEqual([RECORDED]);
    expect(after.fundingMissingSince).toBeUndefined();
  });

  it("adopts an abandoned funding that has come back, and takes it off the abandoned list", async () => {
    const sdk = await makeSdk(
      record({
        btcTxid: undefined,
        vout: undefined,
        fireblocksId: undefined,
        fundingMissingSince: undefined,
        stage: "lock-fixed",
        abandonedBtcTxids: [ADOPTED, "cc".repeat(32)],
      }),
    );

    const res = await sdk.repointBondFunding(BOND, ADOPTED);

    expect(res.success).toBe(true);
    const after = await readRecord(sdk);
    expect(after.btcTxid).toBe(ADOPTED);
    expect(after.abandonedBtcTxids).toEqual(["cc".repeat(32)]);
    expect(sdk.getBtcTxStatus).not.toHaveBeenCalled();
  });

  it("replaces a caller-supplied txid that disappeared, where no Fireblocks transfer is on record", async () => {
    const sdk = await makeSdk(record({ fireblocksId: undefined }));

    const res = await sdk.repointBondFunding(BOND, ADOPTED);

    expect(res.success).toBe(true);
    expect(sdk.fireblocksService.getTransferState).not.toHaveBeenCalled();
  });

  it("uses the output the caller names when several pay the lock the bond amount", async () => {
    const sdk = await makeSdk();
    sdk.readBtcTxOutputs.mockResolvedValue(
      paysLock([
        { address: LOCK_ADDRESS, value: AMOUNT },
        { address: LOCK_ADDRESS, value: AMOUNT },
      ]),
    );

    const res = await sdk.repointBondFunding(BOND, ADOPTED, { vout: 1 });

    expect(res.success).toBe(true);
    expect((await readRecord(sdk)).vout).toBe(1);
  });
});

describe("repointBondFunding — refuses and writes nothing", () => {
  const expectUntouched = async (sdk: any, res: any, rec = record()) => {
    expect(res.success).toBe(false);
    expect(await readRecord(sdk)).toEqual(rec);
  };

  it("when the recorded txid is still visible", async () => {
    const sdk = await makeSdk();
    sdk.getBtcTxStatus.mockResolvedValue({
      success: true,
      data: { found: true },
    });

    await expectUntouched(sdk, await sdk.repointBondFunding(BOND, ADOPTED));
  });

  it("when the recorded txid cannot be looked up", async () => {
    const sdk = await makeSdk();
    sdk.getBtcTxStatus.mockResolvedValue({
      success: false,
      error: "esplora 503",
    });

    const res = await sdk.repointBondFunding(BOND, ADOPTED);

    await expectUntouched(sdk, res);
    expect(res.error).toMatch(/UNKNOWN/);
  });

  it.each([
    ["btc-confirmed"],
    ["proof-built"],
    ["registration-submitted"],
    ["registration-confirmed"],
  ])("when the record has reached %s", async (stage) => {
    const rec = record({ stage });
    const sdk = await makeSdk(rec);

    await expectUntouched(
      sdk,
      await sdk.repointBondFunding(BOND, ADOPTED),
      rec,
    );
  });

  it("when the Fireblocks transfer on record is not terminal, since it could still land", async () => {
    const sdk = await makeSdk();
    sdk.fireblocksService.getTransferState.mockResolvedValue({
      status: TransactionStateEnum.PendingAuthorization,
    });

    await expectUntouched(sdk, await sdk.repointBondFunding(BOND, ADOPTED));
  });

  it("when the Fireblocks transfer on record cannot be read", async () => {
    const sdk = await makeSdk();
    sdk.fireblocksService.getTransferState.mockRejectedValue(
      new Error("fireblocks 503"),
    );

    const res = await sdk.repointBondFunding(BOND, ADOPTED);

    await expectUntouched(sdk, res);
    expect(res.error).toMatch(/UNKNOWN/);
  });

  it("when the transaction to adopt is not visible", async () => {
    const sdk = await makeSdk();
    sdk.readBtcTxOutputs.mockResolvedValue({ found: false });

    await expectUntouched(sdk, await sdk.repointBondFunding(BOND, ADOPTED));
  });

  it("when the transaction to adopt cannot be read", async () => {
    const sdk = await makeSdk();
    sdk.readBtcTxOutputs.mockRejectedValue(new Error("esplora 503"));

    const res = await sdk.repointBondFunding(BOND, ADOPTED);

    await expectUntouched(sdk, res);
    expect(res.error).toMatch(/UNKNOWN/);
  });

  it("when no output pays the lock address", async () => {
    const sdk = await makeSdk();
    sdk.readBtcTxOutputs.mockResolvedValue(
      paysLock([{ address: "bcrt1qelsewhere", value: AMOUNT }]),
    );

    await expectUntouched(sdk, await sdk.repointBondFunding(BOND, ADOPTED));
  });

  it.each([
    ["more", AMOUNT + 1],
    ["less", AMOUNT - 1],
  ])(
    "when the output paying the lock is %s than the bond's recorded amount",
    async (_label, value) => {
      const sdk = await makeSdk();
      sdk.readBtcTxOutputs.mockResolvedValue(
        paysLock([{ address: LOCK_ADDRESS, value }]),
      );

      const res = await sdk.repointBondFunding(BOND, ADOPTED);

      await expectUntouched(sdk, res);
      expect(res.error).toContain(String(AMOUNT));
    },
  );

  it("when several outputs pay the lock the bond amount and none is named", async () => {
    const sdk = await makeSdk();
    sdk.readBtcTxOutputs.mockResolvedValue(
      paysLock([
        { address: LOCK_ADDRESS, value: AMOUNT },
        { address: LOCK_ADDRESS, value: AMOUNT },
      ]),
    );

    const res = await sdk.repointBondFunding(BOND, ADOPTED);

    await expectUntouched(sdk, res);
    expect(res.error).toMatch(/vout/);
  });

  it("when the named output does not pay the lock the bond amount", async () => {
    const sdk = await makeSdk();

    await expectUntouched(
      sdk,
      await sdk.repointBondFunding(BOND, ADOPTED, { vout: 0 }),
    );
  });

  it("when the txid is malformed", async () => {
    const sdk = await makeSdk();

    await expectUntouched(
      sdk,
      await sdk.repointBondFunding(BOND, "not-a-txid"),
    );
  });

  it("when the record changed while it was being checked", async () => {
    const sdk = await makeSdk();
    const moved = { ...record(), btcTxid: "dd".repeat(32) };
    sdk.readBtcTxOutputs = jest.fn(async () => {
      await sdk.lockRecordStore.saveRecord(ADDR, BOND, moved);
      return paysLock([{ address: LOCK_ADDRESS, value: AMOUNT }]);
    });

    const res = await sdk.repointBondFunding(BOND, ADOPTED);

    expect(res.success).toBe(false);
    expect((await readRecord(sdk)).btcTxid).toBe("dd".repeat(32));
  });

  it("when there is no record", async () => {
    const sdk = await makeSdk(null);

    expect((await sdk.repointBondFunding(BOND, ADOPTED)).success).toBe(false);
  });
});
