/**
 * A check against the lock record and the write it guards happen as one step.
 *
 * The abandon paths loaded the record, checked it still tracked the failed request, and
 * saved in separate calls. A write from an overlapping call that landed in between was
 * overwritten: the abandon cleared a newer transfer's id, or advanced past a newer request.
 */

import fs from "fs/promises";
import os from "os";
import path from "path";
import { TransactionStateEnum } from "@fireblocks/ts-sdk";
import { StacksSDK } from "../StacksSDK";
import { FireblocksTransferError } from "../utils/FireblocksSigner";
import {
  InMemoryLockRecordStore,
  BondLockRecord,
} from "../staking/bonds/unlock-bytes-store";
import { FileLockRecordStore } from "../staking/bonds/file-lock-record-store";

const ADDR = "ST000000000000000000002AMW42H";
const BOND = 4;
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const record = (over: Partial<BondLockRecord> = {}): BondLockRecord => ({
  bondIndex: BOND,
  unlockBytes: new Uint8Array([1, 2, 3]),
  lockAddress: "bcrt1qlockaddress",
  unlockHeight: 900,
  amountSats: BigInt(100_000),
  isL1Lock: true,
  fundingExternalId: "bond-fund-abc",
  ...over,
});

const terminal = (vendorId: string, operation = "TRANSFER") =>
  new FireblocksTransferError(`${vendorId} reached terminal status REJECTED`, {
    operation,
    status: TransactionStateEnum.Rejected,
    vendorId,
  });

const makeSdk = (): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = ADDR;
  sdk.setLockRecordStore(new InMemoryLockRecordStore());
  return sdk;
};

/**
 * Lands `concurrent` during the SDK's next access to the store: after a load returns (the
 * gap a separate load and save leaves open), or before an atomic update runs (the only
 * place an overlapping write can land then).
 */
const writeDuringNextAccess = (sdk: any, concurrent: BondLockRecord) => {
  const store = sdk.lockRecordStore;
  const realLoad = store.loadRecord.bind(store);
  const realUpdate = store.updateRecord?.bind(store);
  let done = false;
  store.loadRecord = async (a: string, i: number) => {
    const r = await realLoad(a, i);
    if (!done) {
      done = true;
      await store.saveRecord(a, i, concurrent);
    }
    return r;
  };
  if (realUpdate) {
    store.updateRecord = async (a: string, i: number, fn: any) => {
      if (!done) {
        done = true;
        await store.saveRecord(a, i, concurrent);
      }
      return realUpdate(a, i, fn);
    };
  }
};

describe("LockRecordStore.updateRecord", () => {
  it("in memory: passes the current record and writes what the update returns", async () => {
    const store = new InMemoryLockRecordStore();
    await store.saveRecord(ADDR, BOND, record({ fundingGeneration: 1 }));

    await (store as any).updateRecord(
      ADDR,
      BOND,
      (cur: BondLockRecord | null) => ({
        ...cur!,
        fundingGeneration: (cur!.fundingGeneration ?? 0) + 1,
      }),
    );

    expect((await store.loadRecord(ADDR, BOND))!.fundingGeneration).toBe(2);
  });

  it("in memory: writes nothing when the update returns undefined", async () => {
    const store = new InMemoryLockRecordStore();
    await store.saveRecord(ADDR, BOND, record({ fireblocksId: "fb-a" }));

    await (store as any).updateRecord(ADDR, BOND, () => undefined);

    expect((await store.loadRecord(ADDR, BOND))!.fireblocksId).toBe("fb-a");
  });

  describe("file store", () => {
    let dir: string;
    beforeEach(async () => {
      dir = await fs.mkdtemp(path.join(os.tmpdir(), "lockstore-update-"));
    });
    afterEach(async () => {
      await fs.rm(dir, { recursive: true, force: true });
    });

    it("loses no update when many run concurrently", async () => {
      const store = new FileLockRecordStore(path.join(dir, "records.json"));
      await store.saveRecord(ADDR, BOND, record({ fundingGeneration: 0 }));

      await Promise.all(
        Array.from({ length: 8 }, () =>
          (store as any).updateRecord(
            ADDR,
            BOND,
            (cur: BondLockRecord | null) => ({
              ...cur!,
              fundingGeneration: (cur!.fundingGeneration ?? 0) + 1,
            }),
          ),
        ),
      );

      expect((await store.loadRecord(ADDR, BOND))!.fundingGeneration).toBe(8);
    });

    it("writes nothing when the update returns undefined", async () => {
      const store = new FileLockRecordStore(path.join(dir, "records.json"));
      await store.saveRecord(ADDR, BOND, record({ fireblocksId: "fb-a" }));

      await (store as any).updateRecord(ADDR, BOND, () => undefined);

      expect((await store.loadRecord(ADDR, BOND))!.fireblocksId).toBe("fb-a");
    });
  });
});

