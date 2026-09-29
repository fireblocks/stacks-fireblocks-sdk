/**
 * The configured Hiro key must actually reach the PoX-5 reads (issue 209, wiring half).
 *
 * `utils/network.ts` applying a key when handed one, and `FireblocksConfig` carrying a
 * key, are separately tested. Neither covers the hop between them: that `StacksSDK`
 * passes `fireblocksConfig.chainApiKey` into `stacksNetworkFromProfile`,
 * `validateNetworkProfile` and `StacksService`.
 *
 * That hop is the boundary the handoff doc's §6 warns about — it has already swallowed
 * `getHistoricalBondPosition`, `rewardBtcAddress` and `signerManagerAdapters` (the last
 * still unfixed, and the reason reward claiming does not work). It fails silently and
 * looks wired, so it needs an assertion rather than a reading.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return { ...actual };
});

import { StacksSDK } from "../StacksSDK";
import { HIRO_API_KEY_HEADER } from "../utils/constants";

const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const KEY = "hiro-key-wired-through";

/** Constructs the SDK without `create()` — no Fireblocks or chain round-trips. */
const makeSdk = (chainApiKey?: string): any =>
  new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
    ...(chainApiKey !== undefined ? { chainApiKey } : {}),
  });

describe("chainApiKey — config reaches the PoX-5 read path", () => {
  const realFetch = global.fetch;
  let seen: { url: string; headers: Record<string, string> }[];

  beforeEach(() => {
    seen = [];
    global.fetch = (async (input: unknown, init?: RequestInit) => {
      const headers: Record<string, string> = {};
      new Headers(init?.headers ?? {}).forEach((v, k) => (headers[k] = v));
      seen.push({ url: String(input), headers });
      return new Response(JSON.stringify({ balance: "0x0", locked: "0x0" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  it("sends the configured key on a read through the PoX-5 network object", async () => {
    const sdk = makeSdk(KEY);

    // The fetch every @stacks/bitcoin-staking PoX-5 read goes through, targeting the
    // configured Stacks API — the only origin the key is allowed to reach.
    await sdk._pox5Network.client.fetch(
      `${sdk._pox5Network.client.baseUrl}/v2/accounts/ST000`,
    );

    expect(seen[0].headers[HIRO_API_KEY_HEADER]).toBe(KEY);
  });

  it("sends no key header when none is configured", async () => {
    const sdk = makeSdk();

    await sdk._pox5Network.client.fetch(
      `${sdk._pox5Network.client.baseUrl}/v2/accounts/ST000`,
    );

    expect(HIRO_API_KEY_HEADER in seen[0].headers).toBe(false);
  });
});
