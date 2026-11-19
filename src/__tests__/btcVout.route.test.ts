/**
 * createBond, bond resume and renew accept the funding output to prove (`btcVout`) over REST,
 * and check it strictly: it decides which Bitcoin output a registration is built from.
 */

import request from "supertest";
import express from "express";

jest.mock("../api/api.service", () => ({
  apiServiceSingleton: { executeAction: jest.fn() },
}));

import { apiServiceSingleton } from "../api/api.service";
import {
  createBond,
  resumeBondRegistration,
  renewBond,
} from "../api/controller";
import { ActionType } from "../pool/types";

const executeAction = apiServiceSingleton.executeAction as jest.Mock;
const MANAGER = "ST000000000000000000002AMW42H.signer-manager";

const ROUTES = [
  {
    name: "create",
    path: "/api/7/stacking/pox5/bond/create",
    action: ActionType.CREATE_BOND,
    body: { bondIndex: 4, btcAmountSats: "10000", signerManager: MANAGER },
  },
  {
    name: "resume",
    path: "/api/7/stacking/pox5/bond/4/resume",
    action: ActionType.RESUME_BOND_REGISTRATION,
    body: {},
  },
  {
    name: "renew",
    path: "/api/7/stacking/pox5/bond/renew",
    action: ActionType.RENEW_BOND,
    body: { nextBondIndex: 5, signerManager: MANAGER },
  },
];

describe("btcVout over REST", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post("/api/:vaultId/stacking/pox5/bond/create", createBond);
    app.post(
      "/api/:vaultId/stacking/pox5/bond/:bondIndex/resume",
      resumeBondRegistration,
    );
    app.post("/api/:vaultId/stacking/pox5/bond/renew", renewBond);
  });

  beforeEach(() => {
    executeAction.mockReset().mockResolvedValue({ success: true });
  });

  describe.each(ROUTES)("bond/$name", ({ path, action, body }) => {
    it("dispatches btcVout", async () => {
      const res = await request(app)
        .post(path)
        .send({ ...body, btcVout: 1 });

      expect(res.status).toBe(200);
      expect(executeAction).toHaveBeenCalledWith(
        "7",
        action,
        expect.objectContaining({ btcVout: 1 }),
      );
    });

    it("accepts 0 and a plain digit string", async () => {
      await request(app)
        .post(path)
        .send({ ...body, btcVout: 0 });
      await request(app)
        .post(path)
        .send({ ...body, btcVout: "3" });

      expect(executeAction.mock.calls[0][2].btcVout).toBe(0);
      expect(executeAction.mock.calls[1][2].btcVout).toBe(3);
    });

    it("leaves btcVout undefined when none is sent", async () => {
      await request(app).post(path).send(body);

      expect(executeAction.mock.calls[0][2].btcVout).toBeUndefined();
    });

    it.each([
      [-1],
      [1.5],
      ["0x1"],
      ["1e0"],
      ["abc"],
      [""],
      [" 1"],
      [null],
      [true],
      [[1]],
      [{ a: 1 }],
      [0x100000000],
      [Number.MAX_SAFE_INTEGER + 2],
    ])("returns 400 for btcVout %p and dispatches nothing", async (value) => {
      const res = await request(app)
        .post(path)
        .send({ ...body, btcVout: value });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/btcVout/);
      expect(executeAction).not.toHaveBeenCalled();
    });
  });
});
