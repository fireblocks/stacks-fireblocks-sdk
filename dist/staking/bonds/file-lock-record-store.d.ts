import { BondLockRecord, LockRecordStore } from "./unlock-bytes-store";
/** Thrown when a store file exists but cannot be trusted (bad JSON / checksum). */
export declare class CorruptLockStoreError extends Error {
    constructor(filePath: string, detail: string);
}
export declare class FileLockRecordStore implements LockRecordStore {
    private readonly filePath;
    private readonly bakPath;
    private readonly lockPath;
    private readonly dir;
    private tmpCounter;
    constructor(filePath: string);
    private key;
    /**
     * Reads and validates one store file. Returns null when the file is genuinely
     * MISSING; throws CorruptLockStoreError when it exists but cannot be trusted.
     */
    private readFile;
    /**
     * Loads all records. Missing primary + missing backup → empty (new store). A
     * corrupt primary falls back to an intact backup; if neither is trustworthy the
     * error propagates (fail closed) and the corrupt file is left in place.
     */
    private loadAll;
    private fsyncDir;
    /** Atomically persists the full record set with a fresh checksum and a backup. */
    private writeAll;
    /** Simple, fail-closed inter-process lock via exclusive-create lockfile. */
    private acquireLock;
    private releaseLock;
    private withLock;
    saveRecord(stxAddress: string, bondIndex: number, record: BondLockRecord): Promise<void>;
    loadRecord(stxAddress: string, bondIndex: number): Promise<BondLockRecord | null>;
    /**
     * Startup health check used to gate native-BTC funding. Verifies the directory is
     * writable (temp write + fsync + rename + delete) and that the existing store, if
     * any, is readable and not corrupt. Throws on any failure.
     */
    checkHealth(): Promise<void>;
}
