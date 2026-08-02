import { BasePath } from "@fireblocks/ts-sdk/dist/client/clientConfiguration";
export type TConfigFireblocks = {
    BASE_PATH: string;
    API_KEY: string;
};
export declare const config: {
    fireblocks: TConfigFireblocks;
    port: number;
    network: "mainnet" | "testnet";
};
export declare const env: {
    readonly FIREBLOCKS_API_KEY: string;
    readonly FIREBLOCKS_SECRET_KEY_PATH: string;
    readonly FIREBLOCKS_BASE_PATH: BasePath;
    readonly POOL_MAX_SIZE: number;
    readonly POOL_IDLE_TIMEOUT_MS: number;
    readonly POOL_CLEANUP_INTERVAL_MS: number;
    readonly NETWORK: string;
    readonly TESTNET: boolean;
    readonly EARLY_EXIT_SIGNER_URL: string;
};
