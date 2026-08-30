import request from "supertest";
import express from "express";

jest.mock("../api/api.service", () => ({
  apiServiceSingleton: { executeAction: jest.fn() },
}));

import { apiServiceSingleton } from "../api/api.service";
import { replaceBtcRecoveryFee } from "../api/controller";
import { ActionType } from "../pool/types";

const executeAction = apiServiceSingleton.executeAction as jest.Mock;

describe("replaceBtcRecoveryFee controller handler", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post("/api/:vaultId/stacking/pox5/bond/replace-fee", replaceBtcRecoveryFee);
  });

  beforeEach(() => {
    executeAction.mockReset();
    executeAction.mockResolvedValue({
      success: true,
      btcTxid: "bb".repeat(32),
      replacement: {
        oldFeeSats: "500",
        newFeeSats: "1000",
        oldDestinationSats: "99500",
        newDestinationSats: "99000",
        feeRateOldSatVb: "3.33",
        feeRateNewSatVb: "6.67",
        destination: "tb1qexample",
        branch: "matured",
      },
    });
  });

  it("dispatches REPLACE_BTC_RECOVERY_FEE with parsed params", async () => {
    const res = await request(app)
      .post("/api/7/stacking/pox5/bond/replace-fee")
      .send({ originalTxid: "aa".repeat(32), newFeeSats: "1000", bondIndex: 3, kind: "matured" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(executeAction).toHaveBeenCalledWith("7", ActionType.REPLACE_BTC_RECOVERY_FEE, {
      originalTxid: "aa".repeat(32),
      newFeeSats: BigInt(1000),
      bondIndex: 3,
      kind: "matured",
    });
  });

  it("ignores an invalid kind rather than passing it through", async () => {
    await request(app)
      .post("/api/7/stacking/pox5/bond/replace-fee")
      .send({ originalTxid: "aa".repeat(32), newFeeSats: "1000", kind: "bogus" });

    expect(executeAction).toHaveBeenCalledWith("7", ActionType.REPLACE_BTC_RECOVERY_FEE, {
      originalTxid: "aa".repeat(32),
      newFeeSats: BigInt(1000),
      bondIndex: undefined,
      kind: undefined,
    });
  });

  it("returns 400 when originalTxid is missing", async () => {
    const res = await request(app)
      .post("/api/7/stacking/pox5/bond/replace-fee")
      .send({ newFeeSats: "1000" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/originalTxid/);
    expect(executeAction).not.toHaveBeenCalled();
  });

  it("returns 400 when newFeeSats is missing", async () => {
    const res = await request(app)
      .post("/api/7/stacking/pox5/bond/replace-fee")
      .send({ originalTxid: "aa".repeat(32) });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/newFeeSats/);
    expect(executeAction).not.toHaveBeenCalled();
  });

  it("returns 400 on a non-integer newFeeSats", async () => {
    const res = await request(app)
      .post("/api/7/stacking/pox5/bond/replace-fee")
      .send({ originalTxid: "aa".repeat(32), newFeeSats: "not-a-number" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/newFeeSats/);
    expect(executeAction).not.toHaveBeenCalled();
  });
});
