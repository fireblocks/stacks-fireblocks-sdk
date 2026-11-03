/**
 * abandonBroadcastFunding is reachable over REST.
 */

import request from "supertest";
import express from "express";

jest.mock("../api/api.service", () => ({
  apiServiceSingleton: { executeAction: jest.fn() },
}));

import { apiServiceSingleton } from "../api/api.service";
import { abandonBroadcastFunding } from "../api/controller";
import { ActionType } from "../pool/types";

const executeAction = apiServiceSingleton.executeAction as jest.Mock;

describe("abandonBroadcastFunding route", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post(
      "/api/:vaultId/stacking/pox5/bond/:bondIndex/abandon-broadcast-funding",
      abandonBroadcastFunding,
    );
  });

  beforeEach(() => {
    executeAction.mockReset().mockResolvedValue({ success: true });
  });

  it("dispatches ABANDON_BROADCAST_FUNDING with the parsed bond index and no body", async () => {
    const res = await request(app).post(
      "/api/7/stacking/pox5/bond/4/abandon-broadcast-funding",
    );

    expect(res.status).toBe(200);
    expect(executeAction).toHaveBeenCalledWith(
      "7",
      ActionType.ABANDON_BROADCAST_FUNDING,
      { bondIndex: 4 },
    );
  });

  it("rejects an invalid bond index without dispatching", async () => {
    const res = await request(app).post(
      "/api/7/stacking/pox5/bond/-1/abandon-broadcast-funding",
    );

    expect(res.status).toBe(400);
    expect(executeAction).not.toHaveBeenCalled();
  });
});
