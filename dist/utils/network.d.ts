/**
 * Single source of truth for network configuration
 * A `NetworkProfile` resolves once at construction and is passed to every
 * consumer, so chain id, Stacks API, Esplora, Bitcoin network, and cosigner all
 * describe the same chain. `validateNetworkProfile` reads `/v2/info` and `/v2/pox`
 * and fails construction on a chain-id or PoX-contract mismatch.
 */
import { type StacksNetwork } from "@stacks/network";
export type NetworkName = "mainnet" | "private-devnet";
export interface NetworkProfile {
    name: NetworkName;
    /** Stacks API base URL — shared by BOTH the PoX-5 client and StacksService. */
    stacksApiUrl: string;
    /** Numeric chain id; must match the node's `/v2/info` `network_id`. */
    chainId: number;
    magicBytes: string;
    esploraBaseUrl: string;
    /** bech32 HRP for BTC lock addresses; undefined = library default (mainnet 'bc'). */
    bech32Prefix?: string;
    /** Early-exit cosigner base URL; '' when not provisioned for this network. */
    cosignerUrl: string;
    /** PoX contract name expected on-chain; validated at construction. */
    expectedPoxContractName: string;
}
export declare function accountBalanceNormalizingFetch(baseFetch?: typeof fetch): typeof fetch;
/**
 * Resolves the single network profile for this SDK instance. An explicit
 * `stacksApiUrl` (from config) takes precedence over the `STACKS_API_URL`
 * environment variable, which takes precedence over the per-network default.
 */
export declare function resolveNetworkProfile(opts: {
    testnet?: boolean;
    stacksApiUrl?: string;
}): NetworkProfile;
/**
 * Builds the `StacksNetwork` object consumed by `@stacks/bitcoin-staking` and by
 * `StacksService.broadcastTransaction`, deriving chain id / magic bytes / base URL
 * from the resolved profile and installing the account-balance fetch adapter.
 */
export declare function stacksNetworkFromProfile(profile: NetworkProfile): StacksNetwork;
/**
 * Validates that the resolved profile actually describes the chain the node is
 * serving. Reads `/v2/info` (chain id) and `/v2/pox` (active PoX contract) and
 * throws on a definite mismatch. A transport failure is surfaced as a warning
 * rather than a hard failure, since it is not proof of a mismatch.
 */
export declare function validateNetworkProfile(profile: NetworkProfile): Promise<void>;
