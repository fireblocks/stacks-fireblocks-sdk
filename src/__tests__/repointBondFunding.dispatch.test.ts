/**
 * ApiService routes REPOINT_BOND_FUNDING to the SDK method.
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

describe("ApiService dispatch of REPOINT_BOND_FUNDING", () => {
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

  it("calls the SDK method with the bond index, txid and output index", async () => {
    const service = new apiModule.ApiService({
      apiKey: "k",
      apiSecret: "s",
      basePath: BasePath.US,
      testnet: true,
    });
    const sdk = {
      repointBondFunding: jest
        .fn()
        .mockResolvedValue({ success: true, btcTxid: "bb".repeat(32) }),
    };
    (service as any).sdkManager = {
      getSdk: jest.fn().mockResolvedValue(sdk),
      releaseSdk: jest.fn(),
    };

    const result = await service.executeAction(
      "7",
      ActionType.REPOINT_BOND_FUNDING,
      { bondIndex: 4, btcTxid: "bb".repeat(32), vout: 1 },
    );

    expect(sdk.repointBondFunding).toHaveBeenCalledWith(4, "bb".repeat(32), {
      vout: 1,
    });
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });
});
