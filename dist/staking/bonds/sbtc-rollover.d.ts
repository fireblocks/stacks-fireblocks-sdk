/**
 * Pure net-delta post-condition plan for an sBTC bond rollover.
 *
 * An sBTC rollover moves only the DIFFERENCE between the staker's currently custodied
 * sBTC and the target amount for the new bond — never the gross new amount (answers.md
 * §3c, pox-5.clar `roll-sbtc`). The direction of the transfer decides the Deny-mode FT
 * post-condition principal:
 *   - increase (new > old): the staker (tx origin) sends `new − old`;
 *   - decrease (new < old): the PoX-5 boot contract sends `old − new` back to the staker;
 *   - unchanged (new == old): no sBTC moves, so no sBTC post-condition is attached.
 * A first registration is just the increase-from-zero case (old = 0 → origin sends new).
 *
 * The `willSendEq(fullNewAmount)` gross condition is correct only when there is no prior
 * custody; using it for a rollover would over-assert and abort the transaction.
 */
export type SbtcRolloverDirection = 'origin-sends' | 'boot-sends' | 'none';
export interface SbtcRolloverPlan {
    direction: SbtcRolloverDirection;
    /** The net sBTC amount that moves, in sats (0 when nothing moves). */
    amountSats: bigint;
}
export declare function planSbtcRollover(oldCustodiedSats: bigint, newSats: bigint): SbtcRolloverPlan;
