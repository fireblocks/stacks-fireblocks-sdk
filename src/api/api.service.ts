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
          result = await sdk.revokeDelegation(params.nonce);
          break;
        case ActionType.CHECK_STATUS:
          result = await sdk.checkStatus();
          break;
        case ActionType.STACK_SOLO:
          result = await sdk.stackSolo(
            params.signerKey,
            params.signerSig65Hex,
            params.amount,
            params.maxAmount,
            params.lockPeriod,
            params.authId,
            params.note,
            params.nonce,
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
            params.nonce,
          );
          break;
        case ActionType.ALLOW_CONTRACT_CALLER:
          result = await sdk.allowContractCaller(
            params.poolAddress,
            params.poolContractName,
            params.nonce,
          );
          break;
        case ActionType.CREATE_NATIVE_TRANSACTION:
          result = await sdk.createNativeTransaction(
            params.recipientAddress,
            params.amount,
            params.grossTransaction,
            params.note,
            params.nonce,
            params.fee,
            params.memo,
            params.externalId,
          );
          break;
        case ActionType.CREATE_FT_TRANSACTION:
          result = await sdk.createFTTransaction(
            params.recipientAddress,
            params.amount,
            params.tokenType,
            params.tokenContractAddress,
            params.tokenContractName,
            params.tokenAssetName,
            params.note,
            params.nonce,
            params.externalId,
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
            params.fetchAll,
            params.fetchPending,
          );
          break;
        case ActionType.GET_ACCOUNT_ADDRESS:
          result = await sdk.getAddress();
          break;
        case ActionType.GET_ACCOUNT_PUBLIC_KEY:
          result = await sdk.getPublicKey();
          break;
        case ActionType.GET_POX_INFO:
          result = await sdk.getPoxInfo();
          break;
        case ActionType.INCREASE_STACKED_AMOUNT:
          result = await sdk.increaseStackedAmount(
            params.signerKey,
            params.signerSig65Hex,
            params.increaseBy,
            params.maxAmount,
            params.authId,
            params.note,
            params.nonce,
          );
          break;
        case ActionType.EXTEND_STACKING_PERIOD:
          result = await sdk.extendStackingPeriod(
            params.signerKey,
            params.signerSig65Hex,
            params.extendCycles,
            params.maxAmount,
            params.authId,
            params.note,
            params.nonce,
          );
          break;
        case ActionType.REPLACE_TRANSACTION:
          result = await sdk.replaceTransaction(
            params.newFee,
            params.originalTxId,
            params.newRecipient,
            params.newAmount,
            params.nonceOverride,
          );
          break;
        case ActionType.GET_ACCOUNT_NONCE:
          result = await sdk.getAccountNonce();
          break;
        case ActionType.STAKE:
          result = await sdk.stake(
            params.amount,
            params.numCycles,
            params.signerManager,
            params.note,
            params.nonce,
            params.externalId,
          );
          break;
        case ActionType.UPDATE_STAKE:
          result = await sdk.updateStake(
            params.signerManager,
            params.oldSignerManager,
            params.cyclesToExtend,
            params.increaseBy,
            params.note,
            params.nonce,
            params.externalId,
          );
          break;
        case ActionType.UNSTAKE:
          result = await sdk.unstake(
            params.oldSignerManager,
            params.note,
            params.nonce,
            params.externalId,
          );
          break;
        case ActionType.GRANT_SIGNER_KEY:
          result = await sdk.grantSignerKey(
            params.signerManager,
            params.authId,
            params.note,
            params.nonce,
            params.externalId,
          );
          break;
        case ActionType.REVOKE_SIGNER_GRANT:
          result = await sdk.revokeSignerGrant(
            params.signerManager,
            params.signerKey,
            params.note,
            params.nonce,
            params.externalId,
          );
          break;
        case ActionType.GET_STAKER_INFO:
          result = await sdk.getStakerInfo();
          break;
        case ActionType.GET_POX5_INFO:
          result = await sdk.getPox5Info();
          break;
        case ActionType.VERIFY_SIGNER_GRANT:
          result = await sdk.verifySignerGrant(
            params.signerManager,
            params.txid,
          );
          break;
        case ActionType.CREATE_BOND:
          result = await sdk.createBond(
            params.bondIndex,
            params.btcAmountSats,
            params.signerManager,
            { note: params.note, nonce: params.nonce, externalId: params.externalId, confirmations: params.confirmations },
          );
          break;
        case ActionType.GET_BOND_POSITION:
          result = await sdk.getBondPosition();
          break;
        case ActionType.ANNOUNCE_EARLY_EXIT:
          result = await sdk.announceEarlyExit({ note: params.note, nonce: params.nonce, externalId: params.externalId });
          break;
        case ActionType.GET_REQUIREMENTS:
          result = await sdk.getRequirements({ bondIndex: params.bondIndex, btcAmountSats: params.btcAmountSats });
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
