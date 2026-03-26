import {
  derivationPath,
  api_constants,
  stacks_info,
  ftInfo,
  poolInfo,
  poxInfo,
  POX4_ERRORS,
  pagination_defaults,
} from "../utils/constants";
import { TokenType, StackingPools, TokenInfo } from "../services/types";

describe("derivationPath", () => {
  it("has correct BIP-44 purpose", () => {
    expect(derivationPath.purpose).toBe(44);
  });

  it("has correct coin types for mainnet and testnet", () => {
    expect(derivationPath.coinTypeMainnet).toBe(0); // Bitcoin mainnet
    expect(derivationPath.coinTypeTestnet).toBe(1); // Testnet
  });

  it("has correct change and address index", () => {
    expect(derivationPath.change).toBe(0);
    expect(derivationPath.addressIndex).toBe(0);
  });
});

describe("api_constants", () => {
  it("has valid mainnet RPC URL", () => {
    expect(api_constants.stacks_mainnet_rpc).toBe("https://api.hiro.so");
    expect(api_constants.stacks_mainnet_rpc).toMatch(/^https:\/\//);
  });

  it("has valid testnet RPC URL", () => {
    expect(api_constants.stacks_testnet_rpc).toBe("https://api.testnet.hiro.so");
    expect(api_constants.stacks_testnet_rpc).toMatch(/^https:\/\//);
  });
});

describe("stacks_info", () => {
  it("has correct STX decimals", () => {
    expect(stacks_info.stxDecimals).toBe(6);
  });

  it("has correct STX symbol", () => {
    expect(stacks_info.stxSymbol).toBe("STX");
  });

  it("has valid stacking configuration", () => {
    expect(stacks_info.stacking.pool.minLockCycles).toBe(1);
    expect(stacks_info.stacking.pool.maxLockCycles).toBe(12);
    expect(stacks_info.stacking.solo.safetyBlocks).toBeGreaterThan(0);
  });
});

describe("pagination_defaults", () => {
  it("has sensible defaults", () => {
    expect(pagination_defaults.page).toBe(0);
    expect(pagination_defaults.limit).toBeGreaterThan(0);
    expect(pagination_defaults.limit).toBeLessThanOrEqual(100);
  });
});

describe("ftInfo", () => {
  it("has sBTC mainnet token info with correct structure", () => {
    const sbtcMainnet = ftInfo[TokenType.sBTC]?.mainnet;
    expect(sbtcMainnet).toBeDefined();
    expect(sbtcMainnet!.contractAddress).toMatch(/^S[PM]/);
    expect(sbtcMainnet!.contractName).toBe("sbtc-token");
    expect(sbtcMainnet!.decimals).toBe(8);
  });

  it("has sBTC testnet token info with correct structure", () => {
    const sbtcTestnet = ftInfo[TokenType.sBTC]?.testnet;
    expect(sbtcTestnet).toBeDefined();
    expect(sbtcTestnet!.contractAddress).toMatch(/^ST/);
    expect(sbtcTestnet!.contractName).toBe("sbtc-token");
    expect(sbtcTestnet!.decimals).toBe(8);
  });

  it("has USDCx mainnet token info with correct structure", () => {
    const usdcxMainnet = ftInfo[TokenType.USDCx]?.mainnet;
    expect(usdcxMainnet).toBeDefined();
    expect(usdcxMainnet!.contractAddress).toMatch(/^SP/);
    expect(usdcxMainnet!.contractName).toBe("usdcx");
    expect(usdcxMainnet!.decimals).toBe(6);
  });

  it("has USDCx testnet token info with correct structure", () => {
    const usdcxTestnet = ftInfo[TokenType.USDCx]?.testnet;
    expect(usdcxTestnet).toBeDefined();
    expect(usdcxTestnet!.contractAddress).toMatch(/^ST/);
    expect(usdcxTestnet!.contractName).toBe("usdcx");
    expect(usdcxTestnet!.decimals).toBe(6);
  });

  it("all tokens have required fields for both networks", () => {
    Object.values(ftInfo).forEach((networkInfo) => {
      if (!networkInfo) return;
      const networks: Array<"mainnet" | "testnet"> = ["mainnet", "testnet"];
      networks.forEach((network) => {
        const tokenInfo: TokenInfo = networkInfo[network];
        expect(tokenInfo).toHaveProperty("contractAddress");
        expect(tokenInfo).toHaveProperty("contractName");
        expect(tokenInfo).toHaveProperty("decimals");
        expect(typeof tokenInfo.decimals).toBe("number");
        expect(tokenInfo.decimals).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

describe("poolInfo", () => {
  it("has FAST_POOL info with correct structure", () => {
    const fastPool = poolInfo[StackingPools.FAST_POOL];
    expect(fastPool).toBeDefined();
    expect(fastPool!.poolAddress).toMatch(/^S[PT][A-Z0-9]+$/);
    expect(fastPool!.poolContractName).toBe("pox4-fast-pool-v3");
  });
});

describe("poxInfo", () => {
  it("has mainnet PoX-4 contract info", () => {
    expect(poxInfo.mainnet.contractAddress).toBe("SP000000000000000000002Q6VF78");
    expect(poxInfo.mainnet.contractName).toBe("pox-4");
  });

  it("has testnet PoX-4 contract info", () => {
    expect(poxInfo.testnet.contractAddress).toBe("ST000000000000000000002AMW42H");
    expect(poxInfo.testnet.contractName).toBe("pox-4");
  });

  it("mainnet address starts with SP", () => {
    expect(poxInfo.mainnet.contractAddress).toMatch(/^SP/);
  });

  it("testnet address starts with ST", () => {
    expect(poxInfo.testnet.contractAddress).toMatch(/^ST/);
  });
});

describe("POX4_ERRORS", () => {
  it("has error definitions with name and message", () => {
    Object.entries(POX4_ERRORS).forEach(([code, error]) => {
      expect(typeof Number(code)).toBe("number");
      expect(error).toHaveProperty("name");
      expect(error).toHaveProperty("message");
      expect(typeof error.name).toBe("string");
      expect(typeof error.message).toBe("string");
      expect(error.name.length).toBeGreaterThan(0);
      expect(error.message.length).toBeGreaterThan(0);
    });
  });

  it("has common PoX error codes", () => {
    // These are well-known PoX-4 error codes
    expect(POX4_ERRORS[1]).toBeDefined(); // ERR_STACKING_INSUFFICIENT_FUNDS
    expect(POX4_ERRORS[3]).toBeDefined(); // ERR_STACKING_ALREADY_STACKED
    expect(POX4_ERRORS[11]).toBeDefined(); // ERR_STACKING_THRESHOLD_NOT_MET
    expect(POX4_ERRORS[35]).toBeDefined(); // ERR_INVALID_SIGNATURE_PUBKEY
  });

  it("error names follow ERR_ convention", () => {
    Object.values(POX4_ERRORS).forEach((error) => {
      expect(error.name).toMatch(/^ERR_/);
    });
  });
});
