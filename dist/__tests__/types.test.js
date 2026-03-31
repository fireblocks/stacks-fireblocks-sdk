"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../services/types");
describe("TokenType enum", () => {
    it("has correct STX value", () => {
        expect(types_1.TokenType.STX).toBe("STX");
    });
    it("has correct sBTC contract name", () => {
        expect(types_1.TokenType.sBTC).toBe("sbtc-token");
    });
    it("has correct USDC contract name", () => {
        expect(types_1.TokenType.USDCx).toBe("usdcx-token");
    });
    it("has CUSTOM type for custom tokens", () => {
        expect(types_1.TokenType.CUSTOM).toBe("custom-token");
    });
    it("contains all expected token types", () => {
        const expectedTokens = ["STX", "sbtc-token", "usdcx-token", "custom-token"];
        const actualTokens = Object.values(types_1.TokenType);
        expect(actualTokens).toEqual(expect.arrayContaining(expectedTokens));
        expect(actualTokens.length).toBe(expectedTokens.length);
    });
});
describe("TransactionType enum", () => {
    it("has correct STX value", () => {
        expect(types_1.TransactionType.STX).toBe("STX");
    });
    it("has correct FungibleToken value", () => {
        expect(types_1.TransactionType.FungibleToken).toBe("Fungible Token");
    });
    it("contains exactly two transaction types", () => {
        const types = Object.values(types_1.TransactionType);
        expect(types.length).toBe(2);
    });
});
describe("StackingPools enum", () => {
    it("has correct FAST_POOL value", () => {
        expect(types_1.StackingPools.FAST_POOL).toBe("fast-pool");
    });
    it("contains all expected pools", () => {
        const pools = Object.values(types_1.StackingPools);
        expect(pools).toContain("fast-pool");
    });
});
