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
    lockOutpoint?: {
        txid: string;
        vout: number;
    };
    /** The address the input spends from, when Esplora resolves the prevout. */
    prevoutAddress?: string;
}
export type FeeReplacementCheck = {
    ok: false;
    error: string;
} | {
    ok: true;
    oldFeeSats: bigint;
    newFeeSats: bigint;
    oldDestinationSats: bigint;
    newDestinationSats: bigint;
    feeRateOldSatVb: string;
    feeRateNewSatVb: string;
    destination: string;
    lockOutpoint: {
        txid: string;
        vout: number;
    };
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
export declare function checkFeeReplacement(orig: ParsedRecoveryTx, newFeeSats: bigint, lockAddress: string, recordedOutpoint?: {
    txid?: string;
    vout?: number;
}): FeeReplacementCheck;
