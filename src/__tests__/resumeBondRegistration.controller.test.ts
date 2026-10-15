/**
 * The resume entry point has to be reachable from REST, not only from the library.
 *
 * The caller that actually hits the BTC-committed timeout is the app, which reaches this
 * SDK over HTTP — an SDK-only method would close FBS-29's last ask on paper only. This
 * also covers the dispatch boundary, which has silently dropped new options on this
 * branch before.
 */

import request from "supertest";
import express from "express";

jest.mock("../api/api.service", () => ({
  apiServiceSingleton: { executeAction: jest.fn() },
}));

import { apiServiceSingleton } from "../api/api.service";
import { resumeBondRegistration } from "../api/controller";
import { ActionType } from "../pool/types";

const executeAction = apiServiceSingleton.executeAction as jest.Mock;

describe("resumeBondRegistration controller handler", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post(
      "/api/:vaultId/stacking/pox5/bond/:bondIndex/resume",
      resumeBondRegistration,
    );
  });

  beforeEach(() => {
    executeAction.mockReset();
    executeAction.mockResolvedValue({
      success: true,
      btcTxid: "ab".repeat(32),
    });
  });

  it("dispatches RESUME_BOND_REGISTRATION with the parsed bond index", async () => {
    const res = await request(app)
      .post("/api/7/stacking/pox5/bond/4/resume")
      .send({});

    expect(res.status).toBe(200);
    expect(executeAction).toHaveBeenCalledWith(
      "7",
      ActionType.RESUME_BOND_REGISTRATION,
      expect.objectContaining({ bondIndex: 4 }),
    );
  });

  it("forwards the optional resume parameters", async () => {
    await request(app)
      .post("/api/7/stacking/pox5/bond/4/resume")
      .send({ confirmations: 1, note: "retry", btcTxid: "cd".repeat(32) });

    expect(executeAction).toHaveBeenCalledWith(
      "7",
      ActionType.RESUME_BOND_REGISTRATION,
      expect.objectContaining({
        bondIndex: 4,
        confirmations: 1,
        note: "retry",
        btcTxid: "cd".repeat(32),
      }),
    );
  });

  it("accepts a request with no body at all, since every body field is optional", async () => {
    // Review item 5: Express 5 leaves req.body undefined when nothing is sent, so reading
    // req.body.nonce threw and the documented no-body call returned 500.
    const res = await request(app).post("/api/7/stacking/pox5/bond/4/resume");

    expect(res.status).toBe(200);
    expect(executeAction).toHaveBeenCalledWith(
      "7",
      ActionType.RESUME_BOND_REGISTRATION,
      expect.objectContaining({ bondIndex: 4 }),
    );
  });

  it.each([["-5"], [-5]])("rejects a negative nonce (%p) without dispatching", async (nonce) => {
    const res = await request(app)
      .post("/api/7/stacking/pox5/bond/4/resume")
      .send({ nonce });

    expect(res.status).toBe(400);
    expect(executeAction).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric bond index without dispatching", async () => {
    const res = await request(app)
      .post("/api/7/stacking/pox5/bond/not-a-number/resume")
      .send({});

    expect(res.status).toBe(400);
    expect(executeAction).not.toHaveBeenCalled();
  });
});
