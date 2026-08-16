import { diffBondSchedule, formatBondScheduleError } from "../utils/bondSchedule";

/**
 * Pure bond-schedule comparison. The chain reads (fetchBondL1UnlockHeight /
 * computeBondUnlockHeight) live in bondScheduleChain.ts, which imports the Bitcoin
 * staking stack; here we test only the comparison over already-fetched heights so it
 * runs without that ESM dependency.
 *
 * Discovery coverage: the fixtures below span the six concurrently-active cohorts
 * (indices 0..5) plus the boundary index 6. Index 0 pins the active-window width, and the
 * unlock-height deltas between adjacent indices pin the bond-start gap, so a wrong gap or
 * a wrong length each surface as a mismatch.
 */

// A schedule where local == chain for indices 0..6 (gap 2 cycles, length 12 cycles,
// rewardCycleLength 2100, firstBondCycleStartHeight 100000). unlock(i) grows by gap*2100.
function matchingPairs() {
  const rewardCycleLength = 2100;
  const base = 100000 + 12 * rewardCycleLength; // window width baked into unlock(0)
  const gapHeight = 2 * rewardCycleLength;
  return [0, 1, 2, 3, 4, 5, 6].map((bondIndex) => {
    const h = base + bondIndex * gapHeight;
    return { bondIndex, localUnlockHeight: h, onchainUnlockHeight: h };
  });
}

describe("diffBondSchedule", () => {
  it("reports ok with no mismatches when every index matches (six cohorts + boundary)", () => {
    const diff = diffBondSchedule(matchingPairs());
    expect(diff.ok).toBe(true);
    expect(diff.mismatches).toHaveLength(0);
    expect(diff.checks).toHaveLength(7);
    expect(diff.checks.every((c) => c.match)).toBe(true);
  });

  it("flags a wrong active-window length (unlock(0) differs)", () => {
    const pairs = matchingPairs();
    // Chain length is one cycle longer than the local model on every index.
    pairs.forEach((p) => (p.onchainUnlockHeight += 2100));
    const diff = diffBondSchedule(pairs);
    expect(diff.ok).toBe(false);
    expect(diff.mismatches).toHaveLength(7);
  });

  it("flags a wrong bond-start gap (deltas between indices differ)", () => {
    const pairs = matchingPairs();
    // Chain gap is 3 cycles instead of 2: index i drifts by an extra cycle per step.
    pairs.forEach((p) => (p.onchainUnlockHeight += p.bondIndex * 2100));
    const diff = diffBondSchedule(pairs);
    expect(diff.ok).toBe(false);
    // index 0 still matches (delta 0); indices 1..6 diverge.
    expect(diff.mismatches.map((m) => m.bondIndex)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("formats an actionable error naming the local constants and the mismatches", () => {
    const pairs = matchingPairs();
    pairs[3].onchainUnlockHeight += 1;
    const diff = diffBondSchedule(pairs);
    const msg = formatBondScheduleError(diff, { gapCycles: 2, lengthCycles: 12 });
    expect(msg).toMatch(/BOND_GAP_CYCLES=2/);
    expect(msg).toMatch(/BOND_LENGTH_CYCLES=12/);
    expect(msg).toMatch(/bond 3:/);
  });
});
