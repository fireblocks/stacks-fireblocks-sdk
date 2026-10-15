/**
 * Routes whose body fields are all optional accept a request with no body.
 *
 * Express 5 leaves req.body undefined when nothing is sent, so a handler reading
 * req.body.x threw and the request returned 500.
 */

const executeAction = jest.fn();
jest.mock("../api/api.service", () => ({
  apiServiceSingleton: {
    executeAction: (...a: unknown[]) => executeAction(...a),
  },
}));

import request from "supertest";
import express from "express";
import { ActionType } from "../pool/types";
import router from "../api/router";

const app = express();
app.use(express.json());
app.use("/api", router);

beforeEach(() =>
  executeAction.mockReset().mockResolvedValue({ success: true }),
);

describe("routes called with no body", () => {
  it.each([
    [
      "/api/7/stacking/pox5/bond/announce-early-exit",
      ActionType.ANNOUNCE_EARLY_EXIT,
    ],
    ["/api/7/stacking/pox5/rewards/calculate", ActionType.CALCULATE_REWARDS],
    [
      "/api/7/stacking/pox5/rewards/claim-stx",
      ActionType.CLAIM_STX_ONLY_REWARDS,
    ],
  ])("POST %s dispatches instead of returning 500", async (path, action) => {
    const res = await request(app).post(path);

    expect(res.status).toBe(200);
    expect(executeAction).toHaveBeenCalledWith("7", action, expect.any(Object));
  });

  it("GET bond/lock-address with no bondIndex returns 400, not 500", async () => {
    const res = await request(app).get(
      "/api/7/stacking/pox5/bond/lock-address",
    );

    expect(res.status).toBe(400);
    expect(executeAction).not.toHaveBeenCalled();
  });

  it("GET bond/lock-address with a query bondIndex still dispatches", async () => {
    const res = await request(app).get(
      "/api/7/stacking/pox5/bond/lock-address?bondIndex=4",
    );

    expect(res.status).toBe(200);
    expect(executeAction).toHaveBeenCalledWith(
      "7",
      ActionType.GET_BOND_LOCK_ADDRESS,
      { bondIndex: 4 },
    );
  });
});
