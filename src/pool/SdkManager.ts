import { StacksSDK } from "../StacksSDK";
import { PoolConfig, SdkPoolItem, SdkManagerMetrics } from "./types";
import { FireblocksConfig } from "../services/types";
import { formatErrorMessage } from "../utils/errorHandling";
import { PoolCapacityError, SdkInitializationError } from "./errors";

export class SdkManager {
  private sdkPool: Map<string, SdkPoolItem> = new Map();
  // In-flight constructions keyed the same way as sdkPool. Concurrent cold calls for
  // one key share a single creation promise so exactly one instance is built — two
  // instances for the same vault would have independent nonce queues and could
  // collide on nonces.
  private creating: Map<string, Promise<StacksSDK>> = new Map();
  private baseConfig: FireblocksConfig;
  private poolConfig: PoolConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(baseConfig: FireblocksConfig, poolConfig?: Partial<PoolConfig>) {
    this.baseConfig = baseConfig;
    // Set default pool config values
    this.poolConfig = {
      maxPoolSize: poolConfig?.maxPoolSize || 100,
      idleTimeoutMs: poolConfig?.idleTimeoutMs || 30 * 60 * 1000, // 30 minutes
      cleanupIntervalMs: poolConfig?.cleanupIntervalMs || 5 * 60 * 1000, // 5 minutes
      lockRecordStore: poolConfig?.lockRecordStore,
    };

    // Start cleanup interval
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupIdleSdks().catch((error) => {
          console.error("SDK pool cleanup failed:", formatErrorMessage(error));
        });
      },
      this.poolConfig.cleanupIntervalMs
    );
  }

  /**
   * Pool key for a vault. Network identity is part of the key so an instance built
   * for one network is never handed out for another.
   */
  private poolKey = (vaultAccountId: string): string =>
    `${this.baseConfig.testnet ? "testnet" : "mainnet"}:${vaultAccountId}`;

  /**
   * Get an SDK instance for a specific vault account ID. Instance acquisition is
   * atomic: the decision path below runs synchronously (no await) up to the point a
   * single construction promise is registered, so concurrent cold calls for the same
   * vault share one construction rather than building duplicate instances.
   * @param vaultAccountId Fireblocks vault account ID
   * @returns StacksSDK instance
   */
  public getSdk = async (vaultAccountId: string): Promise<StacksSDK> => {
    const key = this.poolKey(vaultAccountId);

    // A constructed instance already exists — reuse it.
    const poolItem = this.sdkPool.get(key);
    if (poolItem) {
      poolItem.lastUsed = new Date();
      poolItem.isInUse = true;
      return poolItem.sdk;
    }

    // A construction is already in flight for this key — share it.
    const inFlight = this.creating.get(key);
    if (inFlight) return inFlight;

    // Capacity check counts both constructed and in-flight instances. Evict an idle
    // instance if at capacity; refuse if none can be evicted. removeOldestIdleSdk is
    // synchronous, so no other call can interleave before the promise is registered.
    if (this.sdkPool.size + this.creating.size >= this.poolConfig.maxPoolSize) {
      const removed = this.removeOldestIdleSdk();
      if (!removed) {
        throw new PoolCapacityError(
          `SDK pool is at maximum capacity (${this.poolConfig.maxPoolSize}) with no idle connections`
        );
      }
    }

    const creation = this.createSdkInstance(vaultAccountId)
      .then((sdk) => {
        this.sdkPool.set(key, { sdk, lastUsed: new Date(), isInUse: true });
        return sdk;
      })
      .finally(() => {
        // Clear the in-flight marker on both success and failure, so a failed
        // construction allows a clean retry and a successful one does not leak.
        this.creating.delete(key);
      });

    this.creating.set(key, creation);
    return creation;
  };

  /**
   * Release an SDK instance back to the pool
   * @param vaultAccountId Vault account ID
   */
  public releaseSdk = (vaultAccountId: string): void => {
    const poolItem = this.sdkPool.get(this.poolKey(vaultAccountId));
    if (poolItem) {
      poolItem.isInUse = false;
      poolItem.lastUsed = new Date();
    }
  };

  /**
   * Create a new SDK instance
   * @param vaultAccountId Vault account ID
   * @returns New MovementFireblocksSDK instance
   */
  private createSdkInstance = async (
    vaultAccountId: string
  ): Promise<StacksSDK> => {
    const config: FireblocksConfig = {
      ...this.baseConfig,
    };

    try {
      console.log(`Creating new SDK instance for vault ${vaultAccountId}`);
      const sdk = await StacksSDK.create(vaultAccountId, config);
      if (this.poolConfig.lockRecordStore) {
        sdk.setLockRecordStore(this.poolConfig.lockRecordStore);
      }
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
  private removeOldestIdleSdk = (): boolean => {
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
    };

    for (const [, value] of this.sdkPool.entries()) {
      if (value.isInUse) {
        metrics.activeInstances++;
      } else {
        metrics.idleInstances++;
      }
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
