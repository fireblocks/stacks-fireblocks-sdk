/**
 * ApiService hands expectedBondIndex to the SDK's announceEarlyExit.
 */

import { BasePath } from "@fireblocks/ts-sdk";
import { ApiService } from "../api/api.service";
import { ActionType } from "../pool/types";

const serviceWith = (sdk: object) => {
  const service = new ApiService({
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

describe("ApiService dispatch of ANNOUNCE_EARLY_EXIT", () => {
  it("calls the SDK method with the reviewed bond index", async () => {
    const sdk = {
      announceEarlyExit: jest.fn().mockResolvedValue({ success: true }),
    };

    await serviceWith(sdk).executeAction("7", ActionType.ANNOUNCE_EARLY_EXIT, {
      note: "n",
      externalId: "x",
      expectedBondIndex: 4,
    });

    expect(sdk.announceEarlyExit).toHaveBeenCalledWith({
      note: "n",
      nonce: undefined,
      externalId: "x",
      expectedBondIndex: 4,
    });
  });
});
