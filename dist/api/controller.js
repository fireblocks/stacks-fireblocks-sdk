"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPoolMetrics = exports.getPoxInfo = exports.extendStackingPeriod = exports.increaseStackedAmount = exports.stackSolo = exports.getTxStatusById = exports.revokeDelegation = exports.allowContractCaller = exports.delegateToPool = exports.createTransaction = exports.getTransactionHistory = exports.getFtBalances = exports.getBalance = exports.getPublicKey = exports.checkStatus = exports.getBtcRewardsAddress = exports.getAddress = void 0;
const api_service_1 = require("./api.service");
const types_1 = require("../pool/types");
const types_2 = require("../services/types");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../utils/constants");
const apiService = api_service_1.apiServiceSingleton;
// Helper to safely extract vaultId from params (Express types it as string | string[])
const getVaultId = (req) => {
    const vaultId = req.params.vaultId;
    return Array.isArray(vaultId) ? vaultId[0] : vaultId;
};
// GET /:vaultId/address
const getAddress = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const address = await apiService.executeAction(vaultId, types_1.ActionType.GET_ACCOUNT_ADDRESS, {});
        res.json({ address });
    }
    catch (err) {
        next(err);
    }
};
exports.getAddress = getAddress;
// GET /:vaultId/btc-rewards-address
const getBtcRewardsAddress = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const address = await apiService.executeAction(vaultId, types_1.ActionType.GET_BTC_REWARDS_ADDRESS, {});
        res.json({ address });
    }
    catch (err) {
        next(err);
    }
};
exports.getBtcRewardsAddress = getBtcRewardsAddress;
// GET /:vaultId/check-status
const checkStatus = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const status = await apiService.executeAction(vaultId, types_1.ActionType.CHECK_STATUS, {});
        res.json(status);
    }
    catch (err) {
        next(err);
    }
};
exports.checkStatus = checkStatus;
// GET /:vaultId/publicKey
const getPublicKey = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const pubKey = await apiService.executeAction(vaultId, types_1.ActionType.GET_ACCOUNT_PUBLIC_KEY, {});
        res.json({ publicKey: pubKey });
    }
    catch (err) {
        next(err);
    }
};
exports.getPublicKey = getPublicKey;
// GET /:vaultId/balance
const getBalance = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const balance = await apiService.executeAction(vaultId, types_1.ActionType.GET_BALANCE, {});
        res.json(balance);
    }
    catch (err) {
        next(err);
    }
};
exports.getBalance = getBalance;
// GET /:vaultId/ft-balances
const getFtBalances = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const ftBalances = await apiService.executeAction(vaultId, types_1.ActionType.GET_FT_BALANCES, {});
        res.json(ftBalances);
    }
    catch (err) {
        next(err);
    }
};
exports.getFtBalances = getFtBalances;
// GET /:vaultId/transactions
const getTransactionHistory = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const getCachedTransactions = String(req.query.getCachedTransactions).toLowerCase() === "true"
            ? true
            : false;
        // Parse limit; service paginates internally so limit can exceed the 50-per-request Stacks API cap
        let limit = req.query.limit ? Number(req.query.limit) : constants_1.helperConstants.stacks_api_max_limit;
        if (!Number.isInteger(limit) || limit <= 0) {
            res.status(400).json({ error: "Bad Request: limit must be a positive integer" });
            return;
        }
        if (limit > constants_1.helperConstants.stacks_api_max_limit) {
            limit = constants_1.helperConstants.stacks_api_max_limit;
        }
        const offset = req.query.offset ? Number(req.query.offset) : 0;
        if (!Number.isInteger(offset) || offset < 0) {
            res.status(400).json({ error: "Bad Request: offset must be a non-negative integer" });
            return;
        }
        const history = await apiService.executeAction(vaultId, types_1.ActionType.GET_TRANSACTIONS_HISTORY, { getCachedTransactions, limit, offset });
        res.json(history);
    }
    catch (err) {
        next(err);
    }
};
exports.getTransactionHistory = getTransactionHistory;
// POST /:vaultId/transfer
const createTransaction = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const recipientAddress = String(req.body.recipientAddress || "");
        const amountStr = String(req.body.amount || "");
        const assetUi = String(req.body.assetType || "").trim(); // "STX" | "sBTC" | "USDCx" | "Custom"
        const grossTransaction = req.body.grossTransaction === true ||
            String(req.body.grossTransaction || "false").toLowerCase() === "true";
        const note = req.body.note ? String(req.body.note) : undefined;
        const tokenContractAddress = req.body.tokenContractAddress
            ? String(req.body.tokenContractAddress).trim()
            : undefined;
        const tokenContractName = req.body.tokenContractName
            ? String(req.body.tokenContractName).trim()
            : undefined;
        const tokenAssetName = req.body.tokenAssetName
            ? String(req.body.tokenAssetName).trim()
            : undefined;
        if (!recipientAddress || !amountStr || !assetUi) {
            res.status(400).json({
                error: "Bad Request: recipientAddress, amount and assetType are required",
            });
            return;
        }
        // Validate custom token fields
        if (assetUi === "Custom") {
            if (!tokenContractAddress || !tokenContractName || !tokenAssetName) {
                res.status(400).json({
                    error: "Bad Request: tokenContractAddress, tokenContractName, and tokenAssetName are required when assetType is Custom",
                });
                return;
            }
        }
        const amount = Number(amountStr);
        if (!Number.isFinite(amount) || amount <= 0) {
            res.status(400).json({ error: "Bad Request: amount must be > 0" });
            return;
        }
        // Map UI label -> TokenType (enum value)
        const mapUiToTokenType = {
            STX: types_2.TokenType.STX,
            sBTC: types_2.TokenType.sBTC,
            USDCx: types_2.TokenType.USDCx,
            Custom: types_2.TokenType.CUSTOM,
        };
        const tokenType = mapUiToTokenType[assetUi];
        // Validate assetType (must be known token or Custom)
        if (!tokenType && assetUi !== "Custom") {
            res.status(400).json({ error: `Unsupported assetType: ${assetUi}` });
            return;
        }
        // Route: STX -> native; others -> FT
        if (tokenType === types_2.TokenType.STX) {
            const tx = await apiService.executeAction(vaultId, types_1.ActionType.CREATE_NATIVE_TRANSACTION, { recipientAddress, amount, grossTransaction, note });
            res.json(tx);
            return;
        }
        // FT transfer
        const tx = await apiService.executeAction(vaultId, types_1.ActionType.CREATE_FT_TRANSACTION, {
            recipientAddress,
            amount,
            tokenType,
            tokenContractAddress,
            tokenContractName,
            tokenAssetName,
            note,
        });
        res.json(tx);
    }
    catch (err) {
        next(err);
    }
};
exports.createTransaction = createTransaction;
// POST /:vaultId/stacking/pool/delegate
const delegateToPool = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const amountStr = String(req.body.amount || "");
        const lockPeriodStr = String(req.body.lockPeriod || "1");
        const pool = String(req.body.pool || "FAST_POOL").trim();
        if (!pool || !amountStr) {
            res.status(400).json({
                error: "Bad Request: pool and amount are required",
            });
            return;
        }
        const amount = Number(amountStr);
        if (!(0, helpers_1.validateAmount)(amount)) {
            res.status(400).json({ error: "Bad Request: amount is invalid" });
            return;
        }
        const lockPeriod = Number(lockPeriodStr);
        if (!Number.isInteger(lockPeriod) || lockPeriod < 1 || lockPeriod > 12) {
            res.status(400).json({
                error: "Bad Request: lockPeriod must be an integer between 1 and 12",
            });
            return;
        }
        // Map UI label -> Pool Type (enum value)
        const poolSelectionMap = {
            FAST_POOL: types_2.StackingPools.FAST_POOL,
        };
        const poolType = poolSelectionMap[pool];
        if (!poolType) {
            res.status(400).json({ error: `Unsupported pool: ${poolType}` });
            return;
        }
        const poolAddress = constants_1.poolInfo[poolType].poolAddress;
        const poolContractName = constants_1.poolInfo[poolType].poolContractName;
        // FT transfer
        const tx = await apiService.executeAction(vaultId, types_1.ActionType.DELEGATE_TO_POOL, { poolAddress, poolContractName, amount, lockPeriod });
        res.json(tx);
    }
    catch (err) {
        next(err);
    }
};
exports.delegateToPool = delegateToPool;
// POST /:vaultId/stacking/pool/allow-contract-caller
const allowContractCaller = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const pool = String(req.body.pool || "FAST_POOL").trim();
        if (!pool) {
            res.status(400).json({
                error: "Bad Request: pool is required",
            });
            return;
        }
        // Map UI label -> Pool Type (enum value)
        const poolSelectionMap = {
            FAST_POOL: types_2.StackingPools.FAST_POOL,
        };
        const poolType = poolSelectionMap[pool];
        if (!poolType) {
            res.status(400).json({ error: `Unsupported pool: ${poolType}` });
            return;
        }
        const poolAddress = constants_1.poolInfo[poolType].poolAddress;
        const poolContractName = constants_1.poolInfo[poolType].poolContractName;
        // FT transfer
        const tx = await apiService.executeAction(vaultId, types_1.ActionType.ALLOW_CONTRACT_CALLER, { poolAddress, poolContractName });
        res.json(tx);
    }
    catch (err) {
        next(err);
    }
};
exports.allowContractCaller = allowContractCaller;
// POST /:vaultId/revoke-delegation
const revokeDelegation = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const tx = await apiService.executeAction(vaultId, types_1.ActionType.REVOKE_DELEGATION, {});
        res.json(tx);
    }
    catch (err) {
        next(err);
    }
};
exports.revokeDelegation = revokeDelegation;
// GET /:vaultId/transactions/:txId
const getTxStatusById = async (req, res, next) => {
    try {
        const { txId } = req.params;
        if (!txId || typeof txId !== "string") {
            res.status(400).json({ error: "Bad Request: txId is required" });
            return;
        }
        const tx = await apiService.executeAction(constants_1.helperConstants.vaultIdForReadOnlyActions, types_1.ActionType.GET_TX_STATUS_BY_ID, { txId });
        res.json(tx);
    }
    catch (err) {
        next(err);
    }
};
exports.getTxStatusById = getTxStatusById;
// POST /:vaultId/stacking/solo
const stackSolo = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const signerKey = String(req.body.signerKey || "").trim();
        const signerSig65Hex = String(req.body.signerSig65Hex || "").trim();
        const amountStr = String(req.body.amount || "");
        const maxAmountStr = String(req.body.maxAmount || "");
        const lockPeriodStr = String(req.body.lockPeriod || "1");
        const authIdStr = String(req.body.authId || "");
        if (!amountStr || !maxAmountStr) {
            res.status(400).json({ error: "Bad Request: amount and maxAmount are required" });
            return;
        }
        const amount = Number(amountStr);
        if (!Number.isFinite(amount) || amount <= 0) {
            res.status(400).json({ error: "Bad Request: amount must be > 0" });
            return;
        }
        const lockPeriod = Number(lockPeriodStr);
        if (!Number.isInteger(lockPeriod) || lockPeriod < 1 || lockPeriod > 12) {
            res.status(400).json({
                error: "Bad Request: lockPeriod must be an integer between 1 and 12",
            });
            return;
        }
        if (!/^[0-9]+$/.test(authIdStr)) {
            res.status(400).json({
                error: "Bad Request: authId must be a positive integer string",
            });
            return;
        }
        const authId = BigInt(authIdStr);
        if (!/^[0-9]+$/.test(maxAmountStr)) {
            res.status(400).json({
                error: "Bad Request: maxAmount must be a positive integer string (microSTX)",
            });
            return;
        }
        const maxAmount = Number(maxAmountStr);
        const tx = await apiService.executeAction(vaultId, types_1.ActionType.STACK_SOLO, {
            signerKey,
            signerSig65Hex,
            amount,
            maxAmount,
            lockPeriod,
            authId,
        });
        res.json(tx);
    }
    catch (err) {
        next(err);
    }
};
exports.stackSolo = stackSolo;
// POST /:vaultId/stacking/solo/increase
const increaseStackedAmount = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const signerKey = String(req.body.signerKey || "").trim();
        const signerSig65Hex = String(req.body.signerSig65Hex || "").trim();
        const increaseByStr = String(req.body.increaseBy || "");
        const maxAmountStr = String(req.body.maxAmount || "");
        const authIdStr = String(req.body.authId || "");
        if (!signerKey || !signerSig65Hex || !increaseByStr || !maxAmountStr || !authIdStr) {
            res.status(400).json({
                error: "Bad Request: signerKey, signerSig65Hex, increaseBy, maxAmount and authId are required",
            });
            return;
        }
        const increaseBy = Number(increaseByStr);
        if (!Number.isFinite(increaseBy) || increaseBy <= 0) {
            res.status(400).json({ error: "Bad Request: increaseBy must be > 0" });
            return;
        }
        if (!/^[0-9]+$/.test(authIdStr)) {
            res.status(400).json({
                error: "Bad Request: authId must be a positive integer string",
            });
            return;
        }
        const authId = BigInt(authIdStr);
        if (!/^[0-9]+$/.test(maxAmountStr)) {
            res.status(400).json({
                error: "Bad Request: maxAmount must be a positive integer string (microSTX)",
            });
            return;
        }
        const maxAmount = BigInt(maxAmountStr);
        const tx = await apiService.executeAction(vaultId, types_1.ActionType.INCREASE_STACKED_AMOUNT, {
            signerKey,
            signerSig65Hex,
            increaseBy,
            maxAmount,
            authId,
        });
        res.json(tx);
    }
    catch (err) {
        next(err);
    }
};
exports.increaseStackedAmount = increaseStackedAmount;
// POST /:vaultId/stacking/solo/extend
const extendStackingPeriod = async (req, res, next) => {
    try {
        const vaultId = getVaultId(req);
        const signerKey = String(req.body.signerKey || "").trim();
        const signerSig65Hex = String(req.body.signerSig65Hex || "").trim();
        const extendCyclesStr = String(req.body.extendCycles || "");
        const maxAmountStr = String(req.body.maxAmount || "");
        const authIdStr = String(req.body.authId || "");
        if (!signerKey || !signerSig65Hex || !extendCyclesStr || !maxAmountStr || !authIdStr) {
            res.status(400).json({
                error: "Bad Request: signerKey, signerSig65Hex, extendCycles, maxAmount and authId are required",
            });
            return;
        }
        const extendCycles = Number(extendCyclesStr);
        if (!Number.isInteger(extendCycles) || extendCycles < 1 || extendCycles > 12) {
            res.status(400).json({
                error: "Bad Request: extendCycles must be an integer between 1 and 12",
            });
            return;
        }
        if (!/^[0-9]+$/.test(authIdStr)) {
            res.status(400).json({
                error: "Bad Request: authId must be a positive integer string",
            });
            return;
        }
        const authId = BigInt(authIdStr);
        if (!/^[0-9]+$/.test(maxAmountStr)) {
            res.status(400).json({
                error: "Bad Request: maxAmount must be a positive integer string (microSTX)",
            });
            return;
        }
        const maxAmount = Number(maxAmountStr);
        const tx = await apiService.executeAction(vaultId, types_1.ActionType.EXTEND_STACKING_PERIOD, {
            signerKey,
            signerSig65Hex,
            extendCycles,
            maxAmount,
            authId,
        });
        res.json(tx);
    }
    catch (err) {
        next(err);
    }
};
exports.extendStackingPeriod = extendStackingPeriod;
// GET /poxInfo
const getPoxInfo = async (req, res, next) => {
    try {
        const poxInfo = await apiService.executeAction(constants_1.helperConstants.vaultIdForReadOnlyActions, types_1.ActionType.GET_POX_INFO, {});
        res.json(poxInfo);
    }
    catch (err) {
        next(err);
    }
};
exports.getPoxInfo = getPoxInfo;
// GET /metrics
const getPoolMetrics = async (req, res, next) => {
    try {
        const metrics = apiService.getPoolMetrics();
        res.json(metrics);
    }
    catch (err) {
        next(err);
    }
};
exports.getPoolMetrics = getPoolMetrics;
