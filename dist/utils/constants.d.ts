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
export declare const RBF_MIN_FEE_MULTIPLIER = 1.25;
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
    public_testnet: string;
};
export declare const PRIVATE1_HIRO_API_BASE = "https://api.private-1.hiro.so";
export declare const PUBLIC_TESTNET_POX5_API = "https://api.testnet-pox5.hiro.so";
export declare const EARLY_EXIT_SIGNER: {
    mainnet: string;
    testnet: string;
    public_testnet: string;
};
/**
 * A signer manager the product FEATURES for a network, supplied by Stacks Labs
 * (2026-08-29) alongside the connection values.
 *
 * PRESENTATION ONLY. This list does not gate anything, and must not be confused with the
 * two enforcement concepts it sits beside:
 *   - the signer-manager ALLOWLIST (`signerManagerAdapters`), which refuses managers when
 *     configured, and is deliberately left unconfigured so a staker can enter their own;
 *   - a manager's PAYOUT BOUND, required to claim rewards through it.
 * Featuring a manager here grants neither. A staker may still enrol with any manager.
 *
 * Third-party managers were removed from the list at the client's request after several
 * deployed ones turned out not to work; the entries below are the ones they support today.
 */
export interface FeaturedSignerManager {
    /** Fully-qualified contract id (`address.name`). */
    contract: string;
    /** Human-readable operator, for display. */
    operator: string;
    /** Pre-select this one. Exactly one entry per network is the default. */
    default: boolean;
}
export declare const FEATURED_SIGNER_MANAGERS: {
    mainnet: FeaturedSignerManager[];
    "private-devnet": FeaturedSignerManager[];
    "public-testnet": FeaturedSignerManager[];
};
/**
 * The manager to pre-select for a network, or undefined when none is featured.
 *
 * The optional chain is load-bearing: the parameter type stops a TypeScript caller passing
 * an unknown key, but a network name threaded through from config at runtime is just a
 * string. Indexing on a miss yields undefined, and `.find` on it would throw a TypeError —
 * so the signature would promise a graceful miss the implementation did not deliver.
 */
export declare const defaultSignerManagerFor: (network: keyof typeof FEATURED_SIGNER_MANAGERS) => FeaturedSignerManager | undefined;
export declare const POX5_BOND_ERRORS: Record<number, {
    name: string;
    message: string;
}>;
