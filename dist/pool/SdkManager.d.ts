import { StacksSDK } from "../StacksSDK";
import { PoolConfig, SdkManagerMetrics } from "./types";
import { FireblocksConfig } from "../services/types";
export declare class SdkManager {
    private sdkPool;
    private baseConfig;
    private poolConfig;
    private cleanupInterval;
    private chainApiKey?;
    constructor(baseConfig: FireblocksConfig, chainApiKey?: string, poolConfig?: Partial<PoolConfig>);
    /**
     * Get an SDK instance for a specific vault account ID
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
     * @returns New StacksSDK instance
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
