/**
 * Durable, crash-safe, single-host file store for native-BTC bond lock records.
 *
 * Losing a lock record for an unspent BTC lock can strand funds, so this store is
 * built to fail CLOSED rather than silently lose data:
 *
 *  - writes are atomic: a temp file is written and fsync'd, the previous file is
 *    copied to a `.bak`, then the temp file is renamed into place and the directory
 *    is fsync'd — a crash at any point leaves either the previous or the new
 *    complete file, never a truncated one;
 *  - every write carries a schema version and an integrity checksum;
 *  - a MISSING file (genuinely new deployment) is distinguished from a CORRUPT one;
 *    corruption is never overwritten with an empty object — the corrupt file is
 *    preserved and the operation fails closed (falling back to the verified backup
 *    only when IT is intact);
 *  - read-modify-write is serialized across processes with an inter-process lock;
 *  - `checkHealth()` verifies the directory is writable and the store is readable,
 *    and is used to gate native-BTC funding at startup.
 */
import { promises as fs } from "fs";
import { createHash } from "crypto";
import * as path from "path";
import { BondLockRecord, EnrollmentStage, LockRecordStore } from "./unlock-bytes-store";

const SCHEMA_VERSION = 1;

/** JSON-safe form of a BondLockRecord (Uint8Array→hex, bigint→decimal string). */
interface SerializedRecord {
  bondIndex: number;
  unlockBytes: string;
  lockAddress: string;
  unlockHeight: number;
  amountSats: string;
  isL1Lock: boolean;
  btcTxid?: string;
  vout?: number;
  signerManager?: string;
  firstRewardCycle?: number;
  // Persisted so a crash + restart resumes at the last completed enrollment stage
  // instead of re-funding Bitcoin (FBS-02).
  fundingExternalId?: string;
  fireblocksId?: string;
  rewardBtcAddress?: string;
  rewardMaxFeeSats?: string;
  stage?: EnrollmentStage;
}

interface StoreFile {
  version: number;
  checksum: string;
  records: Record<string, SerializedRecord>;
}

/** Thrown when a store file exists but cannot be trusted (bad JSON / checksum). */
export class CorruptLockStoreError extends Error {
  constructor(filePath: string, detail: string) {
    super(
      `Lock-record store at ${filePath} is corrupt (${detail}). The file has been ` +
        `preserved for recovery; refusing to proceed rather than lose bond records.`,
    );
    this.name = "CorruptLockStoreError";
  }
}

const toHex = (b: Uint8Array): string => Buffer.from(b).toString("hex");
const fromHex = (h: string): Uint8Array => new Uint8Array(Buffer.from(h, "hex"));

const serializeRecord = (r: BondLockRecord): SerializedRecord => ({
  bondIndex: r.bondIndex,
  unlockBytes: toHex(r.unlockBytes),
  lockAddress: r.lockAddress,
  unlockHeight: r.unlockHeight,
  amountSats: r.amountSats.toString(),
  isL1Lock: r.isL1Lock,
  ...(r.btcTxid !== undefined ? { btcTxid: r.btcTxid } : {}),
  ...(r.vout !== undefined ? { vout: r.vout } : {}),
  ...(r.signerManager !== undefined ? { signerManager: r.signerManager } : {}),
  ...(r.firstRewardCycle !== undefined ? { firstRewardCycle: r.firstRewardCycle } : {}),
  ...(r.fundingExternalId !== undefined ? { fundingExternalId: r.fundingExternalId } : {}),
  ...(r.fireblocksId !== undefined ? { fireblocksId: r.fireblocksId } : {}),
  ...(r.rewardBtcAddress !== undefined ? { rewardBtcAddress: r.rewardBtcAddress } : {}),
  ...(r.rewardMaxFeeSats !== undefined ? { rewardMaxFeeSats: r.rewardMaxFeeSats.toString() } : {}),
  ...(r.stage !== undefined ? { stage: r.stage } : {}),
});

const deserializeRecord = (s: SerializedRecord): BondLockRecord => ({
  bondIndex: s.bondIndex,
  unlockBytes: fromHex(s.unlockBytes),
  lockAddress: s.lockAddress,
  unlockHeight: s.unlockHeight,
  amountSats: BigInt(s.amountSats),
  isL1Lock: s.isL1Lock,
  btcTxid: s.btcTxid,
  vout: s.vout,
  signerManager: s.signerManager,
  firstRewardCycle: s.firstRewardCycle,
  fundingExternalId: s.fundingExternalId,
  fireblocksId: s.fireblocksId,
  rewardBtcAddress: s.rewardBtcAddress,
  rewardMaxFeeSats: s.rewardMaxFeeSats !== undefined ? BigInt(s.rewardMaxFeeSats) : undefined,
  stage: s.stage,
});

