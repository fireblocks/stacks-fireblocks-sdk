import { FireblocksService } from "../services/fireblocks.service";
import {
  FireblocksTransferError,
  StaleRawSignError,
} from "../utils/FireblocksSigner";

/**
 * `signTransaction` must not destroy a typed rawSign failure (Copilot review, PR #31).
 *
 * `rawSign` was made to throw FireblocksTransferError / StaleRawSignError rather than an
 * opaque Error (5ae7276), but `signTransaction` — the layer every caller actually goes
 * through, including `pox5SignAndBroadcast` — still caught everything and rethrew a
 * plain Error. `createBond`'s `isTerminalTransferFailure(registerErr)` check can only
 * ever see what `signTransaction` throws, so the whole terminal-rejection escape hatch
 * for register-for-bond (registrationGeneration) could never fire in production.
 */

const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const makeService = (): any =>
  new (FireblocksService as any)({
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });

describe("FireblocksService.signTransaction — typed error passthrough", () => {
  it("propagates a FireblocksTransferError instead of wrapping it in a plain Error", async () => {
    const svc = makeService();
    const terminal = new FireblocksTransferError(
      "Signing request fb-1 reached terminal status REJECTED",
      {
        operation: "RAW",
        status: "REJECTED" as any,
        vendorId: "fb-1",
      },
    );
    svc.fireblocksSigner = { rawSign: jest.fn().mockRejectedValue(terminal) };

    await expect(svc.signTransaction("content", "7")).rejects.toBe(terminal);
  });

  it("propagates a StaleRawSignError the same way", async () => {
    const svc = makeService();
    const stale = new StaleRawSignError(
      "Signing request fb-2 already holds a different message",
      "fb-2",
    );
    svc.fireblocksSigner = { rawSign: jest.fn().mockRejectedValue(stale) };

    await expect(svc.signTransaction("content", "7")).rejects.toBe(stale);
  });

  it("still wraps a genuinely untyped error with context, unchanged", async () => {
    const svc = makeService();
    svc.fireblocksSigner = {
      rawSign: jest.fn().mockRejectedValue(new Error("ECONNRESET")),
    };

    await expect(svc.signTransaction("content", "7")).rejects.toThrow(
      /Failed to sign transaction.*ECONNRESET/,
    );
  });
});
