"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StacksSDK = void 0;
/**
 * StacksSDK provides a unified interface for interacting with Stacks through Fireblocks services.
 *
 * This SDK allows you to:
 * - Retrieve Stacks account address and public key associated with a Fireblocks vault account.
 * - Query balances and transaction history for the Stacks account.
 * - Create transactions using Fireblocks raw signing.
 *
 * Usage:
 * ```typescript
 * const sdk = await StacksSDK.create(vaultAccountId, fireblocksConfig);
 * const balance = await sdk.getBalance();
 * ```
 *
 * @remarks
 * - Use the static `create` method to instantiate the SDK asynchronously.
 * - Ensure the Fireblocks vault account is properly configured and accessible.
 * - Ensure Fireblocks workspace configuration like API Key, API Secret and Base Path are set up correctly.
 * @public
 */
const stacks_service_1 = require("./services/stacks.service");
const fireblocks_service_1 = require("./services/fireblocks.service");
const types_1 = require("./services/types");
const constants_1 = require("./utils/constants");
const errorHandling_1 = require("./utils/errorHandling");
const fireblocks_utils_1 = require("./utils/fireblocks.utils");
const helpers_1 = require("./utils/helpers");
const transactions_1 = require("@stacks/transactions");
class StacksSDK {
    constructor(vaultAccountId, fireblocksConfig, hiroApiKey) {
        var _b;
        this.cachedTransactions = [];
        this.testnet = false;
        /**
         * Retrieves the Stacks account public key associated with the Fireblocks vault account.
         * @returns The Stacks account public key or empty string if not set.
         */
        this.getPublicKey = () => {
            return this.publicKey || "";
        };
        /**
         * Retrieves the Stacks account address associated with the Fireblocks vault account.
         * @returns The Stacks account address or empty string if not set.
         */
        this.getAddress = () => {
            return this.address || "";
        };
        /**
         * Retrieves the BTC rewards address associated with the Fireblocks vault account (derived from the same public key).
         * @returns The BTC rewards address or empty string if not set.
         */
        this.getBtcRewardsAddress = () => {
            return this.btcRewardsAddress || "";
        };
        /**
         * Retrieves the native coin balance for the current address.
         *
         * @returns A promise that resolves to a {GetNativeBalanceResponse} containing the native balance information.
         * @throws {Error} If the address is not set or if the balance retrieval fails.
         */
        this.getBalance = async () => {
            if (!this.address) {
                console.log("StacksSDK.getBalance() error: address is not set.");
                throw new Error("Stacks address is not set.");
            }
            try {
                const balance = await this.chainService.getNativeBalance(this.address);
                return {
                    success: true,
                    balance: balance,
                };
            }
            catch (error) {
                console.log(`Failed to get balance: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: (0, errorHandling_1.formatErrorMessage)(error),
                };
            }
        };
        /**
         * Returns nonce information for this vault's Stacks address, accounting for
         * pending mempool transactions.
         *
         * - confirmedNonce: next nonce per confirmed on-chain state.
         * - pendingTxCount: number of this address's transactions in the mempool.
         * - nextAvailable: first nonce not already taken by a pending tx (gap-aware).
         *   Use this value when submitting a new transaction.
         *
         * @returns A promise that resolves to a {GetAccountNonceResponse}.
         */
        this.getAccountNonce = async () => {
            if (!this.address) {
                throw new Error("Stacks address is not set.");
            }
            try {
                const result = await this.chainService.getAccountNonce(this.address);
                return Object.assign({ success: true }, result);
            }
            catch (error) {
                return { success: false, error: (0, errorHandling_1.formatErrorMessage)(error) };
            }
        };
        /**
         * Retrieves the status of a transaction by its ID.
         * @param txId - The transaction ID.
         * @returns A promise that resolves to a {GetTransactionStatusResponse} containing the transaction status information.
         * @throws {Error} If the transaction ID is invalid or if the status retrieval fails.
         */
        this.getTxStatusById = async (txId) => {
            var _b, _c, _d;
            if (!txId || typeof txId !== "string") {
                console.log("StacksSDK.getTxStatusById() error: invalid transaction ID.");
                throw new Error("Transaction ID is invalid.");
            }
            try {
                const transaction = await this.chainService.getTxStatusById(txId);
                if (!transaction) {
                    return { success: false, error: "Transaction not found." };
                }
                const txDetails = {
                    tx_id: transaction.tx_id,
                    tx_status: transaction.tx_status,
                    tx_result: transaction.tx_result,
                    full_tx_details: transaction,
                };
                if (transaction.tx_status !== "success") {
                    const errorNumber = (0, helpers_1.parseClarityErrCode)(transaction.tx_result);
                    // Only use PoX-4 error table for PoX contract calls
                    const isPoXTransaction = transaction.tx_type === "contract_call" &&
                        ((_c = (_b = transaction.contract_call) === null || _b === void 0 ? void 0 : _b.contract_id) === null || _c === void 0 ? void 0 : _c.includes("pox-4"));
                    if (isPoXTransaction && errorNumber !== null && constants_1.POX4_ERRORS[errorNumber]) {
                        txDetails.tx_error = constants_1.POX4_ERRORS[errorNumber].name;
                    }
                    else if (errorNumber !== null) {
                        txDetails.tx_error = `Contract error code: ${errorNumber}`;
                    }
                    else {
                        txDetails.tx_error = ((_d = transaction.tx_result) === null || _d === void 0 ? void 0 : _d.repr) || "Transaction failed";
                    }
                }
                return {
                    success: true,
                    data: txDetails,
                };
            }
            catch (error) {
                console.log(`Failed to get transaction status: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: (0, errorHandling_1.formatErrorMessage)(error),
                };
            }
        };
        /**
         * Waits for a transaction to be settled (either success or failure) by polling its status.
         * @param txId - The transaction ID.
         * @param intervalMs - The interval in milliseconds between status checks (default is 3000ms).
         * @param maxAttempts - The maximum number of attempts to check the status (default is 20).
         * @returns A promise that resolves to a {GetTransactionStatusResponse} containing the final transaction status.
         */
        this.waitForTxSettlement = async (txId, intervalMs = 3000, maxAttempts = 20) => {
            var _b;
            for (let i = 0; i < maxAttempts; i++) {
                const status = await this.getTxStatusById(txId);
                if (!status.success)
                    return status;
                const txStatus = (_b = status.data) === null || _b === void 0 ? void 0 : _b.tx_status;
                if (txStatus !== "submitted" && txStatus !== "pending") {
                    return status; // settled — success or a real error
                }
                await new Promise(res => setTimeout(res, intervalMs));
            }
            return { success: false, error: "Transaction timed out waiting for confirmation." };
        };
        /**
         * Retrieves the fungible tokens balances for the current address.
         *
         * @returns A promise that resolves to a {GetFtBalancesResponse} containing the fungible tokens balances.
         * @throws {Error} If the address is not set or if the balance retrieval fails.
         */
        this.getFtBalances = async () => {
            if (!this.address) {
                console.log("StacksSDK.getTransactionsHistory() error: address is not set.");
                throw new Error("Stacks address is not set.");
            }
            try {
                const data = [];
                const balances = await this.chainService.getFTBalancesForAddress(this.address);
                for (const [assetId, info] of Object.entries(balances)) {
                    const { contractAddress, contractName, tokenName } = (0, helpers_1.parseAssetId)(assetId);
                    let decimals = (0, helpers_1.getDecimalsFromFtInfo)(assetId);
                    // if decimals is 0 => not found in ftInfo => custom token
                    if (decimals == 0) {
                        decimals = await this.chainService.fetchFtDecimals(contractAddress, contractName);
                    }
                    const balance = {
                        token: tokenName,
                        tokenContractName: contractName,
                        tokenContractAddress: contractAddress,
                        balance: (0, helpers_1.microToToken)(info.balance, decimals),
                    };
                    data.push(balance);
                }
                return {
                    success: true,
                    data,
                };
            }
            catch (error) {
                console.error(`Error fetching fungible tokens balances: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: (0, errorHandling_1.formatErrorMessage)(error),
                };
            }
        };
        /**
         * Retrieves the transaction history for the current address.
         *
         * @param getCachedTransactions - Whether to return cached transactions (default is true).
         * @param limit - The maximum number of transactions to return (default is 50).
         * @param offset - The offset for pagination (default is 0).
         * @returns A promise that resolves to an array of {Transaction} containing transaction history.
         * @throws {Error} If the address is not set or if the transaction history retrieval fails.
         */
        this.getTransactionHistory = async (getCachedTransactions = true, // Must be manually set to false to fetch fresh transactions
        limit = constants_1.pagination_defaults.limit, offset = constants_1.pagination_defaults.page) => {
            if (getCachedTransactions) {
                console.log("Using cached transactions");
                return { success: true, data: this.cachedTransactions };
            }
            if (!this.address) {
                console.log("StacksSDK.getTransactionsHistory() error: address is not set.");
                throw new Error("Stacks address is not set.");
            }
            try {
                const txs = await this.chainService.getTransactionHistory(this.address, limit, offset);
                const existingHashes = new Set(this.cachedTransactions.map((tx) => tx.transaction_hash));
                const newTransactions = txs.filter((tx) => !existingHashes.has(tx.transaction_hash));
                this.cachedTransactions = [
                    ...this.cachedTransactions,
                    ...newTransactions,
                ];
                return { success: true, data: txs };
            }
            catch (error) {
                return {
                    success: false,
                    error: (0, errorHandling_1.formatErrorMessage)(error),
                };
            }
        };
        /**
         * Checks and validates transaction parameters, adjusting the amount if necessary.
         *
         * @param recipientAddress - The address of the recipient.
         * @param amount - The amount to transfer in native coin.
         * @param grossTransaction - Optional flag indicating if the transaction is gross, if so fee will be deducted from recipient (default is false).
         * @param type - The type of transaction (default is native coin).
         * @param token - The type of fungible token to transfer (required if type is FungibleToken).
         * @returns A promise that resolves to an object indicating if parameters are valid, the final amount, and reason if invalid.
         * @throws {Error} If parameter validation fails.
         */
        this.checkParamsAndAdjustAmount = async (recipientAddress, amount, grossTransaction = false, type = types_1.TransactionType.STX, token, customTokenContractAddress, customTokenContractName) => {
            var _b, _c, _d, _e;
            try {
                if (!(0, helpers_1.validateAddress)(recipientAddress, this.testnet)) {
                    return {
                        validParams: false,
                        reason: `Not a valid recipient address`,
                    };
                }
                if (amount <= 0) {
                    return {
                        validParams: false,
                        reason: `Transfer amount must be greater than zero`,
                    };
                }
                if (type == types_1.TransactionType.FungibleToken && !token) {
                    return {
                        validParams: false,
                        reason: `Token type must be provided for fungible token transfers`,
                    };
                }
                if (token === types_1.TokenType.CUSTOM) {
                    if (!customTokenContractAddress || !customTokenContractName) {
                        return {
                            validParams: false,
                            reason: `Custom token contract address and name must be provided for CUSTOM token type`,
                        };
                    }
                }
                let microAmount = type == types_1.TransactionType.FungibleToken
                    ? await (0, helpers_1.tokenToMicro)(amount, token, this.chainService, customTokenContractAddress, customTokenContractName)
                    : (0, helpers_1.stxToMicro)(amount);
                let microfee = 0;
                let fee = 0;
                if (type == types_1.TransactionType.STX) {
                    microfee = await this.chainService.estimateTxFee(recipientAddress, microAmount);
                    fee = (0, helpers_1.microToStx)(microfee);
                }
                else if (type == types_1.TransactionType.FungibleToken) {
                    // Estimate fee for FT contract call
                    const tokenInfo = token !== types_1.TokenType.CUSTOM
                        ? (0, helpers_1.getTokenInfo)(token, this.testnet ? "testnet" : "mainnet")
                        : undefined;
                    const ftContractAddress = (_b = tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.contractAddress) !== null && _b !== void 0 ? _b : customTokenContractAddress;
                    const ftContractName = (_c = tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.contractName) !== null && _c !== void 0 ? _c : customTokenContractName;
                    // Build SIP-010 transfer args for fee estimation
                    const functionArgs = [
                        (0, transactions_1.uintCV)(microAmount),
                        (0, transactions_1.principalCV)(this.address),
                        (0, transactions_1.principalCV)(recipientAddress),
                        (0, transactions_1.noneCV)(),
                    ];
                    microfee = await this.chainService.estimateContractCallFee(ftContractAddress, ftContractName, "transfer", functionArgs);
                    fee = (0, helpers_1.microToStx)(microfee);
                }
                // For FT transfers, check STX balance covers gas fee
                if (type == types_1.TransactionType.FungibleToken) {
                    const stxBalanceResponse = await this.getBalance();
                    if (!stxBalanceResponse.success) {
                        throw new Error("Could not fetch STX balance to check gas funds");
                    }
                    if (stxBalanceResponse.balance < fee) {
                        return {
                            validParams: false,
                            reason: `Insufficient STX for gas fee. Available: ${stxBalanceResponse.balance} STX, required: ${fee} STX`,
                        };
                    }
                }
                const balanceResponse = type == types_1.TransactionType.FungibleToken
                    ? await this.getFtBalances()
                    : await this.getBalance();
                if (!balanceResponse.success) {
                    throw new Error(`Could not fetch account balance to check funds sufficiency`);
                }
                // if its a gross STX transfer, deduct fee from transferred amount
                if (type == types_1.TransactionType.STX && grossTransaction) {
                    console.log(`Gross transaction: deducting fee ${fee} STX from amount ${amount} STX`);
                    amount -= fee;
                    if (amount <= 0) {
                        return {
                            validParams: false,
                            reason: `Amount after fee deduction is zero or negative`,
                        };
                    }
                }
                let balance;
                if (type == types_1.TransactionType.FungibleToken) {
                    // For known tokens, match by contract name from tokenInfo
                    // For custom tokens, match by contract address
                    const tokenInfo = token !== types_1.TokenType.CUSTOM
                        ? (0, helpers_1.getTokenInfo)(token, this.testnet ? "testnet" : "mainnet")
                        : undefined;
                    balance = (_e = (_d = balanceResponse.data) === null || _d === void 0 ? void 0 : _d.find((b) => (tokenInfo && b.tokenContractName === tokenInfo.contractName) ||
                        (customTokenContractAddress && b.tokenContractAddress === customTokenContractAddress))) === null || _e === void 0 ? void 0 : _e.balance;
                }
                else {
                    balance = balanceResponse.balance;
                }
                if ((type === types_1.TransactionType.FungibleToken ? amount : amount + fee) > balance) {
                    return {
                        validParams: false,
                        reason: `Insufficient funds. Available balance: ${balance}, required: ${amount}`,
                    };
                }
                // Recalculate microAmount after any adjustments
                microAmount =
                    type == types_1.TransactionType.FungibleToken
                        ? await (0, helpers_1.tokenToMicro)(amount, token, this.chainService, customTokenContractAddress, customTokenContractName)
                        : (0, helpers_1.stxToMicro)(amount);
                console.log(`Converted amount to micro: ${microAmount} (from ${amount} ${token ? token : "STX"})`);
                return {
                    validParams: true,
                    finalAmount: microAmount,
                };
            }
            catch (error) {
                throw new Error(`Parameter validation failed: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Resolves the nonce to use for a transaction. If an explicit nonce is
         * provided it is returned as-is. Otherwise the gap-aware nextAvailable
         * value from getAccountNonce() is used, keeping our auto-nonce consistent
         * with what GET /:vaultId/nonce reports.
         */
        this.resolveNonce = async (nonce) => {
            if (nonce !== undefined)
                return nonce;
            const { nextAvailable } = await this.chainService.getAccountNonce(this.address);
            return nextAvailable;
        };
        /**
         *  Builds, signs, and sends an STX or fungible token transfer transaction.
         * @param recipientAddress - The address of the recipient.
         * @param microAmount - The amount to transfer in micro units.
         * @param type - The type of transaction (default is native coin).
         * @param token - The token type for fungible token transfers.
         * @param note - Optional note to be attached to the transaction in raw signing.
         * @returns - A promise that resolves to the transaction broadcast result.
         */
        this.buildSignSendTransfer = async (recipientAddress, microAmount, type = types_1.TransactionType.STX, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, note, nonce, feeUstx) => {
            try {
                const resolvedNonce = await this.resolveNonce(nonce);
                const transactionToSign = await this.chainService.serializeTransaction(this.address, this.publicKey, recipientAddress, microAmount, type, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, resolvedNonce, feeUstx);
                const rawSignature = await this.fireblocksService.signTransaction(transactionToSign.preSignSigHash, this.vaultAccountId.toString(), note || "");
                const signature = (0, helpers_1.concatSignature)(rawSignature.fullSig, rawSignature.v);
                transactionToSign.unsignedTx.auth.spendingCondition.signature =
                    (0, transactions_1.createMessageSignature)(signature);
                const result = await this.chainService.broadcastTransaction(transactionToSign.unsignedTx);
                return result;
            }
            catch (error) {
                throw new Error(`Failed to build, sign or send transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        this.buildSignSendContractCall = async (options) => {
            const { functionName, poolAddress, poolContractName, amount, maxAmount, lockPeriod, extendCycles, signerKey, signerSig65Hex, startBurnHeight, authId, contractCallParams, note, nonce, } = options;
            try {
                if (functionName === "allow-contract-caller" && (!poolContractName || !poolAddress)) {
                    throw new Error("Pool contract name and address must be provided for allow-contract-caller");
                }
                if (functionName === "delegate-stx" && (!amount || !lockPeriod || !poolAddress)) {
                    throw new Error("Amount, lock period, and pool address must be provided for delegate-stx");
                }
                if (functionName === "solo-stack" &&
                    (!amount || !lockPeriod || !signerSig65Hex || !startBurnHeight || !signerKey || maxAmount == null || authId == null)) {
                    throw new Error("Amount, lock period, signer signature, start burn height, signer key, max amount, and auth ID must be provided for solo-stack");
                }
                if (functionName === "increase-stack-amount" &&
                    (!amount || !signerSig65Hex || !signerKey || authId == null || maxAmount == null)) {
                    throw new Error("Amount, signer signature, signer key, auth ID and max amount must be provided for increase-stack-amount");
                }
                if (functionName === "extend-stack-period" &&
                    (!extendCycles || !signerSig65Hex || !signerKey || authId == null || maxAmount == null)) {
                    throw new Error("Extend cycles, signer signature, signer key, auth ID and max amount must be provided for extend-stack-period");
                }
                const resolvedNonce = await this.resolveNonce(nonce);
                if (functionName === "generic-contract-call" && !contractCallParams) {
                    throw new Error("Contract call parameters must be provided for generic-contract-call");
                }
                let transactionToSign;
                switch (functionName) {
                    case "allow-contract-caller":
                        transactionToSign = await this.chainService.allowPoxContractCaller(this.publicKey, poolAddress, poolContractName, resolvedNonce);
                        break;
                    case "delegate-stx":
                        transactionToSign = await this.chainService.delegateStx(this.publicKey, poolAddress, amount, lockPeriod, resolvedNonce);
                        break;
                    case "revoke-delegate-stx":
                        transactionToSign = await this.chainService.revokeStxDelegation(this.publicKey, resolvedNonce);
                        break;
                    case "solo-stack":
                        transactionToSign = await this.chainService.soloStack(this.publicKey, signerKey, amount, this.btcRewardsAddress, lockPeriod, maxAmount, signerSig65Hex, startBurnHeight, authId, resolvedNonce);
                        break;
                    case "increase-stack-amount":
                        transactionToSign = await this.chainService.increaseStackedStx(this.publicKey, signerKey, amount, maxAmount, signerSig65Hex, authId, resolvedNonce);
                        break;
                    case "extend-stack-period":
                        transactionToSign = await this.chainService.extendStackingPeriod(this.publicKey, signerKey, this.btcRewardsAddress, extendCycles, maxAmount, signerSig65Hex, authId, resolvedNonce);
                        break;
                    case "generic-contract-call":
                        transactionToSign = await this.chainService.makeContractCall(this.publicKey, contractCallParams.contractAddress, contractCallParams.contractName, contractCallParams.functionName, contractCallParams.functionArgs, contractCallParams.postConditions, contractCallParams.postConditionMode);
                        break;
                    default:
                        throw new Error(`Unknown contract call function: ${functionName}`);
                }
                const rawSignature = await this.fireblocksService.signTransaction(transactionToSign.preSignSigHash, this.vaultAccountId.toString(), note || "");
                const signature = (0, helpers_1.concatSignature)(rawSignature.fullSig, rawSignature.v);
                transactionToSign.unsignedContractCall.auth.spendingCondition.signature =
                    (0, transactions_1.createMessageSignature)(signature);
                const transaction = (0, transactions_1.serializeTransaction)(transactionToSign.unsignedContractCall);
                const result = await this.chainService.broadcastTransaction(transactionToSign.unsignedContractCall);
                return Object.assign(Object.assign({}, result), { transaction });
            }
            catch (error) {
                throw new Error(`Failed to build, sign or send contract call transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Creates a native coin transaction to transfer funds to a recipient address.
         * @param recipientAddress - The address of the recipient.
         * @param amount - Amount to transfer in STX (number, e.g. 1.5 for 1.5 STX). Converted to microSTX internally.
         * @param grossTransaction - Optional flag indicating if the transaction is gross, if so fee will be deducted from recipient (default is false).
         * @param note - Optional note to be attached to the transaction in raw signing.
         * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
         * @param fee - Optional fee in STX (number). Defaults to network estimate.
         * @returns A promise that resolves to a {CreateTransactionResponse}.
         * @throws {Error} If the address, public key, or vault ID are not set, or if the transaction creation fails.
         */
        this.createNativeTransaction = async (recipientAddress, amount, grossTransaction = false, note, nonce, fee) => {
            if (!this.address || !this.publicKey || !this.vaultAccountId) {
                throw new Error("Address, Public Key or Vault ID are not set");
            }
            try {
                const paramsValidationResponse = await this.checkParamsAndAdjustAmount(recipientAddress, amount, grossTransaction, types_1.TransactionType.STX);
                if (!paramsValidationResponse.validParams) {
                    return {
                        success: false,
                        error: `Invalid transaction parameters: ${paramsValidationResponse.reason}`,
                    };
                }
                const microAmount = paramsValidationResponse.finalAmount;
                const result = await this.buildSignSendTransfer(recipientAddress, microAmount, types_1.TransactionType.STX, undefined, // token
                undefined, // customTokenContractAddress
                undefined, // customTokenContractName
                undefined, // customTokenAssetName
                note, nonce, fee !== undefined ? (0, helpers_1.stxToMicro)(fee) : undefined);
                if (!result || result.error || !result.txid || result.reason) {
                    const errorAndReason = result.error && result.reason
                        ? `${result.error} - ${result.reason}`
                        : result.error || result.reason || "unknown error";
                    console.error(`Transaction broadcast failed: ${(0, errorHandling_1.formatErrorMessage)(errorAndReason)}`);
                    return {
                        success: false,
                        error: (result === null || result === void 0 ? void 0 : result.error)
                            ? (0, errorHandling_1.formatErrorMessage)(errorAndReason)
                            : "unknown error",
                    };
                }
                return {
                    success: true,
                    txHash: result.txid,
                };
            }
            catch (error) {
                throw new Error(`Failed to create transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Creates a fungible token transaction to transfer funds to a recipient address.
         * @param recipientAddress - The address of the recipient.
         * @param amount - Amount to transfer in STX (number). Converted to microSTX internally.
         * @param token - The type of fungible token to transfer.
         * @param note - Optional note to be attached to the transaction in raw signing.
         * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
         * @returns A promise that resolves to a {CreateTransactionResponse}.
         * @throws {Error} If the address, public key, or vault ID are not set, or if the transaction creation fails.
         */
        this.createFTTransaction = async (recipientAddress, amount, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, note, nonce) => {
            if (!this.address || !this.publicKey || !this.vaultAccountId) {
                throw new Error("Address, Public Key or Vault ID are not set");
            }
            // if custom token, validate contract address, name, and asset name are provided
            if (token === types_1.TokenType.CUSTOM) {
                if (!customTokenContractAddress || !customTokenContractName || !customTokenAssetName) {
                    return {
                        success: false,
                        error: `Custom token contract address, name, and asset name must be provided for CUSTOM token type`,
                    };
                }
            }
            console.log(`Creating FT transaction: ${amount} ${token} to ${recipientAddress}`);
            try {
                const paramsValidationResponse = await this.checkParamsAndAdjustAmount(recipientAddress, amount, undefined, // Gross transaction not applicable for FT transfers
                types_1.TransactionType.FungibleToken, token, customTokenContractAddress, customTokenContractName);
                if (!paramsValidationResponse.validParams) {
                    return {
                        success: false,
                        error: `Invalid transaction parameters: ${paramsValidationResponse.reason}`,
                    };
                }
                const microAmount = paramsValidationResponse.finalAmount;
                const result = await this.buildSignSendTransfer(recipientAddress, microAmount, types_1.TransactionType.FungibleToken, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, note, nonce);
                if (!result || result.error || !result.txid || result.reason) {
                    const errorAndReason = (result === null || result === void 0 ? void 0 : result.error) && (result === null || result === void 0 ? void 0 : result.reason)
                        ? `${result.error} - ${result.reason}`
                        : (result === null || result === void 0 ? void 0 : result.error) || (result === null || result === void 0 ? void 0 : result.reason) || "unknown error";
                    console.error(`FT transaction broadcast failed: ${(0, errorHandling_1.formatErrorMessage)(errorAndReason)}`);
                    return {
                        success: false,
                        error: (0, errorHandling_1.formatErrorMessage)(errorAndReason),
                    };
                }
                return {
                    success: true,
                    txHash: result.txid,
                };
            }
            catch (error) {
                throw new Error(`Failed to create transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Delegate STX to a stacking pool.
         * @param poolsAddress - The address of the stacking pool.
         * @param poolContractName - The contract name of the stacking pool.
         * @param amount - Amount of STX to delegate (number). Converted to microSTX internally.
         * @param lockPeriod - The lock period in cycles.
         * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
         * @returns A promise that resolves to a {CreateTransactionResponse}.
         * @throws {Error} If the address, public key, or vault ID are not set, or if the delegate process fails.
         */
        this.delegateToPool = async (poolsAddress, poolContractName, amount, lockPeriod, nonce) => {
            var _b;
            if (this.testnet) {
                console.log(`[WARNING] delegateToPool is not supported on testnet.`);
                return {
                    success: false,
                    error: `delegateToPool is not supported on testnet.`,
                };
            }
            if (!this.address || !this.publicKey || !this.vaultAccountId) {
                throw new Error("Address, Public Key or Vault ID are not set");
            }
            try {
                const status = await this.checkStatus();
                if (!status.success) {
                    return {
                        success: false,
                        error: `Failed to check account status before delegating STX: ${status.error}`,
                    };
                }
                if ((_b = status.data) === null || _b === void 0 ? void 0 : _b.delegation.is_delegated) {
                    return {
                        success: false,
                        error: `Account already has an active delegation to ${status.data.delegation.delegated_to}, if you wish to change delegation please revoke existing delegation first, run checkStatus for more info.`,
                    };
                }
                console.log(`Delegating ${amount} STX to pool: ${poolsAddress} for ${lockPeriod} cycles`);
                // Delegate STX to pool address
                const delegateResult = await this.buildSignSendContractCall({
                    functionName: "delegate-stx",
                    poolAddress: poolsAddress,
                    poolContractName,
                    amount: (0, helpers_1.stxToMicro)(amount),
                    lockPeriod,
                    nonce,
                });
                const assertDelegateResult = (0, helpers_1.assertResultSuccess)(delegateResult);
                if (assertDelegateResult.success === false) {
                    return {
                        success: false,
                        error: `Failed to delegate STX: ${assertDelegateResult.error}`,
                    };
                }
                console.log(`Successfully delegated ${amount} STX to pool ${poolsAddress}.${poolContractName}`);
                return {
                    success: true,
                    txHash: delegateResult.txid,
                };
            }
            catch (error) {
                console.error(`Error delegating to pool: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: `Failed to delegate to pool: ${(0, errorHandling_1.formatErrorMessage)(error)}`,
                };
            }
        };
        /**
         * Allows a stacking pool to lock delegated STX on behalf of the delegator.
         * @param poolsAddress - The address of the stacking pool.
         * @param poolContractName - The contract name of the stacking pool.
         * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
         * @returns A promise that resolves to a {CreateTransactionResponse}.
         * @throws {Error} If the address, public key, or vault ID are not set, or if the process fails.
         */
        this.allowContractCaller = async (poolsAddress, poolContractName, nonce) => {
            if (this.testnet) {
                console.log(`[WARNING] allowContractCaller is not supported on testnet.`);
                return {
                    success: false,
                    error: `allowContractCaller is not supported on testnet.`,
                };
            }
            if (!this.address || !this.publicKey || !this.vaultAccountId) {
                throw new Error("Address, Public Key or Vault ID are not set");
            }
            console.log(`Allowing ${poolsAddress}.${poolContractName} as PoX contract caller on behalf of ${this.address}`);
            try {
                // Allow contract caller
                const allowCallerResult = await this.buildSignSendContractCall({
                    functionName: "allow-contract-caller",
                    poolAddress: poolsAddress,
                    poolContractName,
                    nonce,
                });
                const assertAllowCallerResult = (0, helpers_1.assertResultSuccess)(allowCallerResult);
                if (assertAllowCallerResult.success === false) {
                    return {
                        success: false,
                        error: `Failed to allow contract caller: ${assertAllowCallerResult.error}`,
                    };
                }
                console.log(`Successfully allowed contract caller for pool ${poolsAddress}.${poolContractName}`);
                return {
                    success: true,
                    txHash: allowCallerResult.txid,
                };
            }
            catch (error) {
                console.error(`Error allowing contract caller: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: `Failed to allow contract caller: ${(0, errorHandling_1.formatErrorMessage)(error)}`,
                };
            }
        };
        /**
         * Revoke any STX delegation to any address for this account.
         * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
         * @returns A promise that resolves to a {CreateTransactionResponse}.
         * @throws {Error} If the address, public key, or vault ID are not set, or if the process fails.
         */
        this.revokeDelegation = async (nonce) => {
            if (this.testnet) {
                console.log(`[WARNING] revokeDelegation is not supported on testnet.`);
                return {
                    success: false,
                    error: `revokeDelegation is not supported on testnet.`,
                };
            }
            if (!this.address || !this.publicKey || !this.vaultAccountId) {
                throw new Error("Address, Public Key or Vault ID are not set");
            }
            console.log(`Revoking STX delegations from address: ${this.address}`);
            try {
                // Revoke any existing delegations.
                const revokeResult = await this.buildSignSendContractCall({
                    functionName: "revoke-delegate-stx",
                    nonce,
                });
                const assertDelegateResult = (0, helpers_1.assertResultSuccess)(revokeResult);
                if (assertDelegateResult.success === false) {
                    return {
                        success: false,
                        error: `Failed to delegate STX: ${assertDelegateResult.error}`,
                    };
                }
                console.log(`Successfully revoked STX delegations from address ${this.address}`);
                return {
                    success: true,
                    txHash: revokeResult.txid,
                };
            }
            catch (error) {
                console.error(`Error revoking delegation: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: `Failed to revoke delegation: ${(0, errorHandling_1.formatErrorMessage)(error)}`,
                };
            }
        };
        /**
         * Check account status: balance total, locked amount and delegation status.
         * @returns A promise that resolves to a {CreateTransactionResponse}.
         */
        this.checkStatus = async () => {
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            if (!this.address || !this.publicKey || !this.vaultAccountId) {
                throw new Error("Address, Public Key or Vault ID are not set");
            }
            console.log(`Checking account status for address: ${this.address}`);
            try {
                const [delegationData, balanceResponse] = await Promise.all([
                    this.chainService.checkDelegationStatus(this.address), // may be null
                    this.chainService.makeBalanceCalls(this.address),
                ]);
                if (!balanceResponse) {
                    throw new Error("Failed to fetch balance data");
                }
                const balanceData = balanceResponse.data;
                const stxBalMicro = BigInt((_b = balanceData.stx.balance) !== null && _b !== void 0 ? _b : "0");
                const stxLockedMicro = BigInt((_c = balanceData.stx.locked) !== null && _c !== void 0 ? _c : "0");
                const totalMinerRewardsRecievedMicro = BigInt((_d = balanceData.stx.total_miner_rewards_received) !== null && _d !== void 0 ? _d : "0");
                const isDelegated = !!(delegationData && delegationData.value);
                const amountDelegatedMicro = isDelegated
                    ? BigInt((_f = (_e = delegationData.value["amount-ustx"]) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : "0")
                    : null;
                const delegatedTo = isDelegated
                    ? ((_h = (_g = delegationData.value["delegated-to"]) === null || _g === void 0 ? void 0 : _g.value) !== null && _h !== void 0 ? _h : null)
                    : null;
                const untilBurnHt = isDelegated
                    ? ((_k = (_j = delegationData.value["until-burn-ht"]) === null || _j === void 0 ? void 0 : _j.value) === null || _k === void 0 ? void 0 : _k.value)
                        ? Number(delegationData.value["until-burn-ht"].value.value)
                        : null
                    : null;
                const poxAddrTuple = isDelegated
                    ? ((_m = (_l = delegationData.value["pox-addr"]) === null || _l === void 0 ? void 0 : _l.value) !== null && _m !== void 0 ? _m : null) // null if none
                    : null;
                const statusData = {
                    balance: {
                        stx_total: (0, helpers_1.microToStx)(stxBalMicro),
                        stx_locked: (0, helpers_1.microToStx)(stxLockedMicro),
                        lock_tx_id: balanceData.stx.lock_tx_id || null,
                        lock_height: balanceData.stx.lock_height || null,
                        burnchain_lock_height: balanceData.stx.burnchain_lock_height || null,
                        burnchain_unlock_height: balanceData.stx.burnchain_unlock_height || null,
                        total_miner_rewards_received: (0, helpers_1.microToStx)(totalMinerRewardsRecievedMicro),
                    },
                    delegation: {
                        is_delegated: isDelegated,
                        delegated_to: delegatedTo,
                        amount_delegated: amountDelegatedMicro
                            ? (0, helpers_1.microToStx)(amountDelegatedMicro)
                            : null,
                        until_burn_ht: untilBurnHt,
                        pox_addr: poxAddrTuple,
                    },
                };
                return {
                    success: true,
                    data: statusData,
                };
            }
            catch (error) {
                console.error(`Error checking status: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: `Failed to check status: ${(0, errorHandling_1.formatErrorMessage)(error)}`,
                };
            }
        };
        /**
         * Check eligibility for solo stacking.
         * @returns A promise that resolves to an object indicating eligibility and reason if not eligible.
         */
        this.checkEligibility = async (pox, amount) => {
            var _b;
            try {
                const status = await this.checkStatus();
                if (!status.success) {
                    throw new Error(`Failed to check account status before solo stacking STX: ${status.error}`);
                }
                if ((_b = status.data) === null || _b === void 0 ? void 0 : _b.delegation.is_delegated) {
                    return {
                        eligible: false,
                        reason: `Account already has an active delegation to ${status.data.delegation.delegated_to}, please revoke existing delegation first.`,
                    };
                }
                const safteyCheckResponse = (0, helpers_1.isSafeToSubmit)(pox);
                if (!safteyCheckResponse.safe) {
                    return {
                        eligible: false,
                        reason: `Too close to prepare phase boundary, try again next cycle`,
                    };
                }
                if ((0, helpers_1.stxToMicro)(amount) < BigInt(pox.min_amount_ustx)) {
                    return {
                        eligible: false,
                        reason: `Amount to stack is less than the minimum required amount of ${(0, helpers_1.microToStx)(BigInt(pox.min_amount_ustx))} STX.`,
                    };
                }
                const balance = await this.getBalance();
                if (!balance.success) {
                    throw new Error(`Could not fetch account balance to check funds sufficiency`);
                }
                if ((0, helpers_1.stxToMicro)(amount) > (0, helpers_1.stxToMicro)(balance.balance)) {
                    return {
                        eligible: false,
                        reason: `Amount to stack is greater than the available balance of ${balance.balance} STX.`,
                    };
                }
                return {
                    eligible: true,
                };
            }
            catch (error) {
                console.error(`Error checking eligibility: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    eligible: false,
                    reason: `Failed to check eligibility: ${(0, errorHandling_1.formatErrorMessage)(error)}`,
                };
            }
        };
        /**
         * Solo stacks a specified amount of STX for a given lock period.
         * @param signerKey - The signer's compressed public key (hex).
         * @param signerSig65Hex - 65-byte signer signature (hex).
         * @param amount - Amount of STX to stack (number). Converted to microSTX internally.
         * @param maxAmount - Maximum authorized STX amount, must be >= amount (number). Converted to microSTX internally.
         * @param lockPeriod - The number of cycles to lock the STX.
         * @param authId - Authorization ID for the transaction (bigint).
         * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
         * @returns A response indicating success or failure of the transaction.
         */
        this.stackSolo = async (signerKey, signerSig65Hex, amount, maxAmount, lockPeriod, authId, nonce) => {
            var _b, _c;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error("Address, Public Key or Vault ID are not set");
                }
                console.log(`Solo stacking ${amount} STX for ${lockPeriod} cycles`);
                const poxResponse = await this.chainService.fetchPoxInfo();
                const pox = poxResponse.data;
                const eligibilityCheck = await this.checkEligibility(pox, amount);
                if (!eligibilityCheck.eligible) {
                    return {
                        success: false,
                        error: `Account not eligible for solo stacking: ${eligibilityCheck.reason}`,
                    };
                }
                const startBurnHeight = pox.current_burnchain_block_height;
                const result = await this.buildSignSendContractCall({
                    functionName: "solo-stack",
                    amount: (0, helpers_1.stxToMicro)(amount),
                    maxAmount: (0, helpers_1.stxToMicro)(maxAmount),
                    lockPeriod,
                    signerKey,
                    signerSig65Hex,
                    startBurnHeight,
                    authId,
                    nonce,
                });
                const assertResult = (0, helpers_1.assertResultSuccess)(result);
                if (assertResult.success === false) {
                    return {
                        success: false,
                        error: `Failed to solo stack STX: ${assertResult.error}`,
                    };
                }
                const txStatus = await this.waitForTxSettlement(result.txid);
                if (txStatus.success && ((_b = txStatus.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== "success") {
                    return {
                        success: false,
                        error: ((_c = txStatus.data) === null || _c === void 0 ? void 0 : _c.tx_error) || "Transaction failed at the contract level.",
                        txHash: result.txid,
                    };
                }
                console.log(`Successfully solo stacked ${amount} STX`);
                return {
                    success: true,
                    txHash: result.txid,
                };
            }
            catch (error) {
                console.error(`Error solo stacking: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: `Failed to solo stack: ${(0, errorHandling_1.formatErrorMessage)(error)}`,
                };
            }
        };
        /**
         * Increases the stacked amount of an existing solo stacking position.
         * @param signerKey - The signer's compressed public key (hex).
         * @param signerSig65Hex - 65-byte signer signature (hex).
         * @param increaseBy - Amount of STX to add to the existing stack (number). Converted to microSTX internally.
         * @param maxAmount - New maximum authorized STX amount after increase (number). Converted to microSTX internally.
         * @param authId - Authorization ID for the transaction (bigint).
         * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
         * @returns A response indicating success or failure of the transaction.
         */
        this.increaseStackedAmount = async (signerKey, signerSig65Hex, increaseBy, maxAmount, authId, nonce) => {
            var _b, _c;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error("Address, Public Key or Vault ID are not set");
                }
                console.log(`Increasing stacked amount by ${increaseBy} STX`);
                const result = await this.buildSignSendContractCall({
                    functionName: "increase-stack-amount",
                    amount: (0, helpers_1.stxToMicro)(increaseBy),
                    maxAmount: (0, helpers_1.stxToMicro)(maxAmount),
                    signerKey,
                    signerSig65Hex,
                    authId,
                    nonce,
                });
                const assertResult = (0, helpers_1.assertResultSuccess)(result);
                if (assertResult.success === false) {
                    return {
                        success: false,
                        error: `Failed to increase stacked amount: ${assertResult.error}`,
                    };
                }
                const txStatus = await this.waitForTxSettlement(result.txid);
                if (txStatus.success && ((_b = txStatus.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== "success") {
                    return {
                        success: false,
                        error: ((_c = txStatus.data) === null || _c === void 0 ? void 0 : _c.tx_error) || "Transaction failed at the contract level.",
                        txHash: result.txid,
                    };
                }
                console.log(`Successfully increased stacked amount by ${increaseBy} STX`);
                return {
                    success: true,
                    txHash: result.txid,
                };
            }
            catch (error) {
                console.error(`Error increasing stacked amount: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: `Failed to increase stacked amount: ${(0, errorHandling_1.formatErrorMessage)(error)}`,
                };
            }
        };
        /**
        * Extends the stacking period of an existing solo stacking position.
        * @param signerKey - The signer's compressed public key (hex).
        * @param signerSig65Hex - 65-byte signer signature (hex).
        * @param increaseBy - Number of additional cycles to extend the stacking period.
        * @param maxAmount - Maximum authorized STX amount for the extension (number). Converted to microSTX internally.
        * @param authId - Authorization ID for the transaction (bigint).
        * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
        * @returns A response indicating success or failure of the transaction.
        */
        this.extendStackingPeriod = async (signerKey, signerSig65Hex, extendCycles, maxAmount, authId, nonce) => {
            var _b, _c;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error("Address, Public Key or Vault ID are not set");
                }
                console.log(`Extending stacking period by ${extendCycles} cycles`);
                const result = await this.buildSignSendContractCall({
                    functionName: "extend-stack-period",
                    maxAmount: (0, helpers_1.stxToMicro)(maxAmount),
                    extendCycles,
                    signerKey,
                    signerSig65Hex,
                    authId,
                    nonce,
                });
                const assertResult = (0, helpers_1.assertResultSuccess)(result);
                if (assertResult.success === false) {
                    return {
                        success: false,
                        error: `Failed to extend stacking period: ${assertResult.error}`,
                    };
                }
                const txStatus = await this.waitForTxSettlement(result.txid);
                if (txStatus.success && ((_b = txStatus.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== "success") {
                    return {
                        success: false,
                        error: ((_c = txStatus.data) === null || _c === void 0 ? void 0 : _c.tx_error) || "Transaction failed at the contract level.",
                        txHash: result.txid,
                    };
                }
                console.log(`Successfully extended stacking period by ${extendCycles} cycles`);
                return {
                    success: true,
                    txHash: result.txid,
                };
            }
            catch (error) {
                console.error(`Error extending stacking period: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: `Failed to extend stacking period: ${(0, errorHandling_1.formatErrorMessage)(error)}`,
                };
            }
        };
        /**
         * Replaces a pending STX transaction with a new one using the same nonce but a higher fee.
         * Supports both native STX token_transfer and contract_call transactions.
         * @param originalTxId - The transaction ID of the transaction to replace.
         * @param newFee - The new fee in STX. Must be at least RBF_MIN_FEE_MULTIPLIER × the original.
         * @param newRecipient - For token_transfer only: optional new recipient. Defaults to original.
         * @param newAmount - For token_transfer only: optional new amount in STX. Defaults to original.
         * @param nonceOverride - Optional nonce override (bigint). Bypasses the Hiro indexer lookup
         *   and skips ownership validation of the original transaction. Use only when you are certain
         *   of the nonce value and the original tx is not visible in the explorer. When set,
         *   newRecipient and newAmount are required (only STX transfers supported on this path).
         * @returns A promise that resolves to a {CreateTransactionResponse}.
         */
        this.replaceTransaction = async (originalTxId, newFee, newRecipient, newAmount, nonceOverride) => {
            if (!this.address || !this.publicKey || !this.vaultAccountId) {
                throw new Error("Address, Public Key or Vault ID are not set");
            }
            try {
                const feeBigInt = (0, helpers_1.stxToMicro)(newFee);
                if (nonceOverride !== undefined) {
                    // ── Override path: nonce is known, tx may not be visible to the indexer ──
                    // Only STX transfers are supported here — no original tx to reconstruct args from.
                    if (!newRecipient || newAmount === undefined) {
                        return {
                            success: false,
                            error: "newRecipient and newAmount are required when nonceOverride is provided",
                        };
                    }
                    if (!(0, helpers_1.validateAddress)(newRecipient, this.testnet)) {
                        return { success: false, error: "Invalid recipient address" };
                    }
                    const nonce = nonceOverride;
                    const amountUstx = (0, helpers_1.stxToMicro)(newAmount);
                    const balance = await this.getBalance();
                    if (balance.success) {
                        const totalRequired = (0, helpers_1.microToStx)(amountUstx + feeBigInt);
                        if (balance.balance !== undefined && totalRequired > balance.balance) {
                            return {
                                success: false,
                                error: `Insufficient balance. Required: ${totalRequired} STX, Available: ${balance.balance} STX`,
                            };
                        }
                    }
                    const transactionToSign = await this.chainService.serializeTransaction(this.address, this.publicKey, newRecipient, amountUstx, types_1.TransactionType.STX, undefined, undefined, undefined, undefined, nonce, feeBigInt);
                    const rawSignature = await this.fireblocksService.signTransaction(transactionToSign.preSignSigHash, this.vaultAccountId.toString());
                    const signature = (0, helpers_1.concatSignature)(rawSignature.fullSig, rawSignature.v);
                    transactionToSign.unsignedTx.auth.spendingCondition.signature =
                        (0, transactions_1.createMessageSignature)(signature);
                    const result = await this.chainService.broadcastTransaction(transactionToSign.unsignedTx);
                    if (!result || result.error || !result.txid || result.reason) {
                        const msg = (result === null || result === void 0 ? void 0 : result.error) && (result === null || result === void 0 ? void 0 : result.reason)
                            ? `${result.error} - ${result.reason}`
                            : (result === null || result === void 0 ? void 0 : result.error) || (result === null || result === void 0 ? void 0 : result.reason) || "unknown error";
                        return { success: false, error: (0, errorHandling_1.formatErrorMessage)(msg) };
                    }
                    console.log(`Replaced transaction ${originalTxId} with ${result.txid}`);
                    return { success: true, txHash: result.txid };
                }
                // ── Lookup path: reconstruct any pending tx type with higher fee ──────────
                const originalTxResponse = await this.getTxStatusById(originalTxId);
                if (!originalTxResponse.success || !originalTxResponse.data) {
                    return { success: false, error: "Could not fetch original transaction details" };
                }
                if (originalTxResponse.data.tx_status !== "pending") {
                    return {
                        success: false,
                        error: `Can only replace pending transactions. Current status: ${originalTxResponse.data.tx_status}`,
                    };
                }
                const fullTx = originalTxResponse.data.full_tx_details;
                if ((fullTx === null || fullTx === void 0 ? void 0 : fullTx.tx_type) !== "token_transfer" && (fullTx === null || fullTx === void 0 ? void 0 : fullTx.tx_type) !== "contract_call") {
                    return {
                        success: false,
                        error: `Cannot replace tx of type "${fullTx === null || fullTx === void 0 ? void 0 : fullTx.tx_type}". Only token_transfer and contract_call are supported.`,
                    };
                }
                if (fullTx.sender_address !== this.address) {
                    return {
                        success: false,
                        error: "Transaction sender does not match this vault account address",
                    };
                }
                // Fee check: new fee must be at least RBF_MIN_FEE_MULTIPLIER × original
                const originalFeeUstx = BigInt(fullTx.fee_rate);
                const minFeeUstx = (originalFeeUstx * BigInt(Math.round(constants_1.RBF_MIN_FEE_MULTIPLIER * 100))) / BigInt(100);
                if (feeBigInt < minFeeUstx) {
                    return {
                        success: false,
                        error: `New fee (${newFee} STX) must be at least ${constants_1.RBF_MIN_FEE_MULTIPLIER}x the original fee (${(0, helpers_1.microToStx)(originalFeeUstx)} STX). Minimum required: ${(0, helpers_1.microToStx)(minFeeUstx)} STX`,
                    };
                }
                const nonce = BigInt(fullTx.nonce);
                let unsignedTxWire;
                let preSignSigHash;
                if (fullTx.tx_type === "token_transfer") {
                    const recipient = newRecipient !== null && newRecipient !== void 0 ? newRecipient : fullTx.token_transfer.recipient_address;
                    const amountUstx = newAmount !== undefined
                        ? (0, helpers_1.stxToMicro)(newAmount)
                        : BigInt(fullTx.token_transfer.amount);
                    if (!(0, helpers_1.validateAddress)(recipient, this.testnet)) {
                        return { success: false, error: "Invalid recipient address" };
                    }
                    const balanceCheck = await this.getBalance();
                    if (balanceCheck.success) {
                        const totalRequired = (0, helpers_1.microToStx)(amountUstx + feeBigInt);
                        if (balanceCheck.balance !== undefined && totalRequired > balanceCheck.balance) {
                            return {
                                success: false,
                                error: `Insufficient balance. Required: ${totalRequired} STX, Available: ${balanceCheck.balance} STX`,
                            };
                        }
                    }
                    const serialized = await this.chainService.serializeTransaction(this.address, this.publicKey, recipient, amountUstx, types_1.TransactionType.STX, undefined, undefined, undefined, undefined, nonce, feeBigInt);
                    unsignedTxWire = serialized.unsignedTx;
                    preSignSigHash = serialized.preSignSigHash;
                }
                else {
                    // contract_call — reconstruct with identical args, same nonce, higher fee
                    const [contractAddress, contractName] = fullTx.contract_call.contract_id.split(".");
                    const functionName = fullTx.contract_call.function_name;
                    const functionArgs = fullTx.contract_call.function_args.map((arg) => (0, transactions_1.hexToCV)(arg.hex));
                    const balanceCheck = await this.getBalance();
                    if (balanceCheck.success) {
                        const feeStx = (0, helpers_1.microToStx)(feeBigInt);
                        if (balanceCheck.balance !== undefined && feeStx > balanceCheck.balance) {
                            return {
                                success: false,
                                error: `Insufficient balance for fee. Required: ${feeStx} STX, Available: ${balanceCheck.balance} STX`,
                            };
                        }
                    }
                    const serialized = await this.chainService.serializeContractCall(this.publicKey, contractAddress, contractName, functionName, functionArgs, nonce, feeBigInt);
                    unsignedTxWire = serialized.unsignedContractCall;
                    preSignSigHash = serialized.preSignSigHash;
                }
                const rawSignature = await this.fireblocksService.signTransaction(preSignSigHash, this.vaultAccountId.toString());
                const signature = (0, helpers_1.concatSignature)(rawSignature.fullSig, rawSignature.v);
                unsignedTxWire.auth.spendingCondition.signature = (0, transactions_1.createMessageSignature)(signature);
                const result = await this.chainService.broadcastTransaction(unsignedTxWire);
                if (!result || result.error || !result.txid || result.reason) {
                    const errorAndReason = (result === null || result === void 0 ? void 0 : result.error) && (result === null || result === void 0 ? void 0 : result.reason)
                        ? `${result.error} - ${result.reason}`
                        : (result === null || result === void 0 ? void 0 : result.error) || (result === null || result === void 0 ? void 0 : result.reason) || "unknown error";
                    return { success: false, error: (0, errorHandling_1.formatErrorMessage)(errorAndReason) };
                }
                console.log(`Replaced transaction ${originalTxId} with ${result.txid}`);
                return { success: true, txHash: result.txid };
            }
            catch (error) {
                console.error(`Error replacing transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: `Failed to replace transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`,
                };
            }
        };
        /**
        * fetches current pox info from blockchain.
        * @returns the pox info response.
        * @throws {Error} If fetching pox info fails.
        */
        this.getPoxInfo = async () => {
            try {
                const poxResponse = await this.chainService.fetchPoxInfo();
                if (!poxResponse || !poxResponse.data) {
                    return {
                        success: false,
                        error: `Failed to fetch POX info: empty response`,
                    };
                }
                return {
                    success: true,
                    data: poxResponse.data,
                };
            }
            catch (error) {
                console.error(`Error fetching POX info: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: `Failed to fetch POX info: ${(0, errorHandling_1.formatErrorMessage)(error)}`,
                };
            }
        };
        /**
         * Makes a generic contract call to a given contract address and name with specified function and arguments.
         * @param contractAddress - The address of the contract to call.
         * @param contractName - The name of the contract to call.
         * @param functionName - The name of the function to call on the contract.
         * @param functionArgs - The arguments to pass to the contract function - must be an array of ClarityValue objects in the same order and types as the function parameters.
         * @param postConditions - Optional post conditions for the transaction.
         * @param postConditionMode - Optional post condition mode.
         * @returns A response indicating success or failure of the transaction.
         */
        this.makeContractCall = async (contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode) => {
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error("Address, Public Key or Vault ID are not set");
                }
                console.log(`Making contract call to ${contractAddress}.${contractName} function ${functionName} with ${functionArgs.length} arg(s)`);
                const result = await this.buildSignSendContractCall({
                    functionName: "generic-contract-call",
                    contractCallParams: { contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode },
                });
                const assertResult = (0, helpers_1.assertResultSuccess)(result);
                if (assertResult.success === false) {
                    return {
                        success: false,
                        error: `Failed to make contract call: ${assertResult.error}`,
                    };
                }
                console.log(`Successfully made contract call to ${contractAddress}.${contractName} function ${functionName}`);
                return {
                    success: true,
                    txHash: result.txid,
                    transaction: result.transaction,
                };
            }
            catch (error) {
                console.error(`Error making contract call: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
                return {
                    success: false,
                    error: `Failed to make contract call to ${contractAddress}.${contractName} function ${functionName}: ${(0, errorHandling_1.formatErrorMessage)(error)}`,
                };
            }
        };
        /**
         * Signs an externally built transaction and returns the signed transaction hex.
         * The caller is responsible for broadcasting the signed transaction.
         */
        this.signExternalTransaction = async (txHex) => {
            try {
                if (!this.publicKey || !this.vaultAccountId) {
                    throw new Error("Public key or vault ID are not set");
                }
                const txBytes = Buffer.from(txHex, 'hex');
                const tx = (0, transactions_1.deserializeTransaction)(txBytes);
                const sigHash = tx.signBegin();
                const preSignSigHash = (0, transactions_1.sigHashPreSign)(sigHash, tx.auth.authType, tx.auth.spendingCondition.fee, tx.auth.spendingCondition.nonce);
                const rawSignature = await this.fireblocksService.signTransaction(preSignSigHash, this.vaultAccountId.toString(), '');
                const signature = (0, helpers_1.concatSignature)(rawSignature.fullSig, rawSignature.v);
                tx.auth.spendingCondition.signature = (0, transactions_1.createMessageSignature)(signature);
                const signedTxHex = (0, transactions_1.serializeTransaction)(tx);
                return { success: true, txHex: signedTxHex };
            }
            catch (error) {
                return { success: false, error: (0, errorHandling_1.formatErrorMessage)(error) };
            }
        };
        /**
         * Signs a plain text message and returns the signature.
         */
        this.signMessage = async (message) => {
            try {
                if (!this.vaultAccountId) {
                    throw new Error("Vault ID is not set");
                }
                const crypto = require('crypto');
                const prefix = '\x17Stacks Signed Message:\n';
                const hash = crypto.createHash('sha256').update(Buffer.from(prefix + message)).digest('hex');
                const rawSignature = await this.fireblocksService.signTransaction(hash, this.vaultAccountId.toString(), '');
                const signature = (0, helpers_1.concatSignature)(rawSignature.fullSig, rawSignature.v);
                return { success: true, signature };
            }
            catch (error) {
                return { success: false, error: (0, errorHandling_1.formatErrorMessage)(error) };
            }
        };
        /**
         * Signs a SIP-018 structured message and returns the signature.
         * message and domain are hex-encoded serialized ClarityValues.
         */
        this.signStructuredMessage = async (message, domain) => {
            try {
                if (!this.vaultAccountId) {
                    throw new Error("Vault ID is not set");
                }
                const { deserializeCV } = require('@stacks/transactions');
                const { sha256 } = require('@noble/hashes/sha256');
                const messageCV = deserializeCV(Buffer.from(message, 'hex'));
                const domainCV = deserializeCV(Buffer.from(domain, 'hex'));
                const encoded = (0, transactions_1.encodeStructuredDataBytes)({ message: messageCV, domain: domainCV });
                const hash = Buffer.from(sha256(encoded)).toString('hex');
                const rawSignature = await this.fireblocksService.signTransaction(hash, this.vaultAccountId.toString(), '');
                const signature = (0, helpers_1.concatSignature)(rawSignature.fullSig, rawSignature.v);
                return { success: true, signature };
            }
            catch (error) {
                return { success: false, error: (0, errorHandling_1.formatErrorMessage)(error) };
            }
        };
        /**
         * Fetches contract call transactions for the current account, excluding STX and FT transfers.
         * @param limit - The maximum number of transactions to return (default is 50).
         * @param offset - The offset for pagination (default is 0).
         * @returns A promise that resolves to a {GetContractCallHistoryResponse}.
         * @throws {Error} If the address is not set or if the request fails.
         */
        this.getContractCallHistory = async (limit = constants_1.pagination_defaults.limit, offset = constants_1.pagination_defaults.page) => {
            if (!this.address) {
                throw new Error("Stacks address is not set.");
            }
            try {
                const txs = await this.chainService.getContractCallHistory(this.address, limit, offset);
                return { success: true, data: txs };
            }
            catch (error) {
                return {
                    success: false,
                    error: (0, errorHandling_1.formatErrorMessage)(error),
                };
            }
        };
        try {
            // Validate Fireblocks API credentials before initializing services
            if (fireblocksConfig) {
                (0, fireblocks_utils_1.validateApiCredentials)(fireblocksConfig.apiKey, (_b = fireblocksConfig.apiSecret) !== null && _b !== void 0 ? _b : "", vaultAccountId);
            }
            this.fireblocksService = new fireblocks_service_1.FireblocksService(fireblocksConfig);
            this.testnet = (fireblocksConfig === null || fireblocksConfig === void 0 ? void 0 : fireblocksConfig.testnet) || false;
            this.chainService = new stacks_service_1.StacksService(this.testnet, hiroApiKey);
        }
        catch (error) {
            throw new Error(`Failed to initialize services: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
        }
        if (typeof vaultAccountId === "string") {
            // Trim spaces and ensure only digit characters remain
            this.vaultAccountId =
                vaultAccountId
                    .trim()
                    .replace(/^\s+|\s+$/g, "")
                    .replace(/\D/g, "") || vaultAccountId.trim();
        }
        else {
            this.vaultAccountId = vaultAccountId;
        }
    }
}
exports.StacksSDK = StacksSDK;
_a = StacksSDK;
/**
 * Creates an instance of StacksSDK.
 * @param vaultAccountId - The Fireblocks vault account ID.
 * @param fireblocksConfig - Optional Fireblocks configuration.
 * @returns A Promise that resolves to an instance of StacksSDK.
 * @throws Will throw an error if the instance creation fails.
 */
StacksSDK.create = async (vaultAccountId, fireblocksConfig, hiroApiKey) => {
    try {
        const instance = new _a(vaultAccountId, fireblocksConfig, hiroApiKey);
        instance.publicKey =
            await instance.fireblocksService.getPublicKeyByVaultID(vaultAccountId);
        instance.address = instance.chainService.formatAddress(instance.publicKey);
        instance.btcRewardsAddress =
            await instance.fireblocksService.getBtcSegwitAddressForVaultID(vaultAccountId);
        return instance;
    }
    catch (error) {
        throw new Error(`Failed to create StacksSDK instance: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
    }
};
