import {
  validateAmount,
  validateAddress,
  isCompressedSecp256k1PubKeyHex,
  stxToMicro,
  microToStx,
  microToToken,
  concatSignature,
  concatSignerSignature,
  parseAssetId,
  untilBurnHeightForCycles,
  assertResultSuccess,
  safeStringify,
  isSafeToSubmit,
  parseClarityErrCode,
} from "../utils/helpers";

describe("validateAmount", () => {
  it("returns true for positive numbers", () => {
    expect(validateAmount(100)).toBe(true);
    expect(validateAmount(0.1)).toBe(true);
    expect(validateAmount("50")).toBe(true);
    expect(validateAmount("0.001")).toBe(true);
  });

  it("returns false for zero or negative numbers", () => {
    expect(validateAmount(0)).toBe(false);
    expect(validateAmount(-10)).toBe(false);
    expect(validateAmount("-5")).toBe(false);
  });

  it("returns false for invalid strings", () => {
    expect(validateAmount("abc")).toBe(false);
    expect(validateAmount("")).toBe(false);
  });
});

describe("validateAddress", () => {
  // Valid mainnet address
  const validMainnetAddr = "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7";
  // Valid testnet address
  const validTestnetAddr = "ST2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQYAC0RQ";

  it("validates mainnet addresses correctly", () => {
    expect(validateAddress(validMainnetAddr, false)).toBe(true);
  });

  it("validates testnet addresses correctly", () => {
    expect(validateAddress(validTestnetAddr, true)).toBe(true);
  });

  it("rejects mainnet address on testnet", () => {
    expect(validateAddress(validMainnetAddr, true)).toBe(false);
  });

  it("rejects testnet address on mainnet", () => {
    expect(validateAddress(validTestnetAddr, false)).toBe(false);
  });

  it("rejects invalid addresses", () => {
    expect(validateAddress("invalid", false)).toBe(false);
    expect(validateAddress("", false)).toBe(false);
    expect(validateAddress("SP123", false)).toBe(false);
  });
});

describe("isCompressedSecp256k1PubKeyHex", () => {
  it("returns true for valid compressed public keys", () => {
    const validPubKey02 =
      "02" + "a".repeat(64); // 02 prefix
    const validPubKey03 =
      "03" + "b".repeat(64); // 03 prefix
    expect(isCompressedSecp256k1PubKeyHex(validPubKey02)).toBe(true);
    expect(isCompressedSecp256k1PubKeyHex(validPubKey03)).toBe(true);
  });

  it("returns false for invalid public keys", () => {
    expect(isCompressedSecp256k1PubKeyHex("04" + "a".repeat(64))).toBe(false); // wrong prefix
    expect(isCompressedSecp256k1PubKeyHex("02" + "a".repeat(63))).toBe(false); // too short
    expect(isCompressedSecp256k1PubKeyHex("02" + "a".repeat(65))).toBe(false); // too long
    expect(isCompressedSecp256k1PubKeyHex("")).toBe(false);
    expect(isCompressedSecp256k1PubKeyHex("invalid")).toBe(false);
  });
});

describe("stxToMicro", () => {
  it("converts whole STX amounts correctly", () => {
    expect(stxToMicro(1)).toBe(BigInt(1000000));
    expect(stxToMicro(100)).toBe(BigInt(100000000));
    expect(stxToMicro("50")).toBe(BigInt(50000000));
  });

  it("converts fractional STX amounts correctly", () => {
    expect(stxToMicro(1.5)).toBe(BigInt(1500000));
    expect(stxToMicro("0.000001")).toBe(BigInt(1));
    expect(stxToMicro("1.123456")).toBe(BigInt(1123456));
  });

  it("handles decimal truncation beyond 6 places", () => {
    expect(stxToMicro("1.1234567")).toBe(BigInt(1123456)); // truncated
  });

  it("throws for invalid amounts", () => {
    expect(() => stxToMicro(0)).toThrow();
    expect(() => stxToMicro(-1)).toThrow();
  });
});

describe("microToStx", () => {
  it("converts micro amounts to STX correctly", () => {
    expect(microToStx(BigInt(1000000))).toBe(1);
    expect(microToStx(BigInt(1500000))).toBe(1.5);
    expect(microToStx(BigInt(1))).toBe(0.000001);
  });

  it("accepts number and string inputs", () => {
    expect(microToStx(1000000)).toBe(1);
    expect(microToStx("1000000")).toBe(1);
  });
});

describe("microToToken", () => {
  it("converts micro amounts based on decimals", () => {
    expect(microToToken(BigInt(100000000), 8)).toBe(1); // 8 decimals (like sBTC)
    expect(microToToken(BigInt(1000000), 6)).toBe(1); // 6 decimals (like STX/USDC)
  });
});

describe("concatSignature", () => {
  it("concatenates signature with recovery id 0", () => {
    const sig = "a".repeat(128);
    expect(concatSignature(sig, 0)).toBe("00" + sig);
  });

  it("concatenates signature with recovery id 1", () => {
    const sig = "b".repeat(128);
    expect(concatSignature(sig, 1)).toBe("01" + sig);
  });
});

