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
  GET_BALANCE = "getBalance",
  GET_TRANSACTIONS_HISTORY = "getTransactionsHistory",
  GET_ACCOUNT_ADDRESS = "getAddress",
  GET_ACCOUNT_PUBLIC_KEY = "getPublicKey",
}

export interface SdkManagerMetrics {
  totalInstances: number;
  activeInstances: number;
  idleInstances: number;
  instancesByVaultAccount: Record<string, boolean>;
}
