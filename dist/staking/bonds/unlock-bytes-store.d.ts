/**
 * Durable lock-record persistence for native BTC bonds.
 *
 * A bond's recoverable state — the exact unlock bytes, lock address, unlock
 * height, locked amount, and (once funded) the funding outpoint — is immutable
 * after funding, but the on-chain membership that recovery used to read from is
 * NOT: `announce-l1-early-exit` zeroes `amount-sats`, bond maturity drops the
 * membership entirely, and a later registration overwrites it. Persisting the
 * record at funding time lets all three spend paths select the lock UTXO by
 * outpoint instead of by a mutable amount.
 *
 * The default store is in-memory and therefore neither durable across restarts
 * nor shared across replicas — any deployment that creates native BTC bonds
 * should supply a durable backend (see StacksSDK.setLockRecordStore / the pool's
 * lockRecordStore option). Losing a record for an unspent lock can strand BTC.
 */
export interface BondLockRecord {
    bondIndex: number;
    /** Witness `staker-unlock-bytes` committed to the on-chain lock script. */
    unlockBytes: Uint8Array;
    /** P2WSH lock address the BTC was sent to. */
    lockAddress: string;
    /** Burn height at which the CLTV branch becomes spendable. */
    unlockHeight: number;
    /** Exact locked amount in satoshis (immutable once funded). */
    amountSats: bigint;
    /** Native BTC lock (true) vs sBTC-backed (false). */
    isL1Lock: boolean;
    /** Funding transaction id — set once the L1 lock is broadcast. */
    btcTxid?: string;
    /** Output index of the lock within the funding tx — set once the SPV proof resolves it. */
    vout?: number;
    /**
     * Signer-manager contract this bond was registered under. Recorded so rewards
     * remain claimable after the on-chain membership ends or is overwritten, when
     * the current membership no longer reflects the manager that was in effect.
     */
    signerManager?: string;
    /** First reward cycle the bond earns in — the lower bound for reward discovery. */
    firstRewardCycle?: number;
}
export interface LockRecordStore {
    saveRecord(stxAddress: string, bondIndex: number, record: BondLockRecord): Promise<void>;
    loadRecord(stxAddress: string, bondIndex: number): Promise<BondLockRecord | null>;
}
export declare class InMemoryLockRecordStore implements LockRecordStore {
    private store;
    private key;
    saveRecord(stxAddress: string, bondIndex: number, record: BondLockRecord): Promise<void>;
    loadRecord(stxAddress: string, bondIndex: number): Promise<BondLockRecord | null>;
}
