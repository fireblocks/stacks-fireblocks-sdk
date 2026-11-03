/**
 * The REST half of app issue 213 (review F5).
 *
 * `listBondLockRecords` is the discovery call an operator reaches for when the bond
 * index is lost — `resumeBondRegistration`'s own error text points at it. The SDK method
 * and the `executeAction` case shipped in `fbee414`, but no controller handler and no
 * route did, so over REST it was unreachable.
 *
 * It also cannot be returned as-is: a `BondLockRecord` carries `bigint` and
 * `Uint8Array`, and `res.json` calls `JSON.stringify`, which THROWS on a bigint.
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

const record = () => ({
  bondIndex: 4,
  unlockBytes: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
  lockAddress: "bcrt1qlock",
  unlockHeight: 900,
  amountSats: BigInt(120_000),
  isL1Lock: true,
  btcTxid: "ab".repeat(32),
  vout: 0,
  signerManager: "ST000000000000000000002AMW42H.signer-manager",
  rewardMaxFeeSats: BigInt(5_000),
  fundingGeneration: 1,
});

beforeEach(() => executeAction.mockReset());

describe("GET /:vaultId/stacking/pox5/bond/lock-records", () => {
  it("is routed to the list action", async () => {
    executeAction.mockResolvedValue({ success: true, data: [] });

    const res = await request(app).get(
      "/api/7/stacking/pox5/bond/lock-records",
    );

    expect(res.status).toBe(200);
    expect(executeAction).toHaveBeenCalledWith(
      "7",
      ActionType.LIST_BOND_LOCK_RECORDS,
      {},
    );
  });

  it("serializes bigints and unlock bytes instead of throwing on them", async () => {
    executeAction.mockResolvedValue({ success: true, data: [record()] });

    const res = await request(app).get(
      "/api/7/stacking/pox5/bond/lock-records",
    );

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({
      bondIndex: 4,
      // Decimal strings, matching how every other endpoint renders a bigint.
      amountSats: "120000",
      rewardMaxFeeSats: "5000",
      // Hex, not the {"0":222,"1":173,...} that JSON.stringify makes of a Uint8Array.
      unlockBytes: "deadbeef",
    });
  });

  it("omits absent optional fields rather than emitting nulls", async () => {
    const bare = record();
    delete (bare as { rewardMaxFeeSats?: bigint }).rewardMaxFeeSats;
    delete (bare as { btcTxid?: string }).btcTxid;
    executeAction.mockResolvedValue({ success: true, data: [bare] });

    const res = await request(app).get(
      "/api/7/stacking/pox5/bond/lock-records",
    );

    expect("rewardMaxFeeSats" in res.body.data[0]).toBe(false);
    expect("btcTxid" in res.body.data[0]).toBe(false);
  });

  it("passes a refusal through untouched", async () => {
    // "The store cannot enumerate" and "there are no records" lead to opposite operator
    // decisions, so the failure must not arrive as an empty list.
    executeAction.mockResolvedValue({
      success: false,
      error: "store cannot enumerate",
    });

    const res = await request(app).get(
      "/api/7/stacking/pox5/bond/lock-records",
    );

    expect(res.body).toEqual({
      success: false,
      error: "store cannot enumerate",
    });
    expect(res.body.data).toBeUndefined();
  });
});
