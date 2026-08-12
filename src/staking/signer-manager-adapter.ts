/**
 * Signer-manager adapters make the SDK's handling of a signer manager EXPLICIT
 * rather than assumed.
 *
 * PoX-5 has no pool logic of its own: sBTC reward custody and the staker payout live
 * in the caller-selected signer-manager contract, and each manager defines its own
 * payout behavior. A correct Deny-mode post-condition for the `claim-staker-rewards`
 * leg is therefore manager-specific and must be supplied per manager. A manager
 * without a registered payout policy is REFUSED rather than signed with a permissive
 * (Allow-mode) post-condition — under Fireblocks RAW signing the payload is opaque,
 * so an unbounded sBTC payout is not acceptable.
 */

export interface SignerManagerPayoutPolicy {
  /** The sBTC-equivalent fungible token the manager pays the staker in. */
  asset: { contractAddress: string; contractName: string; assetName: string };
  /**
   * Upper bound (in sats) the manager may send the staker in a single
   * `claim-staker-rewards` call. The staker payout leg is bounded with an
   * at-most (SentLte) FT post-condition on the manager principal using this value.
   */
  maxPayoutSats: bigint;
}

export interface SignerManagerAdapter {
  /** The signer-manager contract principal (e.g. `ST….my-manager`) this describes. */
  contractPrincipal: string;
  /**
   * Payout policy for `claim-staker-rewards`. When absent, staker reward claims
   * through this manager are refused (there is no safe generic bound).
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
}
