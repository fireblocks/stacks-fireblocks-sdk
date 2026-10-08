// The SDK module is mocked so this stays a unit test of the config boundary, not of
// chain construction — StacksSDK.create is only inspected for what it was handed.
jest.mock("../StacksSDK", () => ({
  StacksSDK: { create: jest.fn() },
}));

import { SdkManager } from "../pool/SdkManager";
import { StacksSDK } from "../StacksSDK";
import { FireblocksConfig } from "../services/types";
import { toFireblocksConfig } from "../pool/config";

const createMock = StacksSDK.create as unknown as jest.Mock;

/**
 * A Hiro API key configured on the pool must reach every pooled SDK instance.
 *
 * `ApiService` hand-builds its `FireblocksConfig` field by field rather than spreading
 * the incoming config, so a new option is invisible to the SDK until that construction
 * forwards it — and it fails silently, looking wired. That boundary has already
 * swallowed `getHistoricalBondPosition`, `rewardBtcAddress` and `signerManagerAdapters`.
 */
describe("chainApiKey — survives the pool config boundary", () => {
  beforeEach(() => createMock.mockReset());

  it("forwards chainApiKey from the pool's base config to each SDK instance", async () => {
    createMock.mockImplementation(async () => ({ tag: "sdk" }));
    const baseConfig: FireblocksConfig = {
      apiKey: "k",
      apiSecret: "s",
      testnet: true,
      chainApiKey: "hiro-key-under-test",
    };

    const mgr = new SdkManager(baseConfig);
    try {
      await mgr.getSdk("7");

      expect(createMock).toHaveBeenCalledTimes(1);
      const configPassed = createMock.mock.calls[0][1];
      expect(configPassed.chainApiKey).toBe("hiro-key-under-test");
    } finally {
      await mgr.shutdown();
    }
  });

  it("leaves chainApiKey undefined when none is configured", async () => {
    createMock.mockImplementation(async () => ({ tag: "sdk" }));
    const mgr = new SdkManager({ apiKey: "k", apiSecret: "s", testnet: true });
    try {
      await mgr.getSdk("7");

      const configPassed = createMock.mock.calls[0][1];
      // Absent, not empty-string — an empty key would be sent as a header value.
      expect(configPassed.chainApiKey).toBeUndefined();
    } finally {
      await mgr.shutdown();
    }
  });
});

/**
 * `toFireblocksConfig` is the REST layer's hand-built config boundary, extracted so it
 * can be asserted directly — importing `api.service` is not an option, since that module
 * constructs a process-wide pool (and its cleanup interval) at load time.
 */
describe("toFireblocksConfig — the REST config boundary", () => {
  it("forwards chainApiKey from ApiServiceConfig", () => {
    const out = toFireblocksConfig({
      apiKey: "k",
      apiSecret: "s",
      basePath: "https://api.fireblocks.io",
      testnet: true,
      chainApiKey: "hiro-key-via-rest",
    });

    expect(out.chainApiKey).toBe("hiro-key-via-rest");
  });

  it("does not leak REST-only keys into the SDK config", () => {
    const out = toFireblocksConfig({
      apiKey: "k",
      apiSecret: "s",
      basePath: "https://api.fireblocks.io",
      poolConfig: { maxPoolSize: 5 },
    });

    expect("poolConfig" in out).toBe(false);
  });
});
