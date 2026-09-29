import { BasePath } from "@fireblocks/ts-sdk";
import { FireblocksConfig } from "../services/types";
import { ApiServiceConfig } from "./types";
import { SignerManagerAdapter } from "../staking/signer-manager-adapter";

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
 * A Stacks contract principal: C32 address, a dot, and a contract name. Shape only —
 * enough to reject a typo, not a checksum validation.
 */
const CONTRACT_PRINCIPAL = /^S[0-9A-Z]{25,41}\.[a-zA-Z][a-zA-Z0-9_-]{0,39}$/;

/**
 * Parses `SIGNER_MANAGER_ALLOWLIST` — a comma-separated list of signer-manager contract
 * principals — into adapters.
 *
 * Fails CLOSED, by throwing. An empty registry means "no allowlist configured, every
 * manager allowed", so a value that parsed to nothing or dropped a malformed entry would
 * silently disable the control the operator just switched on. Returns undefined only
 * when the variable is genuinely absent.
 *
 * Only the allowlist is exposed through the environment. The payout-asset override on an
 * adapter is structured data with no natural flat encoding, and a caller who needs it is
 * building `ApiServiceConfig` in code already.
 */
export const signerManagerAllowlistFromEnv = (
  raw: string | undefined,
): SignerManagerAdapter[] | undefined => {
  // Empty or whitespace-only reads as UNSET: `.env.example` ships every optional
  // variable with no value, and throwing on a copied example file would make the
  // server refuse to boot over a setting nobody configured. A non-empty value that
  // yields no usable entry is a different thing, and still throws below.
  if (raw === undefined || raw.trim().length === 0) return undefined;
  const entries = raw
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
  if (entries.length === 0) {
    throw new Error(
      "SIGNER_MANAGER_ALLOWLIST is set but lists no signer manager. Remove the variable to impose no allowlist; an empty value would leave every manager allowed.",
    );
  }
  const invalid = entries.filter((e) => !CONTRACT_PRINCIPAL.test(e));
  if (invalid.length > 0) {
    throw new Error(
      `SIGNER_MANAGER_ALLOWLIST contains ${invalid.length} entry/entries that are not contract principals: ${invalid.join(", ")}. Expected a comma-separated list of <address>.<contract-name>.`,
    );
  }
  return entries.map((contractPrincipal) => ({ contractPrincipal }));
};

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
  signerManagerAdapters: signerManagerAllowlistFromEnv(
    env.SIGNER_MANAGER_ALLOWLIST,
  ),
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
  signerManagerAdapters: config.signerManagerAdapters,
});
