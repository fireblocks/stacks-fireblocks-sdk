"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireblocksSigner = void 0;
const crypto_1 = require("crypto");
const ts_sdk_1 = require("@fireblocks/ts-sdk");
const constants_1 = require("./constants");
const errorHandling_1 = require("./errorHandling");
const POLL_INITIAL_MS = 3000;
const POLL_CEILING_MS = 30000;
const POLL_TIMEOUT_MS = 30 * 60 * 1000;
class FireblocksSigner {
    constructor(fireblocks) {
        this.fireblocks = fireblocks;
        this.createTransactionPayload = (externalTxId) => {
            return {
                note: "raw signing for stacks-fireblocks-sdk",
                externalTxId,
                source: {
                    type: ts_sdk_1.TransferPeerPathType.VaultAccount,
                },
                operation: ts_sdk_1.TransactionOperation.Raw,
                extraParameters: {
                    rawMessageData: {
                        messages: [{}],
                        algorithm: ts_sdk_1.SignedMessageAlgorithmEnum.EcdsaSecp256K1,
                    },
                },
            };
        };
        this.getTxStatus = async (txId) => {
            let response = await this.fireblocks.transactions.getTransaction({ txId });
            let tx = response.data;
            const deadline = Date.now() + POLL_TIMEOUT_MS;
            let delay = POLL_INITIAL_MS;
            while (tx.status !== ts_sdk_1.TransactionStateEnum.Completed) {
                switch (tx.status) {
                    case ts_sdk_1.TransactionStateEnum.Blocked:
                    case ts_sdk_1.TransactionStateEnum.Cancelled:
                    case ts_sdk_1.TransactionStateEnum.Failed:
                    case ts_sdk_1.TransactionStateEnum.Rejected:
                        throw new Error(`Signing request failed/blocked/cancelled: Transaction: ${tx.id} status is ${tx.status}`);
                }
                if (Date.now() + delay > deadline) {
                    throw new Error(`Signing request timed out after 30 minutes: Transaction ${tx.id} is still ${tx.status}`);
                }
                console.log(`Transaction ${tx.id} is currently at status - ${tx.status}`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay = Math.min(delay * 2, POLL_CEILING_MS);
                try {
                    response = await this.fireblocks.transactions.getTransaction({ txId });
                    tx = response.data;
                }
                catch (pollError) {
                    console.warn(`Transient error polling transaction ${txId}, will retry:`, pollError);
                }
            }
            return tx;
        };
        this.rawSign = async (content, vaultAccountId, txNote, testnet = false, externalId) => {
            try {
                if (typeof content !== "string") {
                    throw new Error("Content for raw signing must be a hex string");
                }
                const hexContent = content.startsWith("0x") ? content.slice(2) : content;
                const transactionPayload = this.createTransactionPayload(externalId !== null && externalId !== void 0 ? externalId : (0, crypto_1.randomUUID)());
                if (txNote) {
                    transactionPayload.note = txNote;
                }
                transactionPayload.extraParameters.rawMessageData = {
                    messages: [
                        {
                            content: hexContent,
                            derivationPath: [
                                constants_1.derivationPath.purpose,
                                testnet
                                    ? constants_1.derivationPath.coinTypeTestnet
                                    : constants_1.derivationPath.coinTypeMainnet,
                                Number(vaultAccountId),
                                constants_1.derivationPath.change,
                                constants_1.derivationPath.addressIndex,
                            ],
                        },
                    ],
                    algorithm: ts_sdk_1.SignedMessageAlgorithmEnum.EcdsaSecp256K1,
                };
                const transactionResponse = await this.fireblocks.transactions.createTransaction({
                    transactionRequest: transactionPayload,
                });
                const txId = transactionResponse.data.id;
                if (!txId) {
                    throw new Error("Transaction ID is undefined.");
                }
                const txInfo = (await this.getTxStatus(txId));
                const signature = txInfo.signedMessages[0].signature;
                return signature;
            }
            catch (error) {
                console.log(`Caught error in rawSign: ${error}`);
                throw new Error(`Error in rawSign: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
    }
}
exports.FireblocksSigner = FireblocksSigner;
