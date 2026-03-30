import { getTokenInfo, parseAssetId } from "../utils/helpers";
import { TokenType } from "../services/types";
import { ftInfo } from "../utils/constants";

describe("Balance Matching Logic", () => {
  describe("getTokenInfo", () => {
    it("returns correct token info for sBTC on mainnet", () => {
      const tokenInfo = getTokenInfo(TokenType.sBTC, "mainnet");

      expect(tokenInfo).toBeDefined();
      expect(tokenInfo?.contractName).toBe("sbtc-token");
      expect(tokenInfo?.contractAddress).toBe("SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4");
      expect(tokenInfo?.decimals).toBe(8);
    });

    it("returns correct token info for sBTC on testnet", () => {
      const tokenInfo = getTokenInfo(TokenType.sBTC, "testnet");

      expect(tokenInfo).toBeDefined();
      expect(tokenInfo?.contractName).toBe("sbtc-token");
      expect(tokenInfo?.contractAddress).toBe("ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT");
    });

    it("returns correct token info for USDCx on mainnet", () => {
      const tokenInfo = getTokenInfo(TokenType.USDCx, "mainnet");

      expect(tokenInfo).toBeDefined();
      expect(tokenInfo?.contractName).toBe("usdcx");
      expect(tokenInfo?.contractAddress).toBe("SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE");
      expect(tokenInfo?.decimals).toBe(6);
    });

    it("returns correct token info for USDCx on testnet", () => {
      const tokenInfo = getTokenInfo(TokenType.USDCx, "testnet");

      expect(tokenInfo).toBeDefined();
      expect(tokenInfo?.contractName).toBe("usdcx");
    });

    it("returns undefined for CUSTOM token type", () => {
      const tokenInfo = getTokenInfo(TokenType.CUSTOM, "mainnet");
      expect(tokenInfo).toBeUndefined();
    });

    it("returns undefined for STX (native token)", () => {
      const tokenInfo = getTokenInfo(TokenType.STX, "mainnet");
      expect(tokenInfo).toBeUndefined();
    });
  });

  describe("parseAssetId", () => {
    it("correctly parses sBTC asset ID", () => {
      const assetId = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token";
      const result = parseAssetId(assetId);

      expect(result.contractAddress).toBe("SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4");
      expect(result.contractName).toBe("sbtc-token");
      expect(result.tokenName).toBe("sbtc-token");
    });

    it("correctly parses USDCx asset ID", () => {
      const assetId = "SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx::usdcx";
      const result = parseAssetId(assetId);

      expect(result.contractAddress).toBe("SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE");
      expect(result.contractName).toBe("usdcx");
      expect(result.tokenName).toBe("usdcx");
    });

    it("handles asset IDs where tokenName differs from contractName", () => {
      // Some tokens have different token name vs contract name
      const assetId = "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-alex::alex";
      const result = parseAssetId(assetId);

      expect(result.contractAddress).toBe("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9");
      expect(result.contractName).toBe("token-alex");
      expect(result.tokenName).toBe("alex");
    });
  });

  describe("Balance matching by contractName", () => {
    // Simulates the balance lookup logic in StacksSDK.checkParamsAndAdjustAmount
    const mockBalanceResponse = [
      {
        token: "sbtc-token",
        tokenContractName: "sbtc-token",
        tokenContractAddress: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4",
        balance: 100000000,
      },
      {
        token: "usdcx",
        tokenContractName: "usdcx",
        tokenContractAddress: "SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE",
        balance: 50000000,
      },
    ];

    it("matches sBTC balance by contractName", () => {
      const tokenInfo = getTokenInfo(TokenType.sBTC, "mainnet");

      const matchedBalance = mockBalanceResponse.find(
        (b) => tokenInfo && b.tokenContractName === tokenInfo.contractName
      );

      expect(matchedBalance).toBeDefined();
      expect(matchedBalance?.balance).toBe(100000000);
    });

    it("matches USDCx balance by contractName", () => {
      const tokenInfo = getTokenInfo(TokenType.USDCx, "mainnet");

      const matchedBalance = mockBalanceResponse.find(
        (b) => tokenInfo && b.tokenContractName === tokenInfo.contractName
      );

      expect(matchedBalance).toBeDefined();
      expect(matchedBalance?.balance).toBe(50000000);
    });

    it("returns undefined for non-existent token", () => {
      // Simulate a token that doesn't exist in the balance response
      const tokenInfo = { contractName: "non-existent-token" };

      const matchedBalance = mockBalanceResponse.find(
        (b) => b.tokenContractName === tokenInfo.contractName
      );

      expect(matchedBalance).toBeUndefined();
    });

    it("matches custom token by contractAddress", () => {
      const customTokenContractAddress = "SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE";

      const matchedBalance = mockBalanceResponse.find(
        (b) => b.tokenContractAddress === customTokenContractAddress
      );

      expect(matchedBalance).toBeDefined();
      expect(matchedBalance?.tokenContractName).toBe("usdcx");
    });
  });

  describe("TokenType enum vs parsed tokenName", () => {
    // This test documents the previous bug and verifies the fix
    it("TokenType.USDCx does NOT equal parsed tokenName (this was the bug)", () => {
      const assetId = "SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx::usdcx";
      const parsed = parseAssetId(assetId);

      // TokenType.USDCx = "usdcx-token" but parsed.tokenName = "usdcx"
      // This mismatch caused the balance check to fail
      expect(TokenType.USDCx).toBe("usdcx-token");
      expect(parsed.tokenName).toBe("usdcx");
      expect(TokenType.USDCx).not.toBe(parsed.tokenName);
    });

    it("contractName from tokenInfo matches parsed contractName (the fix)", () => {
      const assetId = "SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx::usdcx";
      const parsed = parseAssetId(assetId);
      const tokenInfo = getTokenInfo(TokenType.USDCx, "mainnet");

      // The fix: compare contractName instead of tokenName
      expect(tokenInfo?.contractName).toBe(parsed.contractName);
      expect(tokenInfo?.contractName).toBe("usdcx");
    });

    it("sBTC contractName matches correctly", () => {
      const assetId = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token";
      const parsed = parseAssetId(assetId);
      const tokenInfo = getTokenInfo(TokenType.sBTC, "mainnet");

      expect(tokenInfo?.contractName).toBe(parsed.contractName);
      expect(tokenInfo?.contractName).toBe("sbtc-token");
    });
  });
});
