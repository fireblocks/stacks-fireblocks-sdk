import { Request, Response, NextFunction } from "express";
import { apiServiceSingleton } from "./api.service";
import { ActionType } from "../pool/types";
import { StackingPools, TokenType } from "../services/types";
import { validateAmount } from "../utils/helpers";
import { helperConstants, poolInfo } from "../utils/constants";
import { parseOptionalFee, parseOptionalNonce } from "../utils/validation";

const apiService = apiServiceSingleton;

// Handler utilities
type Handler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

// Helper to safely extract vaultId from params (Express types it as string | string[])
const getVaultId = (req: Request): string => {
  const vaultId = req.params.vaultId;
  return Array.isArray(vaultId) ? vaultId[0] : vaultId;
};

// GET /:vaultId/address
export const getAddress: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const address = await apiService.executeAction(
      vaultId,
      ActionType.GET_ACCOUNT_ADDRESS,
      {},
    );
    res.json({ address });
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/btc-rewards-address
export const getBtcRewardsAddress: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const address = await apiService.executeAction(
      vaultId,
      ActionType.GET_BTC_REWARDS_ADDRESS,
      {},
    );
    res.json({ address });
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/check-status
export const checkStatus: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const status = await apiService.executeAction(
      vaultId,
      ActionType.CHECK_STATUS,
      {},
    );
    res.json(status);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/publicKey
export const getPublicKey: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const pubKey = await apiService.executeAction(
      vaultId,
      ActionType.GET_ACCOUNT_PUBLIC_KEY,
      {},
    );
    res.json({ publicKey: pubKey });
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/nonce
export const getAccountNonce: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const result = await apiService.executeAction(
      vaultId,
      ActionType.GET_ACCOUNT_NONCE,
      {},
    ) as any;
    res.json({
      ...result,
      ...(result.confirmedNonce !== undefined && { confirmedNonce: result.confirmedNonce.toString() }),
      ...(result.nextAvailable !== undefined && { nextAvailable: result.nextAvailable.toString() }),
    });
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/balance
export const getBalance: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const balance = await apiService.executeAction(
      vaultId,
      ActionType.GET_BALANCE,
      {},
    );
    res.json(balance);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/ft-balances
export const getFtBalances: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const ftBalances = await apiService.executeAction(
      vaultId,
      ActionType.GET_FT_BALANCES,
      {},
    );
    res.json(ftBalances);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/transactions
export const getTransactionHistory: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const getCachedTransactions =
      String(req.query.getCachedTransactions).toLowerCase() === "true"
        ? true
        : false;

    const fetchAll = String(req.query.fetchAll).toLowerCase() === "true";
    const fetchPending = String(req.query.fetchPending).toLowerCase() === "true";

    let limit = req.query.limit ? Number(req.query.limit) : helperConstants.stacks_api_max_limit;
    if (!Number.isInteger(limit) || limit <= 0) {
      res.status(400).json({ error: "Bad Request: limit must be a positive integer" });
      return;
    }
    if (!fetchAll && limit > helperConstants.stacks_api_max_limit) {
      limit = helperConstants.stacks_api_max_limit;
    }

    const offset = req.query.offset ? Number(req.query.offset) : 0;
    if (!Number.isInteger(offset) || offset < 0) {
      res.status(400).json({ error: "Bad Request: offset must be a non-negative integer" });
      return;
    }

    const history = await apiService.executeAction(
      vaultId,
      ActionType.GET_TRANSACTIONS_HISTORY,
      { getCachedTransactions, limit, offset, fetchAll, fetchPending },
    );

    res.json(history);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/transfer
