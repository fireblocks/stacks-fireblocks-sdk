import { NetworkProfile } from './network';
import { BondScheduleDiff } from './bondSchedule';
/**
 * Default bond indices to validate: the six concurrently-active bond cohorts
 * (BOND_LENGTH_CYCLES / BOND_GAP_CYCLES = 12 / 2 = 6) plus index 6, which crosses the
 * boundary where the first cohort's window has fully elapsed. Index 0 pins the active-
 * window width; the deltas between adjacent indices pin the bond-start gap.
 */
export declare const DEFAULT_SCHEDULE_BOND_INDICES: number[];
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
export declare function validateBondScheduleAgainstChain(opts: {
    profile: NetworkProfile;
    bondIndices?: number[];
}): Promise<BondScheduleValidation>;
