/**
 * Extracts a human-readable message from an unknown thrown value.
 *
 * Fireblocks and axios reject with structured objects whose detail sits in `response.data`.
 * Only message/code fields are read; request config is skipped so credentials are not surfaced.
 */
export declare function formatErrorMessage(error: unknown): string;
/**
 * Error text for a transaction that was broadcast but whose outcome could not be
 * observed — `waitForTxSettlement` reports `success: false` only on timeout.
 *
 * The distinction is operational, not cosmetic: "it failed" and "it may still be in
 * flight" call for opposite actions. Where Bitcoin has already moved, the standing
 * advice is not to create a second transaction, which is unfollowable if a slow
 * transaction is indistinguishable from an aborted one.
 */
export declare function unsettledTransactionError(operation: string, txId: string, reason?: string, resumeHint?: string): string;
