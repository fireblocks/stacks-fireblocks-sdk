/**
 * ApiService hands btcVout to the SDK for createBond, resumeBondRegistration and renewBond.
 *
 * `api.service` builds the process-wide service from the environment when it is first
 * imported, so the import is made after placeholder values are set.
 */

import { BasePath } from "@fireblocks/ts-sdk";
import { ActionType } from "../pool/types";

const PLACEHOLDER_ENV = {
  FIREBLOCKS_API_KEY: "00000000-0000-0000-0000-000000000000",
  FIREBLOCKS_SECRET_KEY_PATH: "./not-a-real-key-path",
};

describe("ApiService dispatch of btcVout", () => {
  const saved: Record<string, string | undefined> = {};
  let apiModule: typeof import("../api/api.service");

  beforeAll(async () => {
    for (const [k, v] of Object.entries(PLACEHOLDER_ENV)) {
      saved[k] = process.env[k];
      process.env[k] = v;
    }
    apiModule = await import("../api/api.service");
  });

  afterAll(async () => {
    await apiModule.apiServiceSingleton.shutdown();
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  const serviceWith = (sdk: object) => {
    const service = new apiModule.ApiService({
      apiKey: "k",
      apiSecret: "s",
      basePath: BasePath.US,
      testnet: true,
    });
    (service as any).sdkManager = {
      getSdk: jest.fn().mockResolvedValue(sdk),
      releaseSdk: jest.fn(),
    };
    return service;
  };

  it("passes btcVout to createBond", async () => {
    const sdk = { createBond: jest.fn().mockResolvedValue({ success: true }) };

    await serviceWith(sdk).executeAction("7", ActionType.CREATE_BOND, {
      bondIndex: 4,
      btcAmountSats: BigInt(10_000),
      signerManager: "m",
      btcTxid: "ab".repeat(32),
      btcVout: 1,
    });

    expect(sdk.createBond.mock.calls[0][3]).toEqual(
      expect.objectContaining({ btcTxid: "ab".repeat(32), btcVout: 1 }),
    );
  });

  it("passes btcVout to resumeBondRegistration", async () => {
    const sdk = {
      resumeBondRegistration: jest.fn().mockResolvedValue({ success: true }),
    };

    await serviceWith(sdk).executeAction(
      "7",
      ActionType.RESUME_BOND_REGISTRATION,
      { bondIndex: 4, btcVout: 1 },
    );

    expect(sdk.resumeBondRegistration).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ btcVout: 1 }),
    );
  });

  it("passes btcVout to renewBond", async () => {
    const sdk = { renewBond: jest.fn().mockResolvedValue({ success: true }) };

    await serviceWith(sdk).executeAction("7", ActionType.RENEW_BOND, {
      nextBondIndex: 5,
      signerManager: "m",
      btcVout: 1,
    });

    expect(sdk.renewBond.mock.calls[0][2]).toEqual(
      expect.objectContaining({ btcVout: 1 }),
    );
  });
});
