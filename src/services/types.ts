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
    tokenContractName: string;
    tokenContractAddress: string;
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

export type GetTransactionHistoryParams = {
  getCachedTransactions?: boolean;
  limit?: number;
  offset?: number;
}

export type GetPoxInfoResponse = {
  success: boolean;
  data?: any;
  error?: string;
}

export type TransactionDetails = {
  tx_id: string;
  tx_status: string;
  tx_result: any;
  full_tx_details?: any;
  tx_error?: string;
};

export type GetTransactionStatusResponse = {
  success: boolean;
  data?: TransactionDetails;
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
  timestamp: any;
  success: boolean;
};

export type CheckStatusData = {
  balance: {
    stx_total: number;
    stx_locked: number;
    lock_tx_id: string | null;
    lock_height: number | null;
    burnchain_lock_height: number | null;
    burnchain_unlock_height: number | null;
    total_miner_rewards_received: number | null;
  };
  delegation: {
    is_delegated: boolean;
    delegated_to: string | null;
    amount_delegated: number | null;
    until_burn_ht: number | null;
    pox_addr: string | null;
  };
};

export type CheckStatusResponse = {
  success: boolean;
  data?: CheckStatusData;
  error?: string;
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
  CUSTOM = "custom-token",
}

export enum StackingPools {
  FAST_POOL = "fast-pool",
}

export type TokenInfo = {
  contractAddress: string;
  contractName: string;
  decimals: number;
};

export type PoolInfo = {
  poolAddress: string;
  poolContractName: string;
};

export type SDKResponse =
  | GetNativeBalanceResponse
  | string
  | CreateTransactionResponse
  | GetTransactionHistoryResponse;
