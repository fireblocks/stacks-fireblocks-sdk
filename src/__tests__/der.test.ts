import { encodeDerScalar, toDerSignature } from "../utils/der";

const bytes = (...b: number[]) => new Uint8Array(b);
const scalar = (lead: number, fill = 0x11) => {
  const a = new Uint8Array(32).fill(fill);
  a[0] = lead;
  return a;
};

describe("encodeDerScalar (minimal DER integer)", () => {
  it("prepends 0x00 when the high bit is set", () => {
    const enc = encodeDerScalar(scalar(0x80));
    expect(enc.length).toBe(33);
    expect(enc[0]).toBe(0x00);
    expect(enc[1]).toBe(0x80);
  });

  it("does not prepend when the high bit is clear", () => {
    const enc = encodeDerScalar(scalar(0x7f));
    expect(enc.length).toBe(32);
    expect(enc[0]).toBe(0x7f);
  });

  it("strips a redundant leading zero (high bit of next byte clear)", () => {
    // 0x00 0x7f ... -> 0x7f ... (leading zero removed, no re-add)
    const a = scalar(0x00);
    a[1] = 0x7f;
    const enc = encodeDerScalar(a);
    expect(enc.length).toBe(31);
    expect(enc[0]).toBe(0x7f);
  });

  it("strips a redundant leading zero but re-adds one when next byte has high bit set", () => {
    // 0x00 0x80 ... -> strip to 0x80 ..., then re-prepend 0x00 -> 0x00 0x80 ...
    const a = scalar(0x00);
    a[1] = 0x80;
    const enc = encodeDerScalar(a);
    expect(enc.length).toBe(32);
    expect(enc[0]).toBe(0x00);
    expect(enc[1]).toBe(0x80);
  });

  it("keeps a single byte for an all-zero scalar (never empties)", () => {
    const enc = encodeDerScalar(new Uint8Array(32));
    expect(enc).toEqual(bytes(0x00));
  });
});

describe("toDerSignature", () => {
  it("wraps r and s in a DER SEQUENCE and appends SIGHASH_ALL", () => {
    const r = scalar(0x7f);
    const s = scalar(0x7f);
    const der = toDerSignature(r, s);
    expect(der[0]).toBe(0x30); // SEQUENCE
    expect(der[der.length - 1]).toBe(0x01); // SIGHASH_ALL
    // 0x30 len 0x02 32 <r32> 0x02 32 <s32> 0x01 = 2 + (2+32) + (2+32) + 1 = 71
    expect(der.length).toBe(71);
    expect(der[1]).toBe(0x44); // inner length = 68
    expect(der[2]).toBe(0x02);
    expect(der[3]).toBe(32);
  });

  it("produces the minimal (shorter) encoding for high-bit scalars via 0x00 pads", () => {
    const der = toDerSignature(scalar(0x80), scalar(0x80));
    // each scalar becomes 33 bytes: 0x30 len 0x02 33 <..> 0x02 33 <..> 0x01 = 73
    expect(der.length).toBe(73);
    expect(der[1]).toBe(0x46); // 70
  });
});