describe("concatSignerSignature", () => {
  it("appends v at the end for stacking signatures", () => {
    const sig = "c".repeat(128);
    expect(concatSignerSignature(sig, 0)).toBe(sig + "00");
    expect(concatSignerSignature(sig, 1)).toBe(sig + "01");
  });

  it("handles v values >= 27 (EIP-155 style)", () => {
    const sig = "d".repeat(128);
    expect(concatSignerSignature(sig, 27)).toBe(sig + "00");
    expect(concatSignerSignature(sig, 28)).toBe(sig + "01");
  });
});

describe("parseAssetId", () => {
  it("parses asset ID correctly", () => {
    const result = parseAssetId(
      "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc::aeusdc"
    );
    expect(result.contractAddress).toBe(
      "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K"
    );
    expect(result.contractName).toBe("token-aeusdc");
    expect(result.tokenName).toBe("aeusdc");
  });
});

describe("untilBurnHeightForCycles", () => {
  const mockPoxInfo = {
    prepare_phase_block_length: 100,
    reward_phase_block_length: 2000,
    next_cycle: {
      prepare_phase_start_block_height: 1000,
      reward_phase_start_block_height: 1100,
    },
    current_burnchain_block_height: 500,
    first_burnchain_block_height: 0,
  };

  it("calculates burn height for given cycles", () => {
    const result = untilBurnHeightForCycles(1, mockPoxInfo);
    // P=1000, cycleLen=2100, result = 1000 + 1*2100 - 1 = 3099
    expect(result).toBe(3099);
  });

  it("throws for invalid cycle counts", () => {
    expect(() => untilBurnHeightForCycles(0, mockPoxInfo)).toThrow();
    expect(() => untilBurnHeightForCycles(13, mockPoxInfo)).toThrow();
    expect(() => untilBurnHeightForCycles(1.5, mockPoxInfo)).toThrow();
  });

  it("handles wrapped poxInfo with data property", () => {
    const wrapped = { data: mockPoxInfo };
    expect(untilBurnHeightForCycles(1, wrapped)).toBe(3099);
  });
});

describe("assertResultSuccess", () => {
  it("returns success true for valid txid result", () => {
    const result = assertResultSuccess({ txid: "0x123" });
    expect(result).toEqual({ success: true });
  });

  it("returns error for missing txid", () => {
    const result = assertResultSuccess({});
    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error");
  });

  it("returns error for error field present", () => {
    const result = assertResultSuccess({ txid: "0x123", error: "some error" });
    expect(result.success).toBe(false);
  });

  it("returns error for reason field present", () => {
    const result = assertResultSuccess({ txid: "0x123", reason: "rejected" });
    expect(result.success).toBe(false);
  });
});

describe("safeStringify", () => {
  it("converts BigInt to string", () => {
    const obj = { amount: BigInt(1000000) };
    const result = safeStringify(obj);
    expect(result).toContain('"amount": "1000000"');
  });

  it("handles circular references", () => {
    const obj: any = { a: 1 };
    obj.self = obj;
    const result = safeStringify(obj);
    expect(result).toContain("[Circular]");
  });

  it("handles nested objects", () => {
    const obj = { nested: { value: BigInt(123) } };
    const result = safeStringify(obj);
    expect(result).toContain('"value": "123"');
  });
});

describe("isSafeToSubmit", () => {
  it("returns safe when far from prepare phase", () => {
    const poxInfo = {
      prepare_phase_block_length: 100,
      reward_phase_block_length: 2000,
      next_cycle: {
        prepare_phase_start_block_height: 1000,
        reward_phase_start_block_height: 1100,
      },
      current_burnchain_block_height: 100, // early in cycle
      first_burnchain_block_height: 0,
    };
    const result = isSafeToSubmit(poxInfo);
    expect(result.safe).toBe(true);
  });

  it("returns unsafe when close to prepare phase", () => {
    const poxInfo = {
      prepare_phase_block_length: 100,
      reward_phase_block_length: 2000,
      next_cycle: {
        prepare_phase_start_block_height: 1000,
        reward_phase_start_block_height: 1100,
      },
      current_burnchain_block_height: 1995, // close to boundary
      first_burnchain_block_height: 0,
    };
    const result = isSafeToSubmit(poxInfo);
    expect(result.safe).toBe(false);
  });
});

describe("parseClarityErrCode", () => {
  it("extracts error code from (err N) format", () => {
    expect(parseClarityErrCode({ repr: "(err 3)" })).toBe(3);
    expect(parseClarityErrCode({ repr: "(err u3)" })).toBe(3);
    expect(parseClarityErrCode({ repr: "(err 35)" })).toBe(35);
  });

  it("returns null for success results", () => {
    expect(parseClarityErrCode({ repr: "(ok true)" })).toBe(null);
    expect(parseClarityErrCode({ repr: "(ok u100)" })).toBe(null);
  });

  it("returns null for missing or invalid input", () => {
    expect(parseClarityErrCode(undefined)).toBe(null);
    expect(parseClarityErrCode({})).toBe(null);
    expect(parseClarityErrCode({ repr: null })).toBe(null);
  });
});
