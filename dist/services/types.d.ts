import { BasePath } from "@fireblocks/ts-sdk";
import { SignerManagerAdapter } from "../staking/signer-manager-adapter";
export type Network = "mainnet" | "testnet";
export type GetNativeBalanceResponse = {
    success: boolean;
    balance?: number;
    error?: string;
};
export type GetFtBalancesResponse = {
    success: boolean;
    data?: {
        token: string;
        tokenContractName: string;
        tokenContractAddress: string;
        balance: number;
    }[];
    error?: string;
};
export type FireblocksConfig = {
    apiKey: string;
    apiSecret: string;
    basePath?: BasePath;
    testnet?: boolean;
    /**
     * Explicit network profile. Takes precedence over `testnet`. `public-testnet` is
     * currently gated and fails construction until a node serving the PoX-5 boot
     * contract is available. When omitted, `testnet: true` maps to `private-devnet`
     * and `testnet` unset/false maps to `mainnet`.
     */
    network?: "mainnet" | "public-testnet" | "private-devnet";
    /**
     * Explicit Stacks API base URL. Overrides the STACKS_API_URL env var and the
     * per-network default. Applied to BOTH the PoX-5 client and StacksService so
     * they always target the same node.
     */
    stacksApiUrl?: string;
    /**
     * Expert policy ceiling (µSTX) for a bond's paired-STX lock amount. The normal API
     * derives the amount from the bond's sats value; an explicit per-call override is
     * only accepted when this ceiling is configured, and only within
     * [contract-minimum, maxBondStxUstx]. Prevents an erroneous override from locking
     * an unbounded amount of STX for the full bond term. Not exposed over the REST
     * server.
     */
    maxBondStxUstx?: bigint;
    /**
     * Approved EXTERNAL Bitcoin destinations for native-BTC recovery. Under RAW signing
     * Fireblocks cannot see the destination, so recovery defaults to the vault's own
     * derived BTC address; any other destination must appear here to be permitted.
     */
    btcRecoveryAllowlist?: string[];
    /**
     * Signer-manager adapters supported by this deployment. Each supplies the payout
     * policy used to bound the `claim-staker-rewards` leg; a claim through a manager
     * with no registered adapter/policy is refused rather than signed permissively.
     */
    signerManagerAdapters?: SignerManagerAdapter[];
    /**
     * When true, native-BTC funding is refused unless the early-exit cosigner service
     * is reachable AND holds the exact key committed into the bond's lock script. Off
     * by default: a bond still recovers via natural maturity without the cosigner, so
     * enabling this trades that fallback's availability for a guaranteed early-exit path.
     */
    verifyEarlyExitCosignerAtFunding?: boolean;
};
export type CreateTransactionResponse = {
    success: boolean;
    txHash?: string;
    /** The serialized signed transaction (populated by the generic contract-call path). */
    transaction?: any;
    error?: string;
    /**
     * Non-fatal advisory for an operation that SUCCEEDED on-chain but left local
     * bookkeeping incomplete (e.g. a signer rotation confirmed, but no durable record
     * existed to update). Surfaced so the condition is visible rather than silent.
     */
    warning?: string;
    /**
     * True when settlement polling TIMED OUT — the transaction was broadcast but its
     * final on-chain state is UNKNOWN and may still succeed. Distinct from a confirmed
     * contract failure (where `unsettled` is falsy). Callers must NOT treat this as a
     * definite failure or re-submit blindly; poll `txHash` on its chain instead.
     */
    unsettled?: boolean;
};
export type GetTransactionHistoryResponse = {
    success: boolean;
    data?: any[];
    error?: string;
};
export type GetPoxInfoResponse = {
    success: boolean;
    data?: any;
    error?: string;
};
export type TransactionDetails = {
    tx_id: string;
    tx_status: string;
    tx_result: any;
    full_tx_details?: any;
    tx_error?: string;
};
export type GetTransactionStatusResponse = {
    success: boolean;
    /** The chain this status was read from — always Stacks for this endpoint. */
    chain?: 'stacks';
    data?: TransactionDetails;
    error?: string;
};
/**
 * Status of a Bitcoin transaction read from the selected Esplora API. A Bitcoin txid must
 * be polled here, never through the Stacks status endpoint. `found: false` means the txid
 * is not (yet) known to Esplora — distinct from a read failure, which sets `success:false`.
 */
