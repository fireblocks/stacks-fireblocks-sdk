import { BasePath } from "@fireblocks/ts-sdk";

export type GetNativeBalanceResponse = {
  success: boolean;
  balance?: number;
  error?: string;
};

export type GetFtBalancesResponse = {
  success: boolean;
  data?: {
    token: string;
    balance: number;
  }[];
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
  type: TransactionType.STX | TransactionType.FungibleToken;
  tokenName?: string;
  tokenContractAddress?: string;
  sender: string;
  recipient: string;
  amount: number;
  transaction_hash: string;
  success: boolean;
};

export enum TransactionType {
  STX = "STX",
  FungibleToken = "Fungible Token",
}

export enum TokenType {
  STX = "STX",
  sBTC = "sbtc-token",
  USDC = "token-aeusdc",
  USDH = "usdh-token-v1",
}

export type TokenInfo = {
  contractAddress: string;
  contractName: string;
  decimals: number;
};

export type SDKResponse =
  | GetNativeBalanceResponse
  | string
  | CreateTransactionResponse
  | GetTransactionHistoryResponse;
