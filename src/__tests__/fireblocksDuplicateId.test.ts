import { FireblocksService } from "../services/fireblocks.service";

/**
 * The 1438 (duplicate external id) detector gates FBS-02's resume path: on a re-submit
 * that Fireblocks rejects because the deterministic funding external id was already
 * consumed, the SDK resolves the existing transfer instead of failing. Matching must be
 * robust to the several shapes the ts-sdk / axios surface the error in.
 */
describe("FireblocksService.isDuplicateExternalIdError", () => {
  it("matches an axios-style response body code", () => {
    expect(FireblocksService.isDuplicateExternalIdError({ response: { data: { code: 1438 } } })).toBe(true);
  });

  it("matches a top-level code", () => {
    expect(FireblocksService.isDuplicateExternalIdError({ code: 1438 })).toBe(true);
  });

  it("matches a 1438 in the message", () => {
    expect(FireblocksService.isDuplicateExternalIdError(new Error("Tx rejected: code 1438 duplicate externalTxId"))).toBe(true);
  });

  it("does not match unrelated errors", () => {
    expect(FireblocksService.isDuplicateExternalIdError(new Error("network down"))).toBe(false);
    expect(FireblocksService.isDuplicateExternalIdError({ response: { data: { code: 1401 } } })).toBe(false);
    expect(FireblocksService.isDuplicateExternalIdError(null)).toBe(false);
    expect(FireblocksService.isDuplicateExternalIdError(undefined)).toBe(false);
  });

  it("does not misclassify a message that merely contains 1438 in a number", () => {
    // Amount / id / timestamp containing the substring must not read as a duplicate-id.
    expect(FireblocksService.isDuplicateExternalIdError(new Error("amount 0.01438 rejected"))).toBe(false);
    expect(FireblocksService.isDuplicateExternalIdError(new Error("request 9a1438bc timed out"))).toBe(false);
    // A genuine duplicate-external-id message still matches.
    expect(FireblocksService.isDuplicateExternalIdError(new Error("code 1438: duplicate externalTxId"))).toBe(true);
  });
});

describe("FireblocksService.isTerminalTransferFailure", () => {
  it("matches the getTxStatus terminal-status message", () => {
    for (const s of ["BLOCKED", "CANCELLED", "FAILED", "REJECTED"]) {
      expect(FireblocksService.isTerminalTransferFailure(new Error(`Signing request failed/blocked/cancelled: Transaction: abc status is ${s}`))).toBe(true);
    }
  });

  it("does NOT match a timeout or transient error (retryable)", () => {
    expect(FireblocksService.isTerminalTransferFailure(new Error("Signing request timed out after 30 minutes: Transaction abc is still SUBMITTED"))).toBe(false);
    expect(FireblocksService.isTerminalTransferFailure(new Error("ECONNRESET"))).toBe(false);
    expect(FireblocksService.isTerminalTransferFailure(null)).toBe(false);
  });
});
