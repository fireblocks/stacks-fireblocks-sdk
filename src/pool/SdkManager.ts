import { StacksSDK } from "../StacksSDK";
import { PoolConfig, SdkPoolItem, SdkManagerMetrics } from "./types";
import { FireblocksConfig } from "../services/types";
import { formatErrorMessage } from "../utils/errorHandling";
import { PoolCapacityError, SdkInitializationError } from "./errors";

export class SdkManager {
  private sdkPool: Map<string, SdkPoolItem> = new Map();
  private baseConfig: FireblocksConfig;
  private poolConfig: PoolConfig;
  private cleanupInterval: NodeJS.Timeout;
  private chainApiKey?: string;

  constructor(baseConfig: FireblocksConfig, chainApiKey?: string, poolConfig?: Partial<PoolConfig>) {
    this.baseConfig = baseConfig;
    this.chainApiKey = chainApiKey;
    // Set default pool config values
    this.poolConfig = {
      maxPoolSize: poolConfig?.maxPoolSize || 100,
      idleTimeoutMs: poolConfig?.idleTimeoutMs || 30 * 60 * 1000, // 30 minutes
      cleanupIntervalMs: poolConfig?.cleanupIntervalMs || 5 * 60 * 1000, // 5 minutes
    };

    // Start cleanup interval
    this.cleanupInterval = setInterval(
      () => this.cleanupIdleSdks(),
      this.poolConfig.cleanupIntervalMs
    );
  }

  /**
   * Get an SDK instance for a specific vault account ID
   * @param vaultAccountId Fireblocks vault account ID
   * @returns StacksSDK instance
   */
  public getSdk = async (vaultAccountId: string): Promise<StacksSDK> => {
    // Check if we already have an instance for this vault account
    const poolItem = this.sdkPool.get(vaultAccountId);

    // If instance exists and is not in use, return it
    if (poolItem && !poolItem.isInUse) {
      console.log(`Reusing existing SDK instance for vault ${vaultAccountId}`);
      poolItem.lastUsed = new Date();
      poolItem.isInUse = true;
      return poolItem.sdk;
    }

    // Check pool capacity
    if (this.sdkPool.size >= this.poolConfig.maxPoolSize && !poolItem) {
      // Try to find and remove an idle instance
      const removed = await this.removeOldestIdleSdk();
      if (!removed) {
        throw new PoolCapacityError(
          `SDK pool is at maximum capacity (${this.poolConfig.maxPoolSize}) with no idle connections`
        );
      }
    }

    // Create a new SDK instance if needed
    if (!poolItem) {
      const sdk = await this.createSdkInstance(vaultAccountId);
      this.sdkPool.set(vaultAccountId, {
        sdk,
        lastUsed: new Date(),
        isInUse: true,
      });
      return sdk;
    } else {
      // Instance exists but is in use
      poolItem.lastUsed = new Date();
      poolItem.isInUse = true;
      return poolItem.sdk;
    }
  };

  /**
   * Release an SDK instance back to the pool
   * @param vaultAccountId Vault account ID
   */
  public releaseSdk = (vaultAccountId: string): void => {
    const poolItem = this.sdkPool.get(vaultAccountId);
    if (poolItem) {
      poolItem.isInUse = false;
      poolItem.lastUsed = new Date();
    }
  };

  /**
   * Create a new SDK instance
   * @param vaultAccountId Vault account ID
   * @returns New StacksSDK instance
   */
  private createSdkInstance = async (
    vaultAccountId: string
  ): Promise<StacksSDK> => {
    const config: FireblocksConfig = {
      ...this.baseConfig,
    };

    try {
      console.log(`Creating new SDK instance for vault ${vaultAccountId}`);
      const sdk = await StacksSDK.create(vaultAccountId, config, this.chainApiKey);
      return sdk;
    } catch (error) {
      console.error(`Failed to create SDK for vault ${vaultAccountId}:`, error);
      throw new SdkInitializationError(
        vaultAccountId,
        formatErrorMessage(error)
      );
    }
  };

  /**
   * Find and remove the oldest idle SDK instance
   * @returns True if an instance was removed, false otherwise
   */
  private removeOldestIdleSdk = async (): Promise<boolean> => {
    let oldestKey: string | null = null;
    let oldestDate: Date = new Date();

    // Find the oldest idle instance
    for (const [key, value] of this.sdkPool.entries()) {
      if (!value.isInUse && value.lastUsed < oldestDate) {
        oldestDate = value.lastUsed;
        oldestKey = key;
      }
    }

    // If an idle instance was found, shut it down and remove it
    if (oldestKey) {
      this.sdkPool.delete(oldestKey);
      return true;
    }

    return false;
  };

  /**
   * Clean up idle SDK instances
   */
  private cleanupIdleSdks = async (): Promise<void> => {
    const now = new Date();
    const keysToRemove: string[] = [];

    for (const [key, value] of this.sdkPool.entries()) {
      if (!value.isInUse) {
        const idleTime = now.getTime() - value.lastUsed.getTime();
        if (idleTime > this.poolConfig.idleTimeoutMs) {
          keysToRemove.push(key);
        }
      }
    }

    for (const key of keysToRemove) {
      try {
        this.sdkPool.delete(key);
        console.log(`Removed idle SDK instance for vault ${key}`);
      } catch (error) {
        console.error(`Error shutting down SDK for vault ${key}:`, error);
      }
    }
  };

  /**
   * Get metrics about the SDK pool
   */
  public getMetrics = (): SdkManagerMetrics => {
    const metrics: SdkManagerMetrics = {
      totalInstances: this.sdkPool.size,
      activeInstances: 0,
      idleInstances: 0,
      instancesByVaultAccount: {},
    };

    for (const [key, value] of this.sdkPool.entries()) {
      if (value.isInUse) {
        metrics.activeInstances++;
      } else {
        metrics.idleInstances++;
      }
      metrics.instancesByVaultAccount[key] = value.isInUse;
    }

    return metrics;
  };

  /**
   * Shut down all SDK instances and clean up resources
   */
  public shutdown = async (): Promise<void> => {
    clearInterval(this.cleanupInterval);
    this.sdkPool.clear();
    console.log("All SDK instances have been shut down");
  };
}
