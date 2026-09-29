/**
 * The signer-manager allowlist has to survive the REST config boundary (FBS-161,
 * residual plumbing).
 *
 * `FireblocksConfig.signerManagerAdapters` existed and `StacksSDK` consumed it, but
 * `ApiServiceConfig` had no such field and `toFireblocksConfig` never forwarded one — so
 * only a direct library consumer could configure an allowlist. REST deployments AND the
 * app (which builds `ApiServiceConfig` in code, verified on `app-version`) could not.
 *
 * Env carries strings, and adapters are structured, so only the ALLOWLIST is exposed
 * through env — a flat comma-separated list of contract principals, matching how every
 * other variable in this file is shaped. The payout-asset override stays library-only:
 * a caller who needs it is constructing config in code anyway.
 *
 * It fails CLOSED. An empty registry means "no allowlist configured, all managers
 * allowed", so a typo that parsed to an empty or partial list would silently disable a
 * security control rather than break loudly.
 */

import { apiServiceConfigFromEnv, toFireblocksConfig } from "../pool/config";

const BASE_ENV = {
  FIREBLOCKS_API_KEY: "key",
  FIREBLOCKS_SECRET_KEY_PATH: "./secret.key",
} as NodeJS.ProcessEnv;

const MANAGER_A = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.manager-a";
const MANAGER_B = "ST000000000000000000002AMW42H.manager-b";

describe("SIGNER_MANAGER_ALLOWLIST — env to registry", () => {
  it("treats an empty value as unset, the way .env.example ships it", () => {
    // `.env.example` lists the variable with no value, matching every other optional
    // one. Throwing on that would make a copied example file crash the server at boot.
    expect(
      apiServiceConfigFromEnv({ ...BASE_ENV, SIGNER_MANAGER_ALLOWLIST: "" })
        .signerManagerAdapters,
    ).toBeUndefined();
    expect(
      apiServiceConfigFromEnv({ ...BASE_ENV, SIGNER_MANAGER_ALLOWLIST: "   " })
        .signerManagerAdapters,
    ).toBeUndefined();
  });

  it("leaves adapters undefined when the variable is absent", () => {
    const cfg = apiServiceConfigFromEnv({ ...BASE_ENV });

    // Undefined, not [] — an empty array is an explicit "allowlist of nothing", and the
    // registry reads size 0 as "no allowlist at all". They must not be conflated.
    expect(cfg.signerManagerAdapters).toBeUndefined();
  });

  it("parses a comma-separated list into adapters", () => {
    const cfg = apiServiceConfigFromEnv({
      ...BASE_ENV,
      SIGNER_MANAGER_ALLOWLIST: `${MANAGER_A},${MANAGER_B}`,
    });

    expect(cfg.signerManagerAdapters).toEqual([
      { contractPrincipal: MANAGER_A },
      { contractPrincipal: MANAGER_B },
    ]);
  });

  it("tolerates surrounding whitespace and trailing separators", () => {
    const cfg = apiServiceConfigFromEnv({
      ...BASE_ENV,
      SIGNER_MANAGER_ALLOWLIST: `  ${MANAGER_A} , ${MANAGER_B} ,  `,
    });

    expect(cfg.signerManagerAdapters).toHaveLength(2);
  });

  it("refuses a malformed entry instead of silently dropping it", () => {
    expect(() =>
      apiServiceConfigFromEnv({
        ...BASE_ENV,
        SIGNER_MANAGER_ALLOWLIST: `${MANAGER_A},not-a-principal`,
      }),
    ).toThrow(/not-a-principal/);
  });

  it("refuses a value that parses to nothing", () => {
    // Would otherwise boot with size 0 = no allowlist, i.e. the control the operator
    // just tried to switch on is off.
    expect(() =>
      apiServiceConfigFromEnv({
        ...BASE_ENV,
        SIGNER_MANAGER_ALLOWLIST: " , , ",
      }),
    ).toThrow(/SIGNER_MANAGER_ALLOWLIST/);
  });

  it("refuses a bare address with no contract name", () => {
    expect(() =>
      apiServiceConfigFromEnv({
        ...BASE_ENV,
        SIGNER_MANAGER_ALLOWLIST: "ST000000000000000000002AMW42H",
      }),
    ).toThrow();
  });
});

describe("toFireblocksConfig — the boundary that swallowed this before", () => {
  it("forwards signerManagerAdapters to the SDK config", () => {
    const fb = toFireblocksConfig({
      apiKey: "key",
      apiSecret: "secret",
      signerManagerAdapters: [{ contractPrincipal: MANAGER_A }],
    } as never);

    expect(fb.signerManagerAdapters).toEqual([
      { contractPrincipal: MANAGER_A },
    ]);
  });

  it("leaves it undefined when not configured", () => {
    const fb = toFireblocksConfig({
      apiKey: "key",
      apiSecret: "secret",
    } as never);

    expect(fb.signerManagerAdapters).toBeUndefined();
  });
});
