/**
 * Pure comparison of the SDK's local bond-schedule model against the authoritative
 * on-chain schedule.
 *
 * The SDK derives every bond's reward cycle and L1 unlock height locally from the
 * `BOND_GAP_CYCLES` (bond-start spacing) and `BOND_LENGTH_CYCLES` (active-window width)
 * constants in @stacks/bitcoin-staking. If those differ from what the deployed PoX-5
 * contract enforces, funds would be locked or spent against the wrong height. The
 * authoritative check compares the locally computed unlock height against the contract's
 * own `get-bond-l1-unlock-height` accessor for a set of bond indices:
 *   - unlock(0) encodes the active-window width (BOND_LENGTH_CYCLES), so a mismatch there
 *     proves the length is wrong;
 *   - unlock(n) − unlock(n−1) equals the bond-start gap (BOND_GAP_CYCLES) in cycles, so a
 *     mismatch across adjacent indices proves the gap is wrong.
 * Checking indices spanning the active cohorts therefore validates BOTH schedule values.
 *
 * This module holds only the pure comparison; the chain reads live in bondScheduleChain.ts
 * so the comparison can be unit tested without importing the Bitcoin signing stack.
 */

export interface BondScheduleCheck {
  bondIndex: number;
  localUnlockHeight: number;
  onchainUnlockHeight: number;
  match: boolean;
}

export interface BondScheduleDiff {
  ok: boolean;
  checks: BondScheduleCheck[];
  mismatches: BondScheduleCheck[];
}

export function diffBondSchedule(
  pairs: Array<{ bondIndex: number; localUnlockHeight: number; onchainUnlockHeight: number }>,
): BondScheduleDiff {
  const checks: BondScheduleCheck[] = pairs.map((p) => ({
    ...p,
    match: p.localUnlockHeight === p.onchainUnlockHeight,
  }));
  const mismatches = checks.filter((c) => !c.match);
  return { ok: mismatches.length === 0, checks, mismatches };
}

export function formatBondScheduleError(
  diff: BondScheduleDiff,
  schedule: { gapCycles: number; lengthCycles: number },
): string {
  const detail = diff.mismatches
    .map((m) => `bond ${m.bondIndex}: local ${m.localUnlockHeight} != chain ${m.onchainUnlockHeight}`)
    .join('; ');
  return (
    `Bond schedule does not match the chain (local BOND_GAP_CYCLES=${schedule.gapCycles}, ` +
    `BOND_LENGTH_CYCLES=${schedule.lengthCycles}). Refusing to operate against a schedule the ` +
    `deployed PoX-5 contract does not enforce. Mismatches: ${detail}`
  );
}
