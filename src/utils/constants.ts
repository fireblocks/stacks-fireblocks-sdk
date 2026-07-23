import {
  PoolInfo,
  StackingPools,
  TokenInfo,
  TokenType,
  Network,
} from "../services/types";

export const derivationPath = {
  purpose: 44,
  coinTypeTestnet: 1,
  coinTypeMainnet: 0,
  change: 0,
  addressIndex: 0,
};

export const helperConstants = {
  vaultIdForReadOnlyActions: "0", // Use a dummy vault ID for read-only actions that don't require a specific vault account/blockchain address
  stacks_api_page_size: 50, // Hard maximum per single Stacks API request
  stacks_api_max_limit: 200, // Maximum limit accepted from callers; service paginates internally when limit > stacks_api_page_size
}

// Minimum fee multiplier for replace-by-fee (RBF) transactions.
// The new fee must be at least this multiple of the original fee.
// Applied only on the lookup path (when the original tx is visible to the indexer).
export const RBF_MIN_FEE_MULTIPLIER = 1.25;

// Maximum fee accepted by the SDK in STX. Guards against typos (e.g. 100 instead of 0.001).
export const MAX_FEE_STX = 10;
export const DEFAULT_POX_FEE_USTX = BigInt(10000);

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

export const ftInfo: Partial<Record<TokenType, Record<Network, TokenInfo>>> = {
   [TokenType.sBTC]: {
    mainnet: {
      contractAddress: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4",
      contractName: "sbtc-token",
      assetName: "sbtc-token",
      decimals: 8,
    },
    testnet: {
      contractAddress: "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT",
      contractName: "sbtc-token",
      assetName: "sbtc-token",
      decimals: 8,
    },
  },
  [TokenType.USDCx]: {
    mainnet: {
      contractAddress: "SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE",
      contractName: "usdcx",
      assetName: "usdcx-token",
      decimals: 6,
    },
    testnet: {
      contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      contractName: "usdcx",
      assetName: "usdcx-token",
      decimals: 6,
    },
  },
};

