import { Fireblocks, TransactionRequest, TransactionResponse } from "@fireblocks/ts-sdk";
export declare class FireblocksSigner {
    fireblocks: Fireblocks;
    constructor(fireblocks: Fireblocks);
    createTransactionPayload: (externalTxId: string) => TransactionRequest;
    getTxStatus: (txId: string) => Promise<TransactionResponse>;
    rawSign: (content: string, vaultAccountId: string, txNote?: string, testnet?: boolean, externalId?: string) => Promise<any>;
}
