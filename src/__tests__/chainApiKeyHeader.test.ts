import {
  accountBalanceNormalizingFetch,
  resolveNetworkProfile,
  stacksNetworkFromProfile,
  validateNetworkProfile,
} from "../utils/network";
import { StacksService } from "../services/stacks.service";

/**
 * The Hiro API key must actually reach the chain reads (issue 209).
 *
 * Every PoX-5 read went out anonymous: nothing in `utils/network.ts` applied a key, so
 * the SDK sat on Hiro's lowest rate-limit tier — which is also why app item 211 sees
 * 429s with no retry. Hiro takes the key as `x-hiro-api-key` (confirmed against the
 * working `app-version` StacksService, not inferred).
 */
const HEADER = "x-hiro-api-key";
const KEY = "hiro-key-under-test";

/** Captures the headers each outgoing request was made with. */
const recordingFetch = () => {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const fn = (async (input: unknown, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    new Headers(init?.headers ?? {}).forEach((v, k) => (headers[k] = v));
    calls.push({ url: String(input), headers });
    return new Response(
      JSON.stringify({ network_id: 256, contract_id: "ST000.pox-5" }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }) as unknown as typeof fetch;
  return { calls, fn };
};

describe("chainApiKey reaches the chain reads", () => {
  it("sends the key on requests through the balance-normalizing adapter", async () => {
    const { calls, fn } = recordingFetch();

    const wrapped = accountBalanceNormalizingFetch(fn, KEY);
    await wrapped("https://example.invalid/v2/accounts/ST000");

    expect(calls[0].headers[HEADER]).toBe(KEY);
  });

  it("omits the header entirely when no key is configured", async () => {
    const { calls, fn } = recordingFetch();

    const wrapped = accountBalanceNormalizingFetch(fn);
    await wrapped("https://example.invalid/v2/accounts/ST000");

    // Absent, not empty — an empty header value is worse than none.
    expect(HEADER in calls[0].headers).toBe(false);
  });

  it("never attaches the key to a different origin", async () => {
    const { calls, fn } = recordingFetch();
    const profile = resolveNetworkProfile({ network: "private-devnet" });
    const network = stacksNetworkFromProfile(profile, KEY, fn);

    // Esplora and the early-exit cosigner are third parties. The adapter must refuse to
    // carry the Hiro credential off the Stacks API origin even if a caller points it
    // there — the issue asks for a *same-origin* adapter, not a header-adding one.
    await network.client.fetch!("https://blockstream.info/api/tx/abc");

    expect(HEADER in calls[0].headers).toBe(false);
  });

  it("never attaches the key to a different origin from the StacksService axios client", async () => {
    // The axios client set the key as an unconditional default header, so scoping rested
    // on every call site happening to target the Stacks API. withChainApiKey makes that
    // structural for the fetch paths; this client must not be the one place it is not.
    const svc: any = new StacksService(
      true,
      {
        baseUrl: "https://api.example-stacks.invalid",
        chainId: 1,
        magicBytes: "id",
      },
      KEY,
    );
    const seen: Record<string, unknown>[] = [];
    svc.axiosClient.defaults.adapter = async (config: any) => {
      seen.push({
        url: config.url,
        header: config.headers?.[HEADER] ?? config.headers?.get?.(HEADER),
      });
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };

    await svc.axiosClient.get("https://blockstream.info/api/tx/abc");
    await svc.axiosClient.get("https://api.example-stacks.invalid/v2/info");

    expect(seen[0].header).toBeFalsy();
    expect(seen[1].header).toBe(KEY);
  });

  it("carries the key on the network object the PoX-5 client reads through", async () => {
    const { calls, fn } = recordingFetch();
    const profile = resolveNetworkProfile({ network: "private-devnet" });

    const network = stacksNetworkFromProfile(profile, KEY, fn);
    // A real PoX-5 read targets the configured Stacks API, so this is the same origin.
    await network.client.fetch!(`${profile.stacksApiUrl}/v2/accounts/ST000`);

    expect(calls[0].headers[HEADER]).toBe(KEY);
  });

  it("sends the key on the startup /v2/info and /v2/pox validation reads", async () => {
    const { calls, fn } = recordingFetch();
    const profile = resolveNetworkProfile({ network: "private-devnet" });

    await validateNetworkProfile(profile, KEY, fn);

    const infoCall = calls.find((c) => c.url.endsWith("/v2/info"));
    const poxCall = calls.find((c) => c.url.endsWith("/v2/pox"));
    expect(infoCall?.headers[HEADER]).toBe(KEY);
    expect(poxCall?.headers[HEADER]).toBe(KEY);
  });
});
