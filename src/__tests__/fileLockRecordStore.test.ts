import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import {
  FileLockRecordStore,
  CorruptLockStoreError,
} from "../staking/bonds/file-lock-record-store";
import { BondLockRecord } from "../staking/bonds/unlock-bytes-store";

const makeRecord = (bondIndex: number): BondLockRecord => ({
  bondIndex,
  unlockBytes: new Uint8Array([1, 2, 3, 4]),
  lockAddress: "bcrt1qexample",
  unlockHeight: 1000 + bondIndex,
  amountSats: BigInt("100000000") + BigInt(bondIndex),
  isL1Lock: true,
  btcTxid: "aa".repeat(32),
  vout: 0,
  signerManager: "ST000000000000000000002AMW42H.signer-manager",
  firstRewardCycle: 42,
  fundingExternalId: `bond-fund-${bondIndex}`,
  stage: "btc-confirmed",
});

describe("FileLockRecordStore (FBS-35/52 durable store)", () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "lockstore-"));
    file = path.join(dir, "records.json");
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("round-trips a record (including Uint8Array and bigint)", async () => {
    const store = new FileLockRecordStore(file);
    const rec = makeRecord(3);
    await store.saveRecord("STADDR", 3, rec);

    const loaded = await store.loadRecord("STADDR", 3);
    expect(loaded).not.toBeNull();
    expect(loaded!.amountSats).toBe(rec.amountSats);
    expect(Array.from(loaded!.unlockBytes)).toEqual([1, 2, 3, 4]);
    expect(loaded!.lockAddress).toBe(rec.lockAddress);
    expect(loaded!.signerManager).toBe(rec.signerManager);
  });

  it("persists the resume fields (stage, fundingExternalId) across reload", async () => {
    // A fresh store instance reads only what was written to disk — no in-memory carry-over.
    const rec = makeRecord(5);
    await new FileLockRecordStore(file).saveRecord("STADDR", 5, rec);

    const loaded = await new FileLockRecordStore(file).loadRecord("STADDR", 5);
    expect(loaded!.stage).toBe("btc-confirmed");
    expect(loaded!.fundingExternalId).toBe("bond-fund-5");
  });

  it("does not clobber the verified backup with a corrupt primary on the next save", async () => {
    const store = new FileLockRecordStore(file);
    await store.saveRecord("STADDR", 1, makeRecord(1)); // primary={1}, no bak
    await store.saveRecord("STADDR", 2, makeRecord(2)); // bak={1}, primary={1,2}

    await fs.writeFile(file, "corrupt", "utf8"); // primary corrupt; bak still {1}

    // This save recovers from the backup and must NOT copy the corrupt primary over it.
    await store.saveRecord("STADDR", 3, makeRecord(3));

    // Corrupt the primary a second time: if the backup had been clobbered, record 1 would
    // now be unrecoverable. With the backup preserved, it is still readable.
    await fs.writeFile(file, "corrupt again", "utf8");
    const recovered = await store.loadRecord("STADDR", 1);
    expect(recovered).not.toBeNull();
    expect(recovered!.bondIndex).toBe(1);
  });

  it("treats a genuinely missing store as empty (not an error)", async () => {
    const store = new FileLockRecordStore(file);
    expect(await store.loadRecord("STADDR", 1)).toBeNull();
    await expect(store.checkHealth()).resolves.toBeUndefined();
  });

  it("fails closed on a corrupt store and preserves the corrupt file", async () => {
    const store = new FileLockRecordStore(file);
    await store.saveRecord("STADDR", 1, makeRecord(1));

    // Corrupt the primary file without touching the backup.
    await fs.writeFile(file, "{ not valid json", "utf8");

    await expect(store.loadRecord("STADDR", 1)).rejects.toBeInstanceOf(CorruptLockStoreError);
    // The corrupt file must NOT be overwritten with an empty object.
    const raw = await fs.readFile(file, "utf8");
    expect(raw).toBe("{ not valid json");
  });

  it("recovers from an intact backup when the primary is corrupt", async () => {
    const store = new FileLockRecordStore(file);
    // Two writes so a .bak of the first good file exists.
    await store.saveRecord("STADDR", 1, makeRecord(1));
    await store.saveRecord("STADDR", 2, makeRecord(2));

    await fs.writeFile(file, "corrupt", "utf8");

    // Backup holds the state after the first save (record 1 only).
    const recovered = await store.loadRecord("STADDR", 1);
    expect(recovered).not.toBeNull();
    expect(recovered!.bondIndex).toBe(1);
  });

  it("detects a checksum mismatch as corruption", async () => {
    const store = new FileLockRecordStore(file);
    await store.saveRecord("STADDR", 1, makeRecord(1));

    const parsed = JSON.parse(await fs.readFile(file, "utf8"));
    parsed.records["STADDR:1"].amountSats = "999"; // tamper without updating checksum
    await fs.writeFile(file, JSON.stringify(parsed), "utf8");

    await expect(store.checkHealth()).rejects.toBeInstanceOf(CorruptLockStoreError);
  });

  it("serializes concurrent writers without losing records", async () => {
    const store = new FileLockRecordStore(file);
    await Promise.all(
      Array.from({ length: 8 }, (_, i) => store.saveRecord("STADDR", i, makeRecord(i))),
    );
    for (let i = 0; i < 8; i++) {
      const r = await store.loadRecord("STADDR", i);
      expect(r).not.toBeNull();
      expect(r!.bondIndex).toBe(i);
    }
  });
});
