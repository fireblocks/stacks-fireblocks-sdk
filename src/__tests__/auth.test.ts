import request from "supertest";
import express from "express";
import { requireAuth, assertAuthConfigured, loadAuthConfig, AuthConfig } from "../api/auth";

const buildApp = (config: AuthConfig) => {
  const app = express();
  app.use(express.json());
  app.use(requireAuth(config));
  app.get("/api/:vaultId/balance", (_req, res) => res.json({ ok: true }));
  app.get("/api/transactions/:txId", (_req, res) => res.json({ ok: true }));
  return app;
};

const base: AuthConfig = { token: "", allowUnauthenticated: false, production: true };

describe("REST authentication (requireAuth)", () => {
  it("fails closed with 503 when no token is configured", async () => {
    const app = buildApp({ ...base });
    const res = await request(app).get("/api/5/balance");
    expect(res.status).toBe(503);
  });

  it("allows requests when unauthenticated mode is explicitly enabled", async () => {
    const app = buildApp({ ...base, allowUnauthenticated: true, production: false });
    const res = await request(app).get("/api/5/balance");
    expect(res.status).toBe(200);
  });

  it("rejects a request with no bearer token (401)", async () => {
    const app = buildApp({ ...base, token: "s3cret" });
    const res = await request(app).get("/api/5/balance");
    expect(res.status).toBe(401);
  });

  it("rejects a wrong token (401)", async () => {
    const app = buildApp({ ...base, token: "s3cret" });
    const res = await request(app)
      .get("/api/5/balance")
      .set("Authorization", "Bearer wrong");
    expect(res.status).toBe(401);
  });

  it("accepts the correct token", async () => {
    const app = buildApp({ ...base, token: "s3cret" });
    const res = await request(app)
      .get("/api/5/balance")
      .set("Authorization", "Bearer s3cret");
    expect(res.status).toBe(200);
  });
});

describe("startup auth gate (assertAuthConfigured)", () => {
  it("throws when no token is configured", () => {
    expect(() => assertAuthConfigured({ ...base })).toThrow();
  });

  it("does not throw when a token is configured", () => {
    expect(() => assertAuthConfigured({ ...base, token: "s3cret" })).not.toThrow();
  });

  it("does not throw when unauthenticated mode is explicitly enabled", () => {
    expect(() =>
      assertAuthConfigured({ ...base, allowUnauthenticated: true, production: false }),
    ).not.toThrow();
  });
});

/**
 * `ALLOW_UNAUTHENTICATED` must not be honoured in production (FBS-33).
 *
 * The opt-out existed for local development, but nothing stopped it in production: the
 * boot check logged a warning and returned, and `requireAuth` then waved every request
 * through. A deployment with the variable set runs as an open signing proxy, and the
 * process holds a credential that can sign for every vault it is entitled to.
 *
 * Mainnet is the production signal — `NETWORK` defaults to mainnet when unset, so an
 * unconfigured deployment is treated as production and refuses.
 */
describe("ALLOW_UNAUTHENTICATED is refused in production (FBS-33)", () => {
  const mainnet = { token: "", allowUnauthenticated: true, production: true };
  const testnet = { token: "", allowUnauthenticated: true, production: false };

  it("refuses to start on mainnet even with the opt-out set", () => {
    expect(() => assertAuthConfigured(mainnet)).toThrow(/production|mainnet/i);
  });

  it("still starts on testnet, where the opt-out is meant to be usable", () => {
    expect(() => assertAuthConfigured(testnet)).not.toThrow();
  });

  it("rejects requests in production rather than waving them through", () => {
    const next = jest.fn();
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    requireAuth(mainnet)({ header: () => "" } as any, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("still waves requests through on testnet", () => {
    const next = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    requireAuth(testnet)({ header: () => "" } as any, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("treats an unset NETWORK as production", () => {
    const env = {} as NodeJS.ProcessEnv;
    expect(loadAuthConfig(env).production).toBe(true);
  });

  it("treats NETWORK=testnet as non-production", () => {
    const env = { NETWORK: "testnet" } as NodeJS.ProcessEnv;
    expect(loadAuthConfig(env).production).toBe(false);
  });

  it("treats NODE_ENV=production as production even on testnet", () => {
    const env = { NETWORK: "testnet", NODE_ENV: "production" } as NodeJS.ProcessEnv;
    expect(loadAuthConfig(env).production).toBe(true);
  });
});
