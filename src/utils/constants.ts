import {
  PoolInfo,
  StackingPools,
  TokenInfo,
  TokenType,
} from "../services/types";

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
  stacking: {
    pool: {
      minLockCycles: 1,
      maxLockCycles: 12,
    },
    solo: {
      safetyBlocks: 10,
    },
  },
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

export const poolInfo: Partial<Record<StackingPools, PoolInfo>> = {
  [StackingPools.FAST_POOL]: {
    poolAddress: "SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP",
    poolContractName: "pox4-fast-pool-v3",
  },
};

export const ft: Record<string, number> = {
  "sbtc-token": 8,
  "aeusdc-token": 8,
};

export const poxInfo = {
  testnet: {
    contractAddress: "ST000000000000000000002AMW42H",
    contractName: "pox-4",
  },
  mainnet: {
    contractAddress: "SP000000000000000000002Q6VF78",
    contractName: "pox-4",
  },
};

export const POX4_ERRORS: Record<number, { name: string; message: string }> = {
  1: {
    name: "ERR_STACKING_INSUFFICIENT_FUNDS",
    message: "Insufficient STX balance to stack the requested amount.",
  },
  2: {
    name: "ERR_STACKING_INVALID_LOCK_PERIOD",
    message: "Invalid lock period. Must be between 1 and 12 cycles.",
  },
  3: {
    name: "ERR_STACKING_ALREADY_STACKED",
    message:
      "This address is already stacking. Use stack-increase or stack-extend to modify your existing stake, or wait until your current lock period ends.",
  },
  4: {
    name: "ERR_STACKING_NO_SUCH_PRINCIPAL",
    message: "No stacking record found for this address.",
  },
  5: {
    name: "ERR_STACKING_EXPIRED",
    message: "The stacking authorization has expired.",
  },
  6: {
    name: "ERR_STACKING_STX_LOCKED",
    message: "STX are already locked and cannot be re-locked.",
  },
  9: {
    name: "ERR_STACKING_PERMISSION_DENIED",
    message:
      "Permission denied. You don't have authorization to perform this stacking operation.",
  },
  11: {
    name: "ERR_STACKING_THRESHOLD_NOT_MET",
    message:
      "The amount you're trying to stack is below the minimum threshold for this cycle.",
  },
  12: {
    name: "ERR_STACKING_POX_ADDRESS_IN_USE",
    message: "This PoX address is already in use with a different signer key.",
  },
  13: {
    name: "ERR_STACKING_INVALID_POX_ADDRESS",
    message: "Invalid Bitcoin reward address format.",
  },
  19: {
    name: "ERR_STACKING_IS_DELEGATED",
    message:
      "This address has delegated its stacking rights to a pool operator.",
  },
  20: {
    name: "ERR_DELEGATION_EXPIRES_DURING_LOCK",
    message: "The delegation would expire before the lock period ends.",
  },
  21: {
    name: "ERR_DELEGATION_TOO_MUCH_LOCKED",
    message: "Trying to lock more STX than the delegator has authorized.",
  },
  22: {
    name: "ERR_DELEGATION_POX_ADDR_REQUIRED",
    message: "A PoX address must be specified for this delegation operation.",
  },
  23: {
    name: "ERR_INVALID_START_BURN_HEIGHT",
    message:
      "Invalid start burn height. The cycle may have already started or the timing is incorrect.",
  },
  24: {
    name: "ERR_NOT_ALLOWED",
    message: "This operation is not allowed.",
  },
  25: {
    name: "ERR_STACKING_ALREADY_DELEGATED",
    message: "This address has already delegated to a pool.",
  },
  26: {
    name: "ERR_DELEGATION_ALREADY_REVOKED",
    message: "The delegation has already been revoked.",
  },
  27: {
    name: "ERR_STACKING_ALREADY_REJECTED",
    message: "This stacking operation was already rejected.",
  },
  28: {
    name: "ERR_STACKING_INVALID_AMOUNT",
    message: "Invalid stacking amount.",
  },
  29: {
    name: "ERR_NOT_CURRENT_STACKER",
    message: "You are not currently stacking.",
  },
  30: {
    name: "ERR_STACK_EXTEND_NOT_LOCKED",
    message: "Cannot extend: your STX are not currently locked.",
  },
  31: {
    name: "ERR_STACK_INCREASE_NOT_LOCKED",
    message: "Cannot increase: your STX are not currently locked.",
  },
  32: {
    name: "ERR_DELEGATION_NO_REWARD_SLOT",
    message: "No reward slot available for this delegation.",
  },
  33: {
    name: "ERR_DELEGATION_WRONG_REWARD_SLOT",
    message: "Wrong reward slot specified for this delegation.",
  },
  34: {
    name: "ERR_STACKING_UNREACHABLE",
    message: "An unreachable code path was hit (internal error).",
  },
  35: {
    name: "ERR_INVALID_SIGNATURE_PUBKEY",
    message:
      "The signer signature does not match the provided public key, or signature parameters don't match the transaction.",
  },
  36: {
    name: "ERR_INVALID_SIGNATURE_RECOVER",
    message:
      "Failed to recover the public key from the signature. The signature format may be incorrect.",
  },
  37: {
    name: "ERR_INVALID_REWARD_CYCLE",
    message: "Invalid reward cycle specified.",
  },
  38: {
    name: "ERR_SIGNER_AUTH_AMOUNT_TOO_HIGH",
    message:
      "The stacking amount exceeds the maximum amount authorized by the signer signature.",
  },
  39: {
    name: "ERR_SIGNER_AUTH_USED",
    message:
      "This signer authorization has already been used and cannot be reused.",
  },
  40: {
    name: "ERR_INVALID_INCREASE",
    message: "Invalid stack increase operation.",
  },
  254: {
    name: "ERR_STACKING_CORRUPTED_STATE",
    message: "The stacking state is corrupted (internal error).",
  },
  255: {
    name: "ERR_STACKING_UNREACHABLE",
    message: "An unreachable code path was hit (internal error).",
  },
};
