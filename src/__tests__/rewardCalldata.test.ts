import { encodeRewardAddressCalldata, REWARD_CALLDATA_MAX_BYTES, decodeCommittedRewardMapValue, nativeRewardThresholdSats } from "../utils/rewardCalldata";
import { Cl, deserializeCV, serializeCV } from "@stacks/transactions";
import { poxAddressToTuple } from "@stacks/stacking";

/**
 * The reward-address calldata must be exactly what the reference signer-manager's
 * `validate-stake!` decodes with `from-consensus-buff?`:
 *   { pox-addr: { version: (buff 1), hashbytes: (buff 32) }, max-fee: uint }
 * (contrib/core-contract-tests/contracts/signer-manager.clar). The round-trip below
 * deserializes the encoded buffer back to a Clarity value and asserts that shape and the
 * PoX version scheme check-pox-addr enforces (version ≤ 4 → 20-byte hash, 5–6 → 32-byte).
 */

// Public BIP-173 / BIP-350 example addresses (not secrets).
const P2WPKH_TESTNET = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"; // v4, 20-byte
const P2PKH_MAINNET = "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"; // v0, 20-byte
const P2WSH_MAINNET = "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3"; // v5, 32-byte
// A Stacks principal (wrong address family) used to prove the encoder rejects non-BTC input.
const NON_BTC_PRINCIPAL = "SP2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";

// deserializeCV yields BufferCV.value as a hex string and UIntCV.value as a bigint in
// this @stacks/transactions version; assert against those.
function decode(bytes: Uint8Array) {
  const cv: any = deserializeCV(bytes);
  const poxAddr = cv.value["pox-addr"];
  const versionHex: string = poxAddr.value["version"].value;
  const hashHex: string = poxAddr.value["hashbytes"].value;
  return {
    versionByte: parseInt(versionHex, 16),
    versionLen: versionHex.length / 2,
    hashLen: hashHex.length / 2,
    maxFee: cv.value["max-fee"].value as bigint,
  };
}

describe("encodeRewardAddressCalldata", () => {
  it("encodes a P2WPKH (v4) address into the exact contract tuple", () => {
    const d = decode(encodeRewardAddressCalldata(P2WPKH_TESTNET, BigInt(5000)));
    expect(d.versionLen).toBe(1);
    expect(d.versionByte).toBe(4);
    expect(d.hashLen).toBe(20);
    expect(d.maxFee).toBe(BigInt(5000));
  });

  it("encodes a mainnet P2PKH (v0) with a 20-byte hash", () => {
    const d = decode(encodeRewardAddressCalldata(P2PKH_MAINNET, BigInt(0)));
    expect(d.versionByte).toBe(0);
    expect(d.hashLen).toBe(20);
  });

  it("encodes a P2WSH (v5) with a 32-byte hash", () => {
    const d = decode(encodeRewardAddressCalldata(P2WSH_MAINNET, BigInt(1234)));
    expect(d.versionByte).toBe(5);
    expect(d.hashLen).toBe(32);
  });

  it("preserves large max-fee values exactly (bigint)", () => {
    expect(decode(encodeRewardAddressCalldata(P2WPKH_TESTNET, BigInt("4294967297"))).maxFee).toBe(BigInt("4294967297"));
  });

  it("rejects a malformed / non-Bitcoin address", () => {
    expect(() => encodeRewardAddressCalldata("not-a-btc-address", BigInt(1))).toThrow();
    expect(() => encodeRewardAddressCalldata(NON_BTC_PRINCIPAL, BigInt(1))).toThrow();
  });

  it("rejects a negative max-fee", () => {
    expect(() => encodeRewardAddressCalldata(P2WPKH_TESTNET, BigInt(-1))).toThrow(/non-negative/);
  });

  it("stays within the 500-byte calldata limit", () => {
    expect(encodeRewardAddressCalldata(P2WSH_MAINNET, BigInt("18446744073709551615")).length)
      .toBeLessThanOrEqual(REWARD_CALLDATA_MAX_BYTES);
  });
});

