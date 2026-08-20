/**
 * Pure BIP-125 fee-replacement validation for recovery spends.
 *
 * A recovery spend (unlockMaturedBond / spendEarlyExitUtxo) is one input (the lock UTXO)
 * and one output (the destination). Raising the fee therefore reduces the single
 * destination output — there is no change output to shrink. This module holds the
 * chain-independent checks and the old/new fee and amount math so they can be unit
 * tested without pulling in the Bitcoin signing stack.
 */

/** The parsed fields of an original (still-unconfirmed) recovery spend from Esplora. */
export interface ParsedRecoveryTx {
  confirmed: boolean;
  blockHeight?: number;
  feeSats: bigint;
  /** Virtual size in vbytes (ceil(weight/4)); used for the rule-4 increment and rates. */
  vsize: number;
  /** The single output's address (undefined if it could not be decoded). */
  destination?: string;
  /** The single output's value in sats. */
  destinationSats: bigint;
  /** Number of outputs — a recovery spend has exactly one. */
  outputCount: number;
  /** The input outpoint being spent (the lock UTXO). */
  lockOutpoint?: { txid: string; vout: number };
  /** The address the input spends from, when Esplora resolves the prevout. */
  prevoutAddress?: string;
}

export type FeeReplacementCheck =
  | { ok: false; error: string }
  | {
      ok: true;
      oldFeeSats: bigint;
      newFeeSats: bigint;
      oldDestinationSats: bigint;
      newDestinationSats: bigint;
      feeRateOldSatVb: string;
      feeRateNewSatVb: string;
      destination: string;
      lockOutpoint: { txid: string; vout: number };
    };

/**
 * Validates that `newFeeSats` is a legal BIP-125 replacement of `orig`, and computes the
 * resulting destination amount and fee rates. Chain-dependent checks (is the original
 * still unspent, dust limit, re-authorization, re-signing) are enforced by the caller's
 * rebuild path — this is only the fee-rule and shape validation.
 *
 * @param lockAddress - The bond's lock (P2WSH) address the original must be spending.
 * @param recordedOutpoint - The lock outpoint from the durable record, when known, to
 *   ensure the original spends exactly the recorded funding output.
 */
export function checkFeeReplacement(
  orig: ParsedRecoveryTx,
  newFeeSats: bigint,
  lockAddress: string,
  recordedOutpoint?: { txid?: string; vout?: number },
): FeeReplacementCheck {
  if (orig.confirmed) {
    return { ok: false, error: `Original tx is already confirmed (block ${orig.blockHeight}) — nothing to replace.` };
  }
  if (orig.outputCount !== 1) {
    return { ok: false, error: `Original tx has ${orig.outputCount} outputs; only a single-output recovery spend can be fee-replaced by this method.` };
  }
  if (!orig.destination) {
    return { ok: false, error: 'Original tx destination address could not be decoded.' };
  }
  if (!orig.lockOutpoint?.txid || orig.lockOutpoint.vout === undefined) {
    return { ok: false, error: 'Original tx lock input outpoint could not be decoded.' };
  }
  if (orig.prevoutAddress && orig.prevoutAddress !== lockAddress) {
    return { ok: false, error: `Original tx does not spend this bond's lock address (${lockAddress}); refusing to replace an unrelated transaction.` };
  }
  const outpointCheckable = recordedOutpoint?.txid !== undefined && recordedOutpoint.vout !== undefined;
  if (
    outpointCheckable &&
    (orig.lockOutpoint.txid !== recordedOutpoint!.txid || orig.lockOutpoint.vout !== recordedOutpoint!.vout)
  ) {
    return { ok: false, error: `Original tx input ${orig.lockOutpoint.txid}:${orig.lockOutpoint.vout} does not match the recorded lock outpoint ${recordedOutpoint!.txid}:${recordedOutpoint!.vout}.` };
  }
  // Fail closed when NEITHER identity check could run (Esplora omitted the prevout data
  // AND no durable record exists): the "refuse to replace an unrelated transaction"
  // invariant must be enforced by at least one of them, not silently skipped.
  if (!orig.prevoutAddress && !outpointCheckable) {
    return { ok: false, error: `Cannot verify the original transaction spends this bond's lock (no prevout address from Esplora and no recorded outpoint) — refusing to replace an unverified transaction.` };
  }

  const oldFeeSats = orig.feeSats;
  // BIP-125 rule 3: strictly higher absolute fee. Since the replacement has the same size,
  // a higher absolute fee is also a higher fee rate.
  if (newFeeSats <= oldFeeSats) {
    return { ok: false, error: `New fee ${newFeeSats} sats must exceed the original ${oldFeeSats} sats (BIP-125 requires a higher absolute fee).` };
  }
  // BIP-125 rule 4: the increment must at least pay for the replacement's own bandwidth
  // (≥ 1 sat/vB over the original).
  const vsize = orig.vsize > 0 ? orig.vsize : 1;
  if (newFeeSats - oldFeeSats < BigInt(vsize)) {
    return { ok: false, error: `Fee increase ${newFeeSats - oldFeeSats} sats is below the BIP-125 rule-4 minimum of ${vsize} sats (1 sat/vB over a ${vsize} vB tx); raise newFeeSats to at least ${oldFeeSats + BigInt(vsize)}.` };
  }

  const newDestinationSats = orig.destinationSats + oldFeeSats - newFeeSats;
  const rate = (fee: bigint) => (Number(fee) / vsize).toFixed(2);
  return {
    ok: true,
    oldFeeSats,
    newFeeSats,
    oldDestinationSats: orig.destinationSats,
    newDestinationSats,
    feeRateOldSatVb: rate(oldFeeSats),
    feeRateNewSatVb: rate(newFeeSats),
    destination: orig.destination,
    lockOutpoint: orig.lockOutpoint,
  };
}
