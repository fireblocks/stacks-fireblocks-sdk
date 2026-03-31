"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../utils/helpers");
describe("validateAmount", () => {
    it("returns true for positive numbers", () => {
        expect((0, helpers_1.validateAmount)(100)).toBe(true);
        expect((0, helpers_1.validateAmount)(0.1)).toBe(true);
        expect((0, helpers_1.validateAmount)("50")).toBe(true);
        expect((0, helpers_1.validateAmount)("0.001")).toBe(true);
    });
    it("returns false for zero or negative numbers", () => {
        expect((0, helpers_1.validateAmount)(0)).toBe(false);
        expect((0, helpers_1.validateAmount)(-10)).toBe(false);
        expect((0, helpers_1.validateAmount)("-5")).toBe(false);
    });
    it("returns false for invalid strings", () => {
        expect((0, helpers_1.validateAmount)("abc")).toBe(false);
        expect((0, helpers_1.validateAmount)("")).toBe(false);
    });
});
describe("validateAddress", () => {
    // Valid mainnet address
    const validMainnetAddr = "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7";
    // Valid testnet address
    const validTestnetAddr = "ST2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQYAC0RQ";
    it("validates mainnet addresses correctly", () => {
        expect((0, helpers_1.validateAddress)(validMainnetAddr, false)).toBe(true);
    });
    it("validates testnet addresses correctly", () => {
        expect((0, helpers_1.validateAddress)(validTestnetAddr, true)).toBe(true);
    });
    it("rejects mainnet address on testnet", () => {
        expect((0, helpers_1.validateAddress)(validMainnetAddr, true)).toBe(false);
    });
    it("rejects testnet address on mainnet", () => {
        expect((0, helpers_1.validateAddress)(validTestnetAddr, false)).toBe(false);
    });
    it("rejects invalid addresses", () => {
        expect((0, helpers_1.validateAddress)("invalid", false)).toBe(false);
        expect((0, helpers_1.validateAddress)("", false)).toBe(false);
        expect((0, helpers_1.validateAddress)("SP123", false)).toBe(false);
    });
});
describe("isCompressedSecp256k1PubKeyHex", () => {
    it("returns true for valid compressed public keys", () => {
        const validPubKey02 = "02" + "a".repeat(64); // 02 prefix
        const validPubKey03 = "03" + "b".repeat(64); // 03 prefix
        expect((0, helpers_1.isCompressedSecp256k1PubKeyHex)(validPubKey02)).toBe(true);
        expect((0, helpers_1.isCompressedSecp256k1PubKeyHex)(validPubKey03)).toBe(true);
    });
    it("returns false for invalid public keys", () => {
        expect((0, helpers_1.isCompressedSecp256k1PubKeyHex)("04" + "a".repeat(64))).toBe(false); // wrong prefix
        expect((0, helpers_1.isCompressedSecp256k1PubKeyHex)("02" + "a".repeat(63))).toBe(false); // too short
        expect((0, helpers_1.isCompressedSecp256k1PubKeyHex)("02" + "a".repeat(65))).toBe(false); // too long
        expect((0, helpers_1.isCompressedSecp256k1PubKeyHex)("")).toBe(false);
        expect((0, helpers_1.isCompressedSecp256k1PubKeyHex)("invalid")).toBe(false);
    });
});
describe("stxToMicro", () => {
    it("converts whole STX amounts correctly", () => {
        expect((0, helpers_1.stxToMicro)(1)).toBe(BigInt(1000000));
        expect((0, helpers_1.stxToMicro)(100)).toBe(BigInt(100000000));
        expect((0, helpers_1.stxToMicro)("50")).toBe(BigInt(50000000));
    });
    it("converts fractional STX amounts correctly", () => {
        expect((0, helpers_1.stxToMicro)(1.5)).toBe(BigInt(1500000));
        expect((0, helpers_1.stxToMicro)("0.000001")).toBe(BigInt(1));
        expect((0, helpers_1.stxToMicro)("1.123456")).toBe(BigInt(1123456));
    });
    it("handles decimal truncation beyond 6 places", () => {
        expect((0, helpers_1.stxToMicro)("1.1234567")).toBe(BigInt(1123456)); // truncated
    });
    it("throws for invalid amounts", () => {
        expect(() => (0, helpers_1.stxToMicro)(0)).toThrow();
        expect(() => (0, helpers_1.stxToMicro)(-1)).toThrow();
    });
});
describe("microToStx", () => {
    it("converts micro amounts to STX correctly", () => {
        expect((0, helpers_1.microToStx)(BigInt(1000000))).toBe(1);
        expect((0, helpers_1.microToStx)(BigInt(1500000))).toBe(1.5);
        expect((0, helpers_1.microToStx)(BigInt(1))).toBe(0.000001);
    });
    it("accepts number and string inputs", () => {
        expect((0, helpers_1.microToStx)(1000000)).toBe(1);
        expect((0, helpers_1.microToStx)("1000000")).toBe(1);
    });
});
describe("microToToken", () => {
    it("converts micro amounts based on decimals", () => {
        expect((0, helpers_1.microToToken)(BigInt(100000000), 8)).toBe(1); // 8 decimals (like sBTC)
        expect((0, helpers_1.microToToken)(BigInt(1000000), 6)).toBe(1); // 6 decimals (like STX/USDC)
    });
});
describe("concatSignature", () => {
    it("concatenates signature with recovery id 0", () => {
        const sig = "a".repeat(128);
        expect((0, helpers_1.concatSignature)(sig, 0)).toBe("00" + sig);
    });
    it("concatenates signature with recovery id 1", () => {
        const sig = "b".repeat(128);
        expect((0, helpers_1.concatSignature)(sig, 1)).toBe("01" + sig);
    });
});
describe("parseAssetId", () => {
    it("parses asset ID correctly", () => {
        const result = (0, helpers_1.parseAssetId)("SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc::aeusdc");
        expect(result.contractAddress).toBe("SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K");
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
        const result = (0, helpers_1.untilBurnHeightForCycles)(1, mockPoxInfo);
        // P=1000, cycleLen=2100, result = 1000 + 1*2100 - 1 = 3099
        expect(result).toBe(3099);
    });
    it("throws for invalid cycle counts", () => {
        expect(() => (0, helpers_1.untilBurnHeightForCycles)(0, mockPoxInfo)).toThrow();
        expect(() => (0, helpers_1.untilBurnHeightForCycles)(13, mockPoxInfo)).toThrow();
        expect(() => (0, helpers_1.untilBurnHeightForCycles)(1.5, mockPoxInfo)).toThrow();
    });
    it("handles wrapped poxInfo with data property", () => {
        const wrapped = { data: mockPoxInfo };
        expect((0, helpers_1.untilBurnHeightForCycles)(1, wrapped)).toBe(3099);
    });
});
describe("assertResultSuccess", () => {
    it("returns success true for valid txid result", () => {
        const result = (0, helpers_1.assertResultSuccess)({ txid: "0x123" });
        expect(result).toEqual({ success: true });
    });
    it("returns error for missing txid", () => {
        const result = (0, helpers_1.assertResultSuccess)({});
        expect(result.success).toBe(false);
        expect(result).toHaveProperty("error");
    });
    it("returns error for error field present", () => {
        const result = (0, helpers_1.assertResultSuccess)({ txid: "0x123", error: "some error" });
        expect(result.success).toBe(false);
    });
    it("returns error for reason field present", () => {
        const result = (0, helpers_1.assertResultSuccess)({ txid: "0x123", reason: "rejected" });
        expect(result.success).toBe(false);
    });
});
describe("safeStringify", () => {
    it("converts BigInt to string", () => {
        const obj = { amount: BigInt(1000000) };
        const result = (0, helpers_1.safeStringify)(obj);
        expect(result).toContain('"amount": "1000000"');
    });
    it("handles circular references", () => {
        const obj = { a: 1 };
        obj.self = obj;
        const result = (0, helpers_1.safeStringify)(obj);
        expect(result).toContain("[Circular]");
    });
    it("handles nested objects", () => {
        const obj = { nested: { value: BigInt(123) } };
        const result = (0, helpers_1.safeStringify)(obj);
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
        const result = (0, helpers_1.isSafeToSubmit)(poxInfo);
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
        const result = (0, helpers_1.isSafeToSubmit)(poxInfo);
        expect(result.safe).toBe(false);
    });
});
describe("parseClarityErrCode", () => {
    it("extracts error code from (err N) format", () => {
        expect((0, helpers_1.parseClarityErrCode)({ repr: "(err 3)" })).toBe(3);
        expect((0, helpers_1.parseClarityErrCode)({ repr: "(err u3)" })).toBe(3);
        expect((0, helpers_1.parseClarityErrCode)({ repr: "(err 35)" })).toBe(35);
    });
    it("returns null for success results", () => {
        expect((0, helpers_1.parseClarityErrCode)({ repr: "(ok true)" })).toBe(null);
        expect((0, helpers_1.parseClarityErrCode)({ repr: "(ok u100)" })).toBe(null);
    });
    it("returns null for missing or invalid input", () => {
        expect((0, helpers_1.parseClarityErrCode)(undefined)).toBe(null);
        expect((0, helpers_1.parseClarityErrCode)({})).toBe(null);
        expect((0, helpers_1.parseClarityErrCode)({ repr: null })).toBe(null);
    });
});
