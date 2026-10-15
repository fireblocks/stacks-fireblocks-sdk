/**
 * The three Stacks API read paths issue 209 names that still go out anonymous:
 * bond-schedule validation, the reward map/data-var reads, and sBTC asset resolution.
 *
 * Each targets `networkProfile.stacksApiUrl` on bare global `fetch`, so the key has to
 * be applied at the call site. Two of them pass their own `RequestInit` — a POST body
 * with `Content-Type`, and an `AbortController` signal bounding a 15s timeout — so
 * attaching the header must merge rather than replace.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return { ...actual };
});

import { StacksSDK } from "../StacksSDK";
import { HIRO_API_KEY_HEADER } from "../utils/constants";
import { validateBondScheduleAgainstChain } from "../utils/bondScheduleChain";
import { resolveNetworkProfile } from "../utils/network";

const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const KEY = "hiro-key-remaining-reads";
const MANAGER = "ST000000000000000000002AMW42H.signer-manager";
const STAKER = "ST000000000000000000002AMW42H";

const makeSdk = (chainApiKey?: string): any =>
  new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
    ...(chainApiKey !== undefined ? { chainApiKey } : {}),
  });

describe("chainApiKey — the read paths 209 still leaves anonymous", () => {
  const realFetch = global.fetch;
  let seen: { url: string; headers: Record<string, string>; init?: RequestInit }[];

  beforeEach(() => {
    seen = [];
    global.fetch = (async (input: unknown, init?: RequestInit) => {
      const headers: Record<string, string> = {};
      new Headers(init?.headers ?? {}).forEach((v, k) => (headers[k] = v));
      seen.push({ url: String(input), headers, init });
      return new Response(
        JSON.stringify({
          data: "0x09",
          pox_5_sbtc_contract: `${STAKER}.sbtc-token`,
          contract_id: "ST000.pox-5",
          reward_cycle_id: 1,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  const callFor = (fragment: string) =>
    seen.find((c) => c.url.includes(fragment));

  describe("reward reads", () => {
    it("sends the key on the committed-reward map_entry read", async () => {
      const sdk = makeSdk(KEY);

      await sdk.fetchCommittedRewardDestination(MANAGER, STAKER).catch(() => undefined);

      expect(callFor("/v2/map_entry/")?.headers[HIRO_API_KEY_HEADER]).toBe(KEY);
    });

    it("keeps the map_entry POST's own content type and body", async () => {
      const sdk = makeSdk(KEY);

      await sdk.fetchCommittedRewardDestination(MANAGER, STAKER).catch(() => undefined);

      const call = callFor("/v2/map_entry/");
      expect(call?.headers["content-type"]).toBe("application/json");
      expect(call?.init?.method).toBe("POST");
      expect(typeof call?.init?.body).toBe("string");
    });

    it("sends the key on the fees-bips data_var read", async () => {
      const sdk = makeSdk(KEY);

      await sdk.fetchSignerManagerFeeBips(MANAGER).catch(() => undefined);

      expect(callFor("/v2/data_var/")?.headers[HIRO_API_KEY_HEADER]).toBe(KEY);
    });

    it("sends no header on the reward reads when no key is configured", async () => {
      const sdk = makeSdk();

      await sdk.fetchSignerManagerFeeBips(MANAGER).catch(() => undefined);

      expect(HIRO_API_KEY_HEADER in callFor("/v2/data_var/")!.headers).toBe(false);
    });
  });

  describe("sBTC asset resolution", () => {
    it("sends the key on the /v2/pox read", async () => {
      const sdk = makeSdk(KEY);

      await sdk.resolveSbtcAsset().catch(() => undefined);

      expect(callFor("/v2/pox")?.headers[HIRO_API_KEY_HEADER]).toBe(KEY);
    });

    it("keeps the abort signal that bounds the read", async () => {
      const sdk = makeSdk(KEY);

      await sdk.resolveSbtcAsset().catch(() => undefined);

      // The 15s timeout is enforced by this signal; replacing the init drops it and the
      // read can hang indefinitely.
      expect(callFor("/v2/pox")?.init?.signal).toBeDefined();
    });
  });

  describe("bond-schedule validation", () => {
    it("sends the key on the chain reads it makes", async () => {
      const profile = resolveNetworkProfile({ network: "private-devnet" });

      await validateBondScheduleAgainstChain({
        profile,
        bondIndices: [1],
        chainApiKey: KEY,
      });

      const keyed = seen.filter((c) => c.headers[HIRO_API_KEY_HEADER] === KEY);
      expect(seen.length).toBeGreaterThan(0);
      expect(keyed.length).toBe(seen.length);
    });

    it("is reachable with the key from the SDK's own validateBondSchedule", async () => {
      const sdk = makeSdk(KEY);

      await sdk.validateBondSchedule({ bondIndices: [1] });

      expect(seen.length).toBeGreaterThan(0);
      expect(seen.every((c) => c.headers[HIRO_API_KEY_HEADER] === KEY)).toBe(true);
    });
  });
});
