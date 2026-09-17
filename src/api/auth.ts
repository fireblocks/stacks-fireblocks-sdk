/**
 * Authentication for the REST server.
 *
 * Stacks operations are authorized through Fireblocks RAW signing, so the platform
 * only ever sees an opaque digest and cannot enforce a destination- or amount-based
 * policy on them. The service boundary is where a caller is authenticated: the
 * process holds the signing privilege and will exercise it for whoever reaches the
 * port, so an unauthenticated caller must never reach a fund-moving route.
 *
 * Which vaults a deployment may sign for is NOT enforced here. That boundary belongs
 * to Fireblocks — a dedicated API user per deployment, restricted to the vaults it
 * should reach, together with a Transaction Authorization Policy (TAP). An in-process
 * allowlist cannot be authoritative: the process already holds a credential that can
 * sign for every vault that credential is entitled to.
 *
 * This module fails closed: without a configured API token the server refuses to
 * start (assertAuthConfigured) and every request is rejected (requireAuth), rather
 * than the server acting as an open signing proxy.
 */
import { Request, Response, NextFunction } from "express";
import { createHash, timingSafeEqual } from "crypto";

export interface AuthConfig {
  /** Shared bearer token required on every request. Empty = not configured. */
  token: string;
  /** Explicit, loudly-warned opt-out. Honoured only outside production. */
  allowUnauthenticated: boolean;
  /**
   * Whether this deployment is production. Mainnet counts, and `NETWORK` defaults to
   * mainnet when unset, so an unconfigured deployment is production and the opt-out
   * cannot apply to it.
   */
  production: boolean;
}

export const loadAuthConfig = (
  env: NodeJS.ProcessEnv = process.env,
): AuthConfig => ({
  token: env.API_AUTH_TOKEN || "",
  allowUnauthenticated: env.ALLOW_UNAUTHENTICATED === "true",
  production:
    (env.NETWORK ?? "").toLowerCase() !== "testnet" ||
    (env.NODE_ENV ?? "").toLowerCase() === "production",
});

const UNCONFIGURED =
  "Server authentication is not configured. Set API_AUTH_TOKEN (or ALLOW_UNAUTHENTICATED=true for local dev only).";

const REFUSED_IN_PRODUCTION =
  "ALLOW_UNAUTHENTICATED is not honoured in production (mainnet, or NODE_ENV=production). " +
  "The process holds a signing credential and would accept every caller that reaches the port. " +
  "Set API_AUTH_TOKEN.";

/** The opt-out applies only to a non-production deployment. */
const optOutApplies = (config: AuthConfig): boolean =>
  config.allowUnauthenticated && !config.production;

/**
 * Fails server startup when authentication is not configured. Called at boot (not on
 * import), so the process refuses to run as an open signing proxy.
 *
 * The opt-out is refused outright in production rather than warned about: a warning in a
 * boot log does not stop the process, and the failure mode is an open signing proxy.
 */
export const assertAuthConfigured = (config: AuthConfig): void => {
  if (config.token) return;
  if (config.allowUnauthenticated && config.production) {
    throw new Error(REFUSED_IN_PRODUCTION);
  }
  if (config.allowUnauthenticated) {
    console.warn(
      "[SECURITY] API auth disabled (ALLOW_UNAUTHENTICATED=true) — non-production only.",
    );
    return;
  }
  throw new Error(UNCONFIGURED);
};

const sha256 = (s: string): Buffer => createHash("sha256").update(s).digest();

/**
 * Requires a valid `Authorization: Bearer <token>` on every request. Tokens are
 * compared as SHA-256 digests via `timingSafeEqual` to avoid length/timing leaks.
 */
export const requireAuth = (config: AuthConfig) => {
  const expectedDigest = config.token ? sha256(config.token) : null;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!expectedDigest) {
      // Re-checked per request rather than trusting the boot gate: the middleware can be
      // constructed without it, and the failure mode is an open signing proxy.
      if (optOutApplies(config)) {
        next();
        return;
      }
      res.status(503).json({
        error: config.allowUnauthenticated ? REFUSED_IN_PRODUCTION : UNCONFIGURED,
      });
      return;
    }

    const header = req.header("authorization") || "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) {
      res.status(401).json({ error: "Missing or malformed bearer token" });
      return;
    }

    const provided = sha256(match[1]);
    if (
      provided.length !== expectedDigest.length ||
      !timingSafeEqual(provided, expectedDigest)
    ) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    next();
  };
};
