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
});
