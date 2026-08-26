import { poxAddressToTuple, poxAddressToBtcAddress } from "@stacks/stacking";
import { Cl, serializeCVBytes, deserializeCV } from "@stacks/transactions";

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

/**
 * sBTC withdrawal dust floor: the withdrawn amount must EXCEED this, so a cycle is payable
 * to Bitcoin only when the amount left after the fee budget is 547 sats or more.
 */
export const SBTC_WITHDRAWAL_DUST_SATS = BigInt(546);

/**
 * The largest per-cycle reward (in sats, GROSS — before the signer manager's fee) that can
 * NOT be paid out to Bitcoin. This is the number the enrollment UI must disclose:
 * "cycles earning <threshold> sats or less cannot be paid to Bitcoin".
 *
 * Derivation, from the reference signer-manager and sBTC withdrawal rules:
 *  - the manager takes `fees-bips` from the gross reward first, so
 *    `net = gross − floor(gross × feesBips / 10000)`;
 *  - the claim reverts when `net < maxFee`, and the remainder `net − maxFee` must EXCEED the
 *    546-sat dust floor — so a cycle is payable iff `net >= maxFee + 547`;
 *  - therefore the largest non-payable gross is one below the smallest gross whose net
 *    reaches that bound.
 *
 * At `feesBips` 0 and a 5,000-sat budget this yields 5,546 — matching the figure Stacks Labs
 * published for a zero-fee manager, which is what anchors this derivation. Note their
 * "~5,837" for a 495-bip manager is a continuous approximation (`net / (1 − bips/10000)`);
 * the exact integer arithmetic the contract performs gives 5,834, and this returns the exact
 * value. Callers that would rather under-promise can round up — overstating the threshold
 * only withholds a payout the customer was not promised, whereas understating it promises a
 * Bitcoin payout that silently falls back to sBTC.
 */
export function nativeRewardThresholdSats(opts: { maxFeeSats: bigint; feesBips: number }): bigint {
  const { maxFeeSats, feesBips } = opts;
  if (maxFeeSats < BigInt(0)) throw new Error(`maxFeeSats must be non-negative, got ${maxFeeSats}`);
  if (!Number.isInteger(feesBips) || feesBips < 0 || feesBips >= 10000) {
    throw new Error(`feesBips must be an integer in [0, 10000), got ${feesBips}`);
  }
  const BPS = BigInt(10000);
  const bips = BigInt(feesBips);
  const netMinPayable = maxFeeSats + SBTC_WITHDRAWAL_DUST_SATS + BigInt(1);
  // BigInt division truncates toward zero, which matches the contract's floor for positives.
  const netOf = (gross: bigint): bigint => gross - (gross * bips) / BPS;

  // Start from the continuous estimate, then correct EXACTLY in both directions: the floored
  // fee means the closed form can be off by one, and a money disclosure cannot be off by one.
  let gross = (netMinPayable * BPS + (BPS - bips) - BigInt(1)) / (BPS - bips);
  while (netOf(gross) < netMinPayable) gross += BigInt(1);
  while (gross > BigInt(0) && netOf(gross - BigInt(1)) >= netMinPayable) gross -= BigInt(1);
  return gross - BigInt(1);
}

/** The committed reward destination read back from the signer-manager `pox-addrs` map. */
export interface CommittedRewardDestination {
  /** The Bitcoin address rewards are routed to (inverse of the on-chain pox-addr tuple). */
  rewardBtcAddress: string;
  /** The committed BTC-withdrawal fee budget in sats. */
  rewardMaxFeeSats: bigint;
}

const stripHex = (h: string): string => h.replace(/^0x/, "");

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
export function decodeCommittedRewardMapValue(
  dataHex: string,
  network: "mainnet" | "testnet",
): CommittedRewardDestination | null {
  const cv: any = deserializeCV(dataHex);
  // map_entry wraps the value in `(optional ...)`: `none` => no committed reward address.
  if (cv.type === "none") return null;
  if (cv.type !== "some") {
    throw new Error(`Unexpected committed reward map value: expected optional, got ${cv.type}`);
  }
  const tuple = cv.value;
  if (!tuple || tuple.type !== "tuple") {
    throw new Error(`Expected a tuple in the committed reward entry, got ${tuple?.type}`);
  }
  const fields = tuple.value;
  const poxAddr = fields["pox-addr"]?.value;
  const versionHex: unknown = poxAddr?.["version"]?.value;
  const hashHex: unknown = poxAddr?.["hashbytes"]?.value;
  const maxFee: unknown = fields["max-fee"]?.value;
  if (typeof versionHex !== "string" || typeof hashHex !== "string" || typeof maxFee !== "bigint") {
    throw new Error("Committed reward entry is missing or malformed pox-addr/max-fee fields");
  }
  const version = parseInt(stripHex(versionHex), 16);
  const hashClean = stripHex(hashHex);
  const hashBytes = Uint8Array.from((hashClean.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)));
  const rewardBtcAddress = poxAddressToBtcAddress(version, hashBytes, network);
  return { rewardBtcAddress, rewardMaxFeeSats: maxFee };
}
