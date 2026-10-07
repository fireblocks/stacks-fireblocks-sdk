import { fetchPoxInfo } from "@stacks/bitcoin-staking";
import {
  accountBalanceNormalizingFetch,
  resolveNetworkProfile,
  stacksNetworkFromProfile,
} from "../utils/network";

/**
 * A non-JSON error body must not surface as a bare SyntaxError.
 *
 * `fetchPoxInfo`, `fetchAccountStatus` and `fetchBondAdmin` in `@stacks/bitcoin-staking`
 * call `response.json()` without checking `response.ok`. When the node answers with a
 * plain-text error — seen live as a body beginning "Per-minute" on the pre-flight
 * "Authoritative eligibility check" — the user got
 *   Failed to fetch requirements: Unexpected token 'P', "Per-minute"... is not valid JSON
 * which names neither the HTTP status nor the endpoint, so it cannot be told apart from a
 * genuine parsing bug. Every one of those reads passes through this wrapper, so it is the
 * place to turn that case into an error that says what actually came back.
 */

const textResponse = (status: number, body: string, statusText = "") =>
  new Response(body, {
    status,
    statusText,
    headers: { "content-type": "text/plain" },
  });

const wrapped = (res: Response) =>
  accountBalanceNormalizingFetch((async () => res) as unknown as typeof fetch);

describe("accountBalanceNormalizingFetch — non-JSON error bodies", () => {
  it("names the HTTP status, the endpoint path and the body when an error response is not JSON", async () => {
    const f = wrapped(
      textResponse(429, "Per-minute rate limit exceeded", "Too Many Requests"),
    );

    const err = await f("https://api.hiro.so/v2/pox?foo=bar").catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/429/);
    expect(err.message).toMatch(/\/v2\/pox/);
    expect(err.message).toMatch(/Per-minute rate limit exceeded/);
  });

  it("does not echo the query string, which can carry request detail", async () => {
    const f = wrapped(textResponse(502, "Bad Gateway"));

    const err = await f("https://api.hiro.so/v2/pox?secret=abc").catch(
      (e) => e,
    );

    expect(err.message).not.toMatch(/secret=abc/);
  });

  it("bounds how much of a large error page it reports", async () => {
    const f = wrapped(textResponse(503, "x".repeat(5_000)));

    const err = await f("https://api.hiro.so/v2/pox").catch((e) => e);

    expect(err.message.length).toBeLessThan(500);
  });

  it("passes a JSON error body through untouched, for callers that read it", async () => {
    const res = new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });

    const out = await wrapped(res)("https://api.hiro.so/v2/data_var/x");

    expect(out).toBe(res);
  });

  it("passes a successful response through untouched even when its body is not JSON", async () => {
    const res = textResponse(200, "plain text");

    const out = await wrapped(res)("https://api.hiro.so/extended/v1/anything");

    expect(out).toBe(res);
  });
});

describe("the real failure: fetchPoxInfo against a plain-text rate-limit response", () => {
  it("reports the status instead of a JSON parse error", async () => {
    const network = stacksNetworkFromProfile(
      resolveNetworkProfile({ network: "mainnet" }),
      undefined,
      (async () =>
        textResponse(
          429,
          "Per-minute rate limit exceeded",
        )) as unknown as typeof fetch,
    );

    const err = await fetchPoxInfo({ network }).catch((e) => e);

    expect(err.message).not.toMatch(/not valid JSON/);
    expect(err.message).toMatch(/429/);
  });
});
