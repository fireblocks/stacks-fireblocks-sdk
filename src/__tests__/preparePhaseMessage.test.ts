import { POX5_BOND_ERRORS } from "../utils/constants";

/**
 * Wording for the prepare-phase rejection (Stream B, bug 2).
 *
 * The operator authenticated (Touch ID), then saw a bare contract constant. The
 * condition is temporary and nothing was sent or charged, but the message conveyed
 * neither — so it read as a hard failure. Not a rare path: the prepare phase is roughly
 * 17 hours of every two-week mainnet cycle, and about a quarter of all attempts on
 * private-1.
 */
describe("ERR_STAKE_IN_PREPARE_PHASE message", () => {
  const entry = Object.values(POX5_BOND_ERRORS).find(
    (e) => e.name === "ERR_STAKE_IN_PREPARE_PHASE",
  );

  it("is present in the PoX-5 error table", () => {
    expect(entry).toBeDefined();
  });

  it("says the condition is temporary rather than a failure", () => {
    expect(entry!.message).toMatch(/temporar|wait|retry|try again/i);
  });

  it("states that nothing was sent or charged", () => {
    expect(entry!.message).toMatch(
      /nothing was (sent|submitted|charged)|no fee|not charged/i,
    );
  });

  it("says roughly when to retry rather than only what went wrong", () => {
    expect(entry!.message).toMatch(
      /prepare phase ends|next cycle|once the prepare phase/i,
    );
  });
});
