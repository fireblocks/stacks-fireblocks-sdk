import { FireblocksService } from "../services/fireblocks.service";
import { apiServiceConfigFromEnv, toFireblocksConfig } from "../pool/config";
import { FireblocksSigner } from "../utils/FireblocksSigner";

/**
 * The poll budgets must be settable from configuration (review item 4).
 *
 * `FireblocksService` built its signer as `new FireblocksSigner(this.fireblocksSDK)`, so
 * `approvalTimeoutMs` was fixed at its default whatever the deployment wanted. And a field
 * added only to `FireblocksConfig` would still never reach a pooled SDK: the REST boundary
 * (`toFireblocksConfig`) copies fields one by one.
 */

const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");
const API_KEY = "12345678-1234-4123-8123-123456789012";

describe("poll config reaches the signer", () => {
  it("FireblocksService passes FireblocksConfig.poll to its signer", () => {
    const svc: any = new FireblocksService({
      apiKey: API_KEY,
      apiSecret: FAKE_INLINE_PEM,
      testnet: true,
      poll: { approvalTimeoutMs: 4 * 60 * 60_000 },
    } as any);

    expect(svc.fireblocksSigner.poll.approvalTimeoutMs).toBe(4 * 60 * 60_000);
  });

  it("keeps the defaults when no poll config is given", () => {
    const svc: any = new FireblocksService({
      apiKey: API_KEY,
      apiSecret: FAKE_INLINE_PEM,
      testnet: true,
    });

    expect(svc.fireblocksSigner.poll.approvalTimeoutMs).toBe(
      svc.fireblocksSigner.poll.timeoutMs,
    );
  });

  it("toFireblocksConfig forwards poll across the REST/pool boundary", () => {
    const out = toFireblocksConfig({
      apiKey: API_KEY,
      apiSecret: FAKE_INLINE_PEM,
      basePath: "https://api.fireblocks.io/v1",
      poll: { approvalTimeoutMs: 123_000 },
    } as any);

    expect((out as any).poll).toEqual({ approvalTimeoutMs: 123_000 });
  });
});

describe("approval budget default", () => {
  it("defaults approvalTimeoutMs to the configured timeoutMs", () => {
    // The documented default; a fixed 30 minutes ignored a shorter or longer timeoutMs.
    const signer: any = new FireblocksSigner({} as any, { timeoutMs: 5 * 60_000 });

    expect(signer.poll.approvalTimeoutMs).toBe(5 * 60_000);
  });

  it("keeps an explicit approvalTimeoutMs", () => {
    const signer: any = new FireblocksSigner({} as any, { timeoutMs: 5 * 60_000, approvalTimeoutMs: 60 * 60_000 });

    expect(signer.poll.approvalTimeoutMs).toBe(60 * 60_000);
  });
});

describe("poll budgets from the REST server's environment", () => {
  it("reads FIREBLOCKS_POLL_TIMEOUT_MS and FIREBLOCKS_APPROVAL_TIMEOUT_MS", () => {
    const config = apiServiceConfigFromEnv({
      FIREBLOCKS_POLL_TIMEOUT_MS: "600000",
      FIREBLOCKS_APPROVAL_TIMEOUT_MS: "14400000",
    });

    expect(config.poll).toEqual({ timeoutMs: 600_000, approvalTimeoutMs: 14_400_000 });
  });

  it("leaves poll unset when neither variable is set", () => {
    expect(apiServiceConfigFromEnv({}).poll).toBeUndefined();
  });

  it.each([["abc"], ["0"], ["-5"], ["1.5"]])("refuses an invalid value (%p) at boot", (value) => {
    expect(() => apiServiceConfigFromEnv({ FIREBLOCKS_POLL_TIMEOUT_MS: value })).toThrow(/FIREBLOCKS_POLL_TIMEOUT_MS/);
  });
});
