import { encodeRewardAddressCalldata, REWARD_CALLDATA_MAX_BYTES, decodeCommittedRewardMapValue } from "../utils/rewardCalldata";
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