export type BtcTxStatusResponse = {
    success: boolean;
    chain: 'bitcoin';
    data?: {
        txid: string;
        found: boolean;
        confirmed: boolean;
        block_height?: number | null;
        block_hash?: string | null;
        confirmations: number | null;
    };
    error?: string;
};
export type Transaction = {
    type: TransactionType.STX | TransactionType.FungibleToken;
    tokenName?: string;
    tokenContractAddress?: string;
    sender: string;
    recipient: string;
    amount: number;
    transaction_hash: string;
    timestamp: any;
    success: boolean;
    pending?: boolean;
};
export type CheckStatusData = {
    balance: {
        stx_total: number;
        stx_locked: number;
        lock_tx_id: string | null;
        lock_height: number | null;
        burnchain_lock_height: number | null;
        burnchain_unlock_height: number | null;
        total_miner_rewards_received: number | null;
    };
    delegation: {
        /**
         * False on PoX-5, which has no delegation surface. When false, `is_delegated`
         * and `lookup_failed` are both false and were not evaluated.
         */
        applicable: boolean;
        is_delegated: boolean;
        /**
         * True when the on-chain delegation read failed, meaning `is_delegated: false`
         * reflects an unknown state rather than a confirmed absence of delegation.
         */
        lookup_failed: boolean;
        delegated_to: string | null;
        amount_delegated: number | null;
        until_burn_ht: number | null;
        pox_addr: string | null;
    };
    stx_only: {
        is_staked: boolean;
        amount_stx: number | null;
        signer_manager: string | null;
        first_reward_cycle: number | null;
        num_cycles: number | null;
        unlock_burn_height: number | null;
        current_burn_height: number;
        current_cycle_id: number;
        is_prepare_phase: boolean;
        /** True when the PoX read failed: the height/cycle/prepare fields are unknown, not authoritative. */
        pox_lookup_failed: boolean;
    };
    bond: {
        bond_index: number;
        amount_stx: number;
        amount_sats: string;
        signer_manager: string;
        is_l1_lock: boolean;
    } | null;
};
export type CheckStatusResponse = {
    success: boolean;
    data?: CheckStatusData;
    error?: string;
};
export declare enum TransactionType {
    STX = "STX",
    FungibleToken = "Fungible Token"
}
export declare enum TokenType {
    STX = "STX",
    sBTC = "sbtc-token",
    USDCx = "usdcx-token",
    CUSTOM = "custom-token"
}
export declare enum StackingPools {
    FAST_POOL = "fast-pool"
}
export type TokenInfo = {
    contractAddress: string;
    contractName: string;
    assetName: string;
    decimals: number;
};
export type PoolInfo = {
    poolAddress: string;
    poolContractName: string;
};
export type GetAccountNonceResponse = {
    success: boolean;
    confirmedNonce?: bigint;
    pendingTxCount?: number;
    nextAvailable?: bigint;
    error?: string;
};
export type StakerInfoResponse = {
    success: boolean;
    staked?: boolean;
    details?: {
        amount_stx: number;
        firstRewardCycle: number;
        numCycles: number;
        signerManager: string;
    };
    error?: string;
};
export type VerifySignerGrantResponse = {
    success: boolean;
    grant_exists?: boolean;
    signer_registered?: boolean;
    registered_key?: string | null;
    ready_to_stake?: boolean;
    tx_status?: string | null;
    notes?: string[];
    error?: string;
};
export type CreateBondResult = {
    success: boolean;
    btcTxid?: string;
    vout?: number;
    stacksTxid?: string;
    lockingAddress?: string;
    unlockHeight?: number;
    amountUstx?: string;
    error?: string;
    /** Settlement timed out — state unknown, may still succeed (not a confirmed failure). */
    unsettled?: boolean;
};
export type BondPositionData = {
    bond_index: number;
    amount_stx: number;
    amount_ustx: string;
    amount_sats: string;
    amount_btc: string;
    signer_manager: string;
    is_l1_lock: boolean;
    first_reward_cycle: number;
    cycles_until_rewards: number;
    unlock_height: number | null;
    locking_address: string | null;
    still_locked: boolean | null;
    blocks_until_unlock: number | null;
    earned_sats: string;
    earned_btc: string;
} | null;
export type BondPositionResponse = {
    success: boolean;
    data?: {
        bond: BondPositionData;
        stx_only: {
            amount_stx: number;
            first_reward_cycle: number;
            num_cycles: number;
            signer_manager: string;
        } | null;
    };
    error?: string;
};
export type HistoricalBondPositionResponse = {
    success: boolean;
    data?: {
        bond_index: number;
        amount_sats: string;
        amount_btc: string;
        lock_address: string;
        unlock_height: number;
        btc_txid: string | null;
        vout: number | null;
        /** Live UTXO state; null when the Bitcoin lookup failed (unknown, not spent). */
        still_locked: boolean | null;
        recovered: boolean | null;
        matured: boolean | null;
    };
    error?: string;
};
export type AnnounceEarlyExitResponse = {
    success: boolean;
    txHash?: string;
    error?: string;
    /** Settlement timed out — state unknown, may still succeed (not a confirmed failure). */
    unsettled?: boolean;
};
export type RequirementsResponse = {
    success: boolean;
    data?: {
        cycle: {
            id: number;
            current_burn_height: number;
            is_prepare_phase: boolean;
        };
        stx_only: {
            safe_to_submit: boolean;
            blocks_until_deadline: number;
            blocks_until_safe: number | null;
        };
        btc_bond?: {
            current_bond: {
                bond_index: number;
                bond_phase: string;
                open_and_allowlisted: boolean;
                stx_value_ratio: string;
                target_rate_bps: number;
                min_ustx_ratio_bps: number;
                your_allowance_sats: string;
            } | null;
            next_open_bond: {
                bond_index: number;
                bond_phase: string;
                open_and_allowlisted: boolean;
                stx_value_ratio: string;
                target_rate_bps: number;
                min_ustx_ratio_bps: number;
                your_allowance_sats: string;
                min_stx_for_sats?: number;
                min_ustx_for_sats?: string;
            } | null;
            requested_bond?: {
                bond_index: number;
                bond_phase: string;
                open_and_allowlisted: boolean;
                stx_value_ratio: string;
                target_rate_bps: number;
                min_ustx_ratio_bps: number;
                your_allowance_sats: string;
                min_stx_for_sats?: number;
                min_ustx_for_sats?: string;
                eligible?: boolean;
                eligibility_reasons?: string[];
            };
        };
    };
    error?: string;
};
export type DerivedLock = {
    bondIndex: number;
    unlockHeight: number;
    lockScript: Uint8Array;
    lockingAddress: string;
    earlyUnlockBytes: Uint8Array;
    unlockBytes: Uint8Array;
    amountSats: bigint;
    isL1Lock: boolean;
    /** Funding outpoint from the durable record, when available. */
    btcTxid?: string;
    vout?: number;
};
export type UnlockBtcResponse = {
    success: boolean;
    btcTxid?: string;
    error?: string;
};
export type SpendEarlyExitResponse = {
    success: boolean;
    btcTxid?: string;
    error?: string;
};
/**
 * Result of a BIP-125 fee replacement of a recovery spend. `replacement` carries the
 * before/after values a UI must display before the replacement is authorized: the old
 * and new absolute fee, the old and new amount the destination receives (the recovery
 * spend has a single output, so the fee increase is taken from the destination amount),
 * and the corresponding fee rates.
 */
