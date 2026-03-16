import { Request, Response, NextFunction } from "express";
import { apiServiceSingleton } from "./api.service";
import { ActionType } from "../pool/types";
import { StackingPools, TokenType } from "../services/types";
import { validateAmount } from "../utils/helpers";
import { helperConstants, poolInfo } from "../utils/constants";

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

// GET /:vaultId/btc-rewards-address
export const getBtcRewardsAddress: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
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
    const assetUi = String(req.query.assetType || "").trim(); // "STX" | "sBTC" | "USDCx" | "Custom"
    const grossTransaction =
      String(req.query.grossTransaction || "false").toLowerCase() === "true";
    const note = req.query.note ? String(req.query.note) : undefined;
    const tokenContractAddress = req.query.tokenContractAddress
      ? String(req.query.tokenContractAddress).trim()
      : undefined;
    const tokenContractName = req.query.tokenContractName
      ? String(req.query.tokenContractName).trim()
      : undefined;

    if (!recipientAddress || !amountStr || !assetUi) {
      res.status(400).json({
        error:
          "Bad Request: recipientAddress, amount and assetType are required",
      });
      return;
    }

    // Validate custom token fields
    if (assetUi === "Custom") {
      if (!tokenContractAddress || !tokenContractName) {
        res.status(400).json({
          error:
            "Bad Request: tokenContractAddress and tokenContractName are required when assetType is Custom",
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
        { recipientAddress, amount, grossTransaction, note },
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
        note,
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
    const { vaultId } = req.params;

    const amountStr = String(req.query.amount || "");
    const lockPeriodStr = String(req.query.lockPeriod || "1");
    const pool = String(req.query.pool || "FAST_POOL").trim();

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

    // FT transfer
    const tx = await apiService.executeAction(
      vaultId,
      ActionType.DELEGATE_TO_POOL,
      { poolAddress, poolContractName, amount, lockPeriod },
    );
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/pool/allow-contract-caller
export const allowContractCaller: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;

    const pool = String(req.query.pool || "FAST_POOL").trim();

    if (!pool) {
      res.status(400).json({
        error: "Bad Request: pool is required",
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

    // FT transfer
    const tx = await apiService.executeAction(
      vaultId,
      ActionType.ALLOW_CONTRACT_CALLER,
      { poolAddress, poolContractName },
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
    const { vaultId } = req.params;

    const signerKey = String(req.query.signerKey || "").trim();
    const signerSig65Hex = String(req.query.signerSig65Hex || "").trim();
    const amountStr = String(req.query.amount || "");
    const maxAmountStr = String(req.query.maxAmount || "");
    const lockPeriodStr = String(req.query.lockPeriod || "1");
    const authIdStr = String(req.query.authId);

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

    const tx = await apiService.executeAction(vaultId, ActionType.STACK_SOLO, {
      signerKey,
      signerSig65Hex,
      amount,
      maxAmount,
      lockPeriod,
      authId,
    });

    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/solo/increase
export const increaseStackedAmount: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;

    const signerKey = String(req.query.signerKey || "").trim();
    const signerSig65Hex = String(req.query.signerSig65Hex || "").trim();
    const increaseByStr = String(req.query.increaseBy || "");
    const maxAmountStr = String(req.query.maxAmount || "");
    const authIdStr = String(req.query.authId || "");

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

    const tx = await apiService.executeAction(vaultId, ActionType.INCREASE_STACKED_AMOUNT, {
      signerKey,
      signerSig65Hex,
      increaseBy,
      maxAmount,
      authId,
    });

    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/stacking/solo/extend
export const extendStackingPeriod: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;

    const signerKey = String(req.query.signerKey || "").trim();
    const signerSig65Hex = String(req.query.signerSig65Hex || "").trim();
    const extendCyclesStr = String(req.query.extendCycles || "");
    const maxAmountStr = String(req.query.maxAmount || "");
    const authIdStr = String(req.query.authId || "");

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

    const tx = await apiService.executeAction(vaultId, ActionType.EXTEND_STACKING_PERIOD, {
      signerKey,
      signerSig65Hex,
      extendCycles,
      maxAmount,
      authId,
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


// GET /metrics
export const getPoolMetrics: Handler = async (req, res, next) => {
  try {
    const metrics = apiService.getPoolMetrics();
    res.json(metrics);
  } catch (err) {
    next(err);
  }
};
