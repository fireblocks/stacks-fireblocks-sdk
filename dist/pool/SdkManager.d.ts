import { StacksSDK } from "../StacksSDK";
import { PoolConfig, SdkManagerMetrics } from "./types";
import { FireblocksConfig } from "../services/types";
export declare class SdkManager {
    private sdkPool;
    private creating;
    private baseConfig;
    private poolConfig;
    private cleanupInterval;
    /** Optional Hiro API key, forwarded to every pooled StacksSDK instance. */
    private chainApiKey?;
    constructor(baseConfig: FireblocksConfig, chainApiKey?: string, poolConfig?: Partial<PoolConfig>);
    /**
     * Pool key for a vault. Network identity is part of the key so an instance built
     * for one network is never handed out for another.
     */
    private poolKey;
    /**
     * Get an SDK instance for a specific vault account ID. Instance acquisition is
     * atomic: the decision path below runs synchronously (no await) up to the point a
     * single construction promise is registered, so concurrent cold calls for the same
     * vault share one construction rather than building duplicate instances.
     * @param vaultAccountId Fireblocks vault account ID
     * @returns StacksSDK instance
     */
    getSdk: (vaultAccountId: string) => Promise<StacksSDK>;
    /**
     * Release an SDK instance back to the pool
     * @param vaultAccountId Vault account ID
     */
    releaseSdk: (vaultAccountId: string) => void;
    /**
     * Create a new SDK instance
     * @param vaultAccountId Vault account ID
     * @returns New MovementFireblocksSDK instance
     */
    private createSdkInstance;
    /**
     * Find and remove the oldest idle SDK instance
     * @returns True if an instance was removed, false otherwise
     */
    private removeOldestIdleSdk;
    /**
     * Clean up idle SDK instances
     */
    private cleanupIdleSdks;
    /**
     * Get metrics about the SDK pool
     */
    getMetrics: () => SdkManagerMetrics;
    /**
     * Shut down all SDK instances and clean up resources
     */
    shutdown: () => Promise<void>;
}
