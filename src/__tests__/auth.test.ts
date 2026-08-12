import request from "supertest";
import express from "express";
import { requireAuth, assertAuthConfigured, AuthConfig } from "../api/auth";

const buildApp = (config: AuthConfig) => {
  const app = express();
  app.use(express.json());
  app.use(requireAuth(config));
  app.get("/api/:vaultId/balance", (_req, res) => res.json({ ok: true }));
  app.get("/api/transactions/:txId", (_req, res) => res.json({ ok: true }));
  return app;
};

const base: AuthConfig = { token: "", allowUnauthenticated: false };

describe("REST authentication (requireAuth)", () => {
  it("fails closed with 503 when no token is configured", async () => {
    const app = buildApp({ ...base });
    const res = await request(app).get("/api/5/balance");
    expect(res.status).toBe(503);
  });

  it("allows requests when unauthenticated mode is explicitly enabled", async () => {
    const app = buildApp({ ...base, allowUnauthenticated: true });
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
      assertAuthConfigured({ ...base, allowUnauthenticated: true }),
    ).not.toThrow();
  });
});