export const poolInfo: Partial<Record<StackingPools, PoolInfo>> = {
  [StackingPools.FAST_POOL]: {
    poolAddress: "SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP",
    poolContractName: "pox4-fast-pool-v3",
  },
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
  18: {
    name: "ERR_STACKING_INVALID_AMOUNT",
    message: "Invalid stacking amount. Amount must be greater than zero.",
  },
  19: {
    name: "ERR_NOT_ALLOWED",
    message: "This operation is not allowed.",
  },
  20: {
    name: "ERR_STACKING_ALREADY_DELEGATED",
    message: "This address has already delegated to a pool.",
  },
  21: {
    name: "ERR_DELEGATION_EXPIRES_DURING_LOCK",
    message: "The delegation would expire before the lock period ends.",
  },
  22: {
    name: "ERR_DELEGATION_TOO_MUCH_LOCKED",
    message: "Trying to lock more STX than the delegator has authorized.",
  },
  23: {
    name: "ERR_DELEGATION_POX_ADDR_REQUIRED",
    message: "A PoX address must be specified for this delegation operation.",
  },
  24: {
    name: "ERR_INVALID_START_BURN_HEIGHT",
    message:
      "Invalid start burn height. The cycle may have already started or the timing is incorrect.",
  },
  25: {
    name: "ERR_NOT_CURRENT_STACKER",
    message: "You are not currently stacking.",
  },
  26: {
    name: "ERR_STACK_EXTEND_NOT_LOCKED",
    message: "Cannot extend: your STX are not currently locked.",
  },
  27: {
    name: "ERR_STACK_INCREASE_NOT_LOCKED",
    message: "Cannot increase: your STX are not currently locked.",
  },
  28: {
    name: "ERR_DELEGATION_NO_REWARD_SLOT",
    message: "No reward slot available for this delegation.",
  },
  29: {
    name: "ERR_DELEGATION_WRONG_REWARD_SLOT",
    message: "Wrong reward slot specified for this delegation.",
  },
  30: {
    name: "ERR_STACKING_IS_DELEGATED",
    message:
      "This address has delegated its stacking rights and cannot perform direct stacking operations.",
  },
  31: {
    name: "ERR_STACKING_NOT_DELEGATED",
    message: "This address is not delegated to any pool operator.",
  },
  32: {
    name: "ERR_INVALID_SIGNER_KEY",
    message: "Invalid signer key provided.",
  },
  33: {
    name: "ERR_REUSED_SIGNER_KEY",
    message: "This signer key has already been used.",
  },
  34: {
    name: "ERR_DELEGATION_ALREADY_REVOKED",
    message: "The delegation has already been revoked.",
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

export const BTC_ESPLORA = {
  mainnet: 'https://mempool.space/api',
  testnet: 'https://mempool.bitcoin.private-1.hiro.so/api',
};

// PoX-5 private testnet Stacks API (chainId 256, private-1).
export const PRIVATE1_HIRO_API_BASE = 'https://api.private-1.hiro.so';

// External KMS cosigner for the bond early-exit (OP_ELSE) spend path.
// Auth-less public endpoints — no secrets involved. Mainnet is not provisioned
// yet; resolveCosignerUrl throws unless EARLY_EXIT_SIGNER_URL is set.
export const EARLY_EXIT_SIGNER = {
  mainnet: '',
  testnet: 'https://r25rniyw12.execute-api.eu-west-1.amazonaws.com/v1/v1',
};

export const POX5_BOND_ERRORS: Record<number, { name: string; message: string }> = {
  7:  { name: 'ERR_BOND_NOT_FOUND',                    message: 'Bond index not found — verify bondIndex.' },
  8:  { name: 'ERR_INSUFFICIENT_STX',                  message: 'amountUstx below the required STX/BTC ratio minimum.' },
  9:  { name: 'ERR_ALREADY_REGISTERED',                message: 'Overlapping bond membership already exists for this address.' },
  10: { name: 'ERR_TOO_MUCH_SATS',                     message: 'BTC amount exceeds the allowlist cap for this address.' },
  11: { name: 'ERR_NOT_ALLOWLISTED',                   message: 'Address has no allowance entry for this bond — contact the bond operator.' },
  19: { name: 'ERR_ALREADY_STAKED',                    message: 'Address has an overlapping STX-only stake — unstake first.' },
  23: { name: 'ERR_SIGNER_NOT_FOUND',                  message: 'Signer-manager not registered — run grantSignerKey first.' },
  26: { name: 'ERR_UNAUTHORIZED_SIGNER_REGISTRATION',  message: 'Called pox-5 grant directly — use the signer-manager register-self path.' },
  39: { name: 'ERR_READ_TX_OUT_OF_BOUNDS',             message: 'Raw BTC tx bytes malformed or truncated.' },
  40: { name: 'ERR_INVALID_BTC_HEADER',                message: "Block header doesn't hash to the expected burn-chain header at that height." },
  41: { name: 'ERR_INVALID_MERKLE_PROOF',              message: 'Merkle proof is wrong — check block hash and endianness.' },
  42: { name: 'ERR_INVALID_LOCKUP_SCRIPT',             message: 'scriptPubKey ≠ expected P2WSH — script mismatch between SDK and contract.' },
  43: { name: 'ERR_BOND_ALREADY_STARTED',              message: 'Registered after bond-start-height — no grace period.' },
  45: { name: 'ERR_INVALID_LOCKUP_AMOUNT',             message: 'Proof amount ≠ decoded output value.' },
  46: { name: 'ERR_DUPLICATE_LOCKUP_OUTPOINT',         message: 'Same (txid, vout) submitted twice.' },
  47: { name: 'ERR_STAKE_IN_PREPARE_PHASE',            message: 'Landed in prepare phase — broadcast earlier in the cycle.' },
  48: { name: 'ERR_ROLLOVER_TOO_EARLY',                message: 'Rollover attempted before prior bond L1 unlock window.' },
  50: { name: 'ERR_L1_EARLY_EXIT_ALREADY_ANNOUNCED',  message: 'announceEarlyExit already called for this membership.' },
};