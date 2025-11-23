import { BasePath } from "@fireblocks/ts-sdk/dist/client/clientConfiguration";
import dotenv from "dotenv";

export type TConfigFireblocks = { BASE_PATH: string; API_KEY: string };
dotenv.config();

export const config: {
  fireblocks: TConfigFireblocks;
  port: number;
  network: "mainnet" | "testnet";
} = {
  port: Number(process.env.PORT) || 3000,
  fireblocks: {
    BASE_PATH: process.env.FIREBLOCKS_BASE_PATH || "",
    API_KEY: process.env.FIREBLOCKS_API_KEY || "",
  },
  network: process.env.NETWORK === "testnet" ? "testnet" : "mainnet",
};

export const env = {
  FIREBLOCKS_API_KEY: process.env.FIREBLOCKS_API_KEY ?? "",
  FIREBLOCKS_SECRET_KEY_PATH: process.env.FIREBLOCKS_SECRET_KEY_PATH ?? "",
  FIREBLOCKS_BASE_PATH:
    (process.env.FIREBLOCKS_BASE_PATH as BasePath) ?? BasePath.US,
  POOL_MAX_SIZE: parseInt(process.env.POOL_MAX_SIZE ?? "100", 10),
  POOL_IDLE_TIMEOUT_MS: parseInt(
    process.env.POOL_IDLE_TIMEOUT_MS ?? "1800000",
    10
  ),
  POOL_CLEANUP_INTERVAL_MS: parseInt(
    process.env.POOL_CLEANUP_INTERVAL_MS ?? "300000",
    10
  ),
  NETWORK: (process.env.NETWORK ?? "").toLowerCase(),
  TESTNET: (process.env.NETWORK ?? "").toLowerCase() === "testnet",
} as const;
