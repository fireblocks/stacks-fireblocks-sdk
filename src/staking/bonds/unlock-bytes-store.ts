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

/**
 * Durable stages of a native-BTC enrollment. Persisted so a retry after a crash or
 * restart resumes at the last completed stage instead of re-funding Bitcoin.
 */
export type EnrollmentStage =
  | "lock-fixed"              // lock script/address fixed, eligibility confirmed
  | "funding-requested"      // Fireblocks BTC funding requested (external id assigned)
  | "btc-broadcast"          // funding txid recorded
  | "btc-confirmed"          // funding tx reached required confirmations
  | "proof-built"            // SPV proof assembled, funding outpoint resolved
  | "registration-submitted" // register-for-bond broadcast
  | "registration-confirmed"; // register-for-bond settled successfully

const ENROLLMENT_STAGE_ORDER: EnrollmentStage[] = [
  "lock-fixed",
  "funding-requested",
  "btc-broadcast",
  "btc-confirmed",
  "proof-built",
  "registration-submitted",
  "registration-confirmed",
];

/**
 * Returns the LATER of two enrollment stages. Saves along the enrollment flow must
 * never regress a resumed record's stage (e.g. a retry re-confirming Bitcoin must not
 * overwrite "registration-submitted" with "btc-confirmed" — recovery tooling honoring
 * the resume-at-last-stage contract would then re-submit a settled registration).
 */
export function laterStage(a: EnrollmentStage | undefined, b: EnrollmentStage): EnrollmentStage {
  if (a === undefined) return b;
  return ENROLLMENT_STAGE_ORDER.indexOf(a) >= ENROLLMENT_STAGE_ORDER.indexOf(b) ? a : b;
}

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
  /**
   * Deterministic Fireblocks external id used for the BTC funding transfer. Derived
   * from vault + network + bondIndex + lockAddress so a retry reuses the same id and
   * Fireblocks de-duplicates it — a second funding transfer is never created for the
   * same enrollment.
   */
  fundingExternalId?: string;
  /**
   * The Fireblocks transaction id of the BTC funding transfer, persisted as soon as
   * Fireblocks accepts the request — BEFORE the (long, throwable) confirmation poll. A
   * retry after a poll timeout / crash uses it to await or resolve the SAME transfer
   * rather than re-submitting (which the external id would reject as a duplicate),
   * so a completed-but-unseen transfer is never lost and never double-sent.
   */
  fireblocksId?: string;
  /** Last completed durable enrollment stage — a retry resumes from here. */
  stage?: EnrollmentStage;
}

export interface LockRecordStore {
  saveRecord(
    stxAddress: string,
    bondIndex: number,
    record: BondLockRecord,
  ): Promise<void>;
  loadRecord(
    stxAddress: string,
    bondIndex: number,
  ): Promise<BondLockRecord | null>;
  /**
   * Optional startup health check. When present, a durable store proves it can be
   * written and read (and is not corrupt) before native-BTC funding is allowed.
   * Throws on failure. The in-memory default does not implement this and is treated
   * as non-durable.
   */
  checkHealth?(): Promise<void>;
}

export class InMemoryLockRecordStore implements LockRecordStore {
  private store = new Map<string, BondLockRecord>();

  private key(stxAddress: string, bondIndex: number): string {
    return `${stxAddress}:${bondIndex}`;
  }

  async saveRecord(
    stxAddress: string,
    bondIndex: number,
    record: BondLockRecord,
  ): Promise<void> {
    this.store.set(this.key(stxAddress, bondIndex), record);
  }

  async loadRecord(
    stxAddress: string,
    bondIndex: number,
  ): Promise<BondLockRecord | null> {
    return this.store.get(this.key(stxAddress, bondIndex)) ?? null;
  }
}
