import { BasePath } from "@fireblocks/ts-sdk";
import { StacksSDK } from "../StacksSDK";
import { LockRecordStore } from "../staking/bonds/unlock-bytes-store";

export interface PoolConfig {
  maxPoolSize: number;
  idleTimeoutMs: number;
  cleanupIntervalMs: number;
  /**
   * Shared across every pooled instance so PoX-5 bond lock records outlive pool
   * eviction and process restarts. Defaults to each instance's own in-memory store.
   * A durable, shared backend is required in production for any deployment that
   * creates native BTC bonds.
   */
  lockRecordStore?: LockRecordStore;
}

export interface SdkPoolItem {
  sdk: StacksSDK;
  lastUsed: Date;
  /**
   * Number of concurrent callers currently holding this instance. Only an instance
   * with refCount 0 is idle and therefore eligible for eviction — a shared instance
   * must not be evicted while any caller is still mid-operation, or a replacement
   * instance with an independent nonce queue could be built for the same vault.
   */
  refCount: number;
}

export interface ApiServiceConfig {
  apiKey: string;
  apiSecret: string;
  basePath: BasePath | string;
  poolConfig?: Partial<PoolConfig>;
  testnet?: boolean;
  /** Optional Hiro API key, sent as `x-hiro-api-key` on StacksService requests. */
  chainApiKey?: string;
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
  DELEGATE_TO_POOL = "delegateToPool",
  ALLOW_CONTRACT_CALLER = "allowContractCaller",
  REVOKE_DELEGATION = "revokeDelegation",
  CHECK_STATUS = "checkStatus",
  STACK_SOLO = "stackSolo",
  GET_TX_STATUS_BY_ID = "getTxStatusById",
  GET_BTC_TX_STATUS = "getBtcTxStatus",
  VALIDATE_BOND_SCHEDULE = "validateBondSchedule",
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
  UPDATE_BOND_REGISTRATION = "updateBondRegistration",
  GET_STAKER_INFO = "getStakerInfo",
  GET_POX5_INFO = "getPox5Info",
  VERIFY_SIGNER_GRANT = "verifySignerGrant",
  // PoX-5 BTC Bonds
  CREATE_BOND = "createBond",
  CREATE_SBTC_BOND = "createSbtcBond",
  ROLL_SBTC_BOND = "rollSbtcBond",
  UNSTAKE_SBTC = "unstakeSbtc",
  GET_BOND_POSITION = "getBondPosition",
  ANNOUNCE_EARLY_EXIT = "announceEarlyExit",
  SPEND_EARLY_EXIT = "spendEarlyExit",
  GET_EARLY_EXIT_PUBLIC_KEY = "getEarlyExitPublicKey",
  GET_REQUIREMENTS = "getRequirements",
  UNLOCK_BTC = "unlockMaturedBond",
  REPLACE_BTC_RECOVERY_FEE = "replaceBtcRecoveryFee",
  RENEW_BOND = "renewBond",
  CALCULATE_REWARDS = "calculateRewards",
  CLAIM_REWARDS = "claimRewards",
  CLAIM_STX_ONLY_REWARDS = "claimStxOnlyRewards",
  GET_EARNED_REWARDS = "getEarnedRewards",
  GET_BOND_LOCK_ADDRESS = "getBondLockAddress",
  FUND_BOND_LOCK_ADDRESS = "fundBondLockAddress",
  FUND_VAULT = "fundVault",
  // App-surface actions (Electron consumption; not present on the server branch)
  ESTIMATE_FEE = "estimateFee",
  GET_CONTRACT_CALL_HISTORY = "getContractCallHistory",
  MAKE_CONTRACT_CALL = "makeContractCall",
  SIGN_TRANSACTION = "signExternalTransaction",
  SIGN_MESSAGE = "signMessage",
  SIGN_STRUCTURED_MESSAGE = "signStructuredMessage",
}

export interface SdkManagerMetrics {
  totalInstances: number;
  activeInstances: number;
  idleInstances: number;
}
