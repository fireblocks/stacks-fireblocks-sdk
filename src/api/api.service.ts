import { BasePath, TransactionResponse } from "@fireblocks/ts-sdk";
import { SdkManager } from "../pool/SdkManager";
import { ActionType, ApiServiceConfig } from "../pool/types";
import { StacksSDK } from "../StacksSDK";
import { formatErrorMessage } from "../utils/errorHandling";
import { SDKResponse } from "../services/types";

// Configure the API Service once for all handlers
const apiConfig: ApiServiceConfig = {
  apiKey: process.env.FIREBLOCKS_API_KEY || "",
  apiSecret: process.env.FIREBLOCKS_SECRET_KEY_PATH || "",
  basePath: (process.env.FIREBLOCKS_BASE_PATH as BasePath) || BasePath.US,
  testnet: (process.env.NETWORK ?? "").toLowerCase() === "testnet",
  // Optional: customize pool size/timeouts here
  poolConfig: {
    maxPoolSize: parseInt(process.env.POOL_MAX_SIZE || "100"),
    idleTimeoutMs: parseInt(process.env.POOL_IDLE_TIMEOUT_MS || "1800000"),
    cleanupIntervalMs: parseInt(
      process.env.POOL_CLEANUP_INTERVAL_MS || "300000",
    ),
  },
};

// Validate required environment variables
if (apiConfig.apiKey === "") {
  console.error("FIREBLOCKS_API_KEY is not set in environment variables");
  throw new Error("InvalidEnvParams : FIREBLOCKS_API_KEY is required");
}
if (apiConfig.apiSecret === "") {
  console.error("FIREBLOCKS_API_SECRET is not set in environment variables");
  throw new Error("InvalidEnvParams : FIREBLOCKS_API_SECRET is required");
}

export class ApiService {
  private sdkManager: SdkManager;

  constructor(config: ApiServiceConfig) {
    const baseConfig = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      basePath: (config.basePath as BasePath) || BasePath.US,
      vaultAccountId: "", // Will be overridden per request
      testnet: !!config.testnet,
    };

    this.sdkManager = new SdkManager(baseConfig, config.poolConfig);
  }

  /**
   * Execute an action using the appropriate SDK method
   */
  public executeAction = async (
    vaultAccountId: string,
    actionType: ActionType,
    params: any,
  ): Promise<SDKResponse | TransactionResponse> => {
    let sdk: StacksSDK | null = null;
    try {
      // Get SDK instance from the pool
      sdk = await this.sdkManager.getSdk(vaultAccountId);

      // Execute the appropriate action based on type
      let result;
      switch (actionType) {
        case ActionType.GET_BTC_REWARDS_ADDRESS:
          result = await sdk.getBtcRewardsAddress();
          break;
        case ActionType.REVOKE_DELEGATION:
          result = await sdk.revokeDelegation();
          break;
        case ActionType.CHECK_STATUS:
          result = await sdk.checkStatus();
          break;
        case ActionType.STACK_SOLO:
          result = await sdk.stackSolo(
            params.amount,
            params.lockPeriod,
            params.authId,
          );
          break;
        case ActionType.GET_TX_STATUS_BY_ID:
          result = await sdk.getTxStatusById(params.txId);
          break;

        case ActionType.DELEGATE_TO_POOL:
          result = await sdk.delegateToPool(
            params.poolAddress,
            params.poolContractName,
            params.amount,
            params.lockPeriod,
          );
          break;
        case ActionType.ALLOW_CONTRACT_CALLER:
          result = await sdk.allowContractCaller(
            params.poolAddress,
            params.poolContractName,
          );
          break;
        case ActionType.CREATE_NATIVE_TRANSACTION:
          result = await sdk.createNativeTransaction(
            params.recipientAddress,
            params.amount,
            params.grossTransaction,
            params.note,
          );
          break;
        case ActionType.CREATE_FT_TRANSACTION:
          result = await sdk.createFTTransaction(
            params.recipientAddress,
            params.amount,
            params.tokenType,
            params.note,
          );
          break;
        case ActionType.GET_BALANCE:
          result = await sdk.getBalance();
          break;
        case ActionType.GET_FT_BALANCES:
          result = await sdk.getFtBalances();
          break;
        case ActionType.GET_TRANSACTIONS_HISTORY:
          result = await sdk.getTransactionHistory(
            params.getCachedTransactions,
            params.limit,
            params.offset,
          );
          break;
        case ActionType.GET_ACCOUNT_ADDRESS:
          result = await sdk.getAddress();
          break;
        case ActionType.GET_ACCOUNT_PUBLIC_KEY:
          result = await sdk.getPublicKey();
          break;
        default:
          throw new Error(
            `InvalidType :
            Unknown action type: ${actionType}`,
          );
      }

      return result;
    } catch (error) {
      console.error(
        `Error executing ${actionType} for vault ${vaultAccountId}:`,
        error,
      );
      throw new Error(`Failed to execute action: ${formatErrorMessage(error)}`);
    } finally {
      // Always release the SDK back to the pool
      if (sdk) {
        this.sdkManager.releaseSdk(vaultAccountId);
      }
    }
  };
  /**
   * Get metrics about the SDK pool
   */
  public getPoolMetrics = () => {
    return this.sdkManager.getMetrics();
  };

  /**
   * Shut down the API service and all SDK instances
   */
  public shutdown = async (): Promise<void> => {
    return this.sdkManager.shutdown();
  };
}

export const apiServiceSingleton = new ApiService(apiConfig);
