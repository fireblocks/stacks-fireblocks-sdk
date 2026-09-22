import { Fireblocks, TransactionRequest, TransactionResponse, TransactionStateEnum } from "@fireblocks/ts-sdk";
/**
 * Vendor-reported outcome of a Fireblocks transaction. `status` is the authoritative
 * classification input — terminal-vs-retryable decides whether a bond's funding
 * external id may be renewed, so it is never inferred from message text.
 */
export interface FireblocksTransferFailure {
    /** The Fireblocks `TransactionOperation` — RAW for signing, TRANSFER for a BTC send. */
    operation: string;
    status: TransactionStateEnum;
    subStatus?: string;
    errorDescription?: string;
    /** The Fireblocks transaction id. */
    vendorId: string;
}
export declare class FireblocksTransferError extends Error {
    readonly details: FireblocksTransferFailure;
    constructor(message: string, details: FireblocksTransferFailure);
}
/**
 * States from which a transaction can never reach Completed. Typed as strings because
 * the vendor SDK declares `TransactionResponse.status` as `string`.
 */
export declare const TERMINAL_TRANSACTION_STATES: ReadonlySet<string>;
/**
 * Non-terminal states that wait on a person rather than on the platform. A deadline
 * sized for machine-paced work reports these as failures while the approval is still
 * legitimately outstanding.
 *
 * `PENDING_SIGNATURE` is deliberately excluded — that is MPC signing, not a human.
 * `PENDING_AML_SCREENING` and `PENDING_3RD_PARTY` are also excluded: whether either
 * blocks on a person is a Fireblocks semantic this codebase has not confirmed.
 */
export declare const APPROVAL_PENDING_STATES: ReadonlySet<string>;
export interface PollConfig {
    initialMs?: number;
    ceilingMs?: number;
    /** Budget for machine-paced states. */
    timeoutMs?: number;
    /** Budget for states awaiting a person — see `APPROVAL_PENDING_STATES`. */
    approvalTimeoutMs?: number;
}
export declare class FireblocksSigner {
    fireblocks: Fireblocks;
    private readonly poll;
    constructor(fireblocks: Fireblocks, poll?: PollConfig);
    createTransactionPayload: (externalTxId: string, vaultAccountId: string) => TransactionRequest;
    getTxStatus: (txId: string) => Promise<TransactionResponse>;
    rawSign: (content: string, vaultAccountId: string, txNote?: string, testnet?: boolean, externalId?: string) => Promise<any>;
}