export type BtcFeeReplacementResponse = {
    success: boolean;
    btcTxid?: string;
    error?: string;
    replacement?: {
        oldFeeSats: string;
        newFeeSats: string;
        oldDestinationSats: string;
        newDestinationSats: string;
        feeRateOldSatVb: string;
        feeRateNewSatVb: string;
        destination: string;
        branch: 'matured' | 'early-exit';
    };
};
export type RenewBondResult = {
    success: boolean;
    btcTxid?: string;
    vout?: number;
    stacksTxid?: string;
    lockingAddress?: string;
    unlockHeight?: number;
    amountUstx?: string;
    error?: string;
    /** Settlement timed out — state unknown, may still succeed (not a confirmed failure). */
    unsettled?: boolean;
};
export type CalculateRewardsResponse = {
    success: boolean;
    txHash?: string;
    error?: string;
    /** Settlement timed out — state unknown, may still succeed (not a confirmed failure). */
    unsettled?: boolean;
};
/** One structured record per (bond, cycle) claim leg. */
export type ClaimResultItem = {
    /** null for an STX-only claim (bond index `none`). */
    bondIndex: number | null;
    rewardCycle: number;
    signerManager: string;
    /** Signer-cohort accrual for this bond+cycle (get-earned) — NOT the vault's payout. */
    signerAccruedSats: string;
    /** This staker's own entitlement (get-earned-staker-rewards); null if unread. */
    stakerPaidSats: string | null;
    /** signer-manager `claim-rewards` transaction id (shared across the cycle's bonds). */
    signerClaimTxid: string | null;
    /** `claim-staker-rewards` transaction id for this bond. */
    stakerClaimTxid: string | null;
    status: "claimed" | "failed";
    error?: string;
};
export type ClaimRewardsResponse = {
    success: boolean;
    txHashes?: string[];
    /** Structured per-(bond,cycle) results — accrual, payout, both tx ids, and status. */
    results?: ClaimResultItem[];
    error?: string;
    /** A leg's settlement timed out — state unknown, may still succeed (not a confirmed failure). */
    unsettled?: boolean;
};
export type EarnedRewardsResponse = {
    success: boolean;
    data?: {
        current_cycle: number;
        first_reward_cycle?: number;
        cycles_until_rewards?: number;
        earned_sats: string;
        staker_earned_sats?: string;
    };
    error?: string;
};
export type BondLockAddressResponse = {
    success: boolean;
    data?: {
        lockAddress: string;
        unlockHeight: number;
    };
    error?: string;
};
export type FundBondLockResponse = {
    success: boolean;
    data?: {
        txid: string;
        lockAddress: string;
    };
    error?: string;
};
export type FundVaultResponse = {
    success: boolean;
    data?: {
        txid: string;
        address: string;
    };
    error?: string;
};
export type SDKResponse = GetNativeBalanceResponse | string | CreateTransactionResponse | GetTransactionHistoryResponse | GetAccountNonceResponse | StakerInfoResponse;
export type GetTransactionHistoryParams = {
    getCachedTransactions?: boolean;
    limit?: number;
    offset?: number;
};
export type ContractCallTransaction = {
    transaction_hash: string;
    timestamp: any;
    success: boolean;
    sender: string;
    contractId: string;
    contractAddress: string;
    contractName: string;
    functionName: string;
    functionArgs: {
        name: string;
        type: string;
        repr: string;
    }[];
};
export type GetContractCallHistoryResponse = {
    success: boolean;
    data?: ContractCallTransaction[];
    error?: string;
};
