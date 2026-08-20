import { planSbtcRollover } from "../staking/bonds/sbtc-rollover";

/**
 * Net-delta post-condition plan for an sBTC rollover (answers.md §3c). Only the difference
 * between the currently custodied sBTC and the target amount moves; the direction decides
 * the Deny-mode FT post-condition principal. These are the deterministic cases the
 * rollSbtcBond method attaches post-conditions from; the live-node flow is gated on an
 * active PoX-5 testnet (answers.md §7).
 */
describe("planSbtcRollover", () => {
  it("treats first registration (no prior custody) as origin sends the full amount", () => {
    expect(planSbtcRollover(BigInt(0), BigInt(500_000))).toEqual({
      direction: "origin-sends",
      amountSats: BigInt(500_000),
    });
  });

  it("increase: origin sends new − old", () => {
    expect(planSbtcRollover(BigInt(300_000), BigInt(500_000))).toEqual({
      direction: "origin-sends",
      amountSats: BigInt(200_000),
    });
  });

  it("decrease: PoX-5 boot sends old − new back", () => {
    expect(planSbtcRollover(BigInt(500_000), BigInt(300_000))).toEqual({
      direction: "boot-sends",
      amountSats: BigInt(200_000),
    });
  });

  it("decrease to zero: boot returns the full custodied amount", () => {
    expect(planSbtcRollover(BigInt(500_000), BigInt(0))).toEqual({
      direction: "boot-sends",
      amountSats: BigInt(500_000),
    });
  });

  it("unchanged amount: no sBTC moves", () => {
    expect(planSbtcRollover(BigInt(500_000), BigInt(500_000))).toEqual({
      direction: "none",
      amountSats: BigInt(0),
    });
  });

  it("equal rollover from zero: nothing moves", () => {
    expect(planSbtcRollover(BigInt(0), BigInt(0))).toEqual({
      direction: "none",
      amountSats: BigInt(0),
    });
  });

  it("rejects negative amounts (never asserts a nonsensical transfer)", () => {
    expect(() => planSbtcRollover(BigInt(-1), BigInt(100))).toThrow();
    expect(() => planSbtcRollover(BigInt(100), BigInt(-1))).toThrow();
  });

  it("never plans the gross new amount for a rollover with prior custody", () => {
    // Regression guard for the original bug: asserting willSendEq(newSats) on a rollover.
    const plan = planSbtcRollover(BigInt(400_000), BigInt(600_000));
    expect(plan.amountSats).not.toBe(BigInt(600_000));
    expect(plan.amountSats).toBe(BigInt(200_000));
  });
});
