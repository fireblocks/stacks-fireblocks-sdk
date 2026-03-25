import {
  TokenType,
  TransactionType,
  StackingPools,
} from "../services/types";

describe("TokenType enum", () => {
  it("has correct STX value", () => {
    expect(TokenType.STX).toBe("STX");
  });

  it("has correct sBTC contract name", () => {
    expect(TokenType.sBTC).toBe("sbtc-token");
  });

  it("has correct USDC contract name", () => {
    expect(TokenType.USDCx).toBe("usdcx-token");
  });

  it("has CUSTOM type for custom tokens", () => {
    expect(TokenType.CUSTOM).toBe("custom-token");
  });

  it("contains all expected token types", () => {
    const expectedTokens = ["STX", "sbtc-token", "usdcx-token", "custom-token"];
    const actualTokens = Object.values(TokenType);
    expect(actualTokens).toEqual(expect.arrayContaining(expectedTokens));
    expect(actualTokens.length).toBe(expectedTokens.length);
  });
});

describe("TransactionType enum", () => {
  it("has correct STX value", () => {
    expect(TransactionType.STX).toBe("STX");
  });

  it("has correct FungibleToken value", () => {
    expect(TransactionType.FungibleToken).toBe("Fungible Token");
  });

  it("contains exactly two transaction types", () => {
    const types = Object.values(TransactionType);
    expect(types.length).toBe(2);
  });
});

describe("StackingPools enum", () => {
  it("has correct FAST_POOL value", () => {
    expect(StackingPools.FAST_POOL).toBe("fast-pool");
  });

  it("contains all expected pools", () => {
    const pools = Object.values(StackingPools);
    expect(pools).toContain("fast-pool");
  });
});