describe("abandon paths do not overwrite a concurrent write", () => {
  it("funding: a transfer opened between the check and the write keeps its id", async () => {
    const sdk = makeSdk();
    await sdk.lockRecordStore.saveRecord(
      ADDR,
      BOND,
      record({ fireblocksId: "fb-a", stage: "funding-requested" }),
    );
    writeDuringNextAccess(
      sdk,
      record({
        fireblocksId: "fb-b",
        fundingGeneration: 1,
        stage: "funding-requested",
      }),
    );

    await sdk.abandonTerminalFunding(BOND, "bond-fund-abc", terminal("fb-a"));

    const after = await sdk.lockRecordStore.loadRecord(ADDR, BOND);
    expect(after.fireblocksId).toBe("fb-b");
    expect(after.fundingGeneration).toBe(1);
  });

  it("registration: a generation advanced between the check and the write is not advanced again", async () => {
    const sdk = makeSdk();
    await sdk.lockRecordStore.saveRecord(
      ADDR,
      BOND,
      record({ btcTxid: "ab".repeat(32), registrationGeneration: 0 }),
    );
    // The concurrent write also carries a field the stale copy lacks, so an overwrite shows.
    writeDuringNextAccess(
      sdk,
      record({
        btcTxid: "ab".repeat(32),
        registrationGeneration: 1,
        callerExternalId: "newer",
      }),
    );

    await sdk.abandonTerminalRegistration(
      BOND,
      "bond-register-x",
      terminal("fb-raw", "RAW"),
      0,
    );

    const after = await sdk.lockRecordStore.loadRecord(ADDR, BOND);
    expect(after.registrationGeneration).toBe(1);
    expect(after.callerExternalId).toBe("newer");
  });

  it("broadcast funding: a record that changed during the checks is not cleared", async () => {
    const sdk = makeSdk();
    const failed = record({
      btcTxid: "cd".repeat(32),
      vout: 0,
      fireblocksId: "fb-a",
      fundingGeneration: 1,
      stage: "btc-broadcast",
    });
    await sdk.lockRecordStore.saveRecord(ADDR, BOND, failed);
    sdk.fireblocksService = {
      getTransferState: jest
        .fn()
        .mockResolvedValue({ status: TransactionStateEnum.Failed }),
    };
    // The record moves on while the indexer is being read.
    const moved = {
      ...failed,
      btcTxid: "ef".repeat(32),
      stage: "btc-confirmed" as const,
    };
    sdk.getBtcTxStatus = jest.fn(async () => {
      await sdk.lockRecordStore.saveRecord(ADDR, BOND, moved);
      return { success: true, data: { found: false } };
    });
    const realFetch = global.fetch;
    global.fetch = (async () =>
      new Response("[]", { status: 200 })) as unknown as typeof fetch;
    try {
      const res = await sdk.abandonBroadcastFunding(BOND);

      expect(res.success).toBe(false);
      expect((await sdk.lockRecordStore.loadRecord(ADDR, BOND)).btcTxid).toBe(
        "ef".repeat(32),
      );
    } finally {
      global.fetch = realFetch;
    }
  });
});
