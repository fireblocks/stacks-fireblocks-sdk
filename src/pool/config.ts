import { BasePath } from "@fireblocks/ts-sdk";
import { FireblocksConfig } from "../services/types";
import { ApiServiceConfig } from "./types";

/**
 * Maps the REST layer's `ApiServiceConfig` onto the `FireblocksConfig` every pooled SDK
 * instance is built from.
 *
 * Enumerated rather than spread, because `ApiServiceConfig` also carries REST-only keys
 * (`poolConfig`) that must not reach the SDK. The cost of that is real: an SDK option
 * added here is invisible until this function forwards it, and it fails silently rather
 * than loudly — the boundary has already swallowed `getHistoricalBondPosition`,
 * `rewardBtcAddress` and `signerManagerAdapters`. A new option belongs in this function
 * and its test in the same commit as the option itself.
 */
/**
 * Builds the REST layer's `ApiServiceConfig` from the process environment.
 *
 * Kept out of `ApiService`'s module scope so it can be asserted directly: importing that
 * module constructs the process-wide pool and its cleanup interval at load time.
 */
export const apiServiceConfigFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
): ApiServiceConfig => ({
  apiKey: env.FIREBLOCKS_API_KEY || "",
  apiSecret: env.FIREBLOCKS_SECRET_KEY_PATH || "",
  basePath: (env.FIREBLOCKS_BASE_PATH as BasePath) || BasePath.US,
  testnet: (env.NETWORK ?? "").toLowerCase() === "testnet",
  verifyEarlyExitCosignerAtFunding:
    (env.VERIFY_EARLY_EXIT_COSIGNER_AT_FUNDING ?? "").toLowerCase() === "true",
  // Undefined rather than empty: the value is threaded into a request header.
  chainApiKey: env.CHAIN_API_KEY || undefined,
  poolConfig: {
    maxPoolSize: parseInt(env.POOL_MAX_SIZE || "100"),
    idleTimeoutMs: parseInt(env.POOL_IDLE_TIMEOUT_MS || "1800000"),
    cleanupIntervalMs: parseInt(env.POOL_CLEANUP_INTERVAL_MS || "300000"),
  },
});

export const toFireblocksConfig = (
  config: ApiServiceConfig,
): FireblocksConfig => ({
  apiKey: config.apiKey,
  apiSecret: config.apiSecret,
  basePath: (config.basePath as BasePath) || BasePath.US,
  testnet: !!config.testnet,
  verifyEarlyExitCosignerAtFunding: !!config.verifyEarlyExitCosignerAtFunding,
  chainApiKey: config.chainApiKey,
});
