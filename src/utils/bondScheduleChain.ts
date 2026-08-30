import {
  computeBondUnlockHeight,
  fetchBondL1UnlockHeight,
  fetchPoxInfo as fetchPox5Info,
} from '@stacks/bitcoin-staking';
import * as BitcoinStaking from '@stacks/bitcoin-staking';
// BOND_GAP_CYCLES / BOND_LENGTH_CYCLES are exported at runtime from the package's
// constants module but not declared in its typings. They are used only for the report
// label; the actual comparison uses computeBondUnlockHeight, which applies the real
// constants internally, so the validation does not depend on these values.
const BOND_GAP_CYCLES: number = (BitcoinStaking as any).BOND_GAP_CYCLES ?? 2;
const BOND_LENGTH_CYCLES: number = (BitcoinStaking as any).BOND_LENGTH_CYCLES ?? 12;
import { NetworkProfile, stacksNetworkFromProfile } from './network';
import { diffBondSchedule, formatBondScheduleError, BondScheduleDiff } from './bondSchedule';
import { formatErrorMessage } from './errorHandling';

/**
 * Default bond indices to validate: the six concurrently-active bond cohorts
 * (BOND_LENGTH_CYCLES / BOND_GAP_CYCLES = 12 / 2 = 6) plus index 6, which crosses the
 * boundary where the first cohort's window has fully elapsed. Index 0 pins the active-
 * window width; the deltas between adjacent indices pin the bond-start gap.
 */
export const DEFAULT_SCHEDULE_BOND_INDICES = [0, 1, 2, 3, 4, 5, 6];

export interface BondScheduleValidation {
  ok: boolean;
  diff?: BondScheduleDiff;
  gapCycles: number;
  lengthCycles: number;
  error?: string;
}

/**
 * Validates the SDK's local bond-schedule constants against the deployed PoX-5 contract by
 * comparing the locally computed L1 unlock height with the contract's own
 * `get-bond-l1-unlock-height` for each bond index. A read failure is reported as UNKNOWN
 * (ok:false with an error), never silently treated as "matches".
 */
export async function validateBondScheduleAgainstChain(opts: {
  profile: NetworkProfile;
  bondIndices?: number[];
}): Promise<BondScheduleValidation> {
  const network = stacksNetworkFromProfile(opts.profile);
  const indices = opts.bondIndices ?? DEFAULT_SCHEDULE_BOND_INDICES;
  try {
    const poxInfo = await fetchPox5Info({ network });
    const pairs = await Promise.all(
      indices.map(async (bondIndex) => ({
        bondIndex,
        localUnlockHeight: Number(computeBondUnlockHeight({ bondIndex, poxInfo })),
        onchainUnlockHeight: Number(await fetchBondL1UnlockHeight({ bondIndex, network })),
      })),
    );
    const diff = diffBondSchedule(pairs);
    return {
      ok: diff.ok,
      diff,
      gapCycles: BOND_GAP_CYCLES,
      lengthCycles: BOND_LENGTH_CYCLES,
      error: diff.ok ? undefined : formatBondScheduleError(diff, { gapCycles: BOND_GAP_CYCLES, lengthCycles: BOND_LENGTH_CYCLES }),
    };
  } catch (error) {
    return {
      ok: false,
      gapCycles: BOND_GAP_CYCLES,
      lengthCycles: BOND_LENGTH_CYCLES,
      error: `Could not validate the bond schedule against chain (UNKNOWN, not "matches"): ${formatErrorMessage(error)}`,
    };
  }
}
