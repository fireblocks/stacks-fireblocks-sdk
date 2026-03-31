"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireblocksSigner = void 0;
const ts_sdk_1 = require("@fireblocks/ts-sdk");
const constants_1 = require("./constants");
const errorHandling_1 = require("./errorHandling");
class FireblocksSigner {
    constructor(fireblocks) {
        this.fireblocks = fireblocks;
        this.createTransactionPayload = () => {
            return {
                note: "raw signing for stacks-fireblocks-sdk",
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
            const messageToConsole = `Transaction ${tx.id} is currently at status - ${tx.status}`;
            console.log(messageToConsole);
            while (tx.status !== ts_sdk_1.TransactionStateEnum.Completed) {
                await new Promise((resolve) => setTimeout(resolve, 3000));
                response = await this.fireblocks.transactions.getTransaction({ txId });
                tx = response.data;
                switch (tx.status) {
                    case ts_sdk_1.TransactionStateEnum.Blocked:
                    case ts_sdk_1.TransactionStateEnum.Cancelled:
                    case ts_sdk_1.TransactionStateEnum.Failed:
                    case ts_sdk_1.TransactionStateEnum.Rejected:
                        throw new Error(`Signing request failed/blocked/cancelled: Transaction: ${tx.id} status is ${tx.status}`);
                    default:
                        console.log(messageToConsole);
                        break;
                }
            }
            return tx;
        };
        this.rawSign = async (content, vaultAccountId, txNote, testnet = false) => {
            try {
                if (typeof content !== "string") {
                    throw new Error("Content for raw signing must be a hex string");
                }
                const hexContent = content.startsWith("0x") ? content.slice(2) : content;
                const transactionPayload = this.createTransactionPayload();
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
