"use strict";
/**
 * The StacksService class provides a high-level interface for interacting with the Stacks blockchain
 * using the Stacks SDK. It supports building, serializing, signing, submitting, and tracking transactions,
 * as well as querying account balances, coin data, and transaction history.
 *
 * @remarks
 * This service abstracts the complexity of direct SDK usage and provides utility methods for common blockchain operations.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StacksService = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("./types");
const network_1 = require("@stacks/network");
const transactions_1 = require("@stacks/transactions");
const errorHandling_1 = require("../utils/errorHandling");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../utils/constants");
class StacksService {
    constructor(testnet = false, hiroApiKey) {
        /**
         * Fetches the current PoX contract address and name.
         * @returns An object containing the PoX contract address and name
         */
        this.getPoxContractInfo = async () => {
            var _a;
            const poxResponse = await this.fetchPoxInfo();
            if ((_a = poxResponse === null || poxResponse === void 0 ? void 0 : poxResponse.data) === null || _a === void 0 ? void 0 : _a.contract_id) {
                const [contractAddress, contractName] = poxResponse.data.contract_id.split(".");
                return { contractAddress, contractName };
            }
            // Fallback to static config
            return this.network === network_1.STACKS_TESTNET ? constants_1.poxInfo.testnet : constants_1.poxInfo.mainnet;
        };
        /**
         * Formats a compressed secp256k1 public key hex into a Stacks address.
         * @param pubKey - The compressed secp256k1 public key in hex format.
         * @returns - The corresponding Stacks address.
         */
        this.formatAddress = (pubKey) => {
            try {
                if (!pubKey || typeof pubKey !== "string") {
                    throw new Error("Public key must be a non-empty string");
                }
                if (!(0, helpers_1.isCompressedSecp256k1PubKeyHex)(pubKey)) {
                    throw new Error("Invalid compressed secp256k1 public key hex format");
                }
                const isTestnet = this.network === network_1.STACKS_TESTNET;
                const address = (0, transactions_1.publicKeyToAddress)(pubKey, isTestnet ? "testnet" : "mainnet");
                return address;
            }
            catch (error) {
                console.error("formatAddress : Error formatting address:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to format address: ${error}`);
            }
        };
        /**
         * Makes a call to the Stacks balances endpoint for a given address.
         * @param address - The Stacks address to query balances for.
         * @returns - The response from the balances endpoint.
         */
        this.makeBalanceCalls = async (address) => {
            try {
                const response = await this.axiosClient.get(`${this.stackBaseUrl}/extended/v1/address/${address}/balances`);
                if (!response || !response.data || response.status !== 200) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response;
            }
            catch (error) {
                console.error(`Error calling Stacks balances endpoint: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                throw new Error(`Failed to call Stacks balances endpoint for address ${address}: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Retrieves the native STX balance for a given address from makeBalanceCalls response.
         * @param address - The Stacks address to query balance for.
         * @returns - The native STX balance.
         */
        this.getNativeBalance = async (address) => {
            try {
                const response = await this.makeBalanceCalls(address);
                const balance = Number(response.data.stx.balance) / 10 ** constants_1.stacks_info.stxDecimals;
                return balance;
            }
            catch (error) {
                console.error("getNativeBalance : Error fetching native balance:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to fetch native balance for address ${address}: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Retrieves the fungible token balances for a given address from makeBalanceCalls response.
         * @param address - The Stacks address to query balances for.
         * @returns - The fungible token balances.
         */
        this.getFTBalancesForAddress = async (address) => {
            try {
                const response = await this.makeBalanceCalls(address);
                const ftObject = response.data.fungible_tokens;
                return ftObject;
            }
            catch (error) {
                console.error("getFTBalancesForAddress : Error fetching fungible token balances:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to fetch native balance for address ${address}: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Fetches the decimals for a given fungible token contract.
         * @param contractAddress - The address of the fungible token contract.
         * @param contractName - The name of the fungible token contract.
         * @returns - The number of decimals for the fungible token.
         */
        this.fetchFtDecimals = async (contractAddress, contractName) => {
            try {
                const network = this.network;
                const res = await (0, transactions_1.fetchCallReadOnlyFunction)({
                    contractName,
                    contractAddress,
                    functionName: "get-decimals",
                    functionArgs: [],
                    network,
                    senderAddress: contractAddress,
                });
                const val = res.value.value;
                return Number(val);
            }
            catch (error) {
                console.error("Error fetching FT decimals:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to fetch FT decimals: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Estimates the transaction fee for STX transfer.
         * @param recipientAddress - The recipient's Stacks address.
         * @param amountUstx - The amount to transfer in microSTX (ustx).
         * @returns - The estimated transaction fee in microSTX (ustx).
         */
        this.estimateTxFee = async (recipientAddress, amountUstx) => {
            try {
                const payload = (0, transactions_1.createTokenTransferPayload)(recipientAddress, amountUstx);
                const payloadHex = (0, transactions_1.serializePayload)(payload);
                const [, medium] = await (0, transactions_1.fetchFeeEstimateTransaction)({
                    payload: payloadHex,
                    network: this.network,
                });
                return medium.fee;
            }
            catch (error) {
                console.error("Error estimating transaction fee:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to estimate transaction fee: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Estimates the transaction fee for a contract call.
         * @param contractAddress - The address of the contract.
         * @param contractName - The name of the contract.
         * @param functionName - The name of the function to call.
         * @param functionArgs - The arguments to pass to the function.
         * @returns - The estimated transaction fee in microSTX (ustx).
         */
        this.estimateContractCallFee = async (contractAddress, contractName, functionName, functionArgs) => {
            try {
                const payload = (0, transactions_1.createContractCallPayload)(contractAddress, contractName, functionName, functionArgs);
                const payloadHex = (0, transactions_1.serializePayload)(payload);
                const [, medium] = await (0, transactions_1.fetchFeeEstimateTransaction)({
                    payload: payloadHex,
                    network: this.network,
                });
                return medium.fee;
            }
            catch (error) {
                console.error("Error estimating contract call fee:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to estimate contract call fee: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Checks the delegation status of a given address.
         * @param address
         * @returns
         */
        this.checkDelegationStatus = async (address) => {
            try {
                if (!(0, helpers_1.validateAddress)(address, this.network === network_1.STACKS_TESTNET)) {
                    throw new Error("Invalid Stacks address");
                }
                const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
                const cv = await (0, transactions_1.fetchCallReadOnlyFunction)({
                    contractAddress: poxAddr,
                    contractName: poxName,
                    functionName: "get-delegation-info",
                    functionArgs: [(0, transactions_1.principalCV)(address)],
                    network: this.network,
                    senderAddress: address,
                });
                if (!cv) {
                    throw new Error("No response from get-delegation-info");
                }
                return (0, transactions_1.cvToValue)(cv);
            }
            catch (error) {
                console.error("Error checking delegation status:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to check delegation status: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Builds an unsigned transaction for STX transfer or fungible token transfer.
         * @param sender - The sender's Stacks address.
         * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
         * @param recipient - The recipient's Stacks address.
         * @param amount - The amount to transfer (in STX or token units).
         * @param type - The type of transaction (STX or FungibleToken).
         * @param token - The type of fungible token (required if type is FungibleToken).
         * @returns - The unsigned Stacks transaction.
         */
        this.buildUnsignedTransaction = async (sender, senderPublicKey, recipient, amount, type = types_1.TransactionType.STX, token, customTokenContractAddress, customTokenContractName, customTokenAssetName) => {
            try {
                if (!(0, helpers_1.validateAddress)(recipient, this.network === network_1.STACKS_TESTNET)) {
                    throw new Error("Invalid recipient address");
                }
                if (!(0, helpers_1.isCompressedSecp256k1PubKeyHex)(senderPublicKey)) {
                    throw new Error("Invalid compressed secp256k1 public key hex format");
                }
                if (type == types_1.TransactionType.FungibleToken && !token) {
                    throw new Error(`Token type must be provided for fungible token transfers`);
                }
                // if custom token, validate contract address, name, and asset name are provided
                if (token === types_1.TokenType.CUSTOM) {
                    if (!customTokenContractAddress || !customTokenContractName || !customTokenAssetName) {
                        throw new Error(`Custom token contract address, name, and asset name must be provided for CUSTOM token type`);
                    }
                }
                const tokenInfo = (0, helpers_1.getTokenInfo)(token, this.network === network_1.STACKS_TESTNET ? "testnet" : "mainnet");
                if (type === types_1.TransactionType.FungibleToken && token !== types_1.TokenType.CUSTOM && !tokenInfo) {
                    throw new Error(`Token ${token} is not supported on ${this.network}`);
                }
                let unsignedTx;
                if (type === types_1.TransactionType.FungibleToken) {
                    const ftContractAddress = token === types_1.TokenType.CUSTOM
                        ? customTokenContractAddress
                        : tokenInfo.contractAddress;
                    const ftContractName = token === types_1.TokenType.CUSTOM
                        ? customTokenContractName
                        : tokenInfo.contractName;
                    // Asset name may differ from contract name (e.g., usdcx contract has usdcx-token asset)
                    const ftAssetName = token === types_1.TokenType.CUSTOM
                        ? customTokenAssetName
                        : tokenInfo.assetName;
                    // Create post-condition: sender sends exactly `amount` of this token
                    const postCondition = transactions_1.Pc.principal(sender)
                        .willSendEq(amount)
                        .ft(`${ftContractAddress}.${ftContractName}`, ftAssetName);
                    unsignedTx = await (0, transactions_1.makeUnsignedContractCall)({
                        contractAddress: ftContractAddress,
                        contractName: ftContractName,
                        functionName: "transfer",
                        functionArgs: [
                            (0, transactions_1.uintCV)(amount),
                            (0, transactions_1.principalCV)(sender),
                            (0, transactions_1.principalCV)(recipient),
                            (0, transactions_1.noneCV)(),
                        ],
                        publicKey: senderPublicKey,
                        network: this.network,
                        postConditionMode: transactions_1.PostConditionMode.Deny,
                        postConditions: [postCondition],
                    });
                }
                else {
                    unsignedTx = await (0, transactions_1.makeUnsignedSTXTokenTransfer)({
                        recipient,
                        amount,
                        publicKey: senderPublicKey,
                        network: this.network,
                    });
                }
                return unsignedTx;
            }
            catch (error) {
                console.error("Error building unsigned transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to build unsigned transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         *  Builds an unsigned contract call transaction.
         * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
         * @param contractAddress - The address of the contract.
         * @param contractName - The name of the contract.
         * @param functionName - The name of the function to call.
         * @param functionArgs - The arguments to pass to the function.
         * @returns - The unsigned Stacks contract call transaction.
         */
        this.buildUnsignedContractCall = async (senderPublicKey, contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode) => {
            try {
                if (!(0, helpers_1.validateAddress)(contractAddress, this.network === network_1.STACKS_TESTNET)) {
                    throw new Error("Invalid contract address");
                }
                if (!(0, helpers_1.isCompressedSecp256k1PubKeyHex)(senderPublicKey)) {
                    throw new Error("Invalid compressed secp256k1 public key hex format");
                }
                if (!contractName || !functionName) {
                    throw new Error("Contract name and function name must be provided");
                }
                const unsignedContractCall = await (0, transactions_1.makeUnsignedContractCall)({
                    contractAddress,
                    contractName,
                    functionName,
                    functionArgs,
                    publicKey: senderPublicKey,
                    network: this.network,
                    postConditions: postConditions !== null && postConditions !== void 0 ? postConditions : [],
                    postConditionMode: postConditionMode !== null && postConditionMode !== void 0 ? postConditionMode : transactions_1.PostConditionMode.Deny,
                });
                return unsignedContractCall;
            }
            catch (error) {
                console.error("Error building unsigned transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to build unsigned transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Serializes a transaction for STX transfer or fungible token transfer.
         * @param sender - The sender's Stacks address.
         * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
         * @param recipient - The recipient's Stacks address.
         * @param amount - The amount to transfer.
         * @param type - The type of transaction (STX or FungibleToken).
         * @param token - The type of fungible token (required if type is FungibleToken).
         * @returns - The serialized unsigned Stacks transaction and pre-signature hash.
         */
        this.serializeTransaction = async (sender, senderPublicKey, recipient, amount, type = types_1.TransactionType.STX, token, customTokenContractAddress, customTokenContractName, customTokenAssetName) => {
            try {
                if (type == types_1.TransactionType.FungibleToken && !token) {
                    throw new Error("Token type must be provided for FungibleToken transactions");
                }
                if (token === types_1.TokenType.CUSTOM) {
                    if (!customTokenContractAddress || !customTokenContractName || !customTokenAssetName) {
                        throw new Error("Custom token contract address, name, and asset name must be provided for CUSTOM token type");
                    }
                }
                const unsignedTx = await this.buildUnsignedTransaction(sender, senderPublicKey, recipient, amount, type, token, customTokenContractAddress, customTokenContractName, customTokenAssetName);
                const sigHash = unsignedTx.signBegin();
                const preSignSigHash = (0, transactions_1.sigHashPreSign)(sigHash, unsignedTx.auth.authType, unsignedTx.auth.spendingCondition.fee, unsignedTx.auth.spendingCondition.nonce);
                return { unsignedTx, preSignSigHash };
            }
            catch (error) {
                console.error("Error serializing transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to serialize transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         *  Serializes a contract call transaction.
         * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
         * @param contractAddress - The address of the contract.
         * @param contractName - The name of the contract.
         * @param functionName - The name of the function to call.
         * @param functionArgs - The arguments to pass to the function.
         * @returns - The serialized unsigned Stacks contract call transaction and pre-signature hash.
         */
        this.serializeContractCall = async (senderPublicKey, contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode) => {
            try {
                const unsignedContractCall = await this.buildUnsignedContractCall(senderPublicKey, contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode);
                const sigHash = unsignedContractCall.signBegin();
                const preSignSigHash = (0, transactions_1.sigHashPreSign)(sigHash, unsignedContractCall.auth.authType, unsignedContractCall.auth.spendingCondition.fee, unsignedContractCall.auth.spendingCondition.nonce);
                return { unsignedContractCall, preSignSigHash };
            }
            catch (error) {
                console.error("Error serializing transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to serialize transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         *  Broadcasts a signed transaction to the Stacks network.
         * @param signedTransaction - The signed Stacks transaction to broadcast.
         * @returns - The result of the broadcast operation.
         */
        this.broadcastTransaction = async (signedTransaction) => {
            try {
                const result = await (0, transactions_1.broadcastTransaction)({
                    transaction: signedTransaction,
                });
                return result;
            }
            catch (error) {
                console.error("Error broadcasting transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to broadcast transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         *  Retrieves the status of a transaction from the Stacks network.
         * @param txid - The transaction ID to check the status for.
         * @returns - Json object containing transaction details.
         */
        this.getTxStatusById = async (txid) => {
            try {
                const response = await this.axiosClient.get(`${this.stackBaseUrl}/extended/v1/tx/${txid}`);
                if (!response || !response.data || response.status !== 200) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.data;
            }
            catch (error) {
                console.error(`Error getting transaction status: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                throw new Error(`Failed to get transaction status for txid ${txid}: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Parses a raw list of Stacks API transaction items into typed Transaction objects.
         */
        this.parseTransactionItems = async (items, address) => {
            const txs = [];
            for (const tx of items) {
                const base = {
                    transaction_hash: tx.tx_id,
                    timestamp: tx.block_time_iso,
                    success: tx.tx_status === "success",
                };
                // Native STX transfers
                if (tx.tx_type === "token_transfer" && tx.token_transfer) {
                    const amountMicro = BigInt(tx.token_transfer.amount || "0");
                    const amount = Number(amountMicro) / 1000000; // STX has 6 decimals
                    txs.push(Object.assign({ type: types_1.TransactionType.STX, sender: tx.sender_address, recipient: tx.token_transfer.recipient_address, amount, tokenName: undefined, tokenContractAddress: undefined }, base));
                    continue;
                }
                // Fungible Token transfers
                if (tx.tx_type === "contract_call" &&
                    tx.contract_call &&
                    tx.contract_call.function_name === "transfer" &&
                    Array.isArray(tx.contract_call.function_args) &&
                    tx.contract_call.function_args.length >= 3) {
                    const [amountArg, senderArg, recipientArg] = tx.contract_call.function_args;
                    const amountRepr = amountArg === null || amountArg === void 0 ? void 0 : amountArg.repr;
                    const senderRepr = senderArg === null || senderArg === void 0 ? void 0 : senderArg.repr;
                    const recipientRepr = recipientArg === null || recipientArg === void 0 ? void 0 : recipientArg.repr;
                    const rawAmount = amountRepr && amountRepr.startsWith("u")
                        ? amountRepr.slice(1)
                        : "0";
                    const sender = senderRepr && senderRepr.startsWith("'")
                        ? senderRepr.slice(1)
                        : tx.sender_address;
                    const recipient = recipientRepr && recipientRepr.startsWith("'")
                        ? recipientRepr.slice(1)
                        : address;
                    const contractId = tx.contract_call.contract_id;
                    const contractName = contractId.split(".").slice(-1)[0];
                    const contractAddress = contractId.split(".")[0];
                    let decimals = (0, helpers_1.getDecimalsFromFtInfo)(contractId);
                    // if decimals is 0 => not found in ftInfo => custom token
                    if (decimals == 0) {
                        decimals = await this.fetchFtDecimals(contractAddress, contractName);
                    }
                    const amountInt = BigInt(rawAmount);
                    const amount = decimals > 0 ? Number(amountInt) / 10 ** decimals : Number(amountInt);
                    txs.push(Object.assign({ type: types_1.TransactionType.FungibleToken, tokenName: contractName, tokenContractAddress: contractId, sender,
                        recipient,
                        amount }, base));
                    continue;
                }
            }
            return txs;
        };
        /**
         * Retrieves the transaction history for a given address.
         * Automatically paginates through multiple Stacks API requests when limit > stacks_api_page_size.
         * @param address - The Stacks address to retrieve the transaction history for.
         * @param limit - The maximum number of transactions to retrieve.
         * @param offset - The starting offset for pagination.
         * @returns An array of transactions associated with the address.
         */
        this.getTransactionHistory = async (address, limit = constants_1.pagination_defaults.limit, offset = constants_1.pagination_defaults.page) => {
            if (!(0, helpers_1.validateAddress)(address, this.network === network_1.STACKS_TESTNET)) {
                throw new Error("Invalid Stacks address");
            }
            try {
                const allTxs = [];
                let currentOffset = offset;
                let remaining = limit;
                while (remaining > 0) {
                    const pageSize = Math.min(remaining, constants_1.helperConstants.stacks_api_page_size);
                    const response = await this.axiosClient.get(`${this.stackBaseUrl}/extended/v1/address/${address}/transactions?limit=${pageSize}&offset=${currentOffset}`);
                    if (!response || !response.data || response.status !== 200) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const items = (response.data.results || []);
                    if (items.length === 0)
                        break;
                    const txs = await this.parseTransactionItems(items, address);
                    allTxs.push(...txs);
                    if (items.length < pageSize)
                        break; // no more data on the chain
                    currentOffset += pageSize;
                    remaining -= pageSize;
                }
                return allTxs;
            }
            catch (error) {
                throw new Error(`Failed to fetch transaction history: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         *  Fetches PoX contract information from the Stacks network.
         * @returns - The PoX contract information.
         */
        this.fetchPoxInfo = async () => {
            try {
                const response = await this.axiosClient.get(`${this.stackBaseUrl}/v2/pox`);
                if (!response || !response.data || response.status !== 200) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response;
            }
            catch (error) {
                console.error(`Error fetching pox info: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                throw new Error(`Failed to fetch PoX info from network: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Delegates STX to a specified address for a given lock period.
         * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
         * @param delegateTo - The address to delegate STX to.
         * @param amount - The amount of STX to delegate (in microSTX).
         * @param lockPeriod - Number of cycles to lock the delegation for.
         * @returns - The unsigned delegate STX transaction.
         */
        this.delegateStx = async (senderPublicKey, delegateTo, amount, lockPeriod) => {
            try {
                if (!(0, helpers_1.validateAddress)(delegateTo, this.network === network_1.STACKS_TESTNET)) {
                    throw new Error("Invalid delegateTo address");
                }
                if (!(0, helpers_1.isCompressedSecp256k1PubKeyHex)(senderPublicKey)) {
                    throw new Error("Invalid compressed secp256k1 public key hex format");
                }
                const poxResponse = await this.fetchPoxInfo();
                const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
                if (!poxResponse || !poxResponse.data || poxResponse.status !== 200) {
                    throw new Error("Failed to fetch PoX contract info from the network");
                }
                const until_burn_ht = await (0, helpers_1.untilBurnHeightForCycles)(lockPeriod, poxResponse);
                const serializedContractCall = await this.serializeContractCall(senderPublicKey, poxAddr, poxName, "delegate-stx", [
                    (0, transactions_1.uintCV)(amount),
                    (0, transactions_1.standardPrincipalCV)(delegateTo),
                    (0, transactions_1.someCV)((0, transactions_1.uintCV)(until_burn_ht)),
                    (0, transactions_1.noneCV)(),
                ]);
                return serializedContractCall;
            }
            catch (error) {
                console.error("Error building delegate STX transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to build delegate STX transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Revokes STX delegation.
         * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
         * @returns - The unsigned revoke delegation transaction.
         */
        this.revokeStxDelegation = async (senderPublicKey) => {
            try {
                if (!(0, helpers_1.isCompressedSecp256k1PubKeyHex)(senderPublicKey)) {
                    throw new Error("Invalid compressed secp256k1 public key hex format");
                }
                const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
                const serializedContractCall = await this.serializeContractCall(senderPublicKey, poxAddr, poxName, "revoke-delegate-stx", []);
                return serializedContractCall;
            }
            catch (error) {
                console.error("Error building revoke STX delegation transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to build revoke STX delegation transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Allows the delegatee to call pox contract to lock delegated STX on the delegater's behalf.
         * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
         * @param delegateTo - The address to delegate STX to.
         * @param amount - The amount of STX to delegate (in microSTX).
         * @param lockPeriod - Number of cycles to lock the delegation for.
         * @returns - The unsigned delegate STX transaction.
         */
        this.allowPoxContractCaller = async (senderPublicKey, poolAddress, poolContractName) => {
            try {
                if (!(0, helpers_1.validateAddress)(poolAddress, this.network === network_1.STACKS_TESTNET)) {
                    throw new Error("Invalid pool address");
                }
                if (!(0, helpers_1.isCompressedSecp256k1PubKeyHex)(senderPublicKey)) {
                    throw new Error("Invalid compressed secp256k1 public key hex format");
                }
                if (!poolContractName) {
                    throw new Error("Pool contract name must be provided");
                }
                const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
                const serializedContractCall = await this.serializeContractCall(senderPublicKey, poxAddr, poxName, "allow-contract-caller", [(0, transactions_1.contractPrincipalCV)(poolAddress, poolContractName), (0, transactions_1.noneCV)()]);
                return serializedContractCall;
            }
            catch (error) {
                console.error("Error building allow contract caller transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to allow contract caller: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Solo stacks STX on Stacks PoX to earn rewards directly.
         * @param senderPublicKey
         * @param address
         * @param amountUstx
         * @param btcRewardAddress
         * @param lockPeriod
         * @param maxAmountUstx
         * @param authId
         * @returns the unsigned solo stack transaction.
         */
        this.soloStack = async (senderPublicKey, signerKey, amountUstx, btcRewardAddress, lockPeriod, maxAmountUstx, signerSig65Hex, startBurnHeight, authId) => {
            try {
                if (!(0, helpers_1.isCompressedSecp256k1PubKeyHex)(senderPublicKey)) {
                    throw new Error("Invalid compressed secp256k1 public key hex format");
                }
                const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
                const { version, hashbytes } = (0, helpers_1.btcAddressToPoxTuple)(btcRewardAddress);
                const serializedContractCall = await this.serializeContractCall(senderPublicKey, poxAddr, poxName, "stack-stx", [
                    (0, transactions_1.uintCV)(amountUstx),
                    (0, transactions_1.tupleCV)({
                        version: (0, transactions_1.bufferCV)(Uint8Array.from([version])),
                        hashbytes: (0, transactions_1.bufferCV)(hashbytes),
                    }),
                    (0, transactions_1.uintCV)(startBurnHeight),
                    (0, transactions_1.uintCV)(lockPeriod),
                    (0, transactions_1.someCV)((0, transactions_1.bufferCV)(Buffer.from(signerSig65Hex, "hex"))),
                    (0, transactions_1.bufferCV)(Buffer.from(signerKey, "hex")),
                    (0, transactions_1.uintCV)(maxAmountUstx),
                    (0, transactions_1.uintCV)(authId),
                ]);
                return serializedContractCall;
            }
            catch (error) {
                console.error("Error building solo stack transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to solo stack: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Increases the amount of STX in an existing solo stacking position.
         * @param senderPublicKey - Public key of the transaction sender
         * @param signerKey - Signer public key (33-byte compressed hex)
         * @param increaseBy - Amount of microSTX to add to existing stack
         * @param maxAmountUstx - Maximum total amount of microSTX to be stacked after increase
         * @param signerSig65Hex - 65-byte signer signature (hex)
         * @param authId - Random integer for replay protection (must match signature)
         * @returns the unsigned stack-increase transaction.
         */
        this.increaseStackedStx = async (senderPublicKey, signerKey, increaseBy, maxAmountUstx, signerSig65Hex, authId) => {
            try {
                if (!(0, helpers_1.isCompressedSecp256k1PubKeyHex)(senderPublicKey)) {
                    throw new Error("Invalid compressed secp256k1 public key hex format");
                }
                const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
                const serializedContractCall = await this.serializeContractCall(senderPublicKey, poxAddr, poxName, "stack-increase", [
                    (0, transactions_1.uintCV)(increaseBy), // increase-by
                    (0, transactions_1.someCV)((0, transactions_1.bufferCV)(Buffer.from(signerSig65Hex, "hex"))), // signer-sig
                    (0, transactions_1.bufferCV)(Buffer.from(signerKey, "hex")), // signer-key
                    (0, transactions_1.uintCV)(maxAmountUstx), // max-amount
                    (0, transactions_1.uintCV)(authId), // auth-id
                ]);
                return serializedContractCall;
            }
            catch (error) {
                console.error("Error building stack-increase transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to increase stacked STX: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
       * Extends the stacking period of an existing solo stacking position.
       * @param senderPublicKey - Public key of the transaction sender
       * @param signerKey - Signer public key (33-byte compressed hex)
       * @param extendCycles - cycles to extend the stacking period by
       * @param maxAmountUstx - Maximum total amount of microSTX to be stacked
       * @param signerSig65Hex - 65-byte signer signature (hex)
       * @param authId - Random integer for replay protection (must match signature)
       * @returns the unsigned stack-extend transaction.
       */
        this.extendStackingPeriod = async (senderPublicKey, signerKey, btcRewardAddress, extendCycles, maxAmountUstx, signerSig65Hex, authId) => {
            try {
                if (!(0, helpers_1.isCompressedSecp256k1PubKeyHex)(senderPublicKey)) {
                    throw new Error("Invalid compressed secp256k1 public key hex format");
                }
                const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
                const { version, hashbytes } = (0, helpers_1.btcAddressToPoxTuple)(btcRewardAddress);
                const serializedContractCall = await this.serializeContractCall(senderPublicKey, poxAddr, poxName, "stack-extend", [
                    (0, transactions_1.uintCV)(extendCycles), // extend-cycles
                    (0, transactions_1.tupleCV)({
                        version: (0, transactions_1.bufferCV)(Uint8Array.from([version])),
                        hashbytes: (0, transactions_1.bufferCV)(hashbytes),
                    }),
                    (0, transactions_1.someCV)((0, transactions_1.bufferCV)(Buffer.from(signerSig65Hex, "hex"))), // signer-sig
                    (0, transactions_1.bufferCV)(Buffer.from(signerKey, "hex")), // signer-key
                    (0, transactions_1.uintCV)(maxAmountUstx), // max-amount
                    (0, transactions_1.uintCV)(authId), // auth-id
                ]);
                return serializedContractCall;
            }
            catch (error) {
                console.error("Error building stack-extend transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to extend stacking period: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Serializes a generic contract call to a given contract address and name with specified function and arguments.
         * @param senderPublicKey - The compressed secp256k1 public key in hex format of the transaction sender.
         * @param contractAddress - The address of the contract to call.
         * @param contractName - The name of the contract to call.
         * @param functionName - The name of the function to call on the contract.
         * @param functionArgs - The arguments to pass to the contract function - must be an array of ClarityValue objects in the same order and types as the function parameters.
         * @returns the serialized unsigned contract call transaction and pre-signature hash.
         */
        this.makeContractCall = async (senderPublicKey, contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode) => {
            try {
                if (!(0, helpers_1.isCompressedSecp256k1PubKeyHex)(senderPublicKey)) {
                    throw new Error("Invalid compressed secp256k1 public key hex format");
                }
                const serializedContractCall = await this.serializeContractCall(senderPublicKey, contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode);
                return serializedContractCall;
            }
            catch (error) {
                console.error("Error building contract call transaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to make contract call: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Fetches contract call transactions for an address, excluding STX and FT transfers.
         * @param address - The Stacks address to query.
         * @param limit - The maximum number of transactions to retrieve.
         * @param offset - The offset for pagination.
         * @returns An array of contract call transactions.
         */
        this.getContractCallHistory = async (address, limit = constants_1.pagination_defaults.limit, offset = constants_1.pagination_defaults.page) => {
            if (!(0, helpers_1.validateAddress)(address, this.network === network_1.STACKS_TESTNET)) {
                throw new Error("Invalid Stacks address");
            }
            try {
                const allTxs = [];
                let currentOffset = offset;
                while (allTxs.length < limit) {
                    const pageSize = constants_1.helperConstants.stacks_api_page_size;
                    const response = await this.axiosClient.get(`${this.stackBaseUrl}/extended/v1/address/${address}/transactions?limit=${pageSize}&offset=${currentOffset}`);
                    if (!response || !response.data || response.status !== 200) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const items = (response.data.results || []);
                    if (items.length === 0)
                        break;
                    for (const tx of items) {
                        if (tx.tx_type !== "contract_call" || !tx.contract_call) {
                            continue;
                        }
                        // Exclude FT transfers (contract_call with function_name === "transfer" and standard transfer args)
                        const fn = tx.contract_call.function_name;
                        const args = tx.contract_call.function_args;
                        if (fn === "transfer" && Array.isArray(args) && args.length >= 3) {
                            continue;
                        }
                        const contractId = tx.contract_call.contract_id;
                        const dotIdx = contractId.indexOf(".");
                        const contractAddress = dotIdx !== -1 ? contractId.substring(0, dotIdx) : contractId;
                        const contractName = dotIdx !== -1 ? contractId.substring(dotIdx + 1) : "";
                        allTxs.push({
                            transaction_hash: tx.tx_id,
                            timestamp: tx.block_time_iso,
                            success: tx.tx_status === "success",
                            sender: tx.sender_address,
                            contractId,
                            contractAddress,
                            contractName,
                            functionName: fn,
                            functionArgs: Array.isArray(args)
                                ? args.map((a) => {
                                    var _a, _b, _c;
                                    return ({
                                        name: (_a = a.name) !== null && _a !== void 0 ? _a : "",
                                        type: (_b = a.type) !== null && _b !== void 0 ? _b : "",
                                        repr: (_c = a.repr) !== null && _c !== void 0 ? _c : "",
                                    });
                                })
                                : [],
                        });
                    }
                    if (items.length < pageSize)
                        break; // no more data on the chain
                    currentOffset += pageSize;
                }
                return allTxs.slice(0, limit);
            }
            catch (error) {
                throw new Error(`Failed to fetch contract call history: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        this.axiosClient = axios_1.default.create();
        if (hiroApiKey) {
            this.axiosClient.defaults.headers['x-hiro-api-key'] = hiroApiKey;
        }
        this.stackBaseUrl = testnet
            ? constants_1.api_constants.stacks_testnet_rpc
            : constants_1.api_constants.stacks_mainnet_rpc;
        this.network = testnet ? network_1.STACKS_TESTNET : network_1.STACKS_MAINNET;
    }
}
exports.StacksService = StacksService;
