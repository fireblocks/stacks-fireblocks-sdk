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
