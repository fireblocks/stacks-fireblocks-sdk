/**
 * ApiService routes ABANDON_BROADCAST_FUNDING to the SDK method.
 *
 * `api.service` builds the process-wide service from the environment when it is first
 * imported and throws if the Fireblocks credentials are absent, so the import is made
 * after placeholder values are set rather than relying on a developer's `.env`.
 */

import { BasePath } from "@fireblocks/ts-sdk";
import { ActionType } from "../pool/types";

const PLACEHOLDER_ENV = {
  FIREBLOCKS_API_KEY: "00000000-0000-0000-0000-000000000000",
  FIREBLOCKS_SECRET_KEY_PATH: "./not-a-real-key-path",
};

describe("ApiService dispatch of ABANDON_BROADCAST_FUNDING", () => {
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

  it("calls the SDK method with the bond index and returns its result", async () => {
    const service = new apiModule.ApiService({
      apiKey: "k",
      apiSecret: "s",
      basePath: BasePath.US,
      testnet: true,
    });
    const sdk = {
      abandonBroadcastFunding: jest
        .fn()
        .mockResolvedValue({ success: true, abandonedFireblocksId: "fb-1" }),
    };
    (service as any).sdkManager = {
      getSdk: jest.fn().mockResolvedValue(sdk),
      releaseSdk: jest.fn(),
    };

    const result = await service.executeAction(
      "7",
      ActionType.ABANDON_BROADCAST_FUNDING,
      { bondIndex: 4 },
    );

    expect(sdk.abandonBroadcastFunding).toHaveBeenCalledWith(4);
    expect(result).toEqual(
      expect.objectContaining({ success: true, abandonedFireblocksId: "fb-1" }),
    );
  });
});