export const createTransaction: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const recipientAddress = String(req.body.recipientAddress || "");
    const amountStr = String(req.body.amount || "");
    const assetUi = String(req.body.assetType || "").trim(); // "STX" | "sBTC" | "USDCx" | "Custom"
    const grossTransaction =
      req.body.grossTransaction === true ||
      String(req.body.grossTransaction || "false").toLowerCase() === "true";
    const note = req.body.note ? String(req.body.note) : undefined;
    const memo = req.body.memo ? String(req.body.memo) : undefined;
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;
    const tokenContractAddress = req.body.tokenContractAddress
      ? String(req.body.tokenContractAddress).trim()
      : undefined;
    const tokenContractName = req.body.tokenContractName
      ? String(req.body.tokenContractName).trim()
      : undefined;
    const tokenAssetName = req.body.tokenAssetName
      ? String(req.body.tokenAssetName).trim()
      : undefined;

    const nonce = parseOptionalNonce(req.body.nonce);
    const fee = parseOptionalFee(req.body.fee);

    if (!recipientAddress || !amountStr || !assetUi) {
      res.status(400).json({
        error:
          "Bad Request: recipientAddress, amount and assetType are required",
      });
      return;
    }

    // Validate custom token fields
    if (assetUi === "Custom") {
      if (!tokenContractAddress || !tokenContractName || !tokenAssetName) {
        res.status(400).json({
          error:
            "Bad Request: tokenContractAddress, tokenContractName, and tokenAssetName are required when assetType is Custom",
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
    const mapUiToTokenType: Record<string, TokenType> = {
      STX: TokenType.STX,
      sBTC: TokenType.sBTC,
      USDCx: TokenType.USDCx,
      Custom: TokenType.CUSTOM,
    };
    const tokenType = mapUiToTokenType[assetUi];

    // Validate assetType (must be known token or Custom)
    if (!tokenType && assetUi !== "Custom") {
      res.status(400).json({ error: `Unsupported assetType: ${assetUi}` });
      return;
    }

    // Route: STX -> native; others -> FT
    if (tokenType === TokenType.STX) {
      const tx = await apiService.executeAction(
        vaultId,
        ActionType.CREATE_NATIVE_TRANSACTION,
        { recipientAddress, amount, grossTransaction, note, nonce, fee, memo, externalId },
      );
      res.json(tx);
      return;
    }

    // FT transfer
    const tx = await apiService.executeAction(
      vaultId,
      ActionType.CREATE_FT_TRANSACTION,
      {
        recipientAddress,
        amount,
        tokenType,
        tokenContractAddress,
        tokenContractName,
        tokenAssetName,
        note,
        nonce,
        externalId,
      },
    );
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pool/delegate
export const delegateToPool: Handler = async (req, res, next) => {
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
    if (!validateAmount(amount)) {
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

    const nonce = parseOptionalNonce(req.body.nonce);

    // Map UI label -> Pool Type (enum value)
    const poolSelectionMap: Record<string, StackingPools> = {
      FAST_POOL: StackingPools.FAST_POOL,
    };
    const poolType = poolSelectionMap[pool];

    if (!poolType) {
      res.status(400).json({ error: `Unsupported pool: ${poolType}` });
      return;
    }

    const poolAddress = poolInfo[poolType].poolAddress;
    const poolContractName = poolInfo[poolType].poolContractName;

    const tx = await apiService.executeAction(
      vaultId,
      ActionType.DELEGATE_TO_POOL,
      { poolAddress, poolContractName, amount, lockPeriod, nonce },
    );
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pool/allow-contract-caller
export const allowContractCaller: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const pool = String(req.body.pool || "FAST_POOL").trim();

    if (!pool) {
      res.status(400).json({
        error: "Bad Request: pool is required",
      });
      return;
    }

    const nonce = parseOptionalNonce(req.body.nonce);

    // Map UI label -> Pool Type (enum value)
    const poolSelectionMap: Record<string, StackingPools> = {
      FAST_POOL: StackingPools.FAST_POOL,
    };
    const poolType = poolSelectionMap[pool];

    if (!poolType) {
      res.status(400).json({ error: `Unsupported pool: ${poolType}` });
      return;
    }

    const poolAddress = poolInfo[poolType].poolAddress;
    const poolContractName = poolInfo[poolType].poolContractName;

    const tx = await apiService.executeAction(
      vaultId,
      ActionType.ALLOW_CONTRACT_CALLER,
      { poolAddress, poolContractName, nonce },
    );
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/revoke-delegation
export const revokeDelegation: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const nonce = parseOptionalNonce(req.body?.nonce);

    const tx = await apiService.executeAction(
      vaultId,
      ActionType.REVOKE_DELEGATION,
      { nonce },
    );
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/transactions/:txId
export const getTxStatusById: Handler = async (req, res, next) => {
  try {
    const {  txId } = req.params;

    if (!txId || typeof txId !== "string") {
      res.status(400).json({ error: "Bad Request: txId is required" });
      return;
    }

    const tx = await apiService.executeAction(
      helperConstants.vaultIdForReadOnlyActions,
      ActionType.GET_TX_STATUS_BY_ID,
      { txId },
    );

    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/solo
export const stackSolo: Handler = async (req, res, next) => {
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

    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);

    const tx = await apiService.executeAction(vaultId, ActionType.STACK_SOLO, {
      signerKey,
      signerSig65Hex,
      amount,
      maxAmount,
      lockPeriod,
      authId,
      note,
      nonce,
    });

    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/solo/increase
export const increaseStackedAmount: Handler = async (req, res, next) => {
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

    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);

    const tx = await apiService.executeAction(vaultId, ActionType.INCREASE_STACKED_AMOUNT, {
      signerKey,
      signerSig65Hex,
      increaseBy,
      maxAmount,
      authId,
      note,
      nonce,
    });

    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/solo/extend
export const extendStackingPeriod: Handler = async (req, res, next) => {
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

    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);

    const tx = await apiService.executeAction(vaultId, ActionType.EXTEND_STACKING_PERIOD, {
      signerKey,
      signerSig65Hex,
      extendCycles,
      maxAmount,
      authId,
      note,
      nonce,
    });

    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// GET /poxInfo
export const getPoxInfo: Handler = async (req, res, next) => {
  try {
    const poxInfo = await apiService.executeAction(helperConstants.vaultIdForReadOnlyActions, ActionType.GET_POX_INFO, {});
    res.json(poxInfo);
  } catch (err) {
    next(err);
  }
};


// POST /:vaultId/replace-transaction
export const replaceTransaction: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const originalTxId = req.body.originalTxId ? String(req.body.originalTxId).trim() : undefined;
    const newRecipient = req.body.newRecipient ? String(req.body.newRecipient).trim() : undefined;
    const note = req.body.note ? String(req.body.note) : undefined;
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;

    if (req.body.newFee === undefined || req.body.newFee === "") {
      res.status(400).json({ error: "Bad Request: newFee is required" });
      return;
    }

    const newFee = parseOptionalFee(req.body.newFee)!;
    const newAmount = parseOptionalFee(req.body.newAmount);
    const nonceOverride = parseOptionalNonce(req.body.nonceOverride);

    if (!originalTxId && nonceOverride === undefined) {
      res.status(400).json({
        error: "Bad Request: either originalTxId or nonceOverride must be provided",
      });
      return;
    }

    if (nonceOverride !== undefined) {
      if (!newRecipient || newAmount === undefined) {
        res.status(400).json({
          error: "Bad Request: newRecipient and newAmount are required when nonceOverride is provided",
        });
        return;
      }
    }

    const tx = await apiService.executeAction(
      vaultId,
      ActionType.REPLACE_TRANSACTION,
      { originalTxId, newFee, newRecipient, newAmount, nonceOverride, note, externalId },
    );
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/stake
export const stake: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const amountStr = String(req.body.amount || "");
    const numCyclesStr = String(req.body.numCycles || "");
    const signerManager = String(req.body.signerManager || "").trim();

    if (!amountStr || !numCyclesStr || !signerManager) {
      res.status(400).json({ error: "Bad Request: amount, numCycles, and signerManager are required" });
      return;
    }

    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: "Bad Request: amount must be > 0" });
      return;
    }

    const numCycles = Number(numCyclesStr);
    if (!Number.isInteger(numCycles) || numCycles < 1 || numCycles > 96) {
      res.status(400).json({ error: "Bad Request: numCycles must be an integer between 1 and 96" });
      return;
    }

    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;

    const tx = await apiService.executeAction(vaultId, ActionType.STAKE, {
      amount, numCycles, signerManager, note, nonce, externalId,
    });
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/update
export const updateStake: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const signerManager = req.body.signerManager ? String(req.body.signerManager).trim() : undefined;
    const oldSignerManager = req.body.oldSignerManager ? String(req.body.oldSignerManager).trim() : undefined;

    if (!signerManager || !oldSignerManager) {
      res.status(400).json({ error: "Bad Request: signerManager and oldSignerManager are required" });
      return;
    }

    const cyclesToExtend = req.body.cyclesToExtend !== undefined ? Number(req.body.cyclesToExtend) : undefined;
    const increaseBy = req.body.increaseBy !== undefined ? Number(req.body.increaseBy) : undefined;
    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;

    const tx = await apiService.executeAction(vaultId, ActionType.UPDATE_STAKE, {
      signerManager, oldSignerManager, cyclesToExtend, increaseBy, note, nonce, externalId,
    });
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/unstake
export const unstake: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const oldSignerManager = req.body.oldSignerManager ? String(req.body.oldSignerManager).trim() : undefined;
    if (!oldSignerManager) {
      res.status(400).json({ error: "Bad Request: oldSignerManager is required" });
      return;
    }

    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;

    const tx = await apiService.executeAction(vaultId, ActionType.UNSTAKE, { oldSignerManager, note, nonce, externalId });
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/grant-signer-key
export const grantSignerKey: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const signerManager = String(req.body.signerManager || "").trim();
    const authIdStr = String(req.body.authId || "");

    if (!signerManager || !authIdStr) {
      res.status(400).json({ error: "Bad Request: signerManager and authId are required" });
      return;
    }

    if (!/^[0-9]+$/.test(authIdStr)) {
      res.status(400).json({ error: "Bad Request: authId must be a positive integer string" });
      return;
    }

    const authId = BigInt(authIdStr);
    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;

    const tx = await apiService.executeAction(vaultId, ActionType.GRANT_SIGNER_KEY, {
      signerManager, authId, note, nonce, externalId,
    });
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/revoke-signer-grant
export const revokeSignerGrant: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const signerManager = String(req.body.signerManager || "").trim();
    const signerKey = String(req.body.signerKey || "").trim();

    if (!signerManager || !signerKey) {
      res.status(400).json({ error: "Bad Request: signerManager and signerKey are required" });
      return;
    }

    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;

    const tx = await apiService.executeAction(vaultId, ActionType.REVOKE_SIGNER_GRANT, {
      signerManager, signerKey, note, nonce, externalId,
    });
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/stacking/pox5/verify-signer-grant
export const verifySignerGrant: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const signerManager = String(req.query.signerManager || "").trim();
    const txid = req.query.txid ? String(req.query.txid).trim() : undefined;

    if (!signerManager) {
      res.status(400).json({ error: "Bad Request: signerManager is a required query parameter" });
      return;
    }

    const result = await apiService.executeAction(vaultId, ActionType.VERIFY_SIGNER_GRANT, { signerManager, txid });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /stacking/pox5/info
export const getPox5Info: Handler = async (req, res, next) => {
  try {
    const info = await apiService.executeAction(helperConstants.vaultIdForReadOnlyActions, ActionType.GET_POX5_INFO, {});
    res.json(info);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/stacking/pox5/staker-info
export const getStakerInfo: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const info = await apiService.executeAction(vaultId, ActionType.GET_STAKER_INFO, {});
    res.json(info);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/stacking/pox5/requirements
export const getRequirements: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const bondIndexStr = req.query.bondIndex ? String(req.query.bondIndex) : undefined;
    const btcAmountSatsStr = req.query.btcAmountSats ? String(req.query.btcAmountSats) : undefined;

    let bondIndex: number | undefined;
    if (bondIndexStr !== undefined) {
      bondIndex = Number(bondIndexStr);
      if (!Number.isInteger(bondIndex) || bondIndex < 0) {
        res.status(400).json({ error: "Bad Request: bondIndex must be a non-negative integer" });
        return;
      }
    }

    let btcAmountSats: bigint | undefined;
    if (btcAmountSatsStr !== undefined) {
      if (bondIndex === undefined) {
        res.status(400).json({ error: "Bad Request: btcAmountSats requires bondIndex" });
        return;
      }
      if (!/^[0-9]+$/.test(btcAmountSatsStr)) {
        res.status(400).json({ error: "Bad Request: btcAmountSats must be a positive integer string" });
        return;
      }
      btcAmountSats = BigInt(btcAmountSatsStr);
    }

    const result = await apiService.executeAction(vaultId, ActionType.GET_REQUIREMENTS, { bondIndex, btcAmountSats });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/bond/create
export const createBond: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const bondIndexStr = String(req.body.bondIndex ?? "");
    const btcAmountSatsStr = String(req.body.btcAmountSats ?? "");
    const signerManager = String(req.body.signerManager || "").trim();

    if (!bondIndexStr || !btcAmountSatsStr || !signerManager) {
      res.status(400).json({ error: "Bad Request: bondIndex, btcAmountSats, and signerManager are required" });
      return;
    }

    const bondIndex = Number(bondIndexStr);
    if (!Number.isInteger(bondIndex) || bondIndex < 0) {
      res.status(400).json({ error: "Bad Request: bondIndex must be a non-negative integer" });
      return;
    }

    if (!/^[0-9]+$/.test(btcAmountSatsStr)) {
      res.status(400).json({ error: "Bad Request: btcAmountSats must be a positive integer string" });
      return;
    }
    const btcAmountSats = BigInt(btcAmountSatsStr);

    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;
    const confirmations = req.body.confirmations !== undefined ? Number(req.body.confirmations) : undefined;
    const btcTxid = req.body.btcTxid ? String(req.body.btcTxid).trim() : undefined;
    const amountUstxOverride = req.body.amountUstxOverride !== undefined ? BigInt(req.body.amountUstxOverride) : undefined;

    const result = await apiService.executeAction(vaultId, ActionType.CREATE_BOND, {
      bondIndex, btcAmountSats, signerManager, note, nonce, externalId, confirmations, btcTxid, amountUstxOverride,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/stacking/pox5/bond/position
export const getBondPosition: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const result = await apiService.executeAction(vaultId, ActionType.GET_BOND_POSITION, {});
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/bond/announce-early-exit
export const announceEarlyExit: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);

    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;

    const result = await apiService.executeAction(vaultId, ActionType.ANNOUNCE_EARLY_EXIT, { note, nonce, externalId });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/stacking/pox5/bond/lock-address
export const getBondLockAddress: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const bondIndex = Number(req.query.bondIndex ?? req.body.bondIndex);
    if (isNaN(bondIndex)) { res.status(400).json({ error: 'bondIndex is required' }); return; }
    const result = await apiService.executeAction(vaultId, ActionType.GET_BOND_LOCK_ADDRESS, { bondIndex });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/bond/fund-lock
export const fundBondLockAddress: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const bondIndex = Number(req.body.bondIndex);
    if (isNaN(bondIndex)) { res.status(400).json({ error: 'bondIndex is required' }); return; }
    const result = await apiService.executeAction(vaultId, ActionType.FUND_BOND_LOCK_ADDRESS, { bondIndex });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/bond/unlock
export const unlockMaturedBond: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const destination = String(req.body.destinationBtcAddress || "").trim();
    if (!destination) {
      res.status(400).json({ error: "Bad Request: destinationBtcAddress is required" });
      return;
    }
    const feeSats = req.body.feeSats !== undefined ? BigInt(String(req.body.feeSats)) : undefined;
    const bondIndex = req.body.bondIndex !== undefined ? Number(req.body.bondIndex) : undefined;
    const result = await apiService.executeAction(vaultId, ActionType.UNLOCK_BTC, { destinationBtcAddress: destination, feeSats, bondIndex });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/bond/renew
export const renewBond: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const nextBondIndexStr = String(req.body.nextBondIndex ?? "");
    const signerManager = String(req.body.signerManager || "").trim();
    if (!nextBondIndexStr || !signerManager) {
      res.status(400).json({ error: "Bad Request: nextBondIndex and signerManager are required" });
      return;
    }
    const nextBondIndex = Number(nextBondIndexStr);
    if (!Number.isInteger(nextBondIndex) || nextBondIndex < 0) {
      res.status(400).json({ error: "Bad Request: nextBondIndex must be a non-negative integer" });
      return;
    }
    const feeSats = req.body.feeSats !== undefined ? BigInt(String(req.body.feeSats)) : undefined;
    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;
    const confirmations = req.body.confirmations !== undefined ? Number(req.body.confirmations) : undefined;
    const result = await apiService.executeAction(vaultId, ActionType.RENEW_BOND, { nextBondIndex, signerManager, feeSats, note, nonce, externalId, confirmations });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/rewards/calculate
export const calculateRewards: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const result = await apiService.executeAction(vaultId, ActionType.CALCULATE_REWARDS, { note, nonce });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/rewards/claim
export const claimRewards: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const rawIndices = req.body.bondIndices;
    if (!Array.isArray(rawIndices) || rawIndices.length === 0) {
      res.status(400).json({ error: "Bad Request: bondIndices must be a non-empty array of integers" });
      return;
    }
    const bondIndices: number[] = rawIndices.map(Number);
    if (bondIndices.some(i => !Number.isInteger(i) || i < 0)) {
      res.status(400).json({ error: "Bad Request: each bondIndex must be a non-negative integer" });
      return;
    }
    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const result = await apiService.executeAction(vaultId, ActionType.CLAIM_REWARDS, { bondIndices, note, nonce });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/rewards/claim-stx
export const claimStxOnlyRewards: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const result = await apiService.executeAction(vaultId, ActionType.CLAIM_STX_ONLY_REWARDS, { note, nonce });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/stacking/pox5/rewards/earned
export const getEarnedRewards: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const signerManager = String(req.query.signerManager || "").trim();
    if (!signerManager) {
      res.status(400).json({ error: "Bad Request: signerManager query param is required" });
      return;
    }
    const bondIndexStr = req.query.bondIndex as string | undefined;
    const bondIndex = bondIndexStr !== undefined ? Number(bondIndexStr) : undefined;
    if (bondIndex !== undefined && (!Number.isInteger(bondIndex) || bondIndex < 0)) {
      res.status(400).json({ error: "Bad Request: bondIndex must be a non-negative integer" });
      return;
    }
    const result = await apiService.executeAction(vaultId, ActionType.GET_EARNED_REWARDS, { signerManager, bondIndex });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/faucet
export const fundVault: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const staking = String(req.query.stacking).toLowerCase() === 'true';
    const result = await apiService.executeAction(vaultId, ActionType.FUND_VAULT, { staking });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /metrics
export const getPoolMetrics: Handler = async (req, res, next) => {
  try {
    const metrics = apiService.getPoolMetrics();
    res.json(metrics);
  } catch (err) {
    next(err);
  }
};
