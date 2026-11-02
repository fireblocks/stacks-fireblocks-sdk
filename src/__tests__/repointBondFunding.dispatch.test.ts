/**
 * ApiService routes REPOINT_BOND_FUNDING to the SDK method.
 */

import { BasePath } from "@fireblocks/ts-sdk";
import { ApiService } from "../api/api.service";
import { ActionType } from "../pool/types";

describe("ApiService dispatch of REPOINT_BOND_FUNDING", () => {
  it("calls the SDK method with the bond index, txid and output index", async () => {
    const service = new ApiService({
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
