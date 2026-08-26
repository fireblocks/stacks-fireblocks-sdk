import { Request, Response, NextFunction } from "express";
import { apiServiceSingleton } from "./api.service";
import { ActionType } from "../pool/types";
import { StackingPools, TokenType } from "../services/types";
import { validateAmount } from "../utils/helpers";
import { helperConstants, poolInfo } from "../utils/constants";
import { parseOptionalAmount, parseOptionalFee, parseOptionalNonce } from "../utils/validation";

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
      ActionType.GET_TRANSACTION_HISTORY,
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

// GET /stacking/pox5/bond/validate-schedule
export const validateBondSchedule: Handler = async (req, res, next) => {
  try {
    let bondIndices: number[] | undefined;
    const raw = req.query.bondIndices ?? req.body?.bondIndices;
    // Treat an absent OR empty value as "use the default cohort span" rather than [0]
    // (an empty query string splits to [''] → [0], which would under-check the schedule).
    const hasValue = Array.isArray(raw) ? raw.length > 0 : raw !== undefined && String(raw).trim() !== "";
    if (hasValue) {
      const arr = Array.isArray(raw) ? raw : String(raw).split(",");
      bondIndices = arr.map((v: any) => Number(String(v).trim()));
      if (bondIndices.some((n) => !Number.isInteger(n) || n < 0)) {
        res.status(400).json({ error: "Bad Request: bondIndices must be non-negative integers" });
        return;
      }
    }
    const result = await apiService.executeAction(
      helperConstants.vaultIdForReadOnlyActions,
      ActionType.VALIDATE_BOND_SCHEDULE,
      { bondIndices },
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/btc/transactions/:btcTxid
export const getBtcTxStatus: Handler = async (req, res, next) => {
  try {
    const { btcTxid } = req.params;
    if (!btcTxid || typeof btcTxid !== "string") {
      res.status(400).json({ error: "Bad Request: btcTxid is required" });
      return;
    }
    const tx = await apiService.executeAction(
      helperConstants.vaultIdForReadOnlyActions,
      ActionType.GET_BTC_TX_STATUS,
      { btcTxid },
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
    const newAmount = parseOptionalAmount(req.body.newAmount);
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

    const signerManager = req.query.signerManager ? String(req.query.signerManager).trim() : undefined;

    const result = await apiService.executeAction(vaultId, ActionType.GET_REQUIREMENTS, { bondIndex, btcAmountSats, signerManager });
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
    // The paired-STX amount override and the raw signerCalldata are expert, policy-gated
    // paths and are deliberately NOT exposed over REST — the amount is always derived here,
    // and reward routing goes through the validated rewardBtcAddress/rewardMaxFeeSats pair.
    // An explicit null means "register none" (clear the committed reward address) and must
    // survive as null: a truthiness check alone would collapse it to undefined, which the
    // SDK reads as "unchanged" and would silently carry the old destination forward.
    const rewardBtcAddress =
      req.body.rewardBtcAddress === null
        ? null
        : req.body.rewardBtcAddress
          ? String(req.body.rewardBtcAddress).trim()
          : undefined;
    if (req.body.rewardMaxFeeSats !== undefined && !/^[0-9]+$/.test(String(req.body.rewardMaxFeeSats))) {
      res.status(400).json({ error: "Bad Request: rewardMaxFeeSats must be a non-negative integer string" });
      return;
    }
    const rewardMaxFeeSats = req.body.rewardMaxFeeSats !== undefined ? BigInt(String(req.body.rewardMaxFeeSats)) : undefined;

    const result = await apiService.executeAction(vaultId, ActionType.CREATE_BOND, {
      bondIndex, btcAmountSats, signerManager, note, nonce, externalId, confirmations, btcTxid, rewardBtcAddress, rewardMaxFeeSats,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/bond/sbtc/create
export const createSbtcBond: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const bondIndexStr = String(req.body.bondIndex ?? "");
    const sbtcSatsStr = String(req.body.sbtcSats ?? "");
    const signerManager = String(req.body.signerManager || "").trim();
    // Optional override; defaults to the built-in sBTC contract for the network.
    const sbtcAsset = req.body.sbtcAsset && req.body.sbtcAsset.contractAddress && req.body.sbtcAsset.contractName && req.body.sbtcAsset.assetName
      ? req.body.sbtcAsset
      : undefined;

    if (!bondIndexStr || !sbtcSatsStr || !signerManager) {
      res.status(400).json({ error: "Bad Request: bondIndex, sbtcSats, and signerManager are required" });
      return;
    }
    const bondIndex = Number(bondIndexStr);
    if (!Number.isInteger(bondIndex) || bondIndex < 0) {
      res.status(400).json({ error: "Bad Request: bondIndex must be a non-negative integer" });
      return;
    }
    if (!/^[0-9]+$/.test(sbtcSatsStr)) {
      res.status(400).json({ error: "Bad Request: sbtcSats must be a positive integer string" });
      return;
    }
    const sbtcSats = BigInt(sbtcSatsStr);
    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;
    // The paired-STX amount override is an expert, policy-gated path and is
    // deliberately NOT exposed over REST — the amount is always derived here.

    const result = await apiService.executeAction(vaultId, ActionType.CREATE_SBTC_BOND, {
      bondIndex, sbtcSats, signerManager, sbtcAsset, note, nonce, externalId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/bond/sbtc/roll
export const rollSbtcBond: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const nextBondIndexStr = String(req.body.nextBondIndex ?? "");
    const newSbtcSatsStr = String(req.body.newSbtcSats ?? "");
    const signerManager = String(req.body.signerManager || "").trim();
    const sbtcAsset = req.body.sbtcAsset && req.body.sbtcAsset.contractAddress && req.body.sbtcAsset.contractName && req.body.sbtcAsset.assetName
      ? req.body.sbtcAsset
      : undefined;

    if (!nextBondIndexStr || !newSbtcSatsStr || !signerManager) {
      res.status(400).json({ error: "Bad Request: nextBondIndex, newSbtcSats, and signerManager are required" });
      return;
    }
    const nextBondIndex = Number(nextBondIndexStr);
    if (!Number.isInteger(nextBondIndex) || nextBondIndex < 0) {
      res.status(400).json({ error: "Bad Request: nextBondIndex must be a non-negative integer" });
      return;
    }
    // A decrease-to-zero rollover is valid, so allow 0 (unlike create's positive-only).
    if (!/^[0-9]+$/.test(newSbtcSatsStr)) {
      res.status(400).json({ error: "Bad Request: newSbtcSats must be a non-negative integer string" });
      return;
    }
    const newSbtcSats = BigInt(newSbtcSatsStr);
    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;

    const result = await apiService.executeAction(vaultId, ActionType.ROLL_SBTC_BOND, {
      nextBondIndex, newSbtcSats, signerManager, sbtcAsset, note, nonce, externalId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/bond/sbtc/unstake
export const unstakeSbtc: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const signerManager = String(req.body.signerManager || "").trim();
    const amountStr = String(req.body.amountToWithdrawSats ?? "");
    if (!signerManager || !amountStr) {
      res.status(400).json({ error: "Bad Request: signerManager and amountToWithdrawSats are required" });
      return;
    }
    if (!/^[0-9]+$/.test(amountStr)) {
      res.status(400).json({ error: "Bad Request: amountToWithdrawSats must be a positive integer string" });
      return;
    }
    const amountToWithdrawSats = BigInt(amountStr);
    // Optional: when provided, the sBTC withdrawal is bounded by a post-condition.
    const sbtcAsset = req.body.sbtcAsset && req.body.sbtcAsset.contractAddress && req.body.sbtcAsset.contractName && req.body.sbtcAsset.assetName
      ? req.body.sbtcAsset
      : undefined;
    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;

    const result = await apiService.executeAction(vaultId, ActionType.UNSTAKE_SBTC, {
      signerManager, amountToWithdrawSats, sbtcAsset, note, nonce, externalId,
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

// POST /:vaultId/stacking/pox5/bond/early-exit
export const spendEarlyExit: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const destination = String(req.body.destinationBtcAddress || "").trim();
    if (!destination) {
      res.status(400).json({ error: "Bad Request: destinationBtcAddress is required" });
      return;
    }
    if (req.body.feeSats !== undefined && !/^[0-9]+$/.test(String(req.body.feeSats))) {
      res.status(400).json({ error: "Bad Request: feeSats must be a positive integer string" });
      return;
    }
    const feeSats = req.body.feeSats !== undefined ? BigInt(String(req.body.feeSats)) : undefined;
    const bondIndex = req.body.bondIndex !== undefined ? Number(req.body.bondIndex) : undefined;
    if (bondIndex !== undefined && (!Number.isInteger(bondIndex) || bondIndex < 0)) {
      res.status(400).json({ error: "Bad Request: bondIndex must be a non-negative integer" });
      return;
    }
    const result = await apiService.executeAction(vaultId, ActionType.SPEND_EARLY_EXIT, { destinationBtcAddress: destination, feeSats, bondIndex });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/stacking/pox5/bond/early-exit/public-key
export const getEarlyExitPublicKey: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const result = await apiService.executeAction(vaultId, ActionType.GET_EARLY_EXIT_PUBLIC_KEY, {});
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/stacking/pox5/bond/historical
export const getHistoricalBondPosition: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const bondIndex = Number(req.query.bondIndex ?? req.body?.bondIndex);
    if (!Number.isInteger(bondIndex) || bondIndex < 0) {
      res.status(400).json({ error: "Bad Request: bondIndex must be a non-negative integer" });
      return;
    }
    const result = await apiService.executeAction(vaultId, ActionType.GET_HISTORICAL_BOND_POSITION, { bondIndex });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/stacking/pox5/bond/reward-address
export const getCommittedRewardAddress: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    // Both optional: bondIndex resolves the signer manager from the durable record; an
    // explicit signerManager overrides. With neither, the active membership is used.
    const bondIndexRaw = req.query.bondIndex ?? req.body?.bondIndex;
    let bondIndex: number | undefined;
    if (bondIndexRaw !== undefined && bondIndexRaw !== "") {
      bondIndex = Number(bondIndexRaw);
      if (!Number.isInteger(bondIndex) || bondIndex < 0) {
        res.status(400).json({ error: "Bad Request: bondIndex must be a non-negative integer" });
        return;
      }
    }
    const signerManager = req.query.signerManager ? String(req.query.signerManager).trim() : (req.body?.signerManager ? String(req.body.signerManager).trim() : undefined);
    const result = await apiService.executeAction(vaultId, ActionType.GET_COMMITTED_REWARD_ADDRESS, { bondIndex, signerManager });
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
    const result = await apiService.executeAction(vaultId, ActionType.UNLOCK_MATURED_BOND, { destinationBtcAddress: destination, feeSats, bondIndex });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/bond/replace-fee
export const replaceBtcRecoveryFee: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const originalTxid = String(req.body.originalTxid || "").trim();
    if (!originalTxid) {
      res.status(400).json({ error: "Bad Request: originalTxid is required" });
      return;
    }
    if (req.body.newFeeSats === undefined) {
      res.status(400).json({ error: "Bad Request: newFeeSats is required" });
      return;
    }
    let newFeeSats: bigint;
    try {
      newFeeSats = BigInt(String(req.body.newFeeSats));
    } catch {
      res.status(400).json({ error: "Bad Request: newFeeSats must be an integer number of sats" });
      return;
    }
    let bondIndex: number | undefined;
    if (req.body.bondIndex !== undefined) {
      bondIndex = Number(req.body.bondIndex);
      if (!Number.isInteger(bondIndex) || bondIndex < 0) {
        res.status(400).json({ error: "Bad Request: bondIndex must be a non-negative integer" });
        return;
      }
    }
    const kind = req.body.kind === 'matured' || req.body.kind === 'early-exit' ? req.body.kind : undefined;
    const result = await apiService.executeAction(vaultId, ActionType.REPLACE_BTC_RECOVERY_FEE, { originalTxid, newFeeSats, bondIndex, kind });
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
    // An explicit null means "register none" (clear the committed reward address) and must
    // survive as null: a truthiness check alone would collapse it to undefined, which the
    // SDK reads as "unchanged" and would silently carry the old destination forward.
    const rewardBtcAddress =
      req.body.rewardBtcAddress === null
        ? null
        : req.body.rewardBtcAddress
          ? String(req.body.rewardBtcAddress).trim()
          : undefined;
    if (req.body.rewardMaxFeeSats !== undefined && !/^[0-9]+$/.test(String(req.body.rewardMaxFeeSats))) {
      res.status(400).json({ error: "Bad Request: rewardMaxFeeSats must be a non-negative integer string" });
      return;
    }
    const rewardMaxFeeSats = req.body.rewardMaxFeeSats !== undefined ? BigInt(String(req.body.rewardMaxFeeSats)) : undefined;
    const result = await apiService.executeAction(vaultId, ActionType.RENEW_BOND, { nextBondIndex, signerManager, feeSats, note, nonce, externalId, confirmations, rewardBtcAddress, rewardMaxFeeSats });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pox5/bond/update-registration
export const updateBondRegistration: Handler = async (req, res, next) => {
  try {
    const vaultId = getVaultId(req);
    const signerManager = String(req.body.signerManager || "").trim();
    const oldSignerManager = String(req.body.oldSignerManager || "").trim();
    // No bondIndex: the affected bond is derived from the staker's on-chain
    // membership, so a caller-supplied index cannot rotate the wrong record.
    if (!signerManager || !oldSignerManager) {
      res.status(400).json({ error: "Bad Request: signerManager and oldSignerManager are required" });
      return;
    }
    const note = req.body.note ? String(req.body.note) : undefined;
    const nonce = parseOptionalNonce(req.body.nonce);
    const externalId = req.body.externalId ? String(req.body.externalId) : undefined;
    // An explicit null means "register none" (clear the committed reward address) and must
    // survive as null: a truthiness check alone would collapse it to undefined, which the
    // SDK reads as "unchanged" and would silently carry the old destination forward.
    const rewardBtcAddress =
      req.body.rewardBtcAddress === null
        ? null
        : req.body.rewardBtcAddress
          ? String(req.body.rewardBtcAddress).trim()
          : undefined;
    if (req.body.rewardMaxFeeSats !== undefined && !/^[0-9]+$/.test(String(req.body.rewardMaxFeeSats))) {
      res.status(400).json({ error: "Bad Request: rewardMaxFeeSats must be a non-negative integer string" });
      return;
    }
    const rewardMaxFeeSats = req.body.rewardMaxFeeSats !== undefined ? BigInt(String(req.body.rewardMaxFeeSats)) : undefined;
    const result = await apiService.executeAction(vaultId, ActionType.UPDATE_BOND_REGISTRATION, { signerManager, oldSignerManager, note, nonce, externalId, rewardBtcAddress, rewardMaxFeeSats });
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
    // Optional historical range so an EXPIRED STX-only stake can still claim past cycles.
    const fromCycle = req.body.fromCycle !== undefined ? Number(req.body.fromCycle) : undefined;
    const toCycle = req.body.toCycle !== undefined ? Number(req.body.toCycle) : undefined;
    if ((fromCycle !== undefined && (!Number.isInteger(fromCycle) || fromCycle < 0)) || (toCycle !== undefined && (!Number.isInteger(toCycle) || toCycle < 0))) {
      res.status(400).json({ error: "Bad Request: fromCycle/toCycle must be non-negative integers" });
      return;
    }
    const result = await apiService.executeAction(vaultId, ActionType.CLAIM_STX_ONLY_REWARDS, { note, nonce, fromCycle, toCycle });
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
