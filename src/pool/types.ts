import { BasePath } from "@fireblocks/ts-sdk";
import { StacksSDK } from "../StacksSDK";

export interface PoolConfig {
  maxPoolSize: number;
  idleTimeoutMs: number;
  cleanupIntervalMs: number;
}

export interface SdkPoolItem {
  sdk: StacksSDK;
  lastUsed: Date;
  isInUse: boolean;
}

export interface ApiServiceConfig {
  apiKey: string;
  apiSecret: string;
  basePath: BasePath | string;
  poolConfig?: Partial<PoolConfig>;
  testnet?: boolean;
}

export enum ActionType {
  CREATE_NATIVE_TRANSACTION = "createNativeTransaction",
  CREATE_FT_TRANSACTION = "createFTTransaction",
  GET_BALANCE = "getBalance",
  GET_FT_BALANCES = "getFtBalances",
  GET_TRANSACTIONS_HISTORY = "getTransactionsHistory",
  GET_ACCOUNT_ADDRESS = "getAddress",
  GET_ACCOUNT_PUBLIC_KEY = "getPublicKey",
  GET_BTC_REWARDS_ADDRESS = "getBtcRewardsAddress",
  STACK_WITH_POOL = "stackWithPool",
  DELEGATE_TO_POOL = "delegateToPool",
  ALLOW_CONTRACT_CALLER = "allowContractCaller",
  REVOKE_DELEGATION = "revokeDelegation",
  CHECK_STATUS = "checkStatus",
  STACK_SOLO = "stackSolo",
  GET_TX_STATUS_BY_ID = "getTxStatusById",
}

export interface SdkManagerMetrics {
  totalInstances: number;
  activeInstances: number;
  idleInstances: number;
  instancesByVaultAccount: Record<string, boolean>;
}
