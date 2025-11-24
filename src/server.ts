import express from "express";
import { ApiService } from "./api/api.service";
import cors from "cors";
import { BasePath } from "@fireblocks/ts-sdk";
import dotenv from "dotenv";
import { ApiServiceConfig } from "./pool/types";
import router from "./api/router";
import { swaggerUi, specs } from "./utils/swagger";
import { getApiService } from "./api/api_service_singleton";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

// Swagger UI setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.get("/api-docs-json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

const apiServiceConfig: ApiServiceConfig = {
  apiKey: process.env.FIREBLOCKS_API_KEY || "",
  apiSecret: process.env.FIREBLOCKS_SECRET_KEY_PATH || "",
  basePath: (process.env.FIREBLOCKS_BASE_PATH as BasePath) || BasePath.US,
  poolConfig: {
    maxPoolSize: parseInt(process.env.POOL_MAX_SIZE || "100"),
    idleTimeoutMs: parseInt(process.env.POOL_IDLE_TIMEOUT_MS || "1800000"),
    cleanupIntervalMs: parseInt(
      process.env.POOL_CLEANUP_INTERVAL_MS || "300000"
    ),
  },
};

// Validate required environment variables
if (apiServiceConfig.apiKey === "") {
  console.error("FIREBLOCKS_API_KEY is not set in environment variables");
  throw new Error("InvalidEnvParams : FIREBLOCKS_API_KEY is required");
}
if (apiServiceConfig.apiSecret === "") {
  console.error("FIREBLOCKS_API_SECRET is not set in environment variables");
  throw new Error("InvalidEnvParams : FIREBLOCKS_API_SECRET is required");
}

// Initialize API service
const apiService = getApiService();

// Apply routes
app.use("/api", router);

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Stacks-Fireblocks SDK API server running on port ${PORT}`);
});