/** Deterministic JSON so the checksum is stable regardless of key insertion order. */
const stableStringify = (records: Record<string, SerializedRecord>): string => {
  const sortedKeys = Object.keys(records).sort();
  const canonical: Record<string, unknown> = {};
  for (const k of sortedKeys) {
    const rec = records[k] as unknown as Record<string, unknown>;
    const inner: Record<string, unknown> = {};
    for (const field of Object.keys(rec).sort()) inner[field] = rec[field];
    canonical[k] = inner;
  }
  return JSON.stringify(canonical);
};

const checksumOf = (records: Record<string, SerializedRecord>): string =>
  createHash("sha256").update(stableStringify(records)).digest("hex");

export class FileLockRecordStore implements LockRecordStore {
  private readonly filePath: string;
  private readonly bakPath: string;
  private readonly lockPath: string;
  private readonly dir: string;
  private tmpCounter = 0;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
    this.bakPath = `${this.filePath}.bak`;
    this.lockPath = `${this.filePath}.lock`;
    this.dir = path.dirname(this.filePath);
  }

  private key(stxAddress: string, bondIndex: number): string {
    return `${stxAddress}:${bondIndex}`;
  }

  /**
   * Reads and validates one store file. Returns null when the file is genuinely
   * MISSING; throws CorruptLockStoreError when it exists but cannot be trusted.
   */
  private async readFile(p: string): Promise<Record<string, SerializedRecord> | null> {
    let raw: string;
    try {
      raw = await fs.readFile(p, "utf8");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
    let parsed: StoreFile;
    try {
      parsed = JSON.parse(raw) as StoreFile;
    } catch {
      throw new CorruptLockStoreError(p, "invalid JSON");
    }
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.checksum !== "string" ||
      typeof parsed.records !== "object" ||
      parsed.records === null
    ) {
      throw new CorruptLockStoreError(p, "missing version/checksum/records");
    }
    if (checksumOf(parsed.records) !== parsed.checksum) {
      throw new CorruptLockStoreError(p, "checksum mismatch");
    }
    return parsed.records;
  }

  /**
   * Loads all records. Missing primary + missing backup → empty (new store). A
   * corrupt primary falls back to an intact backup; if neither is trustworthy the
   * error propagates (fail closed) and the corrupt file is left in place.
   */
  private async loadAll(): Promise<Record<string, SerializedRecord>> {
    let primaryErr: unknown;
    try {
      const primary = await this.readFile(this.filePath);
      if (primary) return primary;
    } catch (e) {
      if (!(e instanceof CorruptLockStoreError)) throw e;
      primaryErr = e;
    }

    // Primary was corrupt or missing — try the verified backup.
    const backup = await this.readFile(this.bakPath).catch((e) => {
      if (e instanceof CorruptLockStoreError) return null;
      throw e;
    });
    if (backup) return backup;

    // Backup unusable too. If the primary was corrupt, fail closed; if it was simply
    // missing (and no backup), this is a genuinely new store.
    if (primaryErr) throw primaryErr;
    return {};
  }

  private async fsyncDir(): Promise<void> {
    // Best-effort directory fsync so the rename is durable. Not supported on every
    // platform (e.g. Windows), where it is safe to skip.
    try {
      const dh = await fs.open(this.dir, "r");
      try {
        await dh.sync();
      } finally {
        await dh.close();
      }
    } catch {
      /* directory fsync unsupported on this platform — ignore */
    }
  }

  /** Atomically persists the full record set with a fresh checksum and a backup. */
  private async writeAll(records: Record<string, SerializedRecord>): Promise<void> {
    const payload: StoreFile = {
      version: SCHEMA_VERSION,
      checksum: checksumOf(records),
      records,
    };
    const data = JSON.stringify(payload);
    const tmp = `${this.filePath}.tmp.${process.pid}.${this.tmpCounter++}`;

    const fh = await fs.open(tmp, "w");
    try {
      await fh.writeFile(data, "utf8");
      await fh.sync();
    } finally {
      await fh.close();
    }

    // Keep at least one VERIFIED backup of the prior good file before replacing it. Only
    // back up the current primary when it is itself intact — if the primary is corrupt
    // (and loadAll therefore recovered from the existing backup), copying it over the
    // backup would destroy the last good copy, so leave the backup untouched instead.
    try {
      const currentPrimary = await this.readFile(this.filePath); // throws if corrupt
      if (currentPrimary) {
        await fs.copyFile(this.filePath, this.bakPath);
        // fsync the backup before the primary rename proceeds — without it a crash
        // shortly after writeAll could leave .bak truncated/stale even though the new
        // primary was durably renamed. Error handling is split by what the failure
        // means:
        //  - open('r+') failure (EACCES on a mode-0444 backup inherited via copyFile,
        //    EPERM on some CIFS/FUSE mounts) says nothing about the copied DATA — the
        //    copy already succeeded — so it must not hard-fail every saveRecord,
        //    including the money-path saves that run after Bitcoin has moved;
        //  - sync() environment quirks (ENOTSUP/EINVAL/ENOSYS/EPERM) are tolerated
        //    best-effort, but a genuine I/O failure (EIO) stays loud — a failing disk
        //    voiding the backup guarantee must not be silent.
        let bh: Awaited<ReturnType<typeof fs.open>> | null = null;
        try {
          bh = await fs.open(this.bakPath, "r+");
        } catch {
          /* cannot open for flush — backup data already copied; skip the fsync */
        }
        if (bh) {
          try {
            await bh.sync();
          } catch (e) {
            const code = (e as NodeJS.ErrnoException).code;
            if (code !== "ENOTSUP" && code !== "EINVAL" && code !== "ENOSYS" && code !== "EPERM") throw e;
            /* fsync unsupported on this platform — backup still written, just not flushed */
          } finally {
            await bh.close();
          }
        }
      }
      // null → primary missing (new store): nothing to back up.
    } catch (e) {
      if (e instanceof CorruptLockStoreError) {
        // Primary is corrupt: preserve the existing verified backup rather than clobber it.
      } else if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        throw e;
      }
    }

    await fs.rename(tmp, this.filePath);
    await this.fsyncDir();
  }

  /** Simple, fail-closed inter-process lock via exclusive-create lockfile. */
  private async acquireLock(timeoutMs = 15_000, staleMs = 60_000): Promise<void> {
    const start = Date.now();
    for (;;) {
      try {
        const fh = await fs.open(this.lockPath, "wx");
        try {
          await fh.writeFile(`${process.pid} ${Date.now()}`);
        } finally {
          await fh.close();
        }
        return;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
        // Steal a stale lock left by a crashed process.
        try {
          const st = await fs.stat(this.lockPath);
          if (Date.now() - st.mtimeMs > staleMs) {
            await fs.unlink(this.lockPath).catch(() => {});
            continue;
          }
        } catch {
          continue; // lock vanished — retry acquisition
        }
        if (Date.now() - start > timeoutMs) {
          throw new Error(`Timed out acquiring lock ${this.lockPath}`);
        }
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  }

  private async releaseLock(): Promise<void> {
    await fs.unlink(this.lockPath).catch(() => {});
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireLock();
    try {
      return await fn();
    } finally {
      await this.releaseLock();
    }
  }

  async saveRecord(
    stxAddress: string,
    bondIndex: number,
    record: BondLockRecord,
  ): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    await this.withLock(async () => {
      const records = await this.loadAll();
      records[this.key(stxAddress, bondIndex)] = serializeRecord(record);
      await this.writeAll(records);
    });
  }

  async loadRecord(
    stxAddress: string,
    bondIndex: number,
  ): Promise<BondLockRecord | null> {
    const records = await this.loadAll();
    const s = records[this.key(stxAddress, bondIndex)];
    return s ? deserializeRecord(s) : null;
  }

  /**
   * Startup health check used to gate native-BTC funding. Verifies the directory is
   * writable (temp write + fsync + rename + delete) and that the existing store, if
   * any, is readable and not corrupt. Throws on any failure.
   */
  async checkHealth(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });

    const probe = `${this.filePath}.health.${process.pid}.${this.tmpCounter++}`;
    const probeTarget = `${probe}.moved`;
    const fh = await fs.open(probe, "w");
    try {
      await fh.writeFile("ok");
      await fh.sync();
    } finally {
      await fh.close();
    }
    await fs.rename(probe, probeTarget);
    await fs.unlink(probeTarget).catch(() => {});

    // Throws CorruptLockStoreError if the store exists but cannot be trusted.
    await this.loadAll();
  }
}
