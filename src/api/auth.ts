/**
 * Authentication and authorization for the REST server.
 *
 * Because Stacks operations are authorized through Fireblocks RAW signing, the
 * platform only ever sees an opaque digest and cannot enforce a destination- or
 * amount-based policy on them. The service boundary is therefore the only place
 * a caller can be authenticated and mapped to permitted vaults — the process
 * holds the signing privilege and will exercise it for whoever reaches the port.
 *
 * These middlewares fail closed: without a configured API token the server
 * rejects every request rather than acting as an open signing proxy.
 */
import { Request, Response, NextFunction } from "express";
import { createHash, timingSafeEqual } from "crypto";

export interface AuthConfig {
  /** Shared bearer token required on every request. Empty = not configured. */
  token: string;
  /** When non-empty, only these vault ids may be operated on. */
  vaultAllowlist: string[];
  /** Explicit, loudly-warned opt-out for local development only. */
  allowUnauthenticated: boolean;
}

export const loadAuthConfig = (): AuthConfig => ({
  token: process.env.API_AUTH_TOKEN || "",
  vaultAllowlist: (process.env.VAULT_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  allowUnauthenticated: process.env.ALLOW_UNAUTHENTICATED === "true",
});

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
        console.warn(
          "[SECURITY] API auth disabled (ALLOW_UNAUTHENTICATED=true) — do NOT use in production.",
        );
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

/**
 * Rejects operations on any vault outside the configured allowlist. A no-op when
 * no allowlist is set; a production deployment should always set one.
 */
export const enforceVaultAllowlist = (config: AuthConfig) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (config.vaultAllowlist.length === 0) {
      next();
      return;
    }
    const vaultId = String(req.params.vaultId ?? "");
    if (vaultId && !config.vaultAllowlist.includes(vaultId)) {
      res.status(403).json({ error: `Vault ${vaultId} is not allowlisted` });
      return;
    }
    next();
  };
};
