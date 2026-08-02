import { PoolInfo, StackingPools, TokenInfo, TokenType, Network } from "../services/types";
export declare const derivationPath: {
    purpose: number;
    coinTypeTestnet: number;
    coinTypeMainnet: number;
    change: number;
    addressIndex: number;
};
export declare const helperConstants: {
    vaultIdForReadOnlyActions: string;
    stacks_api_page_size: number;
    stacks_api_max_limit: number;
};
export declare const RBF_MIN_FEE_BUMP_USTX: bigint;
export declare const MAX_FEE_STX = 10;
export declare const DEFAULT_POX_FEE_USTX: bigint;
export declare const api_constants: {
    stacks_mainnet_rpc: string;
    stacks_testnet_rpc: string;
};
export declare const stacks_info: {
    stxDecimals: number;
    stxSymbol: string;
    stacking: {
        pool: {
            minLockCycles: number;
            maxLockCycles: number;
        };
        solo: {
            safetyBlocks: number;
        };
    };
};
export declare const pagination_defaults: {
    page: number;
    limit: number;
};
export declare const ftInfo: Partial<Record<TokenType, Record<Network, TokenInfo>>>;
export declare const poolInfo: Partial<Record<StackingPools, PoolInfo>>;
export declare const poxInfo: {
    testnet: {
        contractAddress: string;
        contractName: string;
    };
    mainnet: {
        contractAddress: string;
        contractName: string;
    };
};
export declare const POX4_ERRORS: Record<number, {
    name: string;
    message: string;
}>;
export declare const BTC_ESPLORA: {
    mainnet: string;
    testnet: string;
};
export declare const PRIVATE1_HIRO_API_BASE = "https://api.private-1.hiro.so";
export declare const EARLY_EXIT_SIGNER: {
    mainnet: string;
    testnet: string;
};
export declare const POX5_BOND_ERRORS: Record<number, {
    name: string;
    message: string;
}>;
