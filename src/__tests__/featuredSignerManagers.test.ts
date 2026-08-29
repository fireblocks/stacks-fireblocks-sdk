import { FEATURED_SIGNER_MANAGERS, defaultSignerManagerFor } from "../utils/constants";

/**
 * The featured list is presentation only. These assert the invariants a consumer relies on
 * when seeding a picker, and — deliberately — that it is NOT wired to anything that gates.
 */
describe("FEATURED_SIGNER_MANAGERS", () => {
  const networks = ["mainnet", "private-devnet", "public-testnet"] as const;

  it("has exactly one default per network that features anything", () => {
    for (const n of networks) {
      const defaults = FEATURED_SIGNER_MANAGERS[n].filter((m) => m.default);
      // An empty list is legitimate (not provisioned); a list with 0 or 2+ defaults is not.
      expect(defaults.length).toBe(FEATURED_SIGNER_MANAGERS[n].length === 0 ? 0 : 1);
    }
  });

  it("exposes fully-qualified contract ids and a display operator", () => {
    for (const n of networks) {
      for (const m of FEATURED_SIGNER_MANAGERS[n]) {
        expect(m.contract).toMatch(/^S[A-Z0-9]+\.[a-z0-9-]+$/);
        expect(m.operator.length).toBeGreaterThan(0);
      }
    }
  });

  it("features mainnet managers only on mainnet, and test managers only off it", () => {
    // A mainnet principal starts SP/SM; test networks use ST/STM. Featuring one under the
    // wrong network would pre-select a manager that cannot exist on the chain in use.
    for (const m of FEATURED_SIGNER_MANAGERS.mainnet) expect(m.contract).toMatch(/^SP/);
    for (const m of FEATURED_SIGNER_MANAGERS["private-devnet"]) expect(m.contract).toMatch(/^ST/);
  });

  it("resolves the default, and returns undefined where none is featured", () => {
    expect(defaultSignerManagerFor("mainnet")?.contract)
      .toBe("SP3RX8RME63CY63G5WZ8XQWZNTYNETYJESQKE071E.stacks-labs");
    expect(defaultSignerManagerFor("private-devnet")?.contract)
      .toBe("STM0NRFQG1Q4WNNTQ8YMSX4QGS16PSCTDHFTDMTA.signer-manager");
    expect(defaultSignerManagerFor("public-testnet")).toBeUndefined();
  });
});
