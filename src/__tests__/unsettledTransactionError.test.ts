import { unsettledTransactionError } from "../utils/errorHandling";

/**
 * Wording for a transaction whose outcome is unknown (Stream B, bug 1).
 *
 * `waitForTxSettlement` reports `success: false` ONLY on timeout — the outcome is then
 * UNKNOWN, not failed. Call sites discarded that distinction and fell back to
 * "<operation> failed on-chain", so a slow transaction read identically to an aborted
 * one. That matters most on Complete Early Exit, which moves real Bitcoin: the standing
 * advice is "do not create a second transaction", which is unfollowable if you cannot
 * tell whether a first one exists.
 */
const TXID = "ab".repeat(32);

describe("unsettledTransactionError", () => {
  it("names the transaction so the operator can go look at it", () => {
    const msg = unsettledTransactionError("announce-l1-early-exit", TXID);

    expect(msg).toContain(TXID);
    expect(msg).toContain("announce-l1-early-exit");
  });

  it("says the outcome is unknown, and never that it failed", () => {
    const msg = unsettledTransactionError("announce-l1-early-exit", TXID);

    expect(msg).toMatch(/not known|unknown/i);
    // The whole defect: asserting a failure that was never observed.
    expect(msg).not.toMatch(/failed/i);
  });

  it("warns against sending a replacement on the assumption it failed", () => {
    const msg = unsettledTransactionError("complete-early-exit", TXID);

    expect(msg).toMatch(/do not|don't/i);
    expect(msg).toMatch(/replacement|resubmit|second transaction/i);
  });

  it("carries the underlying reason when the settlement wait supplied one", () => {
    const msg = unsettledTransactionError(
      "update-bond-registration",
      TXID,
      "Transaction timed out waiting for confirmation after 30 minutes.",
    );

    expect(msg).toContain(
      "timed out waiting for confirmation after 30 minutes",
    );
  });

  it("still reads sensibly with no reason supplied", () => {
    const msg = unsettledTransactionError("unstake-sbtc", TXID);

    expect(msg).toMatch(/settlement wait|timed out/i);
  });
});
