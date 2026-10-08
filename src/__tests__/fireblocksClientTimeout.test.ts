/**
 * Every Fireblocks API call is bounded (review item 8).
 *
 * The Fireblocks client is axios-based and was built with no request timeout — axios's
 * default is none — so a getTransaction that never answered hung the poll outright: the
 * poll ceiling is only checked between reads, never during one.
 */

const fireblocksCtor = jest.fn();
jest.mock("@fireblocks/ts-sdk", () => {
  const actual = jest.requireActual("@fireblocks/ts-sdk");
  return {
    ...actual,
    Fireblocks: jest.fn().mockImplementation((opts: unknown) => {
      fireblocksCtor(opts);
      return { transactions: {} };
    }),
  };
});

import { FireblocksService } from "../services/fireblocks.service";

const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

it("builds the Fireblocks client with a finite request timeout", () => {
  new FireblocksService({
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });

  const timeout =
    fireblocksCtor.mock.calls[0][0]?.additionalOptions?.baseOptions?.timeout;
  expect(typeof timeout).toBe("number");
  expect(timeout).toBeGreaterThan(0);
});