/**
 * Builds the serialized VALUE a node `/v2/map_entry` read of pox-addrs returns for a
 * committed staker: `(some { pox-addr, max-fee })`. decodeCommittedRewardMapValue must
 * invert it back to the exact Bitcoin address + max-fee.
 */
function committedMapValueHex(btcAddress: string, maxFee: bigint): string {
  const value = Cl.some(Cl.tuple({ "pox-addr": poxAddressToTuple(btcAddress), "max-fee": Cl.uint(maxFee) }));
  return serializeCV(value);
}

describe("nativeRewardThresholdSats (the required disclosure figure)", () => {
  const t = (maxFeeSats: bigint, feesBips: number) => nativeRewardThresholdSats({ maxFeeSats, feesBips });

  it("matches the published zero-fee figure exactly (5,000 budget -> 5,546)", () => {
    // This is the anchor: Stacks Labs published 5,546 for a zero-fee manager at a 5,000-sat
    // budget. Reproducing it exactly is what validates the whole derivation.
    expect(t(BigInt(5000), 0)).toBe(BigInt(5546));
  });

  it("is exactly maxFee + 546 when the manager takes no fee", () => {
    for (const fee of [0, 1, 1000, 5000, 250_000]) {
      expect(t(BigInt(fee), 0)).toBe(BigInt(fee) + BigInt(546));
    }
  });

  it("grosses up for a manager fee using the contract's floored arithmetic", () => {
    // The continuous approximation (net / (1 - bips/10000)) gives ~5,837; the integer
    // arithmetic the contract actually performs gives 5,834. Off-by-a-few matters here
    // because this string is shown to the customer as a money disclosure.
    const threshold = t(BigInt(5000), 495);
    expect(threshold).toBe(BigInt(5834));
    expect(threshold).toBeGreaterThan(BigInt(5546)); // a fee can only raise the bar
  });

  it("returns a threshold that is genuinely the boundary: +1 is payable, it is not", () => {
    // Re-derive the contract's own test from the returned number, for several fee levels.
    const netOf = (gross: bigint, bips: number) => gross - (gross * BigInt(bips)) / BigInt(10000);
    for (const bips of [0, 100, 495, 1000, 9999]) {
      const maxFee = BigInt(5000);
      const threshold = t(maxFee, bips);
      const payable = (gross: bigint) => netOf(gross, bips) >= maxFee + BigInt(547);
      expect(payable(threshold)).toBe(false);
      expect(payable(threshold + BigInt(1))).toBe(true);
    }
  });

  it("rejects nonsense inputs rather than printing a wrong number", () => {
    expect(() => t(BigInt(-1), 0)).toThrow(/non-negative/);
    expect(() => t(BigInt(5000), -1)).toThrow(/feesBips/);
    expect(() => t(BigInt(5000), 10000)).toThrow(/feesBips/);
    expect(() => t(BigInt(5000), 4.5)).toThrow(/feesBips/);
  });
});

describe("decodeCommittedRewardMapValue", () => {
  it("round-trips a committed testnet P2WPKH destination", () => {
    const out = decodeCommittedRewardMapValue(committedMapValueHex(P2WPKH_TESTNET, BigInt(5000)), "testnet");
    expect(out).not.toBeNull();
    expect(out!.rewardBtcAddress).toBe(P2WPKH_TESTNET);
    expect(out!.rewardMaxFeeSats).toBe(BigInt(5000));
  });

  it("round-trips a committed mainnet P2WSH destination and preserves a large max-fee", () => {
    const out = decodeCommittedRewardMapValue(committedMapValueHex(P2WSH_MAINNET, BigInt("4294967297")), "mainnet");
    expect(out!.rewardBtcAddress).toBe(P2WSH_MAINNET);
    expect(out!.rewardMaxFeeSats).toBe(BigInt("4294967297"));
  });

  it("returns null for a `none` entry (no committed reward address)", () => {
    expect(decodeCommittedRewardMapValue(serializeCV(Cl.none()), "mainnet")).toBeNull();
  });
});
