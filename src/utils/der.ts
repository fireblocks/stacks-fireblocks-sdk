/**
 * Minimal DER encoding for Bitcoin ECDSA signatures (BIP-66).
 *
 * A DER integer must be minimally encoded: no redundant leading 0x00 bytes,
 * except a single 0x00 prepended when the high bit of the leading byte is set
 * (otherwise the value would be read as negative). Encoding a fixed-width 32-byte
 * scalar without stripping leading zeros produces a non-minimal integer roughly
 * one signature in 256 per scalar, which Bitcoin policy/consensus can reject.
 */

/** Encodes a big-endian scalar as a minimal DER integer body. */
export function encodeDerScalar(bytes: Uint8Array): Uint8Array {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0x00) start++;
  const trimmed = bytes.slice(start);
  return trimmed[0] >= 0x80 ? new Uint8Array([0, ...trimmed]) : trimmed;
}

/**
 * Assembles a DER-encoded ECDSA signature from big-endian r and s, appending the
 * single SIGHASH byte (default SIGHASH_ALL = 0x01).
 */
export function toDerSignature(
  r: Uint8Array,
  s: Uint8Array,
  sighashType = 0x01,
): Uint8Array {
  const rEnc = encodeDerScalar(r);
  const sEnc = encodeDerScalar(s);
  const total = 4 + rEnc.length + sEnc.length;
  const der = new Uint8Array(total + 3); // +2 outer tag/len + 1 SIGHASH byte
  let i = 0;
  der[i++] = 0x30;
  der[i++] = total;
  der[i++] = 0x02;
  der[i++] = rEnc.length;
  der.set(rEnc, i);
  i += rEnc.length;
  der[i++] = 0x02;
  der[i++] = sEnc.length;
  der.set(sEnc, i);
  i += sEnc.length;
  der[i] = sighashType;
  return der;
}
