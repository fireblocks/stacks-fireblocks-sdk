import { TokenInfo, TokenType } from "../services/types";

export const derivationPath = {
  purpose: 44,
  coinTypeTestnet: 1,
  coinTypeMainnet: 0,
  change: 0,
  addressIndex: 0,
};

export const api_constants = {
  stacks_mainnet_rpc: "https://api.hiro.so",
  stacks_testnet_rpc: "https://api.testnet.hiro.so",
};

export const stacks_info = {
  stxDecimals: 6,
  stxSymbol: "STX",
};

export const pagination_defaults = {
  page: 0,
  limit: 50,
};

export const ftInfo: Partial<Record<TokenType, TokenInfo>> = {
  [TokenType.sBTC]: {
    contractAddress: "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT",
    contractName: "sbtc-token",
    decimals: 8,
  },

  [TokenType.USDC]: {
    contractAddress: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K",
    contractName: "token-aeusdc",
    decimals: 6,
  },

  [TokenType.USDH]: {
    contractAddress: "SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG",
    contractName: "usdh-token-v1",
    decimals: 8,
  },
};

export const ft: Record<string, number> = {
  "sbtc-token": 8,
  "aeusdc-token": 8,
};
