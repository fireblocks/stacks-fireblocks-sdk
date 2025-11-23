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

export const ftDecimals: Record<string, number> = {
  "sbtc-token": 8,
  "aeusdc-token": 8,
};
