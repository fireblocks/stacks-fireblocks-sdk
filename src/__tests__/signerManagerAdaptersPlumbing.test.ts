/**
 * The signer-manager allowlist must survive `ApiService`'s config boundary (FBS-161).
 *
 * `FireblocksConfig.signerManagerAdapters` existed and `StacksSDK` consumed it, but
 * `ApiServiceConfig` had no such field and `ApiService` never forwarded one — so no
 * deployment could configure an allowlist, and (before the payout bound moved on-chain)
 * reward claiming was refused for every manager.
 *
 * `ApiService` hand-builds its `FireblocksConfig` field by field rather than spreading
 * the incoming config, so a new option is invisible to the SDK until that literal
 * forwards it — and it fails SILENTLY, looking wired. That boundary has already
 * swallowed `getHistoricalBondPosition`, `rewardBtcAddress` and `signerManagerAdapters`
 * itself.
 *
 * On this branch there is no env layer, so the allowlist is code-configured only; the
 * `SIGNER_MANAGER_ALLOWLIST` parsing on the server branch has no counterpart here.
 */

jest.mock("../pool/SdkManager", () => ({
  SdkManager: jest.fn().mockImplementation(() => ({ shutdown: jest.fn() })),
}));

import { ApiService } from "../api/api.service";
import { SdkManager } from "../pool/SdkManager";
import { BasePath } from "@fireblocks/ts-sdk";

const MgrMock = SdkManager as unknown as jest.Mock;
const MANAGER = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.manager-a";

const baseCfg = {
  apiKey: "k",
  apiSecret: "s",
  basePath: BasePath.US,
};

const configHandedToPool = () => MgrMock.mock.calls[0][0];

describe("signerManagerAdapters — survives the ApiService config boundary", () => {
  beforeEach(() => MgrMock.mockClear());

  it("forwards a configured allowlist to every pooled SDK", () => {
    new ApiService({
      ...baseCfg,
      signerManagerAdapters: [{ contractPrincipal: MANAGER }],
    });

    expect(configHandedToPool().signerManagerAdapters).toEqual([
      { contractPrincipal: MANAGER },
    ]);
  });

  it("leaves it undefined when none is configured", () => {
    new ApiService({ ...baseCfg });

    // Undefined, not [] — an empty registry means "no allowlist, every manager
    // allowed", so the two must not be conflated.
    expect(configHandedToPool().signerManagerAdapters).toBeUndefined();
  });
});
