/**
 * The REST server must be able to configure a chain API key at all.
 *
 * `ApiServiceConfig.chainApiKey` is forwarded to every pooled SDK instance, but nothing
 * populated it from the environment — so a REST deployment had no way to set one and
 * every chain read went out anonymous regardless of the call-site plumbing.
 *
 * Asserted against a pure env mapper rather than `api.service`, which constructs a
 * process-wide pool at module load.
 */

import { apiServiceConfigFromEnv } from "../pool/config";

const BASE_ENV = {
  FIREBLOCKS_API_KEY: "12345678-1234-4123-8123-123456789012",
  FIREBLOCKS_SECRET_KEY_PATH: "/secrets/fireblocks_secret.key",
};

describe("apiServiceConfigFromEnv", () => {
  it("reads the chain API key from the environment", () => {
    const config = apiServiceConfigFromEnv({
      ...BASE_ENV,
      CHAIN_API_KEY: "hiro-key-from-env",
    });

    expect(config.chainApiKey).toBe("hiro-key-from-env");
  });

  it("leaves the chain API key undefined when unset", () => {
    const config = apiServiceConfigFromEnv({ ...BASE_ENV });

    // Absent, not empty-string — the key is threaded into a header value.
    expect(config.chainApiKey).toBeUndefined();
  });

  it("treats an empty chain API key as unset", () => {
    const config = apiServiceConfigFromEnv({ ...BASE_ENV, CHAIN_API_KEY: "" });

    expect(config.chainApiKey).toBeUndefined();
  });

  it("still carries the Fireblocks credentials and pool settings", () => {
    const config = apiServiceConfigFromEnv({
      ...BASE_ENV,
      NETWORK: "testnet",
      POOL_MAX_SIZE: "7",
    });

    expect(config.apiKey).toBe(BASE_ENV.FIREBLOCKS_API_KEY);
    expect(config.apiSecret).toBe(BASE_ENV.FIREBLOCKS_SECRET_KEY_PATH);
    expect(config.testnet).toBe(true);
    expect(config.poolConfig?.maxPoolSize).toBe(7);
  });
});
