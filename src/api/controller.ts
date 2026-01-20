import { Request, Response, NextFunction } from "express";
import { apiServiceSingleton } from "./api.service";
import { ActionType } from "../pool/types";
import { StackingPools, TokenType } from "../services/types";
import { validateAmount } from "../utils/helpers";
import { poolInfo } from "../utils/constants";

const apiService = apiServiceSingleton;

// Handler utilities
type Handler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

// GET /:vaultId/address
export const getAddress: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
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

// GET /:vaultId/check-status
export const checkStatus: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
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
    const { vaultId } = req.params;
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

// GET /:vaultId/balance
export const getBalance: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
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
    const { vaultId } = req.params;
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
    const { vaultId } = req.params;

    const getCachedTransactions =
      String(req.query.getCachedTransactions).toLowerCase() === "false"
        ? false
        : true;

    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? String(req.query.offset) : undefined;
    const order = req.query.order
      ? String(req.query.order).toUpperCase() === "DESC"
        ? "DESC"
        : "ASC"
      : undefined;

    const history = await apiService.executeAction(
      vaultId,
      ActionType.GET_TRANSACTIONS_HISTORY,
      { getCachedTransactions, limit, offset },
    );

    res.json(history);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/transfer
export const createTransaction: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;

    const recipientAddress = String(req.query.recipientAddress || "");
    const amountStr = String(req.query.amount || "");
    const assetUi = String(req.query.assetType || "").trim(); // "STX" | "sBTC" | "USDC" | "USDH"
    const grossTransaction =
      String(req.query.grossTransaction || "false").toLowerCase() === "true";
    const note = req.query.note ? String(req.query.note) : undefined;

    if (!recipientAddress || !amountStr || !assetUi) {
      res.status(400).json({
        error:
          "Bad Request: recipientAddress, amount and assetType are required",
      });
      return;
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
      USDC: TokenType.USDC,
      USDH: TokenType.USDH,
    };
    const tokenType = mapUiToTokenType[assetUi];

    if (!tokenType) {
      res.status(400).json({ error: `Unsupported assetType: ${assetUi}` });
      return;
    }

    // Route: STX -> native; others -> FT
    if (tokenType === TokenType.STX) {
      const tx = await apiService.executeAction(
        vaultId,
        ActionType.CREATE_NATIVE_TRANSACTION,
        { recipientAddress, amount, grossTransaction, note },
      );
      res.json(tx);
      return;
    }

    // FT transfer
    const tx = await apiService.executeAction(
      vaultId,
      ActionType.CREATE_FT_TRANSACTION,
      { recipientAddress, amount, tokenType, note },
    );
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/pool-stack
export const poolStack: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;

    const amountStr = String(req.query.amount || "");
    const lockPeriodStr = String(req.query.lockPeriod || "1");
    const pool = String(req.query.pool || "FAST_POOL").trim();

    console.log(
      `[DEBUG] poolStack called with pool=${pool}, amount=${amountStr}, lockPeriod=${lockPeriodStr}`,
    );

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

    console.log(
      `[DEBUG] poolStack resolved to poolAddress=${poolAddress}, poolContractName=${poolContractName}`,
    );

    // FT transfer
    const tx = await apiService.executeAction(
      vaultId,
      ActionType.STACK_WITH_POOL,
      { poolAddress, poolContractName, amount, lockPeriod },
    );
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/revoke-delegation
export const revokeDelegation: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;

    const tx = await apiService.executeAction(
      vaultId,
      ActionType.REVOKE_DELEGATION,
      {},
    );
    res.json(tx);
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
