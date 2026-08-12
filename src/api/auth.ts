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
  /** Explicit, loudly-warned opt-out for local development only. */
  allowUnauthenticated: boolean;
}

export const loadAuthConfig = (): AuthConfig => ({
  token: process.env.API_AUTH_TOKEN || "",
  allowUnauthenticated: process.env.ALLOW_UNAUTHENTICATED === "true",
});

/**
 * Fails server startup when authentication is not configured. Called at boot (not on
 * import), so the process refuses to run as an open signing proxy. An explicit
 * `ALLOW_UNAUTHENTICATED=true` opt-out is honored for local development only.
 */
export const assertAuthConfigured = (config: AuthConfig): void => {
  if (config.token) return;
  if (config.allowUnauthenticated) {
    console.warn(
      "[SECURITY] API auth disabled (ALLOW_UNAUTHENTICATED=true) — do NOT use in production.",
    );
    return;
  }
  throw new Error(
    "Server authentication is not configured. Set API_AUTH_TOKEN (or ALLOW_UNAUTHENTICATED=true for local dev only).",
  );
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
      if (config.allowUnauthenticated) {
        next();
        return;
      }
      res.status(503).json({
        error:
          "Server authentication is not configured. Set API_AUTH_TOKEN (or ALLOW_UNAUTHENTICATED=true for local dev only).",
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
