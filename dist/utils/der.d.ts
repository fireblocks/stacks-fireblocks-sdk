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
export declare function encodeDerScalar(bytes: Uint8Array): Uint8Array;
/**
 * Assembles a DER-encoded ECDSA signature from big-endian r and s, appending the
 * single SIGHASH byte (default SIGHASH_ALL = 0x01).
 */
export declare function toDerSignature(r: Uint8Array, s: Uint8Array, sighashType?: number): Uint8Array;
