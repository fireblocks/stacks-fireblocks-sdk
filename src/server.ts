import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./api/router";
import { swaggerUi, specs } from "./utils/swagger";
import { ValidationError } from "./utils/validation";
import { formatErrorMessage } from "./utils/errorHandling";
import { assertAuthConfigured, loadAuthConfig, requireAuth } from "./api/auth";
import { resolveNetworkProfile } from "./utils/network";
import { validateBondScheduleAgainstChain } from "./utils/bondScheduleChain";

// Load environment variables
dotenv.config();

const authConfig = loadAuthConfig();

// Create Express app
const app = express();
app.use(express.json());

// Restrict CORS to explicitly configured origins. With none set, cross-origin
// browser requests are refused rather than allowed from anywhere.
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: corsOrigins.length ? corsOrigins : false }));

// Authentication guards every endpoint below, including Swagger — the process
// holds Fireblocks signing authority, so an unauthenticated caller must never
// reach a fund-moving route.
app.use(requireAuth(authConfig));

// Swagger UI setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.get("/api-docs-json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

// Apply routes
app.use("/api", router);

// Validation error middleware — must be registered after routes
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: `Bad Request: ${err.message}` });
    return;
  }
  next(err);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled API error:", err);
  if (res.headersSent) return;
  res.status(500).json({ success: false, error: formatErrorMessage(err) });
});

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Not Found" });
});

// A rejected promise outside a request handler terminates the process by default,
// which would take the API down on a transient upstream failure.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", formatErrorMessage(reason));
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", formatErrorMessage(error));
  process.exit(1);
});

// Start the server only if this file is run directly (not imported)
const PORT = process.env.PORT || 3000;

// Resolves the SAME network profile the SDK pool serves requests on. The pool derives
// its network solely from the testnet boolean (api.service.ts: testnet = NETWORK ===
// "testnet"), so boot validation MUST use that same derivation — otherwise it could
// validate the schedule against a different chain than requests actually run on. (A
// NETWORK name like "public-testnet" is not honored by the REST pool today; supporting
// named profiles there is a separate change that must update both paths together.)
function resolveServerProfile() {
  const testnet = (process.env.NETWORK ?? "").toLowerCase() === "testnet";
  return resolveNetworkProfile({ testnet });
}

async function boot() {
  // Fail closed: refuse to start as an open signing proxy when auth is unconfigured.
  assertAuthConfigured(authConfig);

  // Validate the local bond-schedule constants against the deployed PoX-5 contract before
  // accepting any request. A definite mismatch is fatal — operating against a bond
  // schedule the contract does not enforce would lock or spend funds at the wrong height.
  // A transient read failure (UNKNOWN) is logged but not fatal, unless
  // STRICT_BOND_SCHEDULE_CHECK is set, so a momentary upstream outage does not brick boot.
  const schedule = await validateBondScheduleAgainstChain({ profile: resolveServerProfile() });
  if (schedule.diff && !schedule.ok) {
    console.error(`FATAL: ${schedule.error}`);
    process.exit(1);
  }
  if (!schedule.ok) {
    const strict = (process.env.STRICT_BOND_SCHEDULE_CHECK ?? "").toLowerCase() === "true";
    console.error(`${strict ? "FATAL" : "WARNING"}: ${schedule.error}`);
    if (strict) process.exit(1);
  } else {
    console.log(`Bond schedule validated against chain (BOND_GAP_CYCLES=${schedule.gapCycles}, BOND_LENGTH_CYCLES=${schedule.lengthCycles}).`);
  }

  app.listen(PORT, () => {
    console.log(`Stacks-Fireblocks SDK API server running on port ${PORT}`);
  });
}

if (require.main === module) {
  boot().catch((err) => {
    console.error("FATAL: server boot failed:", formatErrorMessage(err));
    process.exit(1);
  });
}

export { app };
