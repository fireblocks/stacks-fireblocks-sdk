"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const network_1 = require("@stacks/network");
const fireblocks_service_1 = require("./services/fireblocks.service");
const types_1 = require("./services/types");
const constants_1 = require("./utils/constants");
const unlock_bytes_store_1 = require("./staking/bonds/unlock-bytes-store");
const validation_1 = require("./utils/validation");
const errorHandling_1 = require("./utils/errorHandling");
const fireblocks_utils_1 = require("./utils/fireblocks.utils");
const helpers_1 = require("./utils/helpers");
const transactions_1 = require("@stacks/transactions");
const bitcoin_staking_1 = require("@stacks/bitcoin-staking");
const btc = __importStar(require("@scure/btc-signer"));
const sha2_1 = require("@noble/hashes/sha2");
const secp256k1_1 = require("@noble/secp256k1");
const common_1 = require("@stacks/common");
const BOND_LENGTH_CYCLES = 12; // fixed per PoX-5 spec; not in .d.ts but confirmed in dist/constants.js
class StacksSDK {
    constructor(vaultAccountId, fireblocksConfig, hiroApiKey) {
        var _b;
        this.cachedTransactions = [];
        this.testnet = false;
        this.unlockBytesStore = new unlock_bytes_store_1.InMemoryUnlockBytesStore();
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
         * Returns the P2WPKH address for the vault's public key on the active Bitcoin network.
         * On testnet this is a bcrt1… regtest address (for use as unlock destination on private-1).
         * On mainnet this is a bc1… address.
         */
        this.getBtcVaultAddress = () => {
            if (!this.publicKey)
                return '';
            const pub = (0, common_1.hexToBytes)(this.publicKey);
            return btc.p2wpkh(pub, this.btcNetwork).address;
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
        limit = constants_1.pagination_defaults.limit, offset = constants_1.pagination_defaults.page, fetchAll = false, fetchPending = false) => {
            if (getCachedTransactions) {
                console.log("Using cached transactions");
                return { success: true, data: this.cachedTransactions };
            }
            if (!this.address) {
                console.log("StacksSDK.getTransactionsHistory() error: address is not set.");
                throw new Error("Stacks address is not set.");
            }
            try {
                const pageSize = constants_1.helperConstants.stacks_api_page_size;
                const fetchPages = async (fetcher) => {
                    const all = [];
                    let currentOffset = offset;
                    while (true) {
                        const page = await fetcher(currentOffset);
                        all.push(...page);
                        if (page.length < pageSize)
                            break;
                        if (!fetchAll && all.length >= limit)
                            break;
                        currentOffset += pageSize;
                    }
                    return fetchAll ? all : all.slice(0, limit);
                };
                const confirmedTxs = await fetchPages((o) => this.chainService.getTransactionHistory(this.address, pageSize, o));
                const pendingTxs = fetchPending
                    ? await fetchPages((o) => this.chainService.getMempoolTransactions(this.address, pageSize, o))
                    : [];
                const txs = [...pendingTxs, ...confirmedTxs];
                const existingHashes = new Set(this.cachedTransactions.map((tx) => tx.transaction_hash));
                const newConfirmed = confirmedTxs.filter((tx) => !existingHashes.has(tx.transaction_hash));
                this.cachedTransactions = [...this.cachedTransactions, ...newConfirmed];
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
        this.estimateFee = async (recipientAddress, amount, type = types_1.TransactionType.STX, token, customTokenContractAddress, customTokenContractName) => {
            var _b, _c;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error('Address, Public Key or Vault ID are not set');
                }
                const microAmount = type === types_1.TransactionType.FungibleToken
                    ? (0, helpers_1.stxToMicro)(amount)
                    : (0, helpers_1.stxToMicro)(amount);
                let microfee = 0;
                if (type === types_1.TransactionType.STX) {
                    microfee = await this.chainService.estimateTxFee(recipientAddress, microAmount);
                }
                else if (type === types_1.TransactionType.FungibleToken) {
                    const tokenInfo = token !== types_1.TokenType.CUSTOM
                        ? (0, helpers_1.getTokenInfo)(token, this.testnet ? 'testnet' : 'mainnet')
                        : undefined;
                    const ftContractAddress = (_b = tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.contractAddress) !== null && _b !== void 0 ? _b : customTokenContractAddress;
                    const ftContractName = (_c = tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.contractName) !== null && _c !== void 0 ? _c : customTokenContractName;
                    const functionArgs = [(0, transactions_1.uintCV)(microAmount), (0, transactions_1.principalCV)(this.address), (0, transactions_1.principalCV)(recipientAddress), (0, transactions_1.noneCV)()];
                    microfee = await this.chainService.estimateContractCallFee(ftContractAddress, ftContractName, 'transfer', functionArgs);
                }
                return { success: true, fee: (0, helpers_1.microToStx)(microfee), microfee };
            }
            catch (error) {
                return { success: false, error: (0, errorHandling_1.formatErrorMessage)(error) };
            }
        };
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
            const nonceInfo = await this.chainService.getAccountNonce(this.address);
            if (nonce !== undefined) {
                if (nonce < nonceInfo.confirmedNonce) {
                    throw new validation_1.ValidationError(`Nonce ${nonce} is below the confirmed nonce (${nonceInfo.confirmedNonce}). This transaction would be rejected.`);
                }
                return nonce;
            }
            return nonceInfo.nextAvailable;
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
        this.buildSignSendTransfer = async (recipientAddress, microAmount, type = types_1.TransactionType.STX, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, note, nonce, feeUstx, memo, externalId) => {
            var _b;
            try {
                const resolvedNonce = await this.resolveNonce(nonce);
                const transactionToSign = await this.chainService.serializeTransaction(this.address, this.publicKey, recipientAddress, microAmount, type, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, resolvedNonce, feeUstx, memo);
                const defaultNote = type === types_1.TransactionType.FungibleToken
                    ? `Transferring ${(0, helpers_1.microToStx)(microAmount)} ${(_b = customTokenContractName !== null && customTokenContractName !== void 0 ? customTokenContractName : token) !== null && _b !== void 0 ? _b : "token"} to ${recipientAddress}`
                    : `Transferring ${(0, helpers_1.microToStx)(microAmount)} STX to ${recipientAddress}`;
                const rawSignature = await this.fireblocksService.signTransaction(transactionToSign.preSignSigHash, this.vaultAccountId.toString(), note || defaultNote, externalId);
                const signature = (0, helpers_1.concatSignature)(rawSignature.fullSig, rawSignature.v);
                transactionToSign.unsignedTx.auth.spendingCondition.signature =
                    (0, transactions_1.createMessageSignature)(signature);
                const result = await this.chainService.broadcastTransaction(transactionToSign.unsignedTx);
                return result;
            }
            catch (error) {
                if (error instanceof validation_1.ValidationError)
                    return { success: false, error: error.message };
                throw new Error(`Failed to build, sign or send transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        this.buildSignSendContractCall = async (options) => {
            const { functionName, poolAddress, poolContractName, amount, maxAmount, lockPeriod, extendCycles, signerKey, signerSig65Hex, startBurnHeight, authId, contractCallParams, note, nonce, externalId, } = options;
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
                        transactionToSign = await this.chainService.delegateStx(this.publicKey, poolAddress, amount, lockPeriod, resolvedNonce, poolContractName);
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
                const defaultNote = poolAddress && poolContractName
                    ? `Calling ${functionName} on ${poolAddress}.${poolContractName}`
                    : `Calling ${functionName}`;
                const rawSignature = await this.fireblocksService.signTransaction(transactionToSign.preSignSigHash, this.vaultAccountId.toString(), note || defaultNote, externalId);
                const signature = (0, helpers_1.concatSignature)(rawSignature.fullSig, rawSignature.v);
                transactionToSign.unsignedContractCall.auth.spendingCondition.signature =
                    (0, transactions_1.createMessageSignature)(signature);
                const transaction = (0, transactions_1.serializeTransaction)(transactionToSign.unsignedContractCall);
                const result = await this.chainService.broadcastTransaction(transactionToSign.unsignedContractCall);
                return Object.assign(Object.assign({}, result), { transaction });
            }
            catch (error) {
                if (error instanceof validation_1.ValidationError)
                    return { success: false, error: error.message };
                throw new Error(`Failed to build, sign or send contract call transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        this.pox5SignAndBroadcast = async (tx, note, externalId) => {
            const sigHash = tx.signBegin();
            const preSignSigHash = (0, transactions_1.sigHashPreSign)(sigHash, tx.auth.authType, tx.auth.spendingCondition.fee, tx.auth.spendingCondition.nonce);
            const rawSignature = await this.fireblocksService.signTransaction(preSignSigHash, this.vaultAccountId.toString(), note, externalId);
            const signature = (0, helpers_1.concatSignature)(rawSignature.fullSig, rawSignature.v);
            tx.auth.spendingCondition.signature = (0, transactions_1.createMessageSignature)(signature);
            return this.chainService.broadcastTransaction(tx, this.pox5Network);
        };
        // ─── PoX-5 Solo STX ──────────────────────────────────────────────────────────
        /**
         * Stakes STX through a signer-manager (PoX-5). Replaces pox-4 stackSolo.
         * @param amountStx - Amount of STX to stake (number). Converted to microSTX internally.
         * @param numCycles - Number of cycles to lock (1–96).
         * @param signerManager - The signer-manager contract principal (must have an on-chain grant).
         * @param note - Optional Fireblocks transaction note.
         * @param nonce - Optional nonce override.
         * @param externalId - Optional Fireblocks external ID for idempotency.
         */
        this.stake = async (amountStx, numCycles, signerManager, note, nonce, externalId) => {
            var _b, _c;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error("Address, Public Key or Vault ID are not set");
                }
                const resolvedNonce = await this.resolveNonce(nonce);
                const pox = await (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network });
                const eligibilityCheck = await this.checkEligibility(pox, amountStx);
                if (!eligibilityCheck.eligible) {
                    return { success: false, error: `Account not eligible for staking: ${eligibilityCheck.reason}` };
                }
                const tx = await (0, bitcoin_staking_1.buildStake)({
                    signerManager,
                    amountUstx: (0, helpers_1.stxToMicro)(amountStx),
                    numCycles,
                    startBurnHt: pox.currentBurnchainBlockHeight,
                    publicKey: this.publicKey,
                    fee: BigInt(10000),
                    nonce: resolvedNonce,
                    network: this.pox5Network,
                    postConditionMode: 'allow',
                });
                const result = await this.pox5SignAndBroadcast(tx, note || `stake ${amountStx} STX for ${numCycles} cycles`, externalId);
                if (!result || result.error || !result.txid || result.reason) {
                    return { success: false, error: (result === null || result === void 0 ? void 0 : result.error) || (result === null || result === void 0 ? void 0 : result.reason) || "Failed to broadcast stake transaction" };
                }
                const txStatus = await this.waitForTxSettlement(result.txid);
                if (!txStatus.success || ((_b = txStatus.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== "success") {
                    return {
                        success: false,
                        error: txStatus.error || ((_c = txStatus.data) === null || _c === void 0 ? void 0 : _c.tx_error) || "Stake transaction failed at the contract level.",
                        txHash: result.txid,
                    };
                }
                return { success: true, txHash: result.txid };
            }
            catch (error) {
                return { success: false, error: `Failed to stake: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Updates an existing PoX-5 staking position — extend cycles, increase amount, or rotate
         * signer-manager. All fields are optional; omit any to leave that dimension unchanged.
         * @param signerManager - Rotate to a new signer-manager principal, or omit to keep current.
         * @param cyclesToExtend - Additional cycles to add (0 = no extension).
         * @param increaseByStx - Additional STX to add (0 = no increase). Converted to microSTX internally.
         * @param note - Optional Fireblocks transaction note.
         * @param nonce - Optional nonce override.
         * @param externalId - Optional Fireblocks external ID for idempotency.
         */
        this.updateStake = async (signerManager, oldSignerManager, cyclesToExtend, increaseByStx, note, nonce, externalId) => {
            var _b, _c;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error("Address, Public Key or Vault ID are not set");
                }
                const resolvedNonce = await this.resolveNonce(nonce);
                const tx = await (0, bitcoin_staking_1.buildStakeUpdate)({
                    signerManager,
                    oldSignerManager,
                    cyclesToExtend: cyclesToExtend !== null && cyclesToExtend !== void 0 ? cyclesToExtend : 0,
                    amountIncrease: increaseByStx ? (0, helpers_1.stxToMicro)(increaseByStx) : BigInt(0),
                    publicKey: this.publicKey,
                    fee: BigInt(10000),
                    nonce: resolvedNonce,
                    network: this.pox5Network,
                    postConditionMode: 'allow',
                });
                const result = await this.pox5SignAndBroadcast(tx, note || "update stake position", externalId);
                if (!result || result.error || !result.txid || result.reason) {
                    return { success: false, error: (result === null || result === void 0 ? void 0 : result.error) || (result === null || result === void 0 ? void 0 : result.reason) || "Failed to broadcast update-stake transaction" };
                }
                const txStatus = await this.waitForTxSettlement(result.txid);
                if (!txStatus.success || ((_b = txStatus.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== "success") {
                    return {
                        success: false,
                        error: txStatus.error || ((_c = txStatus.data) === null || _c === void 0 ? void 0 : _c.tx_error) || "Update-stake transaction failed at the contract level.",
                        txHash: result.txid,
                    };
                }
                return { success: true, txHash: result.txid };
            }
            catch (error) {
                return { success: false, error: `Failed to update stake: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Unlocks a PoX-5 staking position early (sets unlock to end of current cycle).
         * Reverts if called during the prepare phase — the SDK checks this before submitting.
         * @param note - Optional Fireblocks transaction note.
         * @param nonce - Optional nonce override.
         * @param externalId - Optional Fireblocks external ID for idempotency.
         */
        this.unstake = async (oldSignerManager, note, nonce, externalId) => {
            var _b, _c;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error("Address, Public Key or Vault ID are not set");
                }
                const pox = await (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network });
                if ((0, bitcoin_staking_1.isInPreparePhase)({ burnHeight: pox.currentBurnchainBlockHeight, poxInfo: pox })) {
                    return { success: false, error: "Cannot unstake during the prepare phase — wait for the reward phase to begin." };
                }
                const resolvedNonce = await this.resolveNonce(nonce);
                const tx = await (0, bitcoin_staking_1.buildUnstake)({
                    oldSignerManager,
                    publicKey: this.publicKey,
                    fee: BigInt(10000),
                    nonce: resolvedNonce,
                    network: this.pox5Network,
                    postConditionMode: 'allow',
                });
                const result = await this.pox5SignAndBroadcast(tx, note || "unstake STX", externalId);
                if (!result || result.error || !result.txid || result.reason) {
                    return { success: false, error: (result === null || result === void 0 ? void 0 : result.error) || (result === null || result === void 0 ? void 0 : result.reason) || "Failed to broadcast unstake transaction" };
                }
                const txStatus = await this.waitForTxSettlement(result.txid);
                if (!txStatus.success || ((_b = txStatus.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== "success") {
                    return {
                        success: false,
                        error: txStatus.error || ((_c = txStatus.data) === null || _c === void 0 ? void 0 : _c.tx_error) || "Unstake transaction failed at the contract level.",
                        txHash: result.txid,
                    };
                }
                return { success: true, txHash: result.txid };
            }
            catch (error) {
                return { success: false, error: `Failed to unstake: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Registers the vault's signer key with a signer-manager contract (PoX-5).
         * Calls the signer-manager's `register-self`, which performs BOTH legs atomically:
         *   1. pox-5.grant-signer-key (signer-sig over the signer-manager contract + authId)
         *   2. pox-5.register-signer
         * Must be called once before any stake() calls through that signer-manager.
         *
         * IMPORTANT: `register-self` is admin-gated (authorize-admin). The vault address
         * MUST be an admin on the signer-manager contract, or this reverts with
         * ERR_UNAUTHORIZED_ADMIN (u1002). Calling pox-5.grant-signer-key directly from an
         * EOA fails with ERR_UNAUTHORIZED_SIGNER_REGISTRATION (u26) — hence this path.
         *
         * The grant signature is generated internally via Fireblocks raw signing and is
         * computed over the signer-manager CONTRACT (current-contract), not the caller.
         *
         * @param signerManager - The signer-manager contract principal (ST….signer-manager).
         * @param authId - Monotonically increasing unique uint for replay protection. Never reuse.
         * @param note - Optional Fireblocks transaction note.
         * @param nonce - Optional nonce override.
         * @param externalId - Optional Fireblocks external ID for idempotency.
         */
        this.grantSignerKey = async (signerManager, authId, note, nonce, externalId) => {
            var _b, _c;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error("Address, Public Key or Vault ID are not set");
                }
                const [smAddress, smName] = signerManager.split(".");
                if (!smAddress || !smName) {
                    throw new Error(`Invalid signer-manager principal: ${signerManager}. Expected ST….contract-name`);
                }
                const resolvedNonce = await this.resolveNonce(nonce);
                // Signature is over the signer-manager contract (register-self grants for current-contract)
                const grantMsgHash = await (0, bitcoin_staking_1.fetchSignerGrantMessageHash)({
                    signerManager,
                    authId,
                    network: this.pox5Network,
                });
                const rawGrantSig = await this.fireblocksService.signTransaction(grantMsgHash, this.vaultAccountId.toString(), note || "sign grant signer key message", externalId);
                const signerSignature = (0, helpers_1.concatSignature)(rawGrantSig.fullSig, rawGrantSig.v);
                // Call <signerManager>.register-self instead of pox-5.grant-signer-key directly.
                // register-self args: (signer-manager <trait>) (signer-key (buff 33)) (auth-id uint) (signer-sig (buff 65))
                const tx = await (0, transactions_1.makeUnsignedContractCall)({
                    contractAddress: smAddress,
                    contractName: smName,
                    functionName: "register-self",
                    functionArgs: [
                        (0, transactions_1.contractPrincipalCV)(smAddress, smName), // signer-manager trait = the contract itself
                        (0, transactions_1.bufferCV)((0, common_1.hexToBytes)(this.publicKey)), // signer-key (buff 33)
                        (0, transactions_1.uintCV)(authId), // auth-id
                        (0, transactions_1.bufferCV)((0, common_1.hexToBytes)(signerSignature)), // signer-sig (buff 65)
                    ],
                    publicKey: this.publicKey,
                    fee: BigInt(10000),
                    nonce: resolvedNonce,
                    network: this.pox5Network,
                    postConditionMode: transactions_1.PostConditionMode.Deny,
                    postConditions: [],
                });
                const result = await this.pox5SignAndBroadcast(tx, note || "register signer (register-self)", externalId);
                if (!result || result.error || !result.txid || result.reason) {
                    return { success: false, error: (result === null || result === void 0 ? void 0 : result.error) || (result === null || result === void 0 ? void 0 : result.reason) || "Failed to broadcast register-self transaction" };
                }
                const txStatus = await this.waitForTxSettlement(result.txid);
                if (!txStatus.success || ((_b = txStatus.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== "success") {
                    return {
                        success: false,
                        error: txStatus.error || ((_c = txStatus.data) === null || _c === void 0 ? void 0 : _c.tx_error) || "register-self transaction failed at the contract level.",
                        txHash: result.txid,
                    };
                }
                return { success: true, txHash: result.txid };
            }
            catch (error) {
                return { success: false, error: `Failed to register signer key: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        // /**
        //  * Grants a one-time signer key authorization to a signer-manager (PoX-5).
        //  * Must be called once before any stake() calls through that signer-manager.
        //  * The vault's own public key is used as the signer key. The grant signature is
        //  * generated internally via Fireblocks raw signing — no external signature needed.
        //  * @param signerManager - The signer-manager contract principal to authorize.
        //  * @param authId - Monotonically increasing unique uint for replay protection. Never reuse.
        //  * @param note - Optional Fireblocks transaction note.
        //  * @param nonce - Optional nonce override.
        //  * @param externalId - Optional Fireblocks external ID for idempotency.
        //  */
        // public grantSignerKey = async (
        //   signerManager: string,
        //   authId: bigint,
        //   note?: string,
        //   nonce?: bigint,
        //   externalId?: string,
        // ): Promise<CreateTransactionResponse> => {
        //   try {
        //     if (!this.address || !this.publicKey || !this.vaultAccountId) {
        //       throw new Error("Address, Public Key or Vault ID are not set");
        //     }
        //     const resolvedNonce = await this.resolveNonce(nonce);
        //     const grantMsgHash = await fetchSignerGrantMessageHash({
        //       signerManager,
        //       authId,
        //       network: this.pox5Network,
        //     });
        //     const rawGrantSig = await this.fireblocksService.signTransaction(
        //       grantMsgHash, this.vaultAccountId.toString(), note || "sign grant signer key message", externalId,
        //     );
        //     const signerSignature = concatSignature(rawGrantSig.fullSig, rawGrantSig.v);
        //     const tx = await buildGrantSignerKey({
        //       signerKey: this.publicKey,
        //       signerManager,
        //       authId,
        //       signerSignature,
        //       publicKey: this.publicKey,
        //       fee: BigInt(10000),
        //       nonce: resolvedNonce,
        //       network: this.pox5Network,
        //     });
        //     const result = await this.pox5SignAndBroadcast(tx, note || "grant signer key", externalId);
        //     if (!result || result.error || !result.txid || result.reason) {
        //       return { success: false, error: result?.error || result?.reason || "Failed to broadcast grant-signer-key transaction" };
        //     }
        //     const txStatus = await this.waitForTxSettlement(result.txid);
        //     if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        //       return {
        //         success: false,
        //         error: txStatus.error || txStatus.data?.tx_error || "Grant signer key transaction failed at the contract level.",
        //         txHash: result.txid,
        //       };
        //     }
        //     return { success: true, txHash: result.txid };
        //   } catch (error) {
        //     return { success: false, error: `Failed to grant signer key: ${formatErrorMessage(error)}` };
        //   }
        // };
        /**
         * Revokes an existing signer key grant from a signer-manager (PoX-5).
         * @param signerManager - The signer-manager contract principal.
         * @param signerKey - 33-byte compressed secp256k1 public key (hex) to revoke.
         * @param note - Optional Fireblocks transaction note.
         * @param nonce - Optional nonce override.
         * @param externalId - Optional Fireblocks external ID for idempotency.
         */
        this.revokeSignerGrant = async (signerManager, signerKey, note, nonce, externalId) => {
            var _b, _c;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error("Address, Public Key or Vault ID are not set");
                }
                const resolvedNonce = await this.resolveNonce(nonce);
                const tx = await (0, bitcoin_staking_1.buildRevokeSignerGrant)({
                    signerManager,
                    signerKey,
                    publicKey: this.publicKey,
                    fee: BigInt(10000),
                    nonce: resolvedNonce,
                    network: this.pox5Network,
                    postConditionMode: 'allow',
                });
                const result = await this.pox5SignAndBroadcast(tx, note || "revoke signer grant", externalId);
                if (!result || result.error || !result.txid || result.reason) {
                    return { success: false, error: (result === null || result === void 0 ? void 0 : result.error) || (result === null || result === void 0 ? void 0 : result.reason) || "Failed to broadcast revoke-signer-grant transaction" };
                }
                const txStatus = await this.waitForTxSettlement(result.txid);
                if (!txStatus.success || ((_b = txStatus.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== "success") {
                    return {
                        success: false,
                        error: txStatus.error || ((_c = txStatus.data) === null || _c === void 0 ? void 0 : _c.tx_error) || "Revoke signer grant transaction failed at the contract level.",
                        txHash: result.txid,
                    };
                }
                return { success: true, txHash: result.txid };
            }
            catch (error) {
                return { success: false, error: `Failed to revoke signer grant: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Fetches the current PoX-5 staking position for this vault account.
         */
        this.getStakerInfo = async () => {
            try {
                if (!this.address) {
                    throw new Error("Address is not set");
                }
                const info = await (0, bitcoin_staking_1.fetchStakerInfo)({ address: this.address, network: this.pox5Network });
                console.log("Fetched staker info:", info);
                if (!info.staked) {
                    return { success: true, staked: false };
                }
                return {
                    success: true,
                    staked: true,
                    details: {
                        amount_stx: (0, helpers_1.microToStx)(info.details.amountUstx),
                        firstRewardCycle: info.details.firstRewardCycle,
                        numCycles: info.details.numCycles,
                        signerManager: info.details.signer,
                    },
                };
            }
            catch (error) {
                return { success: false, error: `Failed to fetch staker info: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Verifies the full signer-key grant state for a (signerManager, signerKey) pair.
         *
         * Two distinct checks are performed:
         * 1. grant_exists  — the on-chain grant exists and has NOT been consumed yet
         *                    (fetchVerifySignerKeyGrant). A consumed or missing grant → false.
         * 2. signer_registered — the signer-manager contract has a registered signer key
         *                    (fetchSignerInfo). The grant alone does not mean the signer is
         *                    active; registration is a separate step (register-self / admin path).
         *
         * ready_to_stake is true only when both checks pass.
         *
         * If txid is supplied, the transaction is polled first and its status is included.
         * A non-success tx status causes ready_to_stake to be false regardless of on-chain state.
         */
        this.verifySignerGrant = async (signerManager, txid) => {
            var _b, _c, _d;
            try {
                if (!this.publicKey)
                    throw new Error("Public key is not set");
                const notes = [];
                let txStatus = null;
                if (txid) {
                    const poll = await this.waitForTxSettlement(txid);
                    txStatus = (_c = (_b = poll.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== null && _c !== void 0 ? _c : null;
                    if (txStatus !== 'success') {
                        notes.push(`Transaction ${txid} did not succeed (status: ${txStatus !== null && txStatus !== void 0 ? txStatus : 'unknown'}). A broadcast txid does not guarantee contract success — Stacks mines aborted transactions.`);
                        return { success: true, grant_exists: false, signer_registered: false, ready_to_stake: false, tx_status: txStatus, notes };
                    }
                }
                const signerKey = this.publicKey;
                const [grantExists, signerInfo] = await Promise.all([
                    (0, bitcoin_staking_1.fetchVerifySignerKeyGrant)({ signerKey, signerManager, network: this.pox5Network }),
                    (0, bitcoin_staking_1.fetchSignerInfo)({ signerManager, network: this.pox5Network }),
                ]);
                const signerRegistered = !!(signerInfo === null || signerInfo === void 0 ? void 0 : signerInfo.signerKey);
                const registeredKey = (_d = signerInfo === null || signerInfo === void 0 ? void 0 : signerInfo.signerKey) !== null && _d !== void 0 ? _d : null;
                if (!grantExists) {
                    notes.push('No unconsumed grant found for this (signerKey, signerManager) pair. Either the grant was never created, has already been consumed (authId reuse), or was revoked.');
                }
                if (!signerRegistered) {
                    notes.push('The signer-manager has no registered signer key. The grant alone is not sufficient — registration (register-self or admin path) must also complete before stakes are accepted.');
                }
                if (grantExists && signerRegistered && registeredKey !== signerKey) {
                    notes.push(`The registered key (${registeredKey}) does not match the expected signerKey. The signer-manager may be registered to a different signer.`);
                }
                const readyToStake = grantExists && signerRegistered && registeredKey === signerKey;
                return {
                    success: true,
                    grant_exists: grantExists,
                    signer_registered: signerRegistered,
                    registered_key: registeredKey,
                    ready_to_stake: readyToStake,
                    tx_status: txStatus,
                    notes: notes.length ? notes : undefined,
                };
            }
            catch (error) {
                return { success: false, error: `Failed to verify signer grant: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        this.getPox5Info = async () => {
            try {
                const info = await (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network });
                return JSON.parse(JSON.stringify(info, (_, v) => typeof v === 'bigint' ? v.toString() : v));
            }
            catch (error) {
                return { success: false, error: `Failed to fetch PoX-5 info: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
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
        this.createNativeTransaction = async (recipientAddress, amount, grossTransaction = false, note, nonce, fee, memo, externalId) => {
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
                note, nonce, fee !== undefined ? (0, helpers_1.stxToMicro)(fee) : undefined, memo, externalId);
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
        this.createFTTransaction = async (recipientAddress, amount, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, note, nonce, externalId) => {
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
                const result = await this.buildSignSendTransfer(recipientAddress, microAmount, types_1.TransactionType.FungibleToken, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, note, nonce, undefined, // feeUstx
                undefined, // memo
                externalId);
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
        this.delegateToPool = async (poolsAddress, poolContractName, amount, lockPeriod, nonce, externalId) => {
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
                    externalId,
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
        this.allowContractCaller = async (poolsAddress, poolContractName, nonce, externalId) => {
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
                    externalId,
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
        this.revokeDelegation = async (nonce, externalId) => {
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
                    externalId,
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
        this.waitForBtcConfirmations = async (btcTxid, required = 3, pollMs = 30000, timeoutMs = 90 * 60000) => {
            var _b;
            const deadline = Date.now() + timeoutMs;
            while (Date.now() < deadline) {
                const tx = await fetch(`${this.esploraBase()}/tx/${btcTxid}`).then(r => r.json());
                if (((_b = tx === null || tx === void 0 ? void 0 : tx.status) === null || _b === void 0 ? void 0 : _b.confirmed) && tx.status.block_hash) {
                    const confirmations = tx.status.block_height
                        ? (await fetch(`${this.esploraBase()}/blocks/tip/height`).then(r => r.json())) - tx.status.block_height + 1
                        : 0;
                    if (confirmations >= required)
                        return { blockHash: tx.status.block_hash };
                }
                await new Promise(r => setTimeout(r, pollMs));
            }
            throw new Error(`BTC tx ${btcTxid} did not reach ${required} confirmations within ${timeoutMs / 60000} minutes`);
        };
        // --- PoX-5 BTC Bond methods ---
        /**
         * Creates a native-BTC PoX-5 bond: locks BTC on L1 via Fireblocks and registers
         * the paired STX position on L2 with a full SPV proof.
         *
         * Steps: allowlist check → bond params → STX ratio → lock script → send BTC via
         * Fireblocks → wait for confirmations → assemble SPV proof → register-for-bond.
         *
         * NOTE: This call blocks until Bitcoin confirmations are received (~30 min typical).
         */
        this.createBond = async (bondIndex, btcAmountSats, signerManager, opts) => {
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error('Address, Public Key or Vault ID are not set');
                }
                // Step 1 — allowlist check
                const allowance = await (0, bitcoin_staking_1.fetchBondAllowance)({ bondIndex, address: this.address, network: this.pox5Network });
                if (allowance < btcAmountSats) {
                    return { success: false, error: `Not allowlisted for ${btcAmountSats} sats on bond ${bondIndex} (cap: ${allowance} sats)` };
                }
                // Step 2 — fetch bond params + pox info in parallel
                const [pox, bond] = await Promise.all([
                    (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network }),
                    (0, bitcoin_staking_1.fetchBond)({ bondIndex, network: this.pox5Network }),
                ]);
                if (!bond)
                    return { success: false, error: `Bond ${bondIndex} not found` };
                // const safetyCheck = isSafeToSubmit(pox);
                // if (!safetyCheck.safe) {
                //   return { success: false, error: `In prepare phase — wait ${safetyCheck.blocksUntilBoundary} blocks before registering (next cycle: ${pox.rewardCycleId + 1})` };
                // }
                // Step 3 — required paired STX
                const amountUstx = (_b = opts === null || opts === void 0 ? void 0 : opts.amountUstxOverride) !== null && _b !== void 0 ? _b : (0, bitcoin_staking_1.minUstxForSatsAmount)({
                    sats: btcAmountSats,
                    stxValueRatio: bond.stxValueRatio,
                    minUstxRatioBps: bond.minUstxRatioBps,
                });
                const accountStatus = await (0, bitcoin_staking_1.fetchAccountStatus)({ address: this.address, network: this.pox5Network });
                const liquidStx = accountStatus.balance - accountStatus.locked;
                console.log('createBond STX check:', {
                    btcAmountSats: btcAmountSats.toString(),
                    stxValueRatio: bond.stxValueRatio.toString(),
                    minUstxRatioBps: bond.minUstxRatioBps.toString(),
                    amountUstx: amountUstx.toString(),
                    amountStx: (0, helpers_1.microToStx)(amountUstx),
                    balance: accountStatus.balance.toString(),
                    locked: accountStatus.locked.toString(),
                    liquidStx: liquidStx.toString(),
                });
                if (amountUstx > liquidStx) {
                    return { success: false, error: `Insufficient liquid STX: need ${(0, helpers_1.microToStx)(amountUstx)} STX but only ${(0, helpers_1.microToStx)(liquidStx)} available` };
                }
                // Step 4 — compute unlock height
                const firstBondCycle = (0, bitcoin_staking_1.firstPox5RewardCycle)(pox);
                if (firstBondCycle === undefined)
                    return { success: false, error: 'pox-5 not yet configured on this network' };
                const firstRewardCycle = (0, bitcoin_staking_1.bondPeriodToRewardCycle)({ bondIndex, poxInfo: pox });
                const unlockHeight = (0, bitcoin_staking_1.computeUnlockHeight)({ firstRewardCycle, numCycles: BOND_LENGTH_CYCLES, poxInfo: pox });
                // Step 5 — build lock script + derive P2WSH address
                const metadata = (0, bitcoin_staking_1.buildRegisterMetadata)({
                    bondIndex,
                    poxInfo: pox,
                    bitcoinPublicKey: this.publicKey,
                    stxAddress: this.address,
                    earlyUnlockBytes: bond.earlyUnlockBytes,
                    network: this.pox5Network,
                });
                console.log(`createBond: expecting BTC output to lock address ${metadata.lockAddress}`);
                // Step 6 — cross-check script vs contract (prevents funding an unverifiable address)
                // The library's fetchConstructLockupOutputScript doesn't handle (ok (buff N)) returns —
                // call the contract directly and unwrap the ResponseOk wrapper ourselves.
                {
                    const bootAddr = (_d = (_c = this.pox5Network) === null || _c === void 0 ? void 0 : _c.bootAddress) !== null && _d !== void 0 ? _d : (this.testnet ? 'ST000000000000000000002AMW42H' : 'SP000000000000000000002Q6VF78');
                    const buf = (v) => typeof v === 'string' ? transactions_1.Cl.bufferFromHex(v) : transactions_1.Cl.buffer(v);
                    const rawResult = await (0, transactions_1.fetchCallReadOnlyFunction)({
                        contractAddress: bootAddr,
                        contractName: 'pox-5',
                        functionName: 'construct-lockup-output-script',
                        functionArgs: [
                            transactions_1.Cl.address(this.address),
                            transactions_1.Cl.uint(metadata.unlockHeight),
                            buf(metadata.unlockBytes),
                            buf(bond.earlyUnlockBytes),
                        ],
                        senderAddress: bootAddr,
                        network: this.pox5Network,
                    });
                    if (rawResult.type === transactions_1.ClarityType.ResponseErr) {
                        return { success: false, error: `construct-lockup-output-script contract error: ${transactions_1.Cl.prettyPrint(rawResult.value)}` };
                    }
                    // Unwrap (ok (buff N)) or plain (buff N)
                    const inner = rawResult.type === transactions_1.ClarityType.ResponseOk ? rawResult.value : rawResult;
                    const onchainScriptHex = inner.value;
                    if ((0, common_1.bytesToHex)(metadata.outputScript) !== onchainScriptHex.replace(/^0x/, '')) {
                        return { success: false, error: `Lockup script mismatch — SDK: ${(0, common_1.bytesToHex)(metadata.outputScript)}, contract: ${onchainScriptHex}` };
                    }
                }
                // Persist unlockBytes BEFORE funding (losing this strands the BTC)
                await this.unlockBytesStore.save(this.address, bondIndex, metadata.unlockBytes);
                // Step 7 — fund lock address.
                // If btcTxid is provided (e.g. funded via faucet on regtest), skip Fireblocks send.
                let btcTxid;
                if (opts === null || opts === void 0 ? void 0 : opts.btcTxid) {
                    btcTxid = opts.btcTxid;
                }
                else {
                    const result = await this.fireblocksService.createBitcoinTransaction(metadata.lockAddress, btcAmountSats, this.vaultAccountId.toString(), (opts === null || opts === void 0 ? void 0 : opts.note) || `BTC bond ${bondIndex} lock`, opts === null || opts === void 0 ? void 0 : opts.externalId);
                    btcTxid = result.btcTxid;
                }
                // Step 8 — wait for Bitcoin confirmations
                const { blockHash } = await this.waitForBtcConfirmations(btcTxid, (_e = opts === null || opts === void 0 ? void 0 : opts.confirmations) !== null && _e !== void 0 ? _e : 3);
                // Step 9 — assemble SPV proof
                const [txHex, headerHex, merkleProof, blockMeta] = await Promise.all([
                    fetch(`${this.esploraBase()}/tx/${btcTxid}/hex`).then(r => r.text()),
                    fetch(`${this.esploraBase()}/block/${blockHash}/header`).then(r => r.text()),
                    fetch(`${this.esploraBase()}/tx/${btcTxid}/merkle-proof`).then(r => r.json()),
                    fetch(`${this.esploraBase()}/block/${blockHash}`).then(r => r.json()),
                ]);
                console.log('[createBond] SPV data types:', {
                    txHex: typeof txHex, txHexPreview: String(txHex).slice(0, 80),
                    headerHex: typeof headerHex, headerHexPreview: String(headerHex).slice(0, 40),
                    merkleProof: JSON.stringify(merkleProof).slice(0, 200),
                    blockMeta: JSON.stringify(blockMeta).slice(0, 200),
                });
                const lockupProof = Object.assign(Object.assign({}, (0, bitcoin_staking_1.buildLockProof)({
                    txHex,
                    header: headerHex,
                    merkleProof,
                    txCount: blockMeta.tx_count,
                    expectedScript: metadata.outputScript,
                })), { unlockBurnHeight: metadata.unlockHeight });
                // Step 10 — register on L2
                const resolvedNonce = await this.resolveNonce(opts === null || opts === void 0 ? void 0 : opts.nonce);
                const tx = await (0, bitcoin_staking_1.buildRegisterForBond)({
                    bondIndex,
                    signerManager,
                    amountUstx,
                    lockup: { kind: 'btc', outputs: [lockupProof], unlockBytes: metadata.unlockBytes },
                    publicKey: this.publicKey,
                    fee: BigInt(10000),
                    nonce: resolvedNonce,
                    network: this.pox5Network,
                    postConditionMode: 'allow',
                });
                const result = await this.pox5SignAndBroadcast(tx, (_f = opts === null || opts === void 0 ? void 0 : opts.note) !== null && _f !== void 0 ? _f : 'register-for-bond', opts === null || opts === void 0 ? void 0 : opts.externalId);
                if (!(result === null || result === void 0 ? void 0 : result.txid) || result.error || result.reason) {
                    console.error('register-for-bond broadcast failed:', JSON.stringify(result));
                    const parts = [result === null || result === void 0 ? void 0 : result.error, result === null || result === void 0 ? void 0 : result.reason, (result === null || result === void 0 ? void 0 : result.reason_data) ? JSON.stringify(result.reason_data) : undefined].filter(Boolean);
                    const errMsg = parts.join(' — ') || 'broadcast failed';
                    return { success: false, error: errMsg, btcTxid, vout: lockupProof.outputIndex };
                }
                const settled = await this.waitForTxSettlement(result.txid);
                console.log('register-for-bond settlement:', JSON.stringify({ tx_status: (_g = settled.data) === null || _g === void 0 ? void 0 : _g.tx_status, tx_result: (_h = settled.data) === null || _h === void 0 ? void 0 : _h.tx_result }));
                if (!settled.success || ((_j = settled.data) === null || _j === void 0 ? void 0 : _j.tx_status) !== 'success') {
                    const txRepr = (_p = (_m = (_l = (_k = settled.data) === null || _k === void 0 ? void 0 : _k.tx_result) === null || _l === void 0 ? void 0 : _l.repr) !== null && _m !== void 0 ? _m : (_o = settled.data) === null || _o === void 0 ? void 0 : _o.tx_error) !== null && _p !== void 0 ? _p : '';
                    return { success: false, error: `[${(_q = settled.data) === null || _q === void 0 ? void 0 : _q.tx_status}] ${txRepr}`.trim(), stacksTxid: result.txid, btcTxid, vout: lockupProof.outputIndex };
                }
                return {
                    success: true,
                    btcTxid,
                    vout: lockupProof.outputIndex,
                    stacksTxid: result.txid,
                    lockingAddress: metadata.lockAddress,
                    unlockHeight: metadata.unlockHeight,
                    amountUstx: amountUstx.toString(),
                };
            }
            catch (error) {
                console.error('createBond error:', error);
                return { success: false, error: `Failed to create bond: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Returns the current PoX-5 bond position for this vault's address, enriched
         * with live L1 lock state (if BTC-locked) and accrued sats rewards.
         */
        this.getBondPosition = async () => {
            try {
                if (!this.address)
                    throw new Error('Address is not set');
                const [pox, membership, stxOnly] = await Promise.all([
                    (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network }),
                    (0, bitcoin_staking_1.fetchBondMembership)({ address: this.address, network: this.pox5Network }).catch(() => null),
                    (0, bitcoin_staking_1.fetchStakerInfo)({ address: this.address, network: this.pox5Network }).catch(() => null),
                ]);
                const stxOnlyData = (stxOnly === null || stxOnly === void 0 ? void 0 : stxOnly.staked) ? {
                    amount_stx: (0, helpers_1.microToStx)(stxOnly.details.amountUstx),
                    first_reward_cycle: stxOnly.details.firstRewardCycle,
                    num_cycles: stxOnly.details.numCycles,
                    signer_manager: stxOnly.details.signer,
                } : null;
                if (!membership) {
                    return { success: true, data: { bond: null, stx_only: stxOnlyData } };
                }
                // Sum earned sats across all past cycles for a stable, accurate total
                const firstEarningCycle = (0, bitcoin_staking_1.bondPeriodToRewardCycle)({ bondIndex: membership.bondIndex, poxInfo: pox });
                let earnedSats = BigInt(0);
                for (let cycle = firstEarningCycle; cycle < pox.rewardCycleId; cycle++) {
                    const cycleEarned = await (0, bitcoin_staking_1.fetchEarned)({
                        signerManager: membership.signer,
                        rewardCycle: cycle,
                        bondIndex: membership.bondIndex,
                        network: this.pox5Network,
                    }).catch(() => BigInt(0));
                    earnedSats += cycleEarned;
                }
                // L1 lock state (BTC-locked positions only)
                let unlock_height = null;
                let locking_address = null;
                let still_locked = null;
                let blocks_until_unlock = null;
                if (membership.isL1Lock) {
                    const bond = await (0, bitcoin_staking_1.fetchBond)({ bondIndex: membership.bondIndex, network: this.pox5Network });
                    if (bond) {
                        const meta = (0, bitcoin_staking_1.buildRegisterMetadata)({
                            bondIndex: membership.bondIndex,
                            poxInfo: pox,
                            bitcoinPublicKey: this.publicKey,
                            stxAddress: this.address,
                            earlyUnlockBytes: bond.earlyUnlockBytes,
                            network: this.pox5Network,
                        });
                        unlock_height = meta.unlockHeight;
                        locking_address = meta.lockAddress;
                        blocks_until_unlock = Math.max(0, meta.unlockHeight - pox.currentBurnchainBlockHeight);
                        const utxos = await fetch(`${this.esploraBase()}/address/${meta.lockAddress}/utxo`)
                            .then(r => r.json()).catch(() => []);
                        still_locked = utxos.some(u => BigInt(u.value) === membership.amountSats);
                    }
                }
                const amountSatsBn = membership.amountSats;
                const amountBtc = (Number(amountSatsBn) / 1e8).toFixed(8);
                const earnedBtc = (Number(earnedSats) / 1e8).toFixed(8);
                const firstRewardCycle = (0, bitcoin_staking_1.bondPeriodToRewardCycle)({ bondIndex: membership.bondIndex, poxInfo: pox });
                const cyclesUntilRewards = Math.max(0, firstRewardCycle - pox.rewardCycleId);
                return {
                    success: true,
                    data: {
                        bond: {
                            bond_index: membership.bondIndex,
                            amount_stx: (0, helpers_1.microToStx)(membership.amountUstx),
                            amount_ustx: membership.amountUstx.toString(),
                            amount_sats: amountSatsBn.toString(),
                            amount_btc: amountBtc,
                            signer_manager: membership.signer,
                            is_l1_lock: membership.isL1Lock,
                            first_reward_cycle: firstRewardCycle,
                            cycles_until_rewards: cyclesUntilRewards,
                            unlock_height,
                            locking_address,
                            still_locked,
                            blocks_until_unlock,
                            earned_sats: earnedSats.toString(),
                            earned_btc: earnedBtc,
                        },
                        stx_only: stxOnlyData,
                    },
                };
            }
            catch (error) {
                return { success: false, error: `Failed to get bond position: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Announces an L1 early exit for an active BTC-locked bond (L2 leg only).
         * Zeroes the L2 amountSats; paired STX remains locked through the bond's normal
         * unlock cycle. The L1 BTC recovery (OP_ELSE spend) is a separate step requiring
         * the early-exit signer set.
         */
        this.announceEarlyExit = async (opts) => {
            var _b, _c, _d, _e, _f, _g;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error('Address, Public Key or Vault ID are not set');
                }
                const membership = await (0, bitcoin_staking_1.fetchBondMembership)({ address: this.address, network: this.pox5Network });
                if (!membership)
                    return { success: false, error: 'No active bond membership found' };
                if (!membership.isL1Lock)
                    return { success: false, error: 'Early exit only applies to L1-locked (native BTC) bonds' };
                const resolvedNonce = await this.resolveNonce(opts === null || opts === void 0 ? void 0 : opts.nonce);
                const tx = await (0, bitcoin_staking_1.buildAnnounceL1EarlyExit)({
                    staker: this.address,
                    oldSignerManager: membership.signer,
                    publicKey: this.publicKey,
                    fee: BigInt(10000),
                    nonce: resolvedNonce,
                    network: this.pox5Network,
                    postConditionMode: 'allow',
                    postConditions: [],
                });
                const result = await this.pox5SignAndBroadcast(tx, (_b = opts === null || opts === void 0 ? void 0 : opts.note) !== null && _b !== void 0 ? _b : 'announce-l1-early-exit', opts === null || opts === void 0 ? void 0 : opts.externalId);
                if (!(result === null || result === void 0 ? void 0 : result.txid) || result.error || result.reason) {
                    return { success: false, error: (_d = (_c = result === null || result === void 0 ? void 0 : result.error) !== null && _c !== void 0 ? _c : result === null || result === void 0 ? void 0 : result.reason) !== null && _d !== void 0 ? _d : 'broadcast failed' };
                }
                const settled = await this.waitForTxSettlement(result.txid);
                if (!settled.success || ((_e = settled.data) === null || _e === void 0 ? void 0 : _e.tx_status) !== 'success') {
                    return { success: false, error: (_g = (_f = settled.data) === null || _f === void 0 ? void 0 : _f.tx_error) !== null && _g !== void 0 ? _g : 'announce-l1-early-exit failed on-chain', txHash: result.txid };
                }
                return { success: true, txHash: result.txid };
            }
            catch (error) {
                return { success: false, error: `Failed to announce early exit: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Returns the P2WSH lock address (bcrt1… on testnet, bc1… on mainnet) for a given bond index.
         * Use this to know where to send BTC before calling createBond with a pre-funded btcTxid.
         */
        this.getBondLockAddress = async (bondIndex) => {
            try {
                if (!this.address || !this.publicKey)
                    throw new Error('Address or Public Key not set');
                const [pox, bond] = await Promise.all([
                    (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network }),
                    (0, bitcoin_staking_1.fetchBond)({ bondIndex, network: this.pox5Network }),
                ]);
                if (!bond)
                    return { success: false, error: `Bond ${bondIndex} not found` };
                const metadata = (0, bitcoin_staking_1.buildRegisterMetadata)({
                    bondIndex,
                    poxInfo: pox,
                    bitcoinPublicKey: this.publicKey,
                    stxAddress: this.address,
                    earlyUnlockBytes: bond.earlyUnlockBytes,
                    network: this.pox5Network,
                });
                return { success: true, data: { lockAddress: metadata.lockAddress, unlockHeight: metadata.unlockHeight } };
            }
            catch (error) {
                return { success: false, error: `Failed to get bond lock address: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Funds the bond lock address via the private-1 BTC faucet (testnet only).
         * Returns the faucet txid — pass it as btcTxid in createBond to skip the Fireblocks send.
         */
        this.fundBondLockAddress = async (bondIndex) => {
            var _b, _c;
            if (!this.testnet)
                return { success: false, error: 'Faucet funding is only available on testnet' };
            try {
                const lockResult = await this.getBondLockAddress(bondIndex);
                if (!lockResult.success || !((_b = lockResult.data) === null || _b === void 0 ? void 0 : _b.lockAddress))
                    return { success: false, error: lockResult.error };
                const { lockAddress } = lockResult.data;
                const res = await fetch(`https://api.private-1.hiro.so/extended/v1/faucets/btc?address=${lockAddress}`, { method: 'POST' });
                const body = await res.json();
                if (!body.success)
                    return { success: false, error: (_c = body.error) !== null && _c !== void 0 ? _c : 'Faucet request failed' };
                return { success: true, data: { txid: body.txid, lockAddress } };
            }
            catch (error) {
                return { success: false, error: `Failed to fund bond lock address: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Funds the vault's STX address via the private-1 STX faucet (testnet only).
         * Pass staking=true to request the stacking-sized faucet amount.
         */
        this.fundVault = async (staking = false) => {
            var _b, _c;
            if (!this.testnet)
                return { success: false, error: 'Faucet funding is only available on testnet' };
            try {
                const address = await this.getAddress();
                const url = `https://api.private-1.hiro.so/extended/v1/faucets/stx?address=${address}${staking ? '&stacking=true' : ''}`;
                const res = await fetch(url, { method: 'POST' });
                const body = await res.json();
                if (!body.success)
                    return { success: false, error: (_b = body.error) !== null && _b !== void 0 ? _b : 'Faucet request failed' };
                return { success: true, data: { txid: (_c = body.txId) !== null && _c !== void 0 ? _c : '', address } };
            }
            catch (error) {
                return { success: false, error: `Failed to fund vault: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        this.getRequirements = async (opts) => {
            try {
                const pox = await (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network });
                const safetyCheck = (0, helpers_1.isSafeToSubmit)(pox);
                const isPreparePh = (0, bitcoin_staking_1.isInPreparePhase)({ burnHeight: pox.currentBurnchainBlockHeight, poxInfo: pox });
                const cycle = {
                    id: pox.rewardCycleId,
                    current_burn_height: pox.currentBurnchainBlockHeight,
                    is_prepare_phase: isPreparePh,
                };
                const stx_only = {
                    safe_to_submit: safetyCheck.safe,
                    blocks_until_deadline: Math.max(0, safetyCheck.blocksUntilBoundary - constants_1.stacks_info.stacking.solo.safetyBlocks),
                    blocks_until_safe: safetyCheck.safe
                        ? null
                        : pox.prepareCycleLength + safetyCheck.blocksUntilBoundary,
                };
                // Scan to find current and next open bond indices.
                // bondPeriodToRewardCycle is pure — boundary is the first bond whose locked
                // period starts at or after the current cycle.
                // current = boundary - 1 (the bond actively locked right now)
                // next open = boundary or boundary+1 (whichever has open/eligible status)
                let currentBondIndex = null;
                let nextOpenBondIndex = null;
                for (let i = 0; i < 100; i++) {
                    const periodStart = (0, bitcoin_staking_1.bondPeriodToRewardCycle)({ bondIndex: i, poxInfo: pox });
                    if (periodStart >= pox.rewardCycleId) {
                        currentBondIndex = i > 0 ? i - 1 : null;
                        for (const candidate of [i, i + 1]) {
                            const s = await (0, bitcoin_staking_1.fetchBondStatus)({ bondIndex: candidate, poxInfo: pox, network: this.pox5Network });
                            if (s === 'open' || s === 'eligible') {
                                nextOpenBondIndex = candidate;
                                break;
                            }
                        }
                        break;
                    }
                }
                // Helper to fetch full bond details for a given index
                const fetchBondDetails = async (idx) => {
                    const [bond, status, allowance] = await Promise.all([
                        (0, bitcoin_staking_1.fetchBond)({ bondIndex: idx, network: this.pox5Network }),
                        (0, bitcoin_staking_1.fetchBondStatus)({ bondIndex: idx, poxInfo: pox, network: this.pox5Network }),
                        this.address
                            ? (0, bitcoin_staking_1.fetchBondAllowance)({ bondIndex: idx, address: this.address, network: this.pox5Network }).catch(() => BigInt(0))
                            : Promise.resolve(BigInt(0)),
                    ]);
                    if (!bond)
                        return null;
                    return {
                        bond_index: idx,
                        bond_phase: status,
                        can_participate: allowance > BigInt(0) && (status === 'open' || status === 'eligible'),
                        stx_value_ratio: bond.stxValueRatio.toString(),
                        target_rate_bps: bond.targetRateBps,
                        min_ustx_ratio_bps: bond.minUstxRatioBps,
                        your_allowance_sats: allowance.toString(),
                        _bond: bond,
                    };
                };
                // Fetch current and next open bond in parallel
                const [currentDetails, nextOpenDetails] = await Promise.all([
                    currentBondIndex !== null ? fetchBondDetails(currentBondIndex) : Promise.resolve(null),
                    nextOpenBondIndex !== null ? fetchBondDetails(nextOpenBondIndex) : Promise.resolve(null),
                ]);
                if (currentDetails === null && nextOpenDetails === null) {
                    return { success: true, data: { cycle, stx_only } };
                }
                const btc_bond = {
                    current_bond: currentDetails ? {
                        bond_index: currentDetails.bond_index,
                        bond_phase: currentDetails.bond_phase,
                        can_participate: currentDetails.can_participate,
                        stx_value_ratio: currentDetails.stx_value_ratio,
                        target_rate_bps: currentDetails.target_rate_bps,
                        min_ustx_ratio_bps: currentDetails.min_ustx_ratio_bps,
                        your_allowance_sats: currentDetails.your_allowance_sats,
                    } : null,
                    next_open_bond: nextOpenDetails ? {
                        bond_index: nextOpenDetails.bond_index,
                        bond_phase: nextOpenDetails.bond_phase,
                        can_participate: nextOpenDetails.can_participate,
                        stx_value_ratio: nextOpenDetails.stx_value_ratio,
                        target_rate_bps: nextOpenDetails.target_rate_bps,
                        min_ustx_ratio_bps: nextOpenDetails.min_ustx_ratio_bps,
                        your_allowance_sats: nextOpenDetails.your_allowance_sats,
                    } : null,
                };
                // Add btcAmountSats calculation to next_open_bond if provided
                if ((opts === null || opts === void 0 ? void 0 : opts.btcAmountSats) !== undefined && (nextOpenDetails === null || nextOpenDetails === void 0 ? void 0 : nextOpenDetails._bond)) {
                    const minUstx = (0, bitcoin_staking_1.minUstxForSatsAmount)({
                        sats: opts.btcAmountSats,
                        stxValueRatio: nextOpenDetails._bond.stxValueRatio,
                        minUstxRatioBps: nextOpenDetails._bond.minUstxRatioBps,
                    });
                    btc_bond.next_open_bond.min_stx_for_sats = (0, helpers_1.microToStx)(minUstx);
                    btc_bond.next_open_bond.min_ustx_for_sats = minUstx.toString();
                }
                // If caller passed an explicit bondIndex, fetch and attach as requested_bond
                if ((opts === null || opts === void 0 ? void 0 : opts.bondIndex) !== undefined) {
                    const reqDetails = await fetchBondDetails(opts.bondIndex);
                    if (reqDetails) {
                        btc_bond.requested_bond = {
                            bond_index: reqDetails.bond_index,
                            bond_phase: reqDetails.bond_phase,
                            can_participate: reqDetails.can_participate,
                            stx_value_ratio: reqDetails.stx_value_ratio,
                            target_rate_bps: reqDetails.target_rate_bps,
                            min_ustx_ratio_bps: reqDetails.min_ustx_ratio_bps,
                            your_allowance_sats: reqDetails.your_allowance_sats,
                        };
                        if (opts.btcAmountSats !== undefined) {
                            const minUstx = (0, bitcoin_staking_1.minUstxForSatsAmount)({
                                sats: opts.btcAmountSats,
                                stxValueRatio: reqDetails._bond.stxValueRatio,
                                minUstxRatioBps: reqDetails._bond.minUstxRatioBps,
                            });
                            btc_bond.requested_bond.min_stx_for_sats = (0, helpers_1.microToStx)(minUstx);
                            btc_bond.requested_bond.min_ustx_for_sats = minUstx.toString();
                        }
                    }
                }
                return { success: true, data: { cycle, stx_only, btc_bond } };
            }
            catch (error) {
                return { success: false, error: `Failed to fetch requirements: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        // Build the P2WSH output script (OP_0 <32-byte-sha256-of-witnessScript>)
        this.p2wshOutputScript = (witnessScript) => {
            const hash = (0, sha2_1.sha256)(witnessScript);
            const out = new Uint8Array(34);
            out[0] = 0x00; // OP_0
            out[1] = 0x20; // PUSH 32
            out.set(hash, 2);
            return out;
        };
        this.broadcastBtc = async (rawHex) => {
            const res = await fetch(`${this.esploraBase()}/tx`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: rawHex,
            });
            if (!res.ok) {
                const body = await res.text().catch(() => '');
                throw new Error(`BTC broadcast failed (${res.status}): ${body}`);
            }
            return res.text(); // esplora returns the txid as plain text
        };
        this.btcDerSig = (fullSigHex) => {
            // fullSigHex is r||s as 128 hex chars — normalize to low-S then DER-encode
            const parsed = secp256k1_1.Signature.fromCompact(fullSigHex);
            const normalized = parsed.hasHighS() ? parsed.normalizeS() : parsed;
            const compact = normalized.toCompactRawBytes();
            const r = compact.slice(0, 32);
            const s = compact.slice(32, 64);
            const encodeScalar = (bytes) => {
                return bytes[0] >= 0x80 ? new Uint8Array([0, ...bytes]) : bytes;
            };
            const rEnc = encodeScalar(r);
            const sEnc = encodeScalar(s);
            const total = 4 + rEnc.length + sEnc.length;
            const der = new Uint8Array(total + 3); // +2 outer tag/len + 1 SIGHASH_ALL
            let i = 0;
            der[i++] = 0x30;
            der[i++] = total;
            der[i++] = 0x02;
            der[i++] = rEnc.length;
            der.set(rEnc, i);
            i += rEnc.length;
            der[i++] = 0x02;
            der[i++] = sEnc.length;
            der.set(sEnc, i);
            i += sEnc.length;
            der[i] = 0x01; // SIGHASH_ALL
            return der;
        };
        this.signBtcSighash = async (sighash) => {
            const rawSig = await this.fireblocksService.signTransaction((0, common_1.bytesToHex)(sighash), this.vaultAccountId.toString(), 'BTC P2WSH spend');
            return this.btcDerSig(rawSig.fullSig);
        };
        this.btcSegwitSighash = (tx, inputIndex, witnessScript, amountSats) => {
            // preimageWitnessV0 already returns SHA256d(BIP143 preimage) — do not hash again
            return tx.preimageWitnessV0(inputIndex, witnessScript, btc.SigHash.ALL, amountSats);
        };
        this.setP2wshWitness = (tx, inputIndex, items) => {
            tx.updateInput(inputIndex, { finalScriptWitness: items });
        };
        // ─── §5: deriveLock (private) ─────────────────────────────────────────────
        this.deriveLock = async (address, bondIndexOverride) => {
            var _b, _c, _d;
            const addr = address !== null && address !== void 0 ? address : this.address;
            const [pox, membership] = await Promise.all([
                (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network }),
                (0, bitcoin_staking_1.fetchBondMembership)({ address: addr, network: this.pox5Network }).catch(() => null),
            ]);
            const bondIndex = (_b = membership === null || membership === void 0 ? void 0 : membership.bondIndex) !== null && _b !== void 0 ? _b : bondIndexOverride;
            if (bondIndex === undefined)
                return null;
            // Active membership must be L1-locked unless we're using a bondIndex override
            // (override is used when membership has expired after the bond matured)
            if (membership && !membership.isL1Lock)
                return null;
            let unlockBytes = await this.unlockBytesStore.load(addr, bondIndex);
            if (!unlockBytes) {
                unlockBytes = (0, bitcoin_staking_1.buildUnlockScript)((0, common_1.hexToBytes)(this.publicKey));
            }
            const bond = await (0, bitcoin_staking_1.fetchBond)({ bondIndex, network: this.pox5Network });
            if (!bond)
                throw new Error(`Bond ${bondIndex} not found`);
            const meta = (0, bitcoin_staking_1.buildRegisterMetadata)({
                bondIndex,
                poxInfo: pox,
                bitcoinPublicKey: this.publicKey,
                stxAddress: addr,
                earlyUnlockBytes: bond.earlyUnlockBytes,
                network: this.pox5Network,
            });
            return {
                bondIndex,
                unlockHeight: meta.unlockHeight,
                lockScript: meta.lockScript,
                lockingAddress: meta.lockAddress,
                earlyUnlockBytes: typeof bond.earlyUnlockBytes === 'string' ? (0, common_1.hexToBytes)(bond.earlyUnlockBytes) : bond.earlyUnlockBytes,
                unlockBytes: meta.unlockBytes,
                amountSats: (_c = membership === null || membership === void 0 ? void 0 : membership.amountSats) !== null && _c !== void 0 ? _c : BigInt(0),
                isL1Lock: (_d = membership === null || membership === void 0 ? void 0 : membership.isL1Lock) !== null && _d !== void 0 ? _d : true,
            };
        };
        this.findLockUtxo = async (lockingAddress, amountSats) => {
            var _b, _c;
            const utxos = await fetch(`${this.esploraBase()}/address/${lockingAddress}/utxo`)
                .then(r => r.json())
                .catch(() => []);
            return (_c = (_b = utxos.find(u => BigInt(u.value) === amountSats)) !== null && _b !== void 0 ? _b : utxos[0]) !== null && _c !== void 0 ? _c : null;
        };
        // ─── §6: unlockMaturedBond ────────────────────────────────────────────────
        /**
         * Spends the matured P2WSH UTXO back to a destination BTC address via the
         * OP_IF (CLTV) branch. Only callable after `unlockHeight` has passed on the
         * BTC chain. No early-exit signer set required — unilateral staker signature.
         */
        this.unlockMaturedBond = async (destinationBtcAddress, opts) => {
            var _b, _c, _d;
            try {
                const lock = await this.deriveLock(undefined, opts === null || opts === void 0 ? void 0 : opts.bondIndex);
                console.log('[unlockMaturedBond] deriveLock:', lock ? {
                    bondIndex: lock.bondIndex,
                    unlockHeight: lock.unlockHeight,
                    lockingAddress: lock.lockingAddress,
                    amountSats: lock.amountSats.toString(),
                    isL1Lock: lock.isL1Lock,
                    lockScriptHex: (0, common_1.bytesToHex)(lock.lockScript),
                } : null);
                if (!lock)
                    return { success: false, error: 'No L1-locked bond membership found' };
                const tipHeight = await fetch(`${this.esploraBase()}/blocks/tip/height`)
                    .then(r => r.text()).then(Number);
                console.log('[unlockMaturedBond] BTC tip:', tipHeight, '| unlock height:', lock.unlockHeight, '| matured:', tipHeight >= lock.unlockHeight);
                if (tipHeight < lock.unlockHeight) {
                    return { success: false, error: `Bond not matured: BTC tip ${tipHeight} < unlock height ${lock.unlockHeight}` };
                }
                const allUtxos = await fetch(`${this.esploraBase()}/address/${lock.lockingAddress}/utxo`)
                    .then(r => r.json()).catch(() => []);
                console.log('[unlockMaturedBond] UTXOs at locking address:', JSON.stringify(allUtxos));
                const utxo = (_c = (_b = allUtxos.find((u) => BigInt(u.value) === lock.amountSats)) !== null && _b !== void 0 ? _b : allUtxos[0]) !== null && _c !== void 0 ? _c : null;
                console.log('[unlockMaturedBond] selected UTXO:', utxo ? { txid: utxo.txid, vout: utxo.vout, value: utxo.value } : null);
                console.log('[unlockMaturedBond] amountSats match:', utxo ? BigInt(utxo.value) === lock.amountSats : false, `(utxo=${utxo === null || utxo === void 0 ? void 0 : utxo.value}, lock=${lock.amountSats.toString()})`);
                if (!utxo)
                    return { success: false, error: 'Lock UTXO not found or already spent' };
                const feeSats = (_d = opts === null || opts === void 0 ? void 0 : opts.feeSats) !== null && _d !== void 0 ? _d : BigInt(500);
                const actualUtxoSats = BigInt(utxo.value);
                const outputAmount = actualUtxoSats - feeSats;
                console.log('[unlockMaturedBond] feeSats:', feeSats.toString(), '| outputAmount:', outputAmount.toString());
                if (outputAmount <= BigInt(0))
                    return { success: false, error: 'Fee exceeds locked amount' };
                const p2wshScript = this.p2wshOutputScript(lock.lockScript);
                console.log('[unlockMaturedBond] p2wshScript:', (0, common_1.bytesToHex)(p2wshScript));
                const tx = new btc.Transaction({ lockTime: lock.unlockHeight });
                tx.addInput({
                    txid: utxo.txid,
                    index: utxo.vout,
                    sequence: 0xfffffffe,
                    witnessUtxo: { script: p2wshScript, amount: actualUtxoSats },
                    witnessScript: lock.lockScript,
                });
                tx.addOutputAddress(destinationBtcAddress, outputAmount, this.btcNetwork);
                const sighash = this.btcSegwitSighash(tx, 0, lock.lockScript, actualUtxoSats);
                console.log('[unlockMaturedBond] sighash:', (0, common_1.bytesToHex)(sighash));
                const stakerSig = await this.signBtcSighash(sighash);
                console.log('[unlockMaturedBond] stakerSig (DER):', (0, common_1.bytesToHex)(stakerSig));
                this.setP2wshWitness(tx, 0, [stakerSig, new Uint8Array([1]), lock.lockScript]);
                const rawHex = (0, common_1.bytesToHex)(tx.extract());
                console.log('[unlockMaturedBond] raw tx hex:', rawHex);
                const btcTxid = await this.broadcastBtc(rawHex);
                console.log('[unlockMaturedBond] broadcast success, txid:', btcTxid);
                return { success: true, btcTxid };
            }
            catch (error) {
                return { success: false, error: `Failed to unlock matured bond: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        // ─── §7B: spendEarlyExitUtxo ─────────────────────────────────────────────
        /**
         * Spends the P2WSH UTXO via the OP_ELSE (early-exit) branch. Requires an
         * external `earlyExitSigner` (from the Endowment) to co-sign the same sighash.
         * Call `announceEarlyExit()` on L2 first and wait for it to settle.
         */
        this.spendEarlyExitUtxo = async (destinationBtcAddress, earlyExitSigner, opts) => {
            var _b;
            try {
                const lock = await this.deriveLock();
                if (!lock)
                    return { success: false, error: 'No L1-locked bond membership found' };
                const utxo = await this.findLockUtxo(lock.lockingAddress, lock.amountSats);
                if (!utxo)
                    return { success: false, error: 'Lock UTXO not found or already spent' };
                const feeSats = (_b = opts === null || opts === void 0 ? void 0 : opts.feeSats) !== null && _b !== void 0 ? _b : BigInt(500);
                const outputAmount = lock.amountSats - feeSats;
                if (outputAmount <= BigInt(0))
                    return { success: false, error: 'Fee exceeds locked amount' };
                const p2wshScript = this.p2wshOutputScript(lock.lockScript);
                const tx = new btc.Transaction();
                // OP_ELSE path has no CLTV gate — lockTime not required
                tx.addInput({
                    txid: utxo.txid,
                    index: utxo.vout,
                    sequence: 0xfffffffe,
                    witnessUtxo: { script: p2wshScript, amount: lock.amountSats },
                    witnessScript: lock.lockScript,
                });
                tx.addOutputAddress(destinationBtcAddress, outputAmount, this.btcNetwork);
                const sighash = this.btcSegwitSighash(tx, 0, lock.lockScript, lock.amountSats);
                const [stakerSig, earlyExitSig] = await Promise.all([
                    this.signBtcSighash(sighash),
                    earlyExitSigner.sign(sighash),
                ]);
                const preimage = (0, bitcoin_staking_1.computeRegisterPreimage)(this.address);
                // OP_ELSE witness: [ <stakerSig>, <earlyExitSig>, <preimage>, <0=FALSE>, <witnessScript> ]
                this.setP2wshWitness(tx, 0, [stakerSig, earlyExitSig, preimage, new Uint8Array([]), lock.lockScript]);
                const btcTxid = await this.broadcastBtc((0, common_1.bytesToHex)(tx.extract()));
                return { success: true, btcTxid };
            }
            catch (error) {
                return { success: false, error: `Failed to spend early exit UTXO: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        // ─── §8: renewBond ───────────────────────────────────────────────────────
        /**
         * Rolls the current bond into the next period atomically:
         * 1. Spends the matured prior P2WSH → next bond's locking address (OP_IF branch)
         * 2. Assembles the SPV proof for the new output
         * 3. Calls register-for-bond for nextBondIndex on L2
         *
         * Must be called inside the re-lock window (after prior unlockHeight, before next bond starts).
         */
        this.renewBond = async (nextBondIndex, signerManager, opts) => {
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error('Address, Public Key or Vault ID are not set');
                }
                // 1. Resolve prior lock
                const prior = await this.deriveLock();
                if (!prior)
                    return { success: false, error: 'No current L1 bond to renew' };
                const tipHeight = await fetch(`${this.esploraBase()}/blocks/tip/height`)
                    .then(r => r.text()).then(Number);
                if (tipHeight < prior.unlockHeight) {
                    return { success: false, error: `Prior bond not matured: BTC tip ${tipHeight} < unlock height ${prior.unlockHeight}` };
                }
                const utxo = await this.findLockUtxo(prior.lockingAddress, prior.amountSats);
                if (!utxo)
                    return { success: false, error: 'Prior lock UTXO not found or already spent' };
                // 2. Compute next lock parameters
                const [pox, nextBond] = await Promise.all([
                    (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network }),
                    (0, bitcoin_staking_1.fetchBond)({ bondIndex: nextBondIndex, network: this.pox5Network }),
                ]);
                if (!nextBond)
                    return { success: false, error: `Next bond ${nextBondIndex} not found` };
                const nextMeta = (0, bitcoin_staking_1.buildRegisterMetadata)({
                    bondIndex: nextBondIndex,
                    poxInfo: pox,
                    bitcoinPublicKey: this.publicKey,
                    stxAddress: this.address,
                    earlyUnlockBytes: nextBond.earlyUnlockBytes,
                    network: this.pox5Network,
                });
                // Cross-check next lock script against contract
                const onchainNext = await (0, bitcoin_staking_1.fetchConstructLockupOutputScript)({
                    stxAddress: this.address,
                    unlockHeight: nextMeta.unlockHeight,
                    unlockBytes: nextMeta.unlockBytes,
                    earlyUnlockBytes: nextBond.earlyUnlockBytes,
                    network: this.pox5Network,
                });
                if ((0, common_1.bytesToHex)(nextMeta.outputScript) !== (0, common_1.bytesToHex)(onchainNext)) {
                    return { success: false, error: 'Next bond lockup script mismatch — NOT proceeding' };
                }
                // Persist unlockBytes for the new bond period before spending
                await this.unlockBytesStore.save(this.address, nextBondIndex, nextMeta.unlockBytes);
                // 3. Build the atomic BTC spend: prior P2WSH → next locking address
                const feeSats = (_b = opts === null || opts === void 0 ? void 0 : opts.feeSats) !== null && _b !== void 0 ? _b : BigInt(500);
                const outputAmount = prior.amountSats - feeSats;
                if (outputAmount <= BigInt(0))
                    return { success: false, error: 'Fee exceeds locked amount' };
                const priorP2wshScript = this.p2wshOutputScript(prior.lockScript);
                const btcTx = new btc.Transaction({ lockTime: prior.unlockHeight });
                btcTx.addInput({
                    txid: utxo.txid,
                    index: utxo.vout,
                    sequence: 0xfffffffe,
                    witnessUtxo: { script: priorP2wshScript, amount: prior.amountSats },
                    witnessScript: prior.lockScript,
                });
                btcTx.addOutputAddress(nextMeta.lockAddress, outputAmount, this.btcNetwork);
                const sighash = this.btcSegwitSighash(btcTx, 0, prior.lockScript, prior.amountSats);
                const stakerSig = await this.signBtcSighash(sighash);
                this.setP2wshWitness(btcTx, 0, [stakerSig, new Uint8Array([1]), prior.lockScript]);
                const btcTxid = await this.broadcastBtc((0, common_1.bytesToHex)(btcTx.extract()));
                // 4. Wait for confirmations on the new lock output
                const { blockHash } = await this.waitForBtcConfirmations(btcTxid, (_c = opts === null || opts === void 0 ? void 0 : opts.confirmations) !== null && _c !== void 0 ? _c : 3);
                // 5. Assemble SPV proof for the new lock output
                const [txHex, headerHex, merkleProof, blockMeta] = await Promise.all([
                    fetch(`${this.esploraBase()}/tx/${btcTxid}/hex`).then(r => r.text()),
                    fetch(`${this.esploraBase()}/block/${blockHash}/header`).then(r => r.text()),
                    fetch(`${this.esploraBase()}/tx/${btcTxid}/merkle-proof`).then(r => r.json()),
                    fetch(`${this.esploraBase()}/block/${blockHash}`).then(r => r.json()),
                ]);
                const lockupProof = Object.assign(Object.assign({}, (0, bitcoin_staking_1.buildLockProof)({
                    txHex,
                    header: headerHex,
                    merkleProof,
                    txCount: blockMeta.tx_count,
                    expectedScript: nextMeta.outputScript,
                })), { unlockBurnHeight: nextMeta.unlockHeight });
                // 6. Required STX for next bond
                const amountUstx = (0, bitcoin_staking_1.minUstxForSatsAmount)({
                    sats: outputAmount,
                    stxValueRatio: nextBond.stxValueRatio,
                    minUstxRatioBps: nextBond.minUstxRatioBps,
                });
                // 7. Register on L2
                const resolvedNonce = await this.resolveNonce(opts === null || opts === void 0 ? void 0 : opts.nonce);
                const stacksTx = await (0, bitcoin_staking_1.buildRegisterForBond)({
                    bondIndex: nextBondIndex,
                    signerManager,
                    amountUstx,
                    lockup: { kind: 'btc', outputs: [lockupProof], unlockBytes: nextMeta.unlockBytes },
                    publicKey: this.publicKey,
                    fee: BigInt(10000),
                    nonce: resolvedNonce,
                    network: this.pox5Network,
                    postConditionMode: 'allow',
                });
                const result = await this.pox5SignAndBroadcast(stacksTx, (_d = opts === null || opts === void 0 ? void 0 : opts.note) !== null && _d !== void 0 ? _d : `renew-bond-${nextBondIndex}`, opts === null || opts === void 0 ? void 0 : opts.externalId);
                if (!(result === null || result === void 0 ? void 0 : result.txid) || result.error || result.reason) {
                    return { success: false, error: (_f = (_e = result === null || result === void 0 ? void 0 : result.error) !== null && _e !== void 0 ? _e : result === null || result === void 0 ? void 0 : result.reason) !== null && _f !== void 0 ? _f : 'broadcast failed', btcTxid, vout: lockupProof.outputIndex };
                }
                const settled = await this.waitForTxSettlement(result.txid);
                if (!settled.success || ((_g = settled.data) === null || _g === void 0 ? void 0 : _g.tx_status) !== 'success') {
                    const txRepr = (_m = (_k = (_j = (_h = settled.data) === null || _h === void 0 ? void 0 : _h.tx_result) === null || _j === void 0 ? void 0 : _j.repr) !== null && _k !== void 0 ? _k : (_l = settled.data) === null || _l === void 0 ? void 0 : _l.tx_error) !== null && _m !== void 0 ? _m : '';
                    return { success: false, error: `[${(_o = settled.data) === null || _o === void 0 ? void 0 : _o.tx_status}] ${txRepr}`.trim(), stacksTxid: result.txid, btcTxid, vout: lockupProof.outputIndex };
                }
                return {
                    success: true,
                    btcTxid,
                    vout: lockupProof.outputIndex,
                    stacksTxid: result.txid,
                    lockingAddress: nextMeta.lockAddress,
                    unlockHeight: nextMeta.unlockHeight,
                    amountUstx: amountUstx.toString(),
                };
            }
            catch (error) {
                return { success: false, error: `Failed to renew bond: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        // ─── §9: Rewards ─────────────────────────────────────────────────────────
        this.getActiveBondsSorted = async () => {
            const pox = await (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network });
            const candidates = Array.from({ length: 20 }, (_, i) => i);
            const results = await Promise.all(candidates.map(async (i) => {
                const bond = await (0, bitcoin_staking_1.fetchBond)({ bondIndex: i, network: this.pox5Network }).catch(() => null);
                if (!bond)
                    return null;
                const active = (0, bitcoin_staking_1.isBondActiveAtHeight)({ bondIndex: i, burnHeight: pox.currentBurnchainBlockHeight, poxInfo: pox });
                if (!active)
                    return null;
                return { i, stxValueRatio: bond.stxValueRatio };
            }));
            return results
                .filter((r) => r !== null)
                .sort((a, b) => {
                if (b.stxValueRatio > a.stxValueRatio)
                    return 1;
                if (b.stxValueRatio < a.stxValueRatio)
                    return -1;
                return a.i - b.i;
            })
                .map(r => r.i);
        };
        /**
         * Triggers the PoX-5 reward distribution waterfall for the current cycle.
         * Must include ALL active bonds, sorted descending by stxValueRatio (ascending bondIndex as tiebreaker).
         * ERR_DISTRIBUTION_ALREADY_COMPUTED (u30) is benign — rewards were already settled.
         */
        this.calculateRewards = async (opts) => {
            var _b, _c, _d, _e, _f, _g;
            try {
                if (!this.publicKey || !this.vaultAccountId)
                    throw new Error('SDK not initialized');
                const bondIndices = await this.getActiveBondsSorted();
                const resolvedNonce = await this.resolveNonce(opts === null || opts === void 0 ? void 0 : opts.nonce);
                const tx = await (0, bitcoin_staking_1.buildCalculateRewards)({
                    bondIndices,
                    publicKey: this.publicKey,
                    fee: BigInt(10000),
                    nonce: resolvedNonce,
                    network: this.pox5Network,
                });
                const result = await this.pox5SignAndBroadcast(tx, (_b = opts === null || opts === void 0 ? void 0 : opts.note) !== null && _b !== void 0 ? _b : 'calculate-rewards');
                if (!(result === null || result === void 0 ? void 0 : result.txid) || result.error || result.reason) {
                    return { success: false, error: (_d = (_c = result === null || result === void 0 ? void 0 : result.error) !== null && _c !== void 0 ? _c : result === null || result === void 0 ? void 0 : result.reason) !== null && _d !== void 0 ? _d : 'broadcast failed' };
                }
                const settled = await this.waitForTxSettlement(result.txid);
                if (!settled.success || ((_e = settled.data) === null || _e === void 0 ? void 0 : _e.tx_status) !== 'success') {
                    return { success: false, error: (_g = (_f = settled.data) === null || _f === void 0 ? void 0 : _f.tx_error) !== null && _g !== void 0 ? _g : 'calculate-rewards failed on-chain', txHash: result.txid };
                }
                return { success: true, txHash: result.txid };
            }
            catch (error) {
                return { success: false, error: `Failed to calculate rewards: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Claims ALL accumulated sBTC rewards for the given bond indices.
         * Handles the full flow internally: calculate → distribute → claim staker share.
         * User just passes bond indices and gets their sBTC.
         */
        this.claimRewards = async (bondIndices, opts) => {
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
            try {
                if (!this.publicKey || !this.vaultAccountId)
                    throw new Error('SDK not initialized');
                if (!this.address)
                    throw new Error('Address not set');
                const pox = await (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network });
                const membership = await (0, bitcoin_staking_1.fetchBondMembership)({ address: this.address, network: this.pox5Network }).catch(() => null);
                if (!membership)
                    return { success: false, error: 'No bond membership found for this vault' };
                const minBondIndex = Math.min(...bondIndices);
                const firstEarningCycle = (0, bitcoin_staking_1.bondPeriodToRewardCycle)({ bondIndex: minBondIndex, poxInfo: pox });
                const lastComputeHeight = await (0, bitcoin_staking_1.fetchLastRewardComputeHeight)({ network: this.pox5Network }).catch(() => 0);
                const lastComputedCycle = lastComputeHeight > 0
                    ? Math.floor((lastComputeHeight - pox.firstBurnchainBlockHeight) / pox.rewardCycleLength)
                    : pox.rewardCycleId - 1;
                // Find cycles with non-zero bond rewards
                const claimableCycles = [];
                for (let cycle = firstEarningCycle; cycle <= lastComputedCycle; cycle++) {
                    const earned = await (0, bitcoin_staking_1.fetchEarned)({
                        signerManager: membership.signer,
                        rewardCycle: cycle,
                        bondIndex: minBondIndex,
                        network: this.pox5Network,
                    }).catch(() => BigInt(0));
                    if (earned > BigInt(0))
                        claimableCycles.push(cycle);
                }
                if (claimableCycles.length === 0) {
                    return {
                        success: false,
                        error: `No rewards available yet for bond ${minBondIndex} (first_reward_cycle: ${firstEarningCycle}, last_computed_cycle: ${lastComputedCycle}, current_cycle: ${pox.rewardCycleId})`,
                    };
                }
                let nonce = await this.resolveNonce(opts === null || opts === void 0 ? void 0 : opts.nonce);
                const txHashes = [];
                // Parse signer-manager contract address and name from membership.signer
                // e.g. "ST3NB...XCP.signer-manager" → contractAddress + contractName
                const signerDotIdx = membership.signer.lastIndexOf('.');
                const signerContractAddress = membership.signer.slice(0, signerDotIdx);
                const signerContractName = membership.signer.slice(signerDotIdx + 1);
                for (const cycle of claimableCycles) {
                    // Step 1: signer-manager.claim-rewards — pulls sBTC from pox-5 into signer-manager
                    // Anyone can call this. Skip gracefully if already done.
                    const smClaimTx = await (0, transactions_1.makeUnsignedContractCall)({
                        contractAddress: signerContractAddress,
                        contractName: signerContractName,
                        functionName: 'claim-rewards',
                        functionArgs: [
                            transactions_1.Cl.list(bondIndices.map(i => transactions_1.Cl.uint(i))),
                            transactions_1.Cl.uint(cycle),
                        ],
                        publicKey: this.publicKey,
                        fee: BigInt(10000),
                        nonce,
                        network: this.pox5Network,
                        postConditionMode: 'allow',
                        postConditions: [],
                    });
                    const smClaimResult = await this.pox5SignAndBroadcast(smClaimTx, `sm-claim-rewards-cycle-${cycle}`);
                    if ((smClaimResult === null || smClaimResult === void 0 ? void 0 : smClaimResult.txid) && !smClaimResult.error && !smClaimResult.reason) {
                        nonce = nonce + BigInt(1);
                        const smClaimSettled = await this.waitForTxSettlement(smClaimResult.txid);
                        const smClaimRepr = (_f = (_d = (_c = (_b = smClaimSettled.data) === null || _b === void 0 ? void 0 : _b.tx_result) === null || _c === void 0 ? void 0 : _c.repr) !== null && _d !== void 0 ? _d : (_e = smClaimSettled.data) === null || _e === void 0 ? void 0 : _e.tx_error) !== null && _f !== void 0 ? _f : '';
                        // (err u30/u32) means already done — skip. Any other failure stops here.
                        if (((_g = smClaimSettled.data) === null || _g === void 0 ? void 0 : _g.tx_status) !== 'success' && !smClaimRepr.includes('u30') && !smClaimRepr.includes('u32')) {
                            return { success: false, error: `signer-manager.claim-rewards failed at cycle ${cycle}: ${smClaimRepr}`, txHashes };
                        }
                    }
                    else if ((smClaimResult === null || smClaimResult === void 0 ? void 0 : smClaimResult.error) || (smClaimResult === null || smClaimResult === void 0 ? void 0 : smClaimResult.reason)) {
                        const errMsg = [smClaimResult === null || smClaimResult === void 0 ? void 0 : smClaimResult.error, smClaimResult === null || smClaimResult === void 0 ? void 0 : smClaimResult.reason].filter(Boolean).join(' — ');
                        return { success: false, error: `signer-manager.claim-rewards broadcast failed at cycle ${cycle}: ${errMsg}`, txHashes };
                    }
                    // Step 2: signer-manager.claim-staker-rewards — pays this staker their sBTC share
                    // Anyone can call this on behalf of any staker.
                    for (const bondIndex of bondIndices) {
                        const smStakerTx = await (0, transactions_1.makeUnsignedContractCall)({
                            contractAddress: signerContractAddress,
                            contractName: signerContractName,
                            functionName: 'claim-staker-rewards',
                            functionArgs: [
                                transactions_1.Cl.address(this.address),
                                transactions_1.Cl.uint(cycle),
                                transactions_1.Cl.some(transactions_1.Cl.uint(bondIndex)),
                            ],
                            publicKey: this.publicKey,
                            fee: BigInt(10000),
                            nonce,
                            network: this.pox5Network,
                            postConditionMode: 'allow',
                            postConditions: [],
                        });
                        const smStakerResult = await this.pox5SignAndBroadcast(smStakerTx, (_h = opts === null || opts === void 0 ? void 0 : opts.note) !== null && _h !== void 0 ? _h : `sm-claim-staker-rewards-cycle-${cycle}-bond-${bondIndex}`);
                        if (!(smStakerResult === null || smStakerResult === void 0 ? void 0 : smStakerResult.txid) || smStakerResult.error || smStakerResult.reason) {
                            const errMsg = [smStakerResult === null || smStakerResult === void 0 ? void 0 : smStakerResult.error, smStakerResult === null || smStakerResult === void 0 ? void 0 : smStakerResult.reason].filter(Boolean).join(' — ') || 'broadcast failed';
                            return { success: false, error: `Failed at cycle ${cycle} bond ${bondIndex}: ${errMsg}`, txHashes };
                        }
                        const settled = await this.waitForTxSettlement(smStakerResult.txid);
                        if (!settled.success || ((_j = settled.data) === null || _j === void 0 ? void 0 : _j.tx_status) !== 'success') {
                            const stakerRepr = (_p = (_m = (_l = (_k = settled.data) === null || _k === void 0 ? void 0 : _k.tx_result) === null || _l === void 0 ? void 0 : _l.repr) !== null && _m !== void 0 ? _m : (_o = settled.data) === null || _o === void 0 ? void 0 : _o.tx_error) !== null && _p !== void 0 ? _p : '';
                            return { success: false, error: `Claim failed on-chain at cycle ${cycle} bond ${bondIndex}: ${stakerRepr}`, txHashes };
                        }
                        txHashes.push(smStakerResult.txid);
                        nonce = nonce + BigInt(1);
                    }
                }
                return { success: true, txHashes };
            }
            catch (error) {
                return { success: false, error: `Failed to claim rewards: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Returns earned sBTC rewards (sats) for a signerManager + optional bondIndex.
         * Includes staker-specific rewards when this vault's address is in the signer set.
         */
        this.getEarnedRewards = async (signerManager, bondIndex) => {
            try {
                const pox = await (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network });
                const bondFirstRewardCycle = bondIndex !== undefined
                    ? (0, bitcoin_staking_1.bondPeriodToRewardCycle)({ bondIndex, poxInfo: pox })
                    : undefined;
                // Sum across all past cycles for a stable total
                const startCycle = bondFirstRewardCycle !== null && bondFirstRewardCycle !== void 0 ? bondFirstRewardCycle : 0;
                let earned = BigInt(0);
                let stakerEarned = BigInt(0);
                for (let cycle = startCycle; cycle < pox.rewardCycleId; cycle++) {
                    const cycleEarned = await (0, bitcoin_staking_1.fetchEarned)({
                        signerManager,
                        rewardCycle: cycle,
                        bondIndex,
                        network: this.pox5Network,
                    }).catch(() => BigInt(0));
                    earned += cycleEarned;
                    if (this.address) {
                        const cycleStakerEarned = await (0, bitcoin_staking_1.fetchEarnedStakerRewards)({
                            signerManager,
                            rewardCycle: cycle,
                            bondIndex,
                            staker: this.address,
                            network: this.pox5Network,
                        }).catch(() => BigInt(0));
                        stakerEarned += cycleStakerEarned;
                    }
                }
                const cyclesUntilRewards = bondFirstRewardCycle !== undefined
                    ? Math.max(0, bondFirstRewardCycle - pox.rewardCycleId)
                    : undefined;
                return {
                    success: true,
                    data: {
                        current_cycle: pox.rewardCycleId,
                        first_reward_cycle: bondFirstRewardCycle,
                        cycles_until_rewards: cyclesUntilRewards,
                        earned_sats: earned.toString(),
                        staker_earned_sats: stakerEarned.toString(),
                    },
                };
            }
            catch (error) {
                return { success: false, error: `Failed to fetch earned rewards: ${(0, errorHandling_1.formatErrorMessage)(error)}` };
            }
        };
        /**
         * Check account status: balance total, locked amount and delegation status.
         * @returns A promise that resolves to a {CreateTransactionResponse}.
         */
        this.checkStatus = async () => {
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
            if (!this.address || !this.publicKey || !this.vaultAccountId) {
                throw new Error("Address, Public Key or Vault ID are not set");
            }
            console.log(`Checking account status for address: ${this.address}`);
            try {
                const [delegationData, balanceResponse, pox5Info, stakerInfo, bondMembership] = await Promise.all([
                    this.chainService.checkDelegationStatus(this.address).catch(() => null),
                    this.chainService.makeBalanceCalls(this.address),
                    (0, bitcoin_staking_1.fetchPoxInfo)({ network: this.pox5Network }).catch(() => null),
                    (0, bitcoin_staking_1.fetchStakerInfo)({ address: this.address, network: this.pox5Network }).catch(() => null),
                    (0, bitcoin_staking_1.fetchBondMembership)({ address: this.address, network: this.pox5Network }).catch(() => null),
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
                const pox5IsStaked = !!(stakerInfo === null || stakerInfo === void 0 ? void 0 : stakerInfo.staked);
                const pox5Details = pox5IsStaked && (stakerInfo === null || stakerInfo === void 0 ? void 0 : stakerInfo.staked) ? stakerInfo.details : null;
                const unlockBurnHeight = pox5Details && pox5Info
                    ? pox5Info.firstBurnchainBlockHeight
                        + (pox5Details.firstRewardCycle + pox5Details.numCycles) * pox5Info.rewardCycleLength
                    : null;
                const inPreparePhase = pox5Info
                    ? (0, bitcoin_staking_1.isInPreparePhase)({ burnHeight: pox5Info.currentBurnchainBlockHeight, poxInfo: pox5Info })
                    : false;
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
                    stx_only: {
                        is_staked: pox5IsStaked,
                        amount_stx: pox5Details ? (0, helpers_1.microToStx)(pox5Details.amountUstx) : null,
                        signer_manager: (_o = pox5Details === null || pox5Details === void 0 ? void 0 : pox5Details.signer) !== null && _o !== void 0 ? _o : null,
                        first_reward_cycle: (_p = pox5Details === null || pox5Details === void 0 ? void 0 : pox5Details.firstRewardCycle) !== null && _p !== void 0 ? _p : null,
                        num_cycles: (_q = pox5Details === null || pox5Details === void 0 ? void 0 : pox5Details.numCycles) !== null && _q !== void 0 ? _q : null,
                        unlock_burn_height: unlockBurnHeight,
                        current_burn_height: (_r = pox5Info === null || pox5Info === void 0 ? void 0 : pox5Info.currentBurnchainBlockHeight) !== null && _r !== void 0 ? _r : 0,
                        current_cycle_id: (_s = pox5Info === null || pox5Info === void 0 ? void 0 : pox5Info.rewardCycleId) !== null && _s !== void 0 ? _s : 0,
                        is_prepare_phase: inPreparePhase,
                    },
                    bond: bondMembership ? {
                        bond_index: bondMembership.bondIndex,
                        amount_stx: (0, helpers_1.microToStx)(bondMembership.amountUstx),
                        amount_sats: bondMembership.amountSats.toString(),
                        signer_manager: bondMembership.signer,
                        is_l1_lock: bondMembership.isL1Lock,
                    } : null,
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
         * Check eligibility for PoX-5 staking.
         * @returns A promise that resolves to an object indicating eligibility and reason if not eligible.
         */
        this.checkEligibility = async (pox, amountStx) => {
            try {
                // Can't stake if already in an active PoX-5 position — must call updateStake instead
                const stakerInfo = await (0, bitcoin_staking_1.fetchStakerInfo)({ address: this.address, network: this.pox5Network });
                if (stakerInfo.staked) {
                    return {
                        eligible: false,
                        reason: `Account already has an active PoX-5 staking position. Use updateStake to modify it.`,
                    };
                }
                // Block submission when too close to the prepare phase boundary (not just during it)
                const safetyCheck = (0, helpers_1.isSafeToSubmit)(pox);
                if (!safetyCheck.safe) {
                    return {
                        eligible: false,
                        reason: `Too close to prepare phase boundary (${safetyCheck.blocksUntilBoundary} blocks remaining). Try again next cycle (cycle ${pox.rewardCycleId + 1}).`,
                    };
                }
                const balance = await this.getBalance();
                if (!balance.success) {
                    throw new Error(`Could not fetch account balance to check funds sufficiency`);
                }
                if ((0, helpers_1.stxToMicro)(amountStx) > (0, helpers_1.stxToMicro)(balance.balance)) {
                    return {
                        eligible: false,
                        reason: `Amount to stake (${amountStx} STX) exceeds available balance of ${balance.balance} STX.`,
                    };
                }
                return { eligible: true };
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
         * @param note - Optional note shown in Fireblocks console during raw signing.
         * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
         * @returns A response indicating success or failure of the transaction.
         */
        this.stackSolo = async (signerKey, signerSig65Hex, amount, maxAmount, lockPeriod, authId, note, nonce, externalId) => {
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
                    note,
                    nonce,
                    externalId,
                });
                const assertResult = (0, helpers_1.assertResultSuccess)(result);
                if (assertResult.success === false) {
                    return {
                        success: false,
                        error: `Failed to solo stack STX: ${assertResult.error}`,
                    };
                }
                const txStatus = await this.waitForTxSettlement(result.txid);
                if (!txStatus.success || ((_b = txStatus.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== "success") {
                    return {
                        success: false,
                        error: txStatus.error || ((_c = txStatus.data) === null || _c === void 0 ? void 0 : _c.tx_error) || "Transaction failed at the contract level.",
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
         * @param note - Optional note shown in Fireblocks console during raw signing.
         * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
         * @returns A response indicating success or failure of the transaction.
         */
        this.increaseStackedAmount = async (signerKey, signerSig65Hex, increaseBy, maxAmount, authId, note, nonce, externalId) => {
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
                    note,
                    nonce,
                    externalId,
                });
                const assertResult = (0, helpers_1.assertResultSuccess)(result);
                if (assertResult.success === false) {
                    return {
                        success: false,
                        error: `Failed to increase stacked amount: ${assertResult.error}`,
                    };
                }
                const txStatus = await this.waitForTxSettlement(result.txid);
                if (!txStatus.success || ((_b = txStatus.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== "success") {
                    return {
                        success: false,
                        error: txStatus.error || ((_c = txStatus.data) === null || _c === void 0 ? void 0 : _c.tx_error) || "Transaction failed at the contract level.",
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
        * @param note - Optional note shown in Fireblocks console during raw signing.
        * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
        * @returns A response indicating success or failure of the transaction.
        */
        this.extendStackingPeriod = async (signerKey, signerSig65Hex, extendCycles, maxAmount, authId, note, nonce, externalId) => {
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
                    note,
                    nonce,
                    externalId,
                });
                const assertResult = (0, helpers_1.assertResultSuccess)(result);
                if (assertResult.success === false) {
                    return {
                        success: false,
                        error: `Failed to extend stacking period: ${assertResult.error}`,
                    };
                }
                const txStatus = await this.waitForTxSettlement(result.txid);
                if (!txStatus.success || ((_b = txStatus.data) === null || _b === void 0 ? void 0 : _b.tx_status) !== "success") {
                    return {
                        success: false,
                        error: txStatus.error || ((_c = txStatus.data) === null || _c === void 0 ? void 0 : _c.tx_error) || "Transaction failed at the contract level.",
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
         * Replaces a pending transaction with a higher fee (replace-by-fee / RBF).
         *
         * Two mutually exclusive modes — provide one, not both:
         *   - `originalTxId` only: tx is visible in the explorer. SDK looks it up, reads its nonce,
         *     and reconstructs it. Works for token_transfer and contract_call. `newFee` must be
         *     strictly greater than the original fee. `newRecipient`/`newAmount` are optional
         *     overrides for token_transfer only.
         *   - `nonceOverride` only: tx is NOT visible in the explorer. SDK skips lookup entirely.
         *     `originalTxId` is unused — omit it. Only STX transfers supported. `newRecipient` and
         *     `newAmount` are required since there is nothing to reconstruct.
         *
         * @param originalTxId - TX ID to look up and replace. Required unless using nonceOverride.
         * @param newFee - New fee in STX. Must be > 0 and ≤ MAX_FEE_STX.
         * @param newRecipient - New recipient (token_transfer only). Optional on lookup path, required on override path.
         * @param newAmount - New amount in STX (token_transfer only). Optional on lookup path, required on override path.
         * @param nonceOverride - Nonce of the stuck tx. Use only when the tx is not visible in the explorer.
         * @param note - Optional note shown in Fireblocks console during raw signing.
         * @returns A promise that resolves to a {CreateTransactionResponse}.
         */
        this.replaceTransaction = async (newFee, originalTxId, newRecipient, newAmount, nonceOverride, note, externalId) => {
            if (!this.address || !this.publicKey || !this.vaultAccountId) {
                throw new Error("Address, Public Key or Vault ID are not set");
            }
            try {
                (0, validation_1.parseOptionalFee)(newFee);
                (0, validation_1.parseOptionalFee)(newFee);
                const feeBigInt = (0, helpers_1.stxToMicro)(newFee);
                if (!originalTxId && nonceOverride === undefined) {
                    return { success: false, error: "Either originalTxId or nonceOverride must be provided" };
                }
                if (!originalTxId && nonceOverride === undefined) {
                    return { success: false, error: "Either originalTxId or nonceOverride must be provided" };
                }
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
                    const nonceInfo = await this.chainService.getAccountNonce(this.address);
                    if (nonce < nonceInfo.confirmedNonce) {
                        return {
                            success: false,
                            error: `nonceOverride (${nonce}) is below the confirmed nonce (${nonceInfo.confirmedNonce}). This transaction would be rejected.`,
                        };
                    }
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
                    const rawSignature = await this.fireblocksService.signTransaction(transactionToSign.preSignSigHash, this.vaultAccountId.toString(), note, externalId);
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
                // Fee check: new fee must exceed the original by at least 1 microSTX
                // Fee check: new fee must exceed the original by at least 1 microSTX
                const originalFeeUstx = BigInt(fullTx.fee_rate);
                const minFeeUstx = originalFeeUstx + constants_1.RBF_MIN_FEE_BUMP_USTX;
                if (feeBigInt < minFeeUstx) {
                    return {
                        success: false,
                        error: `New fee (${newFee} STX) must be greater than the original fee (${(0, helpers_1.microToStx)(originalFeeUstx)} STX).`,
                    };
                }
                if (fullTx.tx_type === "contract_call" && (newRecipient !== undefined || newAmount !== undefined)) {
                    return {
                        success: false,
                        error: "newRecipient and newAmount can only be changed for native STX transfers. This transaction is a contract_call.",
                    };
                }
                if (fullTx.tx_type === "contract_call" && (newRecipient !== undefined || newAmount !== undefined)) {
                    return {
                        success: false,
                        error: "newRecipient and newAmount can only be changed for native STX transfers. This transaction is a contract_call.",
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
                    const memoHex = fullTx.token_transfer.memo;
                    const memo = memoHex
                        ? Buffer.from(memoHex.slice(2), 'hex').toString('utf8').replace(/\0/g, '') || undefined
                        : undefined;
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
                    const serialized = await this.chainService.serializeTransaction(this.address, this.publicKey, recipient, amountUstx, types_1.TransactionType.STX, undefined, undefined, undefined, undefined, nonce, feeBigInt, memo);
                    unsignedTxWire = serialized.unsignedTx;
                    preSignSigHash = serialized.preSignSigHash;
                }
                else {
                    // contract_call — reconstruct with identical args, same nonce, higher fee
                    const [contractAddress, contractName] = fullTx.contract_call.contract_id.split(".");
                    const functionName = fullTx.contract_call.function_name;
                    const functionArgs = fullTx.contract_call.function_args.map((arg) => (0, transactions_1.hexToCV)(arg.hex));
                    // Reconstruct original post-conditions and mode from the Hiro response.
                    // Dropping them (or switching to Allow) would silently remove "exactly N tokens
                    // can move" safety guarantees on FT transfers.
                    let postConditions;
                    let postConditionMode;
                    try {
                        const modeStr = fullTx.post_condition_mode;
                        postConditionMode = modeStr === "allow" ? transactions_1.PostConditionMode.Allow : transactions_1.PostConditionMode.Deny;
                        postConditions = fullTx.post_conditions.map((pc) => {
                            const principalStr = pc.principal.type_id === "principal_contract"
                                ? `${pc.principal.address}.${pc.principal.contract_name}`
                                : pc.principal.address;
                            const pcBuilder = pc.principal.type_id === "principal_origin" ? transactions_1.Pc.origin() : transactions_1.Pc.principal(principalStr);
                            const amount = BigInt(pc.amount);
                            const withCode = (() => {
                                switch (pc.condition_code) {
                                    case "sent_equal_to": return pcBuilder.willSendEq(amount);
                                    case "sent_greater_than": return pcBuilder.willSendGt(amount);
                                    case "sent_greater_than_or_equal_to": return pcBuilder.willSendGte(amount);
                                    case "sent_less_than": return pcBuilder.willSendLt(amount);
                                    case "sent_less_than_or_equal_to": return pcBuilder.willSendLte(amount);
                                    default: throw new Error(`Unsupported post-condition code: ${pc.condition_code}`);
                                }
                            })();
                            if (pc.type === "stx")
                                return withCode.ustx();
                            if (pc.type === "fungible") {
                                return withCode.ft(`${pc.asset.contract_address}.${pc.asset.contract_name}`, pc.asset.asset_name);
                            }
                            throw new Error(`Unsupported post-condition type: ${pc.type}`);
                        });
                    }
                    catch (_b) {
                        return {
                            success: false,
                            error: "Cannot replace transaction: failed to reconstruct original post-conditions. Refusing to replace to avoid weakening safety guarantees.",
                        };
                    }
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
                    const serialized = await this.chainService.serializeContractCall(this.publicKey, contractAddress, contractName, functionName, functionArgs, nonce, feeBigInt, postConditions, postConditionMode);
                    unsignedTxWire = serialized.unsignedContractCall;
                    preSignSigHash = serialized.preSignSigHash;
                }
                const rawSignature = await this.fireblocksService.signTransaction(preSignSigHash, this.vaultAccountId.toString(), note, externalId);
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
                if (error instanceof validation_1.ValidationError) {
                    return { success: false, error: error.message };
                }
                if (error instanceof validation_1.ValidationError) {
                    return { success: false, error: error.message };
                }
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
        this.makeContractCall = async (contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode, externalId) => {
            try {
                if (!this.address || !this.publicKey || !this.vaultAccountId) {
                    throw new Error("Address, Public Key or Vault ID are not set");
                }
                console.log(`Making contract call to ${contractAddress}.${contractName} function ${functionName} with ${functionArgs.length} arg(s)`);
                const result = await this.buildSignSendContractCall({
                    functionName: "generic-contract-call",
                    contractCallParams: { contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode },
                    externalId,
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
        this.signExternalTransaction = async (txHex, externalId) => {
            try {
                if (!this.publicKey || !this.vaultAccountId) {
                    throw new Error("Public key or vault ID are not set");
                }
                const txBytes = Buffer.from(txHex, 'hex');
                const tx = (0, transactions_1.deserializeTransaction)(txBytes);
                const sigHash = tx.signBegin();
                const preSignSigHash = (0, transactions_1.sigHashPreSign)(sigHash, tx.auth.authType, tx.auth.spendingCondition.fee, tx.auth.spendingCondition.nonce);
                const rawSignature = await this.fireblocksService.signTransaction(preSignSigHash, this.vaultAccountId.toString(), '', externalId);
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
        this.signMessage = async (message, externalId) => {
            try {
                if (!this.vaultAccountId) {
                    throw new Error("Vault ID is not set");
                }
                const { hashMessage } = require('@stacks/encryption');
                const { bytesToHex } = require('@stacks/common');
                const hash = bytesToHex(hashMessage(message));
                const rawSignature = await this.fireblocksService.signTransaction(hash, this.vaultAccountId.toString(), '', externalId);
                const vHex = rawSignature.v === 0 ? '00' : '01';
                const signature = rawSignature.fullSig + vHex;
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
        this.signStructuredMessage = async (message, domain, externalId) => {
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
                const rawSignature = await this.fireblocksService.signTransaction(hash, this.vaultAccountId.toString(), '', externalId);
                const vHex = rawSignature.v === 0 ? '00' : '01';
                const signature = rawSignature.fullSig + vHex;
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
    get pox5Network() {
        return this.testnet ? _a.POX5_TESTNET : network_1.STACKS_MAINNET;
    }
    // --- BTC Bond helpers ---
    esploraBase() {
        return this.testnet ? constants_1.BTC_ESPLORA.testnet : constants_1.BTC_ESPLORA.mainnet;
    }
    // ─── §11: BTC signing helpers (private) ─────────────────────────────────────
    // Private-1 regtest uses bech32 prefix 'bcrt', not 'tb' (testnet3).
    get btcNetwork() {
        return this.testnet ? Object.assign(Object.assign({}, btc.TEST_NETWORK), { bech32: 'bcrt' }) : btc.NETWORK;
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
// PoX-5 private testnet: chainId 256, magicBytes 'id' (devnet) so buildRegisterMetadata
// derives bcrt1… addresses matching the private regtest Bitcoin burn chain.
StacksSDK.POX5_TESTNET = Object.assign(Object.assign({}, network_1.STACKS_TESTNET), { chainId: 256, magicBytes: 'id', client: { baseUrl: 'https://api.private-1.hiro.so' } });
