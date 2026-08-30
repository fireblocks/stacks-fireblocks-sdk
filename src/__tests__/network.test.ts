import { STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network";
import { resolveNetworkProfile, validateNetworkProfile } from "../utils/network";

describe("resolveNetworkProfile (FBS-01 named profiles)", () => {
  const OLD_ENV = process.env.STACKS_API_URL;
  afterEach(() => {
    if (OLD_ENV === undefined) delete process.env.STACKS_API_URL;
    else process.env.STACKS_API_URL = OLD_ENV;
  });

  it("selects mainnet by default", () => {
    expect(resolveNetworkProfile({}).name).toBe("mainnet");
    expect(resolveNetworkProfile({ testnet: false }).name).toBe("mainnet");
  });

  it("maps the legacy testnet boolean to private-devnet", () => {
    expect(resolveNetworkProfile({ testnet: true }).name).toBe("private-devnet");
  });

  it("selects each named profile explicitly", () => {
    expect(resolveNetworkProfile({ network: "mainnet" }).name).toBe("mainnet");
    expect(resolveNetworkProfile({ network: "private-devnet" }).name).toBe("private-devnet");

    const pub = resolveNetworkProfile({ network: "public-testnet" });
    expect(pub.name).toBe("public-testnet");
    expect(pub.requirePox5Active).toBe(true);
    expect(pub.bech32Prefix).toBe("tb");
    expect(pub.chainId).toBe(STACKS_TESTNET.chainId);
  });

  it("gives the network name precedence over the boolean", () => {
    expect(resolveNetworkProfile({ network: "mainnet", testnet: true }).name).toBe("mainnet");
  });

  it("applies an explicit stacksApiUrl override", () => {
    expect(
      resolveNetworkProfile({ network: "mainnet", stacksApiUrl: "https://example.test" }).stacksApiUrl,
    ).toBe("https://example.test");
  });
});

describe("validateNetworkProfile (FBS-01 gating)", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  const mockFetch = (
    responder: (url: string) => { ok: boolean; status?: number; body?: unknown },
  ) => {
    global.fetch = jest.fn(async (input: unknown) => {
      const r = responder(String(input));
      return {
        ok: r.ok,
        status: r.status ?? (r.ok ? 200 : 500),
        json: async () => r.body,
      };
    }) as unknown as typeof fetch;
  };

  const publicTestnet = resolveNetworkProfile({ network: "public-testnet" });
  const mainnet = resolveNetworkProfile({ network: "mainnet" });

  it("throws for a gated profile when the node still serves PoX-4", async () => {
    mockFetch((url) => {
      if (url.endsWith("/v2/info")) return { ok: true, body: { network_id: STACKS_TESTNET.chainId } };
      if (url.endsWith("/v2/pox")) return { ok: true, body: { contract_id: "ST000000000000000000002AMW42H.pox-4" } };
      return { ok: false };
    });
    await expect(validateNetworkProfile(publicTestnet)).rejects.toThrow(/not yet supported/i);
  });

  it("does not throw for a gated profile when PoX-5 is active", async () => {
    mockFetch((url) => {
      if (url.endsWith("/v2/info")) return { ok: true, body: { network_id: STACKS_TESTNET.chainId } };
      if (url.endsWith("/v2/pox")) return { ok: true, body: { contract_id: "ST000000000000000000002AMW42H.pox-5" } };
      return { ok: false };
    });
    await expect(validateNetworkProfile(publicTestnet)).resolves.toBeUndefined();
  });

  it("only warns (does not throw) for a non-gated profile serving an older PoX", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch((url) => {
      if (url.endsWith("/v2/info")) return { ok: true, body: { network_id: STACKS_MAINNET.chainId } };
      if (url.endsWith("/v2/pox")) return { ok: true, body: { contract_id: "SP000000000000000000002Q6VF78.pox-4" } };
      return { ok: false };
    });
    await expect(validateNetworkProfile(mainnet)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
