import { FireblocksService } from "./fireblocks.service";
import { BasePath } from "@fireblocks/ts-sdk";

export type GetNativeBalanceResponse = {
  success: boolean;
  balance?: number;
  error?: string;
};

export type FireblocksConfig = {
  apiKey: string;
  apiSecret: string; // can be path or inline string
  basePath?: BasePath;
  testnet?: boolean;
};

export type CreateTransactionResponse = {
  success: boolean;
  txHash?: string;
  error?: string;
};

export type GetTransactionHistoryResponse = {
  success: boolean;
  data?: any[];
  error?: string;
};

export type Transaction = {
  type: "STX Transfer" | "Fungible Token Transfer";
  tokenName?: string;
  tokenContractAddress?: string;
  sender: string;
  recipient: string;
  amount: number;
  transaction_hash: string;
  success: boolean;
};

export type SDKResponse =
  | GetNativeBalanceResponse
  | string
  | CreateTransactionResponse
  | GetTransactionHistoryResponse;
