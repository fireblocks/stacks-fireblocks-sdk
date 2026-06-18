import { BasePath } from "@fireblocks/ts-sdk";


export type Network = "mainnet" | "testnet";

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
  pending?: boolean;
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
  pox5: {
    is_staked: boolean;
    amount_stx: number | null;
    signer_manager: string | null;
    first_reward_cycle: number | null;
    num_cycles: number | null;
    unlock_burn_height: number | null;
    current_burn_height: number;
    current_cycle_id: number;
    is_prepare_phase: boolean;
  };
  bond: {
    bond_index: number;
    amount_stx: number;
    amount_sats: string;
    signer_manager: string;
    is_l1_lock: boolean;
  } | null;
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
  USDCx = "usdcx-token",
  CUSTOM = "custom-token",
}

export enum StackingPools {
  FAST_POOL = "fast-pool",
}

export type TokenInfo = {
  contractAddress: string;
  contractName: string;
  assetName: string; // The asset name from define-fungible-token (may differ from contractName)
  decimals: number;
};

export type PoolInfo = {
  poolAddress: string;
  poolContractName: string;
};

export type GetAccountNonceResponse = {
  success: boolean;
  confirmedNonce?: bigint;
  pendingTxCount?: number;
  nextAvailable?: bigint;
  error?: string;
};

export type StakerInfoResponse = {
  success: boolean;
  staked?: boolean;
  details?: {
    amount_stx: number;
    firstRewardCycle: number;
    numCycles: number;
    signerManager: string;
  };
  error?: string;
};

export type VerifySignerGrantResponse = {
  success: boolean;
  grant_exists?: boolean;
  signer_registered?: boolean;
  registered_key?: string | null;
  ready_to_stake?: boolean;
  tx_status?: string | null;
  notes?: string[];
  error?: string;
};

export type CreateBondResult = {
  success: boolean;
  btcTxid?: string;
  vout?: number;
  stacksTxid?: string;
  lockingAddress?: string;
  unlockHeight?: number;
  amountUstx?: bigint;
  error?: string;
};

export type BondPositionData = {
  bond_index: number;
  amount_stx: number;
  amount_sats: string;
  signer_manager: string;
  is_l1_lock: boolean;
  unlock_height: number | null;
  locking_address: string | null;
  still_locked: boolean | null;
  blocks_until_unlock: number | null;
  earned_sats: string;
} | null;

export type BondPositionResponse = {
  success: boolean;
  data?: {
    bond: BondPositionData;
    stx_only: {
      amount_stx: number;
      first_reward_cycle: number;
      num_cycles: number;
      signer_manager: string;
    } | null;
  };
  error?: string;
};

export type AnnounceEarlyExitResponse = {
  success: boolean;
  txHash?: string;
  error?: string;
};

export type RequirementsResponse = {
  success: boolean;
  data?: {
    cycle: {
      id: number;
      current_burn_height: number;
      is_prepare_phase: boolean;
      blocks_until_cycle_end: number;
      is_safe_to_submit: boolean;
      current_bond_index: number | null;
    };
    bond?: {
      bond_index: number;
      status: string;
      stx_value_ratio: string;
      target_rate_bps: number;
      your_allowance_sats: string;
      min_stx_for_sats?: number;
      min_ustx_for_sats?: string;
    };
  };
  error?: string;
};

export type SDKResponse =
  | GetNativeBalanceResponse
  | string
  | CreateTransactionResponse
  | GetTransactionHistoryResponse
  | GetAccountNonceResponse
  | StakerInfoResponse;
