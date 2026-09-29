/**
 * Signer-manager adapters make the SDK's handling of a signer manager EXPLICIT
 * rather than assumed.
 *
 * PoX-5 has no pool logic of its own: sBTC reward custody and the staker payout live
 * in the caller-selected signer-manager contract. The payout AMOUNT needs no per-manager
 * configuration — pox-5's `settle-staker-rewards` computes
 * `get-earned-staker-rewards(manager, cycle, bond, staker)` and the manager may pay that
 * or less, so the `claim-staker-rewards` post-condition is bounded by that value read
 * from chain after the first leg settles. A manager the deployment has never heard of is
 * bounded exactly as tightly as a registered one.
 *
 * Two things remain per-manager, and both are optional:
 * an allowlist (a non-empty registry refuses managers absent from it), and the payout
 * ASSET, when a manager does not pay in the sBTC asset pox-5 settles in.
 */

export interface SignerManagerPayoutPolicy {
  /**
   * The fungible token this manager pays the staker in, when it is NOT the sBTC asset
   * resolved from chain. Only narrows which token the post-condition names; the amount
   * comes from the contract. A wrong value aborts the call under Deny mode.
   */
  asset: { contractAddress: string; contractName: string; assetName: string };
}

export interface SignerManagerAdapter {
  /** The signer-manager contract principal (e.g. `ST….my-manager`) this describes. */
  contractPrincipal: string;
  /**
   * Payout asset override for `claim-staker-rewards`. Absent means the chain-resolved
   * sBTC asset is used — absence does not refuse the claim.
   */
  payoutPolicy?: SignerManagerPayoutPolicy;
}

/** Immutable lookup of the signer-manager adapters a deployment supports. */
export class SignerManagerRegistry {
  private readonly byPrincipal: Map<string, SignerManagerAdapter>;

  constructor(adapters: SignerManagerAdapter[] = []) {
    this.byPrincipal = new Map(adapters.map((a) => [a.contractPrincipal, a]));
  }

  get(principal: string): SignerManagerAdapter | undefined {
    return this.byPrincipal.get(principal);
  }

  has(principal: string): boolean {
    return this.byPrincipal.has(principal);
  }

  /** Number of registered adapters. 0 = no allowlist configured (all managers allowed). */
  get size(): number {
    return this.byPrincipal.size;
  }
}
