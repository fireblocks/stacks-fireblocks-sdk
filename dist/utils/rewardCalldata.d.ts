/** The signer-manager's signer-calldata argument is `(optional (buff 500))`. */
export declare const REWARD_CALLDATA_MAX_BYTES = 500;
/**
 * Encodes a native-BTC reward destination into the signer-manager's `validate-stake!`
 * calldata buffer.
 *
 * The reference signer-manager decodes the calldata with `from-consensus-buff?` into
 *   { pox-addr: { version: (buff 1), hashbytes: (buff 32) }, max-fee: uint }
 * (contrib/core-contract-tests/contracts/signer-manager.clar), so the buffer is exactly
 * the Clarity consensus serialization of that tuple. `poxAddressToTuple` validates and
 * decodes the Bitcoin address into the standard PoX `{ version, hashbytes }` tuple (the
 * same version scheme the contract's `check-pox-addr` enforces: versions ≤ 4 carry a
 * 20-byte hash, 5–6 a 32-byte hash) and THROWS on a malformed/unsupported address.
 *
 * `maxFeeSats` is the BTC-withdrawal fee budget in sats (sBTC, the same unit as the
 * staker's earned rewards): with a reward address set, the staker's rewards route as an
 * sBTC L1 withdrawal paying `earned − max-fee` to the address, the unused fee is
 * refunded, and a cycle whose `earned` is below `max-fee` is UNCLAIMABLE until the staker
 * re-stakes with new calldata (ERR_NO_CLAIMABLE_REWARDS). The caller must therefore choose
 * it deliberately relative to expected per-cycle rewards — the SDK does not guess it.
 *
 * Network + checksum validation of the address for the active network is the caller's
 * responsibility (StacksSDK does it before funding); this pure encoder only rejects a
 * structurally invalid address (via poxAddressToTuple) and a negative fee.
 */
export declare function encodeRewardAddressCalldata(rewardBtcAddress: string, maxFeeSats: bigint): Uint8Array;
/** The committed reward destination read back from the signer-manager `pox-addrs` map. */
export interface CommittedRewardDestination {
    /** The Bitcoin address rewards are routed to (inverse of the on-chain pox-addr tuple). */
    rewardBtcAddress: string;
    /** The committed BTC-withdrawal fee budget in sats. */
    rewardMaxFeeSats: bigint;
}
/**
 * Decodes the serialized VALUE returned by a Stacks node `/v2/map_entry` read of the
 * signer-manager's `pox-addrs` map. The map value type is
 *   (optional { pox-addr: { version: (buff 1), hashbytes: (buff 32) }, max-fee: uint })
 * (signer-manager.clar map `pox-addrs`, keyed by the staker principal), so this reads the
 * ACTUALLY-COMMITTED reward destination — the app uses it to display the real on-chain
 * address and to verify a renewal/rotation preserved it.
 *
 * Returns null when the entry is `none` — the staker has no committed reward address and
 * rewards fall back to sBTC-to-principal. Throws only on a genuinely malformed value.
 */
export declare function decodeCommittedRewardMapValue(dataHex: string, network: "mainnet" | "testnet"): CommittedRewardDestination | null;
