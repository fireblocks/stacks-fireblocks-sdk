import request from "supertest";
import express from "express";

jest.mock("../api/api.service", () => ({
  apiServiceSingleton: { executeAction: jest.fn() },
}));

import { apiServiceSingleton } from "../api/api.service";
import { spendEarlyExit, getEarlyExitPublicKey } from "../api/controller";
import { ActionType } from "../pool/types";

const executeAction = apiServiceSingleton.executeAction as jest.Mock;

describe("early-exit controller handlers", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post("/api/:vaultId/stacking/pox5/bond/early-exit", spendEarlyExit);
    app.get(
      "/api/:vaultId/stacking/pox5/bond/early-exit/public-key",
      getEarlyExitPublicKey,
    );
  });

  beforeEach(() => {
    executeAction.mockReset();
    executeAction.mockResolvedValue({
      success: true,
      btcTxid: "aa".repeat(32),
    });
  });

  describe("POST bond/early-exit", () => {
    it("dispatches SPEND_EARLY_EXIT with parsed params", async () => {
      const res = await request(app)
        .post("/api/7/stacking/pox5/bond/early-exit")
        .send({
          destinationBtcAddress: " tb1qexample ",
          feeSats: "600",
          bondIndex: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, btcTxid: "aa".repeat(32) });
      expect(executeAction).toHaveBeenCalledWith(
        "7",
        ActionType.SPEND_EARLY_EXIT,
        {
          destinationBtcAddress: "tb1qexample",
          feeSats: BigInt(600),
          bondIndex: 3,
        },
      );
    });

    it("returns 400 when destinationBtcAddress is missing", async () => {
      const res = await request(app)
        .post("/api/7/stacking/pox5/bond/early-exit")
        .send({ feeSats: "600" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/destinationBtcAddress/);
      expect(executeAction).not.toHaveBeenCalled();
    });

    it("returns 400 on a non-numeric feeSats", async () => {
      const res = await request(app)
        .post("/api/7/stacking/pox5/bond/early-exit")
        .send({ destinationBtcAddress: "tb1qexample", feeSats: "abc" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/feeSats/);
    });

    it("returns 400 on a negative bondIndex", async () => {
      const res = await request(app)
        .post("/api/7/stacking/pox5/bond/early-exit")
        .send({ destinationBtcAddress: "tb1qexample", bondIndex: -1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/bondIndex/);
    });

    it("omits optional params when not provided", async () => {
      await request(app)
        .post("/api/7/stacking/pox5/bond/early-exit")
        .send({ destinationBtcAddress: "tb1qexample" });

      expect(executeAction).toHaveBeenCalledWith(
        "7",
        ActionType.SPEND_EARLY_EXIT,
        {
          destinationBtcAddress: "tb1qexample",
          feeSats: undefined,
          bondIndex: undefined,
        },
      );
    });
  });

  describe("GET bond/early-exit/public-key", () => {
    it("dispatches GET_EARLY_EXIT_PUBLIC_KEY", async () => {
      const meta = { key_id: 1, xpub: "tpubTEST", network: "testnet" };
      executeAction.mockResolvedValue(meta);

      const res = await request(app).get(
        "/api/9/stacking/pox5/bond/early-exit/public-key",
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(meta);
      expect(executeAction).toHaveBeenCalledWith(
        "9",
        ActionType.GET_EARLY_EXIT_PUBLIC_KEY,
        {},
      );
    });
  });
});
