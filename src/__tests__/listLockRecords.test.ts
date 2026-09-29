import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import { FileLockRecordStore } from "../staking/bonds/file-lock-record-store";
import {
  BondLockRecord,
  InMemoryLockRecordStore,
} from "../staking/bonds/unlock-bytes-store";

/**
 * Enumerating a staker's lock records (app issue 213, SDK half).
 *
 * The store could only be read by exact (address, bondIndex). The app's "discard
 * record" action therefore destroyed the only pointer to a funded bond: with the
 * bondIndex gone there was no way to ask the store what Bitcoin had been committed.
 * Recovery needs discovery by address alone.
 */
const ADDR_A = "ST000000000000000000002AMW42H";
const ADDR_B = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

const makeRecord = (bondIndex: number): BondLockRecord => ({
  bondIndex,
  unlockBytes: new Uint8Array([1, 2, 3, 4]),
  lockAddress: `bcrt1qlock${bondIndex}`,
  unlockHeight: 1000 + bondIndex,
  amountSats: BigInt(100_000) + BigInt(bondIndex),
  isL1Lock: true,
  btcTxid: "aa".repeat(32),
  vout: 0,
  fundingExternalId: `bond-fund-${bondIndex}`,
  stage: "btc-confirmed",
});

describe.each([
  [
    "InMemoryLockRecordStore",
    async () => ({
      store: new InMemoryLockRecordStore(),
      cleanup: async () => {},
    }),
  ],
  [
    "FileLockRecordStore",
    async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), "listrecords-"));
      return {
        store: new FileLockRecordStore(path.join(dir, "records.json")),
        cleanup: () => fs.rm(dir, { recursive: true, force: true }),
      };
    },
  ],
])("%s.listRecords", (_name, makeStore) => {
  it("returns every record for the given staker", async () => {
    const { store, cleanup } = await makeStore();
    try {
      await store.saveRecord(ADDR_A, 4, makeRecord(4));
      await store.saveRecord(ADDR_A, 7, makeRecord(7));

      const records = await store.listRecords!(ADDR_A);

      expect(records.map((r) => r.bondIndex).sort()).toEqual([4, 7]);
    } finally {
      await cleanup();
    }
  });

  it("does not leak another staker's records", async () => {
    const { store, cleanup } = await makeStore();
    try {
      await store.saveRecord(ADDR_A, 4, makeRecord(4));
      await store.saveRecord(ADDR_B, 9, makeRecord(9));

      const records = await store.listRecords!(ADDR_A);

      expect(records).toHaveLength(1);
      expect(records[0].bondIndex).toBe(4);
    } finally {
      await cleanup();
    }
  });

  it("returns an empty list for a staker with no records", async () => {
    const { store, cleanup } = await makeStore();
    try {
      const records = await store.listRecords!(ADDR_B);

      expect(records).toEqual([]);
    } finally {
      await cleanup();
    }
  });

  it("round-trips the funding facts recovery depends on", async () => {
    const { store, cleanup } = await makeStore();
    try {
      await store.saveRecord(ADDR_A, 4, makeRecord(4));

      const [record] = await store.listRecords!(ADDR_A);

      // These are the pointers to committed Bitcoin — bigint and Uint8Array must
      // survive serialization, not arrive as strings.
      expect(record.amountSats).toBe(BigInt(100_004));
      expect(record.btcTxid).toBe("aa".repeat(32));
      expect(record.lockAddress).toBe("bcrt1qlock4");
      expect(record.unlockBytes).toEqual(new Uint8Array([1, 2, 3, 4]));
    } finally {
      await cleanup();
    }
  });
});
