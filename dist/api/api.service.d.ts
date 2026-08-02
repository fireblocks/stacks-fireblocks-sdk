import { TransactionResponse } from "@fireblocks/ts-sdk";
import { ActionType, ApiServiceConfig } from "../pool/types";
import { SDKResponse } from "../services/types";
export declare class ApiService {
    private sdkManager;
    constructor(config: ApiServiceConfig);
    /**
     * Execute an action using the appropriate SDK method
     */
    executeAction: (vaultAccountId: string, actionType: ActionType, params: any) => Promise<SDKResponse | TransactionResponse>;
    /**
     * Get metrics about the SDK pool
     */
    getPoolMetrics: () => import("../pool/types").SdkManagerMetrics;
    /**
     * Shut down the API service and all SDK instances
     */
    shutdown: () => Promise<void>;
}
