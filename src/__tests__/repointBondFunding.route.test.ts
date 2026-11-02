/**
 * repointBondFunding is reachable over REST, and the route checks its input strictly.
 */

import request from "supertest";
import express from "express";

jest.mock("../api/api.service", () => ({
  apiServiceSingleton: { executeAction: jest.fn() },
}));

import { apiServiceSingleton } from "../api/api.service";
import { repointBondFunding } from "../api/controller";
import { ActionType } from "../pool/types";

const executeAction = apiServiceSingleton.executeAction as jest.Mock;
const TXID = "bb".repeat(32);
const PATH = (bondIndex: string) =>
  `/api/7/stacking/pox5/bond/${bondIndex}/repoint-funding`;

describe("repointBondFunding route", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post(
      "/api/:vaultId/stacking/pox5/bond/:bondIndex/repoint-funding",
      repointBondFunding,
    );
  });

  beforeEach(() => {
    executeAction.mockReset().mockResolvedValue({ success: true });
  });

  it("dispatches REPOINT_BOND_FUNDING with the bond index, txid and output index", async () => {
    const res = await request(app)
      .post(PATH("4"))
      .send({ btcTxid: TXID, vout: 1 });

    expect(res.status).toBe(200);
    expect(executeAction).toHaveBeenCalledWith(
      "7",
      ActionType.REPOINT_BOND_FUNDING,
      { bondIndex: 4, btcTxid: TXID, vout: 1 },
    );
  });

  it("leaves the output index out when none is sent", async () => {
    await request(app).post(PATH("4")).send({ btcTxid: TXID });

    expect(executeAction).toHaveBeenCalledWith(
      "7",
      ActionType.REPOINT_BOND_FUNDING,
      { bondIndex: 4, btcTxid: TXID },
    );
  });

  it.each([["-1"], ["0x4"], ["4e0"], ["9007199254740993"]])(
    "rejects bond index %p without dispatching",
    async (bondIndex) => {
      const res = await request(app)
        .post(PATH(bondIndex))
        .send({ btcTxid: TXID });

      expect(res.status).toBe(400);
      expect(executeAction).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["a missing txid", {}],
    ["a malformed txid", { btcTxid: "not-a-txid" }],
    ["a negative output index", { btcTxid: TXID, vout: -1 }],
    ["a fractional output index", { btcTxid: TXID, vout: 1.5 }],
  ])("rejects %s without dispatching", async (_label, body) => {
    const res = await request(app).post(PATH("4")).send(body);

    expect(res.status).toBe(400);
    expect(executeAction).not.toHaveBeenCalled();
  });
});
