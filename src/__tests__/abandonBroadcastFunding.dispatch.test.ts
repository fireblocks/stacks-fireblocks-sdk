/**
 * ApiService routes ABANDON_BROADCAST_FUNDING to the SDK method.
 */

import { BasePath } from "@fireblocks/ts-sdk";
import { ApiService } from "../api/api.service";
import { ActionType } from "../pool/types";

describe("ApiService dispatch of ABANDON_BROADCAST_FUNDING", () => {
  it("calls the SDK method with the bond index and returns its result", async () => {
    const service = new ApiService({
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
