import { checkFeeReplacement, ParsedRecoveryTx, FeeReplacementCheck } from "../utils/rbf";

/**
 * BIP-125 fee-replacement validation for recovery spends.
 *
 * A recovery spend is one input (the lock UTXO) and one output (the destination), so the
 * fee is always raised by reducing that single output — the no-change-output case. This
 * SDK never builds a change-output recovery spend (the funding transaction is built by
 * Fireblocks, which manages its own change), so a change-output replacement is not
 * applicable here; `checkFeeReplacement` explicitly rejects any multi-output original.
 */

const LOCK_ADDR = "tb1qlockaddressexample0000000000000000000000";
const DEST_ADDR = "tb1qdestinationexample000000000000000000000";
const LOCK_TXID = "cc".repeat(32);

// The project compiles with strict:false, so discriminated-union narrowing on `.ok` is
// unavailable; these helpers read the union's fields directly for assertions.
const err = (r: FeeReplacementCheck) => (r as { error?: string }).error ?? "";
type Ok = Extract<FeeReplacementCheck, { ok: true }>;
const ok = (r: FeeReplacementCheck) => r as Ok;

function makeParsed(over: Partial<ParsedRecoveryTx> = {}): ParsedRecoveryTx {
  return {
    confirmed: false,
    feeSats: BigInt(500),
    vsize: 150,
    destination: DEST_ADDR,
    destinationSats: BigInt(99_500),
    outputCount: 1,
    lockOutpoint: { txid: LOCK_TXID, vout: 0 },
    prevoutAddress: LOCK_ADDR,
    ...over,
  };
}

describe("checkFeeReplacement", () => {
  it("rejects an already-confirmed original", () => {
    const r = checkFeeReplacement(makeParsed({ confirmed: true, blockHeight: 42 }), BigInt(1000), LOCK_ADDR);
    expect(r.ok).toBe(false);
    expect(err(r)).toMatch(/already confirmed/);
  });

  it("rejects a multi-output original (no change-output recovery spend exists)", () => {
    const r = checkFeeReplacement(makeParsed({ outputCount: 2 }), BigInt(1000), LOCK_ADDR);
    expect(r.ok).toBe(false);
    expect(err(r)).toMatch(/single-output recovery spend/);
  });

  it("rejects a missing destination", () => {
    const r = checkFeeReplacement(makeParsed({ destination: undefined }), BigInt(1000), LOCK_ADDR);
    expect(r.ok).toBe(false);
    expect(err(r)).toMatch(/destination address/);
  });

  it("rejects a missing lock outpoint", () => {
    const r = checkFeeReplacement(makeParsed({ lockOutpoint: undefined }), BigInt(1000), LOCK_ADDR);
    expect(r.ok).toBe(false);
    expect(err(r)).toMatch(/lock input outpoint/);
  });

  it("rejects an original spending a different address", () => {
    const r = checkFeeReplacement(makeParsed({ prevoutAddress: "tb1qOTHER" }), BigInt(1000), LOCK_ADDR);
    expect(r.ok).toBe(false);
    expect(err(r)).toMatch(/unrelated transaction/);
  });

  it("fails closed when neither identity check can run (no prevout, no record)", () => {
    const r = checkFeeReplacement(makeParsed({ prevoutAddress: undefined }), BigInt(1000), LOCK_ADDR);
    expect(r.ok).toBe(false);
    expect(err(r)).toMatch(/unverified transaction/);
  });

  it("passes with no prevout data when the recorded outpoint matches", () => {
    const r = checkFeeReplacement(
      makeParsed({ prevoutAddress: undefined }),
      BigInt(1000),
      LOCK_ADDR,
      { txid: LOCK_TXID, vout: 0 },
    );
    expect(r.ok).toBe(true);
  });

  it("rejects when the input disagrees with the recorded lock outpoint", () => {
    const r = checkFeeReplacement(makeParsed(), BigInt(1000), LOCK_ADDR, { txid: "dd".repeat(32), vout: 1 });
    expect(r.ok).toBe(false);
    expect(err(r)).toMatch(/recorded lock outpoint/);
  });

  it("accepts when the input matches the recorded lock outpoint", () => {
    const r = checkFeeReplacement(makeParsed(), BigInt(1000), LOCK_ADDR, { txid: LOCK_TXID, vout: 0 });
    expect(r.ok).toBe(true);
  });

  it("rejects a new fee not exceeding the original (BIP-125 rule 3)", () => {
    const r = checkFeeReplacement(makeParsed(), BigInt(500), LOCK_ADDR);
    expect(r.ok).toBe(false);
    expect(err(r)).toMatch(/must exceed the original/);
  });

  it("rejects a fee bump below the rule-4 increment (vsize sats)", () => {
    // vsize 150, oldFee 500 → increment must be ≥ 150; 600 (bump 100) is rejected.
    const r = checkFeeReplacement(makeParsed(), BigInt(600), LOCK_ADDR);
    expect(r.ok).toBe(false);
    expect(err(r)).toMatch(/rule-4 minimum/);
  });

  it("accepts a bump exactly at the rule-4 minimum", () => {
    const r = checkFeeReplacement(makeParsed(), BigInt(650), LOCK_ADDR); // bump 150 == vsize
    expect(r.ok).toBe(true);
  });

  it("computes destination delta and fee rates on a valid replacement", () => {
    const r = ok(checkFeeReplacement(makeParsed(), BigInt(1000), LOCK_ADDR));
    expect(r.ok).toBe(true);
    expect(r.oldFeeSats).toBe(BigInt(500));
    expect(r.newFeeSats).toBe(BigInt(1000));
    expect(r.oldDestinationSats).toBe(BigInt(99_500));
    // 99500 + 500 - 1000 = 99000
    expect(r.newDestinationSats).toBe(BigInt(99_000));
    expect(r.feeRateOldSatVb).toBe("3.33"); // 500/150
    expect(r.feeRateNewSatVb).toBe("6.67"); // 1000/150
    expect(r.destination).toBe(DEST_ADDR);
    expect(r.lockOutpoint).toEqual({ txid: LOCK_TXID, vout: 0 });
  });

  it("guards against a zero vsize (never divides by zero)", () => {
    const r = ok(checkFeeReplacement(makeParsed({ vsize: 0, feeSats: BigInt(0) }), BigInt(2), LOCK_ADDR));
    expect(r.ok).toBe(true);
    expect(r.feeRateNewSatVb).not.toMatch(/Infinity|NaN/);
  });
});
