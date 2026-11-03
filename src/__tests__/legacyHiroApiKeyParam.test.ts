/**
 * StacksSDK.create's 3rd positional hiroApiKey parameter (Copilot, PR #31, finding 3).
 *
 * The chainApiKey config-plumbing work replaced this positional param with
 * `FireblocksConfig.chainApiKey`, dropping it from both the constructor and `create()`
 * entirely. That is a breaking public API change: an existing JS caller doing
 * `StacksSDK.create(vault, config, key)` now silently has its key ignored — falling
 * back to anonymous Hiro requests — and an existing TS caller stops compiling.
 *
 * The param is restored as deprecated and folded into `chainApiKey` only when the
 * config itself omits one, so a caller who has already migrated to `chainApiKey` is
 * unaffected.
 */

jest.mock("../services/fireblocks.service", () => {
  return {
    FireblocksService: jest.fn().mockImplementation(() => ({
      getPublicKeyByVaultID: jest.fn().mockResolvedValue(`02${"a".repeat(64)}`),
      getBtcSegwitAddressForVaultID: jest.fn().mockResolvedValue("bcrt1qfake"),
    })),
  };
});

jest.mock("../utils/network", () => {
  const actual = jest.requireActual("../utils/network");
  return {
    ...actual,
    validateNetworkProfile: jest.fn().mockResolvedValue(undefined),
  };
});

import { StacksSDK } from "../StacksSDK";

const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const baseConfig = {
  apiKey: "12345678-1234-4123-8123-123456789012",
  apiSecret: FAKE_INLINE_PEM,
  testnet: true,
};

describe("StacksSDK — deprecated positional hiroApiKey parameter", () => {
  it("create(): folds a positional hiroApiKey into chainApiKey when config omits it", async () => {
    // No `as any` cast: this line is itself the compile-time proof that an existing
    // 3-argument TypeScript caller still compiles.
    const sdk = (await StacksSDK.create(
      "7",
      baseConfig,
      "legacy-positional-key",
    )) as any;

    expect(sdk.chainApiKey).toBe("legacy-positional-key");
  });

  it("create(): fireblocksConfig.chainApiKey takes precedence over the positional param", async () => {
    const sdk = (await StacksSDK.create(
      "7",
      { ...baseConfig, chainApiKey: "from-config" },
      "legacy-positional-key",
    )) as any;

    expect(sdk.chainApiKey).toBe("from-config");
  });

  it("create(): omitting both leaves chainApiKey undefined, unchanged from today", async () => {
    const sdk = (await StacksSDK.create("7", baseConfig)) as any;

    expect(sdk.chainApiKey).toBeUndefined();
  });
});
