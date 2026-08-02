/**
 * Single source of truth for network configuration 
 * A `NetworkProfile` resolves once at construction and is passed to every
 * consumer, so chain id, Stacks API, Esplora, Bitcoin network, and cosigner all
 * describe the same chain. `validateNetworkProfile` reads `/v2/info` and `/v2/pox`
 * and fails construction on a chain-id or PoX-contract mismatch.
 */
import { STACKS_MAINNET, STACKS_TESTNET, type StacksNetwork } from "@stacks/network";
import {
  api_constants,
  BTC_ESPLORA,
  EARLY_EXIT_SIGNER,
  PRIVATE1_HIRO_API_BASE,
} from "./constants";
import { formatErrorMessage } from "./errorHandling";

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

export function accountBalanceNormalizingFetch(
  baseFetch: typeof fetch = fetch,
): typeof fetch {
  const stripHexPrefix = (v: unknown): unknown =>
    typeof v === "string" && /^0x/i.test(v) ? v.slice(2) : v;

  return (async (input: any, init?: any): Promise<Response> => {
    const res = await baseFetch(input, init);
    const url =
      typeof input === "string" ? input : (input?.url ?? String(input));
    if (!res.ok || !/\/v2\/accounts\//.test(url)) return res;

    const data = await res
      .clone()
      .json()
      .catch(() => null);
    if (!data || typeof data !== "object") return res;

    const normalized = {
      ...data,
      balance: stripHexPrefix((data as any).balance),
      locked: stripHexPrefix((data as any).locked),
    };
    return new Response(JSON.stringify(normalized), {
      status: res.status,
      statusText: res.statusText,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

/**
 * Resolves the single network profile for this SDK instance. An explicit
 * `stacksApiUrl` (from config) takes precedence over the `STACKS_API_URL`
 * environment variable, which takes precedence over the per-network default.
 */
export function resolveNetworkProfile(opts: {
  testnet?: boolean;
  stacksApiUrl?: string;
}): NetworkProfile {
  const envUrl = process.env.STACKS_API_URL || undefined;

  if (opts.testnet) {
    return {
      name: "private-devnet",
      stacksApiUrl: opts.stacksApiUrl || envUrl || PRIVATE1_HIRO_API_BASE,
      chainId: 256,
      magicBytes: "id",
      esploraBaseUrl: BTC_ESPLORA.testnet,
      bech32Prefix: "bcrt",
      cosignerUrl: EARLY_EXIT_SIGNER.testnet,
      expectedPoxContractName: "pox-5",
    };
  }

  return {
    name: "mainnet",
    stacksApiUrl: opts.stacksApiUrl || envUrl || api_constants.stacks_mainnet_rpc,
    chainId: STACKS_MAINNET.chainId,
    magicBytes: STACKS_MAINNET.magicBytes,
    esploraBaseUrl: BTC_ESPLORA.mainnet,
    bech32Prefix: undefined,
    cosignerUrl: EARLY_EXIT_SIGNER.mainnet,
    expectedPoxContractName: "pox-5",
  };
}

/**
 * Builds the `StacksNetwork` object consumed by `@stacks/bitcoin-staking` and by
 * `StacksService.broadcastTransaction`, deriving chain id / magic bytes / base URL
 * from the resolved profile and installing the account-balance fetch adapter.
 */
export function stacksNetworkFromProfile(profile: NetworkProfile): StacksNetwork {
  const base = profile.name === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
  return {
    ...base,
    chainId: profile.chainId,
    magicBytes: profile.magicBytes,
    client: {
      baseUrl: profile.stacksApiUrl,
      fetch: accountBalanceNormalizingFetch(),
    },
  } as StacksNetwork;
}

/**
 * Validates that the resolved profile actually describes the chain the node is
 * serving. Reads `/v2/info` (chain id) and `/v2/pox` (active PoX contract) and
 * throws on a definite mismatch. A transport failure is surfaced as a warning
 * rather than a hard failure, since it is not proof of a mismatch.
 */
export async function validateNetworkProfile(
  profile: NetworkProfile,
): Promise<void> {
  let info: any;
  try {
    const res = await fetch(`${profile.stacksApiUrl}/v2/info`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    info = await res.json();
  } catch (error) {
    console.warn(
      `Network profile validation skipped — could not read ${profile.stacksApiUrl}/v2/info: ${formatErrorMessage(error)}`,
    );
    return;
  }

  if (
    typeof info?.network_id === "number" &&
    info.network_id !== profile.chainId
  ) {
    throw new Error(
      `Network mismatch: profile "${profile.name}" expects chain id ${profile.chainId} but ${profile.stacksApiUrl} reports ${info.network_id}. ` +
        `Set STACKS_API_URL / testnet to a node that matches the intended network.`,
    );
  }

  // The active PoX contract is only warned on, never hard-failed: a network may
  // legitimately still run an older PoX contract while this SDK's bond features
  // target a newer one, and blocking construction would also break the SDK's
  // non-bond operations (transfers, balances) on that network.
  try {
    const poxRes = await fetch(`${profile.stacksApiUrl}/v2/pox`);
    if (poxRes.ok) {
      const pox = await poxRes.json();
      const contractId: string | undefined = pox?.contract_id;
      if (
        typeof contractId === "string" &&
        !contractId.endsWith(`.${profile.expectedPoxContractName}`)
      ) {
        console.warn(
          `Active PoX contract "${contractId}" is not ".${profile.expectedPoxContractName}"; PoX-5 bond operations may be unavailable on this network.`,
        );
      }
    }
  } catch (error) {
    console.warn(`PoX contract check skipped: ${formatErrorMessage(error)}`);
  }
}
