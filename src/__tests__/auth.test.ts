import request from "supertest";
import express from "express";
import { requireAuth, enforceVaultAllowlist, AuthConfig } from "../api/auth";

const buildApp = (config: AuthConfig) => {
  const app = express();
  app.use(express.json());
  app.use(requireAuth(config));
  const enforce = enforceVaultAllowlist(config);
  app.get("/api/:vaultId/balance", enforce, (_req, res) => res.json({ ok: true }));
  app.get("/api/transactions/:txId", (_req, res) => res.json({ ok: true }));
  return app;
};

const base: AuthConfig = { token: "", vaultAllowlist: [], allowUnauthenticated: false };

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

describe("vault allowlist (enforceVaultAllowlist)", () => {
  const authed = (extra: Partial<AuthConfig>): AuthConfig => ({
    ...base,
    token: "s3cret",
    ...extra,
  });

  it("permits any vault when the allowlist is empty", async () => {
    const app = buildApp(authed({ vaultAllowlist: [] }));
    const res = await request(app)
      .get("/api/9/balance")
      .set("Authorization", "Bearer s3cret");
    expect(res.status).toBe(200);
  });

  it("rejects a vault outside the allowlist (403)", async () => {
    const app = buildApp(authed({ vaultAllowlist: ["5"] }));
    const res = await request(app)
      .get("/api/9/balance")
      .set("Authorization", "Bearer s3cret");
    expect(res.status).toBe(403);
  });

  it("permits a vault inside the allowlist", async () => {
    const app = buildApp(authed({ vaultAllowlist: ["5"] }));
    const res = await request(app)
      .get("/api/5/balance")
      .set("Authorization", "Bearer s3cret");
    expect(res.status).toBe(200);
  });
});
