import { poxAddressToTuple } from "@stacks/stacking";
import { Cl, serializeCVBytes } from "@stacks/transactions";

/** The signer-manager's signer-calldata argument is `(optional (buff 500))`. */
export const REWARD_CALLDATA_MAX_BYTES = 500;

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
export function encodeRewardAddressCalldata(rewardBtcAddress: string, maxFeeSats: bigint): Uint8Array {
  if (maxFeeSats < BigInt(0)) {
    throw new Error(`rewardMaxFeeSats must be non-negative, got ${maxFeeSats}`);
  }
  const poxAddr = poxAddressToTuple(rewardBtcAddress); // throws on an invalid BTC address
  const tuple = Cl.tuple({ "pox-addr": poxAddr, "max-fee": Cl.uint(maxFeeSats) });
  const bytes = serializeCVBytes(tuple);
  if (bytes.length > REWARD_CALLDATA_MAX_BYTES) {
    throw new Error(
      `Encoded reward calldata is ${bytes.length} bytes, exceeding the ${REWARD_CALLDATA_MAX_BYTES}-byte contract limit.`,
    );
  }
  return bytes;
}
