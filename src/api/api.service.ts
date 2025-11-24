import { BasePath, TransactionResponse } from "@fireblocks/ts-sdk";
import { SdkManager } from "../pool/SdkManager";
import { ActionType, ApiServiceConfig } from "../pool/types";
import { StacksSDK } from "../StacksSDK";
import { formatErrorMessage } from "../utils/errorHandling";
import { SDKResponse } from "../services/types";

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
    params: any
  ): Promise<SDKResponse | TransactionResponse> => {
    let sdk: StacksSDK | null = null;
    try {
      // Get SDK instance from the pool
      sdk = await this.sdkManager.getSdk(vaultAccountId);

      // Execute the appropriate action based on type
      let result;
      switch (actionType) {
        case ActionType.CREATE_NATIVE_TRANSACTION:
          result = await sdk.createNativeTransaction(
            params.recipientAddress,
            params.amount,
            params.inMicro,
            params.grossTransaction,
            params.note,
            params.testnet
          );
          break;
        case ActionType.GET_BALANCE:
          result = await sdk.getBalance();
          break;
        case ActionType.GET_TRANSACTIONS_HISTORY:
          result = await sdk.getTransactionHistory(
            params.getCachedTransactions,
            params.limit,
            params.offset
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
            Unknown action type: ${actionType}`
          );
      }

      return result;
    } catch (error) {
      console.error(
        `Error executing ${actionType} for vault ${vaultAccountId}:`,
        error
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
