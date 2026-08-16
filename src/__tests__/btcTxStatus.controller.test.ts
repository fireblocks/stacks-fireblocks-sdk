import request from "supertest";
import express from "express";

jest.mock("../api/api.service", () => ({
  apiServiceSingleton: { executeAction: jest.fn() },
}));

import { apiServiceSingleton } from "../api/api.service";
import { getBtcTxStatus } from "../api/controller";
import { ActionType } from "../pool/types";

const executeAction = apiServiceSingleton.executeAction as jest.Mock;

describe("getBtcTxStatus controller handler", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.get("/api/btc/transactions/:btcTxid", getBtcTxStatus);
  });

  beforeEach(() => {
    executeAction.mockReset();
    executeAction.mockResolvedValue({
      success: true,
      chain: "bitcoin",
      data: { txid: "aa".repeat(32), found: true, confirmed: true, confirmations: 6 },
    });
  });

  it("dispatches GET_BTC_TX_STATUS with the path txid", async () => {
    const res = await request(app).get(`/api/btc/transactions/${"aa".repeat(32)}`);
    expect(res.status).toBe(200);
    expect(res.body.chain).toBe("bitcoin");
    expect(executeAction).toHaveBeenCalledWith(
      expect.anything(),
      ActionType.GET_BTC_TX_STATUS,
      { btcTxid: "aa".repeat(32) },
    );
  });
});
