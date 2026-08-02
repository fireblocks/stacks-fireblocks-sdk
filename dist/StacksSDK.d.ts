import { AnnounceEarlyExitResponse, BondPositionResponse, RequirementsResponse, CheckStatusResponse, CreateBondResult, CreateTransactionResponse, UnlockBtcResponse, SpendEarlyExitResponse, RenewBondResult, CalculateRewardsResponse, ClaimRewardsResponse, EarnedRewardsResponse, BondLockAddressResponse, FundBondLockResponse, FundVaultResponse, FireblocksConfig, GetContractCallHistoryResponse, GetAccountNonceResponse, GetFtBalancesResponse, GetNativeBalanceResponse, GetPoxInfoResponse, GetTransactionHistoryResponse, GetTransactionStatusResponse, StakerInfoResponse, VerifySignerGrantResponse, TokenType, TransactionType } from "./services/types";
import { LockRecordStore } from "./staking/bonds/unlock-bytes-store";
import { type PoxInfo } from "./utils/helpers";
import { ClarityValue, PostConditionMode, PostConditionWire } from "@stacks/transactions";
import { type PoxInfo as Pox5PoxInfo } from "@stacks/bitcoin-staking";
export declare class StacksSDK {
    private fireblocksService;
    private chainService;
    private vaultAccountId;
    private address;
    private btcRewardsAddress;
    private publicKey;
    private cachedTransactions;
    private testnet;
    private networkProfile;
    private _pox5Network;
    private lockRecordStore;
    private lockRecordStoreIsDurable;
    /**
     * Sets the durable bond lock-record backend (default: in-memory, non-durable).
     *
     * The record captures the immutable recovery state of a native BTC bond
     * (unlock bytes, lock address, unlock height, locked amount, funding outpoint).
     * A durable, shared backend is required for any deployment that creates native
     * BTC bonds — losing a record for an unspent lock can strand BTC.
     */
    setLockRecordStore: (store: LockRecordStore) => void;
    /**
     * Warns loudly before a native BTC bond is created against the non-durable
     * in-memory lock-record store — a process restart or pool eviction between
     * funding and recovery would lose the record and can strand BTC.
     */
    private warnIfLockStoreNotDurable;
    private constructor();
    /**
     * Creates an instance of StacksSDK.
     * @param vaultAccountId - The Fireblocks vault account ID.
     * @param fireblocksConfig - Optional Fireblocks configuration.
     * @returns A Promise that resolves to an instance of StacksSDK.
     * @throws Will throw an error if the instance creation fails.
     */
    static create: (vaultAccountId: string | number, fireblocksConfig?: FireblocksConfig, hiroApiKey?: string) => Promise<StacksSDK>;
    /**
     * Retrieves the Stacks account public key associated with the Fireblocks vault account.
     * @returns The Stacks account public key or empty string if not set.
     */
    getPublicKey: () => string;
    /**
     * Retrieves the Stacks account address associated with the Fireblocks vault account.
     * @returns The Stacks account address or empty string if not set.
     */
    getAddress: () => string;
    /**
     * Retrieves the BTC rewards address associated with the Fireblocks vault account (derived from the same public key).
     * @returns The BTC rewards address or empty string if not set.
     */
    getBtcRewardsAddress: () => string;
    /**
     * Returns the P2WPKH address for the vault's public key on the active Bitcoin network.
     * On testnet this is a bcrt1… regtest address (for use as unlock destination on private-1).
     * On mainnet this is a bc1… address.
     */
    getBtcVaultAddress: () => string;
    /**
     * Retrieves the native coin balance for the current address.
     *
     * @returns A promise that resolves to a {GetNativeBalanceResponse} containing the native balance information.
     * @throws {Error} If the address is not set or if the balance retrieval fails.
     */
    getBalance: () => Promise<GetNativeBalanceResponse>;
    /**
     * Returns nonce information for this vault's Stacks address, accounting for
     * pending mempool transactions.
     *
     * - confirmedNonce: next nonce per confirmed on-chain state.
     * - pendingTxCount: number of this address's transactions in the mempool.
     * - nextAvailable: first nonce not already taken by a pending tx (gap-aware).
     *   Use this value when submitting a new transaction.
     *
     * @returns A promise that resolves to a {GetAccountNonceResponse}.
     */
    getAccountNonce: () => Promise<GetAccountNonceResponse>;
    /**
     * Retrieves the status of a transaction by its ID.
     * @param txId - The transaction ID.
     * @returns A promise that resolves to a {GetTransactionStatusResponse} containing the transaction status information.
     * @throws {Error} If the transaction ID is invalid or if the status retrieval fails.
     */
    getTxStatusById: (txId: string) => Promise<GetTransactionStatusResponse>;
    /**
     * Waits for a transaction to be settled (either success or failure) by polling its status.
     * @param txId - The transaction ID.
     * @param intervalMs - The interval in milliseconds between status checks (default is 3000ms).
     * @param maxAttempts - The maximum number of attempts to check the status (default is 20).
     * @returns A promise that resolves to a {GetTransactionStatusResponse} containing the final transaction status.
     */
    private waitForTxSettlement;
    /**
     * Retrieves the fungible tokens balances for the current address.
     *
     * @returns A promise that resolves to a {GetFtBalancesResponse} containing the fungible tokens balances.
     * @throws {Error} If the address is not set or if the balance retrieval fails.
     */
    getFtBalances: () => Promise<GetFtBalancesResponse>;
    /**
     * Retrieves the transaction history for the current address.
     *
     * @param getCachedTransactions - Whether to return cached transactions (default is true).
     * @param limit - The maximum number of transactions to return (default is 50).
     * @param offset - The offset for pagination (default is 0).
     * @returns A promise that resolves to an array of {Transaction} containing transaction history.
     * @throws {Error} If the address is not set or if the transaction history retrieval fails.
     */
    getTransactionHistory: (getCachedTransactions?: boolean, // Must be manually set to false to fetch fresh transactions
    limit?: number, offset?: number, fetchAll?: boolean, fetchPending?: boolean) => Promise<GetTransactionHistoryResponse>;
    /**
     * Checks and validates transaction parameters, adjusting the amount if necessary.
     *
     * @param recipientAddress - The address of the recipient.
     * @param amount - The amount to transfer in native coin.
     * @param grossTransaction - Optional flag indicating if the transaction is gross, if so fee will be deducted from recipient (default is false).
     * @param type - The type of transaction (default is native coin).
     * @param token - The type of fungible token to transfer (required if type is FungibleToken).
     * @returns A promise that resolves to an object indicating if parameters are valid, the final amount, and reason if invalid.
     * @throws {Error} If parameter validation fails.
     */
    estimateFee: (recipientAddress: string, amount: number, type?: TransactionType, token?: TokenType, customTokenContractAddress?: string, customTokenContractName?: string) => Promise<{
        success: boolean;
        fee?: number;
        microfee?: number;
        error?: string;
    }>;
    private checkParamsAndAdjustAmount;
    /**
     * Resolves the nonce to use for a transaction. If an explicit nonce is
     * provided it is returned as-is. Otherwise the gap-aware nextAvailable
     * value from getAccountNonce() is used, keeping our auto-nonce consistent
     * with what GET /:vaultId/nonce reports.
     */
    private txChain;
    private runNonceExclusive;
    private resolveNonce;
    /**
     *  Builds, signs, and sends an STX or fungible token transfer transaction.
     * @param recipientAddress - The address of the recipient.
     * @param microAmount - The amount to transfer in micro units.
     * @param type - The type of transaction (default is native coin).
     * @param token - The token type for fungible token transfers.
     * @param note - Optional note to be attached to the transaction in raw signing.
     * @returns - A promise that resolves to the transaction broadcast result.
     */
    private buildSignSendTransfer;
    private buildSignSendContractCall;
    private pox5SignAndBroadcast;
    private get pox5Network();
    /**
     * Stakes STX through a signer-manager (PoX-5). Replaces pox-4 stackSolo.
     * @param amountStx - Amount of STX to stake (number). Converted to microSTX internally.
     * @param numCycles - Number of cycles to lock (1–96).
     * @param signerManager - The signer-manager contract principal (must have an on-chain grant).
     * @param note - Optional Fireblocks transaction note.
     * @param nonce - Optional nonce override.
     * @param externalId - Optional Fireblocks external ID for idempotency.
     */
    stake: (amountStx: number, numCycles: number, signerManager: string, note?: string, nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Updates an existing PoX-5 staking position — extend cycles, increase amount, or rotate
     * signer-manager. All fields are optional; omit any to leave that dimension unchanged.
     * @param signerManager - Rotate to a new signer-manager principal, or omit to keep current.
     * @param cyclesToExtend - Additional cycles to add (0 = no extension).
     * @param increaseByStx - Additional STX to add (0 = no increase). Converted to microSTX internally.
     * @param note - Optional Fireblocks transaction note.
     * @param nonce - Optional nonce override.
     * @param externalId - Optional Fireblocks external ID for idempotency.
     */
    updateStake: (signerManager: string, oldSignerManager: string, cyclesToExtend?: number, increaseByStx?: number, note?: string, nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Unlocks a PoX-5 staking position early (sets unlock to end of current cycle).
     * Reverts if called during the prepare phase — the SDK checks this before submitting.
     * @param note - Optional Fireblocks transaction note.
     * @param nonce - Optional nonce override.
     * @param externalId - Optional Fireblocks external ID for idempotency.
     */
    unstake: (oldSignerManager: string, note?: string, nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Registers the vault's signer key with a signer-manager contract (PoX-5).
     * Calls the signer-manager's `register-self`, which performs BOTH legs atomically:
     *   1. pox-5.grant-signer-key (signer-sig over the signer-manager contract + authId)
     *   2. pox-5.register-signer
     * Must be called once before any stake() calls through that signer-manager.
     *
     * IMPORTANT: `register-self` is admin-gated (authorize-admin). The vault address
     * MUST be an admin on the signer-manager contract, or this reverts with
     * ERR_UNAUTHORIZED_ADMIN (u1002). Calling pox-5.grant-signer-key directly from an
     * EOA fails with ERR_UNAUTHORIZED_SIGNER_REGISTRATION (u26) — hence this path.
     *
     * The grant signature is generated internally via Fireblocks raw signing and is
     * computed over the signer-manager CONTRACT (current-contract), not the caller.
     *
     * @param signerManager - The signer-manager contract principal (ST….signer-manager).
     * @param authId - Monotonically increasing unique uint for replay protection. Never reuse.
     * @param note - Optional Fireblocks transaction note.
     * @param nonce - Optional nonce override.
     * @param externalId - Optional Fireblocks external ID for idempotency.
     */
    grantSignerKey: (signerManager: string, authId: bigint, note?: string, nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Revokes an existing signer key grant from a signer-manager (PoX-5).
     * @param signerManager - The signer-manager contract principal.
     * @param signerKey - 33-byte compressed secp256k1 public key (hex) to revoke.
     * @param note - Optional Fireblocks transaction note.
     * @param nonce - Optional nonce override.
     * @param externalId - Optional Fireblocks external ID for idempotency.
     */
    revokeSignerGrant: (signerManager: string, signerKey: string, note?: string, nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Fetches the current PoX-5 staking position for this vault account.
     */
    getStakerInfo: () => Promise<StakerInfoResponse>;
    /**
     * Verifies the full signer-key grant state for a (signerManager, signerKey) pair.
     *
     * Two distinct checks are performed:
     * 1. grant_exists  — the on-chain grant exists and has NOT been consumed yet
     *                    (fetchVerifySignerKeyGrant). A consumed or missing grant → false.
     * 2. signer_registered — the signer-manager contract has a registered signer key
     *                    (fetchSignerInfo). The grant alone does not mean the signer is
     *                    active; registration is a separate step (register-self / admin path).
     *
     * ready_to_stake is true only when both checks pass.
     *
     * If txid is supplied, the transaction is polled first and its status is included.
     * A non-success tx status causes ready_to_stake to be false regardless of on-chain state.
     */
    verifySignerGrant: (signerManager: string, txid?: string) => Promise<VerifySignerGrantResponse>;
    getPox5Info: () => Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * Creates a native coin transaction to transfer funds to a recipient address.
     * @param recipientAddress - The address of the recipient.
     * @param amount - Amount to transfer in STX (number, e.g. 1.5 for 1.5 STX). Converted to microSTX internally.
     * @param grossTransaction - Optional flag indicating if the transaction is gross, if so fee will be deducted from recipient (default is false).
     * @param note - Optional note to be attached to the transaction in raw signing.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @param fee - Optional fee in STX (number). Defaults to network estimate.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     * @throws {Error} If the address, public key, or vault ID are not set, or if the transaction creation fails.
     */
    createNativeTransaction: (recipientAddress: string, amount: number, grossTransaction?: boolean, note?: string, nonce?: bigint, fee?: number, memo?: string, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Creates a fungible token transaction to transfer funds to a recipient address.
     * @param recipientAddress - The address of the recipient.
     * @param amount - Amount to transfer in STX (number). Converted to microSTX internally.
     * @param token - The type of fungible token to transfer.
     * @param note - Optional note to be attached to the transaction in raw signing.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     * @throws {Error} If the address, public key, or vault ID are not set, or if the transaction creation fails.
     */
    createFTTransaction: (recipientAddress: string, amount: number, token: TokenType, customTokenContractAddress?: string, customTokenContractName?: string, customTokenAssetName?: string, note?: string, nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Delegate STX to a stacking pool.
     * @param poolsAddress - The address of the stacking pool.
     * @param poolContractName - The contract name of the stacking pool.
     * @param amount - Amount of STX to delegate (number). Converted to microSTX internally.
     * @param lockPeriod - The lock period in cycles.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     * @throws {Error} If the address, public key, or vault ID are not set, or if the delegate process fails.
     */
    delegateToPool: (poolsAddress: string, poolContractName: string, amount: number, lockPeriod: number, nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Allows a stacking pool to lock delegated STX on behalf of the delegator.
     * @param poolsAddress - The address of the stacking pool.
     * @param poolContractName - The contract name of the stacking pool.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     * @throws {Error} If the address, public key, or vault ID are not set, or if the process fails.
     */
    allowContractCaller: (poolsAddress: string, poolContractName: string, nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Revoke any STX delegation to any address for this account.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     * @throws {Error} If the address, public key, or vault ID are not set, or if the process fails.
     */
    revokeDelegation: (nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    private esploraBase;
    private waitForBtcConfirmations;
    /**
     * Fetches the confirmed BTC transaction, its block header, and its Merkle proof from
     * Esplora, and builds the SPV lockup proof for `register-for-bond` / `renew-bond`.
     * @param outputScript - Expected P2WSH output script the lock transaction must pay to.
     * @param unlockHeight - Burn height at which the lock becomes spendable.
     */
    private assembleLockupProof;
    /**
     * Builds an unsigned `register-for-bond` contract call with the corrected output
     * tuple. The pinned `@stacks/bitcoin-staking` `lockupToCV` omits the
     * `unlock-burn-height` field that the pox-5 contract requires per output, so the
     * node rejects every native enrollment/renewal with a `BadFunctionArgument`
     * tuple-type mismatch — and only after the Bitcoin has already been committed.
     * We construct the arguments locally against the current ABI instead of
     * delegating to the dependency builder.
     */
    private buildRegisterForBondTx;
    /**
     * Builds an unsigned pox-5 contract call via the fork's `makeUnsignedContractCall`
     * (top-level @stacks/transactions), which — unlike the `@stacks/bitcoin-staking`
     * builders' pinned nested copy — understands the `staking`/`pox` post-condition
     * wire types. Used for the fund-moving PoX-5 calls that must carry deny-mode
     * post-conditions; the dependency builders cannot serialize those here.
     */
    private buildPox5Call;
    /**
     * Resolves the sBTC token asset for post-conditions. Prefers an explicit override,
     * otherwise falls back to the built-in sBTC contract for this network (constants
     * `ftInfo[TokenType.sBTC]`). Returns undefined only if neither is available.
     */
    private resolveSbtcAsset;
    /** Renders `fetchEligibleRegisterForBond` reason codes into a readable string. */
    private describeBondReasons;
    /**
     * Rotates a paired bond's signer manager before the bond period starts
     * (canonical `update-bond-registration`). Runs the contract eligibility preflight
     * first, then records the new manager so reward discovery routes to it.
     */
    updateBondRegistration: (bondIndex: number, signerManager: string, oldSignerManager: string, opts?: {
        note?: string;
        nonce?: bigint;
        externalId?: string;
    }) => Promise<CreateTransactionResponse>;
    /**
     * Creates a native-BTC PoX-5 bond: locks BTC on L1 via Fireblocks and registers
     * the paired STX position on L2 with a full SPV proof.
     *
     * Steps: allowlist check → bond params → STX ratio → lock script → send BTC via
     * Fireblocks → wait for confirmations → assemble SPV proof → register-for-bond.
     *
     * NOTE: This call blocks until Bitcoin confirmations are received (~30 min typical).
     */
    createBond: (bondIndex: number, btcAmountSats: bigint, signerManager: string, opts?: {
        note?: string;
        nonce?: bigint;
        externalId?: string;
        confirmations?: number;
        btcTxid?: string;
        amountUstxOverride?: bigint;
    }) => Promise<CreateBondResult>;
    /**
     * Registers an sBTC-backed bond: locks the paired STX and transfers sBTC to the
     * contract in a single L2 call (no Bitcoin L1 lock / SPV proof). The sBTC asset
     * defaults to the built-in sBTC contract for this network; pass `sbtcAsset` to
     * override it. Both legs (STX lock + sBTC transfer) are bounded by post-conditions.
     *
     * NOTE: sBTC paths are not yet exercised end-to-end on a live network; validate
     * before production use.
     */
    createSbtcBond: (bondIndex: number, sbtcSats: bigint, signerManager: string, opts?: {
        sbtcAsset?: {
            contractAddress: string;
            contractName: string;
            assetName: string;
        };
        amountUstxOverride?: bigint;
        note?: string;
        nonce?: bigint;
        externalId?: string;
    }) => Promise<CreateTransactionResponse>;
    /**
     * Withdraws sBTC from an sBTC-backed membership (`unstake-sbtc`). The pox-5
     * contract transfers the requested sBTC back to the staker, so when the deployed
     * sBTC asset is supplied we bound that transfer with a deny-mode post-condition
     * asserting the contract sends at most `amountToWithdrawSats`. Without the asset
     * the call falls back to permissive mode (with a warning).
     *
     * NOTE: sBTC paths are not yet exercised end-to-end on a live network.
     */
    unstakeSbtc: (signerManager: string, amountToWithdrawSats: bigint, sbtcAsset?: {
        contractAddress: string;
        contractName: string;
        assetName: string;
    }, opts?: {
        note?: string;
        nonce?: bigint;
        externalId?: string;
    }) => Promise<CreateTransactionResponse>;
    /**
     * Returns the current PoX-5 bond position for this vault's address, enriched
     * with live L1 lock state (if BTC-locked) and accrued sats rewards.
     */
    getBondPosition: () => Promise<BondPositionResponse>;
    /**
     * Announces an L1 early exit for an active BTC-locked bond (L2 leg only).
     * Zeroes the L2 amountSats; paired STX remains locked through the bond's normal
     * unlock cycle. The L1 BTC recovery (OP_ELSE spend) is a separate step requiring
     * the early-exit signer set.
     */
    announceEarlyExit: (opts?: {
        note?: string;
        nonce?: bigint;
        externalId?: string;
    }) => Promise<AnnounceEarlyExitResponse>;
    /**
     * Returns the P2WSH lock address (bcrt1… on testnet, bc1… on mainnet) for a given bond index.
     * Use this to know where to send BTC before calling createBond with a pre-funded btcTxid.
     */
    getBondLockAddress: (bondIndex: number) => Promise<BondLockAddressResponse>;
    /**
     * Funds the bond lock address via the private-1 BTC faucet (testnet only).
     * Returns the faucet txid — pass it as btcTxid in createBond to skip the Fireblocks send.
     */
    fundBondLockAddress: (bondIndex: number) => Promise<FundBondLockResponse>;
    /**
     * Funds the vault's STX address via the private-1 STX faucet (testnet only).
     * Pass staking=true to request the stacking-sized faucet amount.
     */
    fundVault: (staking?: boolean) => Promise<FundVaultResponse>;
    getRequirements: (opts?: {
        bondIndex?: number;
        btcAmountSats?: bigint;
        signerManager?: string;
    }) => Promise<RequirementsResponse>;
    private get btcNetwork();
    private p2wshOutputScript;
    private broadcastBtc;
    private btcDerSig;
    private signBtcSighash;
    private btcSegwitSighash;
    private setP2wshWitness;
    private deriveLock;
    /**
     * Locates the lock UTXO to spend. Selects by the recorded funding
     * outpoint when available; otherwise falls back to a single unspent output at
     * the bond-specific lock address. A transport failure is surfaced as an error
     * ("unknown"), never silently treated as "already spent" — the previous
     * amount-equality match returned an empty list on both a zeroed amount and a
     * failed read, making a still-locked output look spent.
     */
    private findLockUtxo;
    /**
     * Spends the matured P2WSH UTXO back to a destination BTC address via the
     * OP_IF (CLTV) branch. Only callable after `unlockHeight` has passed on the
     * BTC chain. No early-exit signer set required — unilateral staker signature.
     */
    unlockMaturedBond: (destinationBtcAddress: string, opts?: {
        feeSats?: bigint;
        bondIndex?: number;
    }) => Promise<UnlockBtcResponse>;
    /**
     * Spends the P2WSH UTXO via the OP_ELSE (early-exit) branch. The cosigner
     * leg comes from the external KMS signing service (see cosigner.service.ts).
     * Call `announceEarlyExit()` on L2 first and wait for it to settle — this is
     * pre-checked on-chain before the cosigner is contacted.
     */
    spendEarlyExitUtxo: (destinationBtcAddress: string, opts?: {
        feeSats?: bigint;
        bondIndex?: number;
    }) => Promise<SpendEarlyExitResponse>;
    /**
     * Returns the early-exit cosigner service's account xpub and metadata —
     * useful for verifying the configured service matches a bond's
     * early-unlock-bytes before attempting an early-exit spend.
     */
    getEarlyExitPublicKey: () => Promise<import("./services/cosigner.service").CosignerPublicKeyResponse>;
    /**
     * Rolls the current bond into the next period atomically:
     * 1. Spends the matured prior P2WSH → next bond's locking address (OP_IF branch)
     * 2. Assembles the SPV proof for the new output
     * 3. Calls register-for-bond for nextBondIndex on L2
     *
     * Must be called inside the re-lock window (after prior unlockHeight, before next bond starts).
     */
    renewBond: (nextBondIndex: number, signerManager: string, opts?: {
        feeSats?: bigint;
        note?: string;
        nonce?: bigint;
        externalId?: string;
        confirmations?: number;
    }) => Promise<RenewBondResult>;
    /**
     * Derives the bond-period indices that can be active at the current burn height
     * from the cycle, rather than scanning a fixed range from zero. Bond indices grow
     * without bound, so a hardcoded cap silently operates on an empty set once the
     * live index exceeds it. The window is anchored on the latest started bond and
     * spans BOND_END_OFFSET_PERIODS periods (≤ 6 bonds).
     */
    private bondGapCycles;
    private activeBondWindow;
    private getActiveBondsSorted;
    /**
     * Triggers the PoX-5 reward distribution waterfall for the current cycle.
     * Must include ALL active bonds, sorted descending by stxValueRatio (ascending bondIndex as tiebreaker).
     * ERR_DISTRIBUTION_ALREADY_COMPUTED (u30) is benign — rewards were already settled.
     */
    calculateRewards: (opts?: {
        note?: string;
        nonce?: bigint;
    }) => Promise<CalculateRewardsResponse>;
    private cycleRange;
    /**
     * Resolves a fetcher across cycles in fixed-size batches. Contract reads are issued
     * one batch at a time to keep a wide cycle range from exhausting node connections.
     */
    private mapCyclesLimited;
    /** Fetches a bigint value per cycle in batches and sums the results. */
    private sumOverCycles;
    /** Fetches a bigint value per cycle in batches and returns the cycles with a positive result. */
    private filterCyclesWithPositiveValue;
    /**
     * Executes the two-step signer-manager reward claim for a single reward cycle.
     * @param claimBondIndices - Bond indices passed to claim-rewards (empty for STX-only stakes).
     * @param stakerBondIndices - One claim-staker-rewards call per entry; `undefined` claims the
     * STX-only share via none() instead of some(bondIndex).
     * @returns The advanced nonce, and an error message if any step failed.
     */
    private executeClaimCycle;
    /**
     * Resolves the signer manager and first earning cycle for a bond independently
     * of current membership. Prefers the live membership when it still refers to the
     * bond, else falls back to the durable record saved at registration — so rewards
     * stay discoverable after the bond period ends or the membership is overwritten.
     */
    private resolveBondSignerContext;
    /**
     * Claims ALL accumulated sBTC rewards for the given bond indices.
     * Handles the full flow internally: calculate → distribute → claim staker share.
     *
     * Reward context is resolved per bond from membership OR the durable record, so
     * historical/expired bonds remain claimable, and claims are grouped by signer
     * manager so bonds under different managers route to the correct contract. Each
     * requested bond is probed per cycle (not just the lowest index).
     */
    claimRewards: (bondIndices: number[], opts?: {
        note?: string;
        nonce?: bigint;
    }) => Promise<ClaimRewardsResponse>;
    /**
     * Claims accumulated sBTC rewards for an STX-only staker (no BTC bonds).
     * Same two-step flow as claimRewards but uses none() for bond index and derives
     * the signer-manager from the vault's active STX stake rather than bond membership.
     */
    claimStxOnlyRewards: (opts?: {
        note?: string;
        nonce?: bigint;
    }) => Promise<ClaimRewardsResponse>;
    /**
     * Returns earned sBTC rewards (sats) for a signerManager + optional bondIndex.
     * Includes staker-specific rewards when this vault's address is in the signer set.
     */
    getEarnedRewards: (signerManager: string, bondIndex?: number) => Promise<EarnedRewardsResponse>;
    /**
     * Check account status: balance total, locked amount and delegation status.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     */
    checkStatus: () => Promise<CheckStatusResponse>;
    /**
     * Check eligibility for PoX-5 staking.
     * @returns A promise that resolves to an object indicating eligibility and reason if not eligible.
     */
    checkEligibility: (pox: Pox5PoxInfo | PoxInfo, amountStx: number) => Promise<{
        eligible: boolean;
        reason?: string;
    }>;
    /**
     * Solo stacks a specified amount of STX for a given lock period.
     * @param signerKey - The signer's compressed public key (hex).
     * @param signerSig65Hex - 65-byte signer signature (hex).
     * @param amount - Amount of STX to stack (number). Converted to microSTX internally.
     * @param maxAmount - Maximum authorized STX amount, must be >= amount (number). Converted to microSTX internally.
     * @param lockPeriod - The number of cycles to lock the STX.
     * @param authId - Authorization ID for the transaction (bigint).
     * @param note - Optional note shown in Fireblocks console during raw signing.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A response indicating success or failure of the transaction.
     */
    stackSolo: (signerKey: string, signerSig65Hex: string, amount: number, maxAmount: number, lockPeriod: number, authId: bigint, note?: string, nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Increases the stacked amount of an existing solo stacking position.
     * @param signerKey - The signer's compressed public key (hex).
     * @param signerSig65Hex - 65-byte signer signature (hex).
     * @param increaseBy - Amount of STX to add to the existing stack (number). Converted to microSTX internally.
     * @param maxAmount - New maximum authorized STX amount after increase (number). Converted to microSTX internally.
     * @param authId - Authorization ID for the transaction (bigint).
     * @param note - Optional note shown in Fireblocks console during raw signing.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A response indicating success or failure of the transaction.
     */
    increaseStackedAmount: (signerKey: string, signerSig65Hex: string, increaseBy: number, maxAmount: number, authId: bigint, note?: string, nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
    * Extends the stacking period of an existing solo stacking position.
    * @param signerKey - The signer's compressed public key (hex).
    * @param signerSig65Hex - 65-byte signer signature (hex).
    * @param increaseBy - Number of additional cycles to extend the stacking period.
    * @param maxAmount - Maximum authorized STX amount for the extension (number). Converted to microSTX internally.
    * @param authId - Authorization ID for the transaction (bigint).
    * @param note - Optional note shown in Fireblocks console during raw signing.
    * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
    * @returns A response indicating success or failure of the transaction.
    */
    extendStackingPeriod: (signerKey: string, signerSig65Hex: string, extendCycles: number, maxAmount: number, authId: bigint, note?: string, nonce?: bigint, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Replaces a pending transaction with a higher fee (replace-by-fee / RBF).
     *
     * Two mutually exclusive modes — provide one, not both:
     *   - `originalTxId` only: tx is visible in the explorer. SDK looks it up, reads its nonce,
     *     and reconstructs it. Works for token_transfer and contract_call. `newFee` must be
     *     strictly greater than the original fee. `newRecipient`/`newAmount` are optional
     *     overrides for token_transfer only.
     *   - `nonceOverride` only: tx is NOT visible in the explorer. SDK skips lookup entirely.
     *     `originalTxId` is unused — omit it. Only STX transfers supported. `newRecipient` and
     *     `newAmount` are required since there is nothing to reconstruct.
     *
     * @param originalTxId - TX ID to look up and replace. Required unless using nonceOverride.
     * @param newFee - New fee in STX. Must be > 0 and ≤ MAX_FEE_STX.
     * @param newRecipient - New recipient (token_transfer only). Optional on lookup path, required on override path.
     * @param newAmount - New amount in STX (token_transfer only). Optional on lookup path, required on override path.
     * @param nonceOverride - Nonce of the stuck tx. Use only when the tx is not visible in the explorer.
     * @param note - Optional note shown in Fireblocks console during raw signing.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     */
    replaceTransaction: (newFee: number, originalTxId?: string, newRecipient?: string, newAmount?: number, nonceOverride?: bigint, note?: string, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
    * fetches current pox info from blockchain.
    * @returns the pox info response.
    * @throws {Error} If fetching pox info fails.
    */
    getPoxInfo: () => Promise<GetPoxInfoResponse>;
    /**
     * Makes a generic contract call to a given contract address and name with specified function and arguments.
     * @param contractAddress - The address of the contract to call.
     * @param contractName - The name of the contract to call.
     * @param functionName - The name of the function to call on the contract.
     * @param functionArgs - The arguments to pass to the contract function - must be an array of ClarityValue objects in the same order and types as the function parameters.
     * @param postConditions - Optional post conditions for the transaction.
     * @param postConditionMode - Optional post condition mode.
     * @returns A response indicating success or failure of the transaction.
     */
    makeContractCall: (contractAddress: string, contractName: string, functionName: string, functionArgs: ClarityValue[], postConditions?: PostConditionWire[], postConditionMode?: PostConditionMode, externalId?: string) => Promise<CreateTransactionResponse>;
    /**
     * Signs an externally built transaction and returns the signed transaction hex.
     * The caller is responsible for broadcasting the signed transaction.
     */
    signExternalTransaction: (txHex: string, externalId?: string) => Promise<{
        success: boolean;
        txHex?: string;
        error?: string;
    }>;
    /**
     * Signs a plain text message and returns the signature.
     */
    signMessage: (message: string, externalId?: string) => Promise<{
        success: boolean;
        signature?: string;
        error?: string;
    }>;
    /**
     * Signs a SIP-018 structured message and returns the signature.
     * message and domain are hex-encoded serialized ClarityValues.
     */
    signStructuredMessage: (message: string, domain: string, externalId?: string) => Promise<{
        success: boolean;
        signature?: string;
        error?: string;
    }>;
    /**
     * Fetches contract call transactions for the current account, excluding STX and FT transfers.
     * @param limit - The maximum number of transactions to return (default is 50).
     * @param offset - The offset for pagination (default is 0).
     * @returns A promise that resolves to a {GetContractCallHistoryResponse}.
     * @throws {Error} If the address is not set or if the request fails.
     */
    getContractCallHistory: (limit?: number, offset?: number) => Promise<GetContractCallHistoryResponse>;
}
