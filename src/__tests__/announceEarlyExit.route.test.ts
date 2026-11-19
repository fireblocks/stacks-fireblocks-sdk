/**
 * The announce-early-exit route passes the reviewed bond through, and checks it strictly:
 * it decides which bond the announce is allowed to forfeit.
 */

import request from "supertest";
import express from "express";

jest.mock("../api/api.service", () => ({
  apiServiceSingleton: { executeAction: jest.fn() },
}));

import { apiServiceSingleton } from "../api/api.service";
import { announceEarlyExit } from "../api/controller";
import { ActionType } from "../pool/types";

const executeAction = apiServiceSingleton.executeAction as jest.Mock;
const PATH = "/api/7/stacking/pox5/bond/announce-early-exit";

describe("announceEarlyExit route", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post(
      "/api/:vaultId/stacking/pox5/bond/announce-early-exit",
      announceEarlyExit,
    );
  });

  beforeEach(() => {
    executeAction.mockReset().mockResolvedValue({ success: true });
  });

  it("dispatches ANNOUNCE_EARLY_EXIT with expectedBondIndex", async () => {
    const res = await request(app)
      .post(PATH)
      .send({ expectedBondIndex: 4, note: "n" });

    expect(res.status).toBe(200);
    expect(executeAction).toHaveBeenCalledWith(
      "7",
      ActionType.ANNOUNCE_EARLY_EXIT,
      {
        note: "n",
        nonce: undefined,
        externalId: undefined,
        expectedBondIndex: 4,
      },
    );
  });

  it("accepts 0 and a plain digit string", async () => {
    await request(app).post(PATH).send({ expectedBondIndex: 0 });
    await request(app).post(PATH).send({ expectedBondIndex: "7" });

    expect(executeAction.mock.calls[0][2].expectedBondIndex).toBe(0);
    expect(executeAction.mock.calls[1][2].expectedBondIndex).toBe(7);
  });

  it("leaves expectedBondIndex undefined when none is sent", async () => {
    await request(app).post(PATH).send({});

    expect(executeAction.mock.calls[0][2].expectedBondIndex).toBeUndefined();
  });

  it.each([
    [-1],
    [1.5],
    ["0x4"],
    ["4e0"],
    ["abc"],
    [""],
    [" 4"],
    [null],
    [true],
    [[4]],
    [{ a: 1 }],
    [Number.MAX_SAFE_INTEGER + 2],
    ["9007199254740993"],
  ])(
    "returns 400 for expectedBondIndex %p and dispatches nothing",
    async (value) => {
      const res = await request(app)
        .post(PATH)
        .send({ expectedBondIndex: value });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/expectedBondIndex/);
      expect(executeAction).not.toHaveBeenCalled();
    },
  );
});
