/**
 * ApiService hands btcVout to the SDK for createBond, resumeBondRegistration and renewBond.
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

describe("ApiService dispatch of btcVout", () => {
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
