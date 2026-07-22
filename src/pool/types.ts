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
  GET_TRANSACTION_HISTORY = "getTransactionHistory",
  GET_ACCOUNT_ADDRESS = "getAddress",
  GET_ACCOUNT_PUBLIC_KEY = "getPublicKey",
  GET_BTC_REWARDS_ADDRESS = "getBtcRewardsAddress",
  DELEGATE_TO_POOL = "delegateToPool",
  ALLOW_CONTRACT_CALLER = "allowContractCaller",
  REVOKE_DELEGATION = "revokeDelegation",
  CHECK_STATUS = "checkStatus",
  STACK_SOLO = "stackSolo",
  GET_TX_STATUS_BY_ID = "getTxStatusById",
  GET_POX_INFO = "getPoxInfo",
  INCREASE_STACKED_AMOUNT = "increaseStackedAmount",
  EXTEND_STACKING_PERIOD = "extendStackingPeriod",
  REPLACE_TRANSACTION = "replaceTransaction",
  GET_ACCOUNT_NONCE = "getAccountNonce",
  // PoX-5 Solo STX
  STAKE = "stake",
  UPDATE_STAKE = "updateStake",
  UNSTAKE = "unstake",
  GRANT_SIGNER_KEY = "grantSignerKey",
  REVOKE_SIGNER_GRANT = "revokeSignerGrant",
  GET_STAKER_INFO = "getStakerInfo",
  GET_POX5_INFO = "getPox5Info",
  VERIFY_SIGNER_GRANT = "verifySignerGrant",
  // PoX-5 BTC Bonds
  CREATE_BOND = "createBond",
  GET_BOND_POSITION = "getBondPosition",
  ANNOUNCE_EARLY_EXIT = "announceEarlyExit",
  SPEND_EARLY_EXIT = "spendEarlyExit",
  GET_EARLY_EXIT_PUBLIC_KEY = "getEarlyExitPublicKey",
  GET_REQUIREMENTS = "getRequirements",
  UNLOCK_MATURED_BOND = "unlockMaturedBond",
  RENEW_BOND = "renewBond",
  CALCULATE_REWARDS = "calculateRewards",
  CLAIM_REWARDS = "claimRewards",
  CLAIM_STX_ONLY_REWARDS = "claimStxOnlyRewards",
  GET_EARNED_REWARDS = "getEarnedRewards",
  GET_BOND_LOCK_ADDRESS = "getBondLockAddress",
  FUND_BOND_LOCK_ADDRESS = "fundBondLockAddress",
  FUND_VAULT = "fundVault",
}

export interface SdkManagerMetrics {
  totalInstances: number;
  activeInstances: number;
  idleInstances: number;
}
