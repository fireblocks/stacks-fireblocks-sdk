import { Request, Response, NextFunction } from "express";
import { ApiService } from "./api.service";
import { ActionType, ApiServiceConfig } from "../pool/types";
import { BasePath } from "@fireblocks/ts-sdk";
import { getApiService } from "./api_service_singleton";

// Configure the API Service once for all handlers
const apiConfig: ApiServiceConfig = {
  apiKey: process.env.FIREBLOCKS_API_KEY || "",
  apiSecret: process.env.FIREBLOCKS_SECRET_KEY_PATH || "",
  basePath: (process.env.FIREBLOCKS_BASE_PATH as BasePath) || BasePath.US,
  // Optional: customize pool size/timeouts here
  poolConfig: {},
};
const apiService = getApiService();

// Handler utilities
type Handler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// GET /:vaultId/address
export const getAddress: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
    const address = await apiService.executeAction(
      vaultId,
      ActionType.GET_ACCOUNT_ADDRESS,
      {}
    );
    res.json({ address });
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
      {}
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
      {}
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
      {}
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
      { getCachedTransactions, limit, offset }
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
    const { recipientAddress, amount, grossTransaction, note } = req.body;
    if (!recipientAddress || !amount) {
      res.status(400).json({
        error: "Bad Request : recipientAddress and amount are required",
      });
      return;
    }
    const tx = await apiService.executeAction(
      vaultId,
      ActionType.CREATE_NATIVE_TRANSACTION,
      {
        recipientAddress,
        amount,
        grossTransaction,
        note,
      }
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
