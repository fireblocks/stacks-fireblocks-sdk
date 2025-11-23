// src/singletons/apiService.ts
import { ApiService } from "./api.service";
import { ApiServiceConfig } from "../pool/types";
import { BasePath } from "@fireblocks/ts-sdk";
import dotenv from "dotenv";
import { config, env } from "../config";

dotenv.config(); // make sure .env is loaded once

const apiServiceConfig: ApiServiceConfig = {
  apiKey: env.FIREBLOCKS_API_KEY,
  apiSecret: env.FIREBLOCKS_SECRET_KEY_PATH,
  basePath: env.FIREBLOCKS_BASE_PATH as BasePath,
  testnet: env.TESTNET,
  poolConfig: {
    maxPoolSize: env.POOL_MAX_SIZE,
    idleTimeoutMs: env.POOL_IDLE_TIMEOUT_MS,
    cleanupIntervalMs: env.POOL_CLEANUP_INTERVAL_MS,
  },
};
// Singleton pattern — ensure only one instance exists
let instance: ApiService | null = null;

export function getApiService(): ApiService {
  if (!instance) {
    instance = new ApiService(apiServiceConfig);
  }
  return instance;
}
