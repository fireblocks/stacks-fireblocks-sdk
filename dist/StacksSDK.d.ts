import { AnnounceEarlyExitResponse, BondPositionResponse, HistoricalBondPositionResponse, RequirementsResponse, CheckStatusResponse, CreateBondResult, GetContractCallHistoryResponse, CreateTransactionResponse, UnlockBtcResponse, SpendEarlyExitResponse, BtcFeeReplacementResponse, RenewBondResult, CalculateRewardsResponse, ClaimRewardsResponse, EarnedRewardsResponse, BondLockAddressResponse, FundBondLockResponse, FundVaultResponse, FireblocksConfig, GetAccountNonceResponse, GetFtBalancesResponse, GetNativeBalanceResponse, GetPoxInfoResponse, GetTransactionHistoryResponse, GetTransactionStatusResponse, BtcTxStatusResponse, StakerInfoResponse, VerifySignerGrantResponse, TokenType, TransactionType } from "./services/types";
import { LockRecordStore } from "./staking/bonds/unlock-bytes-store";
import { BondScheduleValidation } from "./utils/bondScheduleChain";
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
    private maxBondStxUstx;
    private btcRecoveryAllowlist;
    private signerManagerRegistry;
    private verifyEarlyExitCosignerAtFunding;
    private sbtcAssetCache;
    private readonly RECOVERY_SPEND_VBYTES;
    private readonly BTC_DUST_LIMIT_SATS;
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
     * Native-BTC funding is refused unless a durable, healthy lock-record store is
     * configured. Losing a record for an unspent BTC lock can strand funds, so the
     * default in-memory store (not durable across restarts / pool eviction) is not
     * allowed to fund, and a configured durable store must pass its health check
     * immediately before funding. Returns an error message when funding must be
     * refused, or undefined when the store is safe to use.
     */
    private assertDurableLockStore;
    /**
     * Deterministic Fireblocks external id for a bond's BTC funding transfer, derived
     * from the vault, network, bond index, and lock address. Because it is stable for a
     * given enrollment, a retry reuses the same id and Fireblocks de-duplicates the
     * transfer — a second funding transaction is never created for the same lock, even
     * across a process crash. A genuine replacement (e.g. fee bump) must use a new id.
     */
    private deriveFundingExternalId;
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
     * Retrieves the status of a BITCOIN transaction from the selected Esplora API.
     *
     * A Bitcoin txid (returned as `btcTxid` by createBond, renewBond, unlockMaturedBond,
     * spendEarlyExitUtxo, and replaceBtcRecoveryFee) MUST be polled here, never through
     * getTxStatusById — that endpoint queries the Stacks API and a BTC txid would never be
     * found there. The response is tagged `chain: 'bitcoin'`. A txid Esplora does not know
     * yet returns `found: false` (not an error); a transport failure returns `success:false`
     * (UNKNOWN, never silently "not confirmed").
     */
    getBtcTxStatus: (btcTxid: string) => Promise<BtcTxStatusResponse>;
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
     * Encodes optional signer-manager calldata as a Clarity `(optional (buff))`. Some
     * signer managers require calldata; when none is supplied this is `none`, preserving
     * the prior hardcoded behavior.
     */
    private encodeSignerCalldata;
    /**
     * Stakes STX through a signer-manager (PoX-5). Replaces pox-4 stackSolo.
     * @param amountStx - Amount of STX to stake (number). Converted to microSTX internally.
     * @param numCycles - Number of cycles to lock (1–96).
     * @param signerManager - The signer-manager contract principal (must have an on-chain grant).
     * @param note - Optional Fireblocks transaction note.
     * @param nonce - Optional nonce override.
     * @param externalId - Optional Fireblocks external ID for idempotency.
     */
    stake: (amountStx: number, numCycles: number, signerManager: string, note?: string, nonce?: bigint, externalId?: string, signerCalldata?: Uint8Array | string) => Promise<CreateTransactionResponse>;
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
    updateStake: (signerManager: string, oldSignerManager: string, cyclesToExtend?: number, increaseByStx?: number, note?: string, nonce?: bigint, externalId?: string, signerCalldata?: Uint8Array | string) => Promise<CreateTransactionResponse>;
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
     * Validates the SDK's local bond-schedule constants (BOND_GAP_CYCLES / BOND_LENGTH_CYCLES)
     * against the deployed PoX-5 contract's get-bond-l1-unlock-height accessor. Returns the
     * per-index comparison plus a mismatch list; `success:false` means either a definite
     * schedule mismatch or an UNKNOWN chain read failure (see error). The REST server also
     * runs this at boot and refuses to start on a definite mismatch.
     */
    validateBondSchedule: (opts?: {
        bondIndices?: number[];
    }) => Promise<{
        success: boolean;
        data?: BondScheduleValidation;
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
    /**
     * Effective sats amount for a bond position: announce-l1-early-exit permanently
     * zeroes the mutable membership amount while the BTC stays locked in a live UTXO, so
     * a zeroed L1 amount falls back to the durable record's immutable funded amount.
     * Single source of truth for every position-reporting surface (getBondPosition,
     * checkStatus) so views cannot disagree about the same bond.
     */
    private effectiveL1AmountSats;
    /**
     * Reads the Bitcoin tip height from Esplora, failing CLOSED: a non-2xx response or a
     * non-numeric body (e.g. an HTML error page, where `Number(text)` is NaN and any
     * `NaN < x` guard silently passes) returns null — UNKNOWN — so maturity gates refuse
     * rather than sign a premature CLTV spend on garbage data.
     */
    private readBtcTipHeight;
    /**
     * Estimates a Bitcoin fee (sats) for a spend of ~`vbytes` from Esplora's
     * `/fee-estimates`, so recovery/rollover spends are broadcast with an adequate fee
     * rather than a fixed guess that can strand a transaction unconfirmed. Falls back to
     * a conservative floor if the estimate is unavailable, so recovery is never blocked.
     */
    private estimateBtcFeeSats;
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
     * Resolves the sBTC token asset for post-conditions from the SELECTED NETWORK's
     * pox-5 configuration — the `pox_5_sbtc_contract` field of GET /v2/pox on the same
     * node used to build and broadcast the transaction. A static mainnet asset id is
     * meaningless on another network, so there is deliberately no table fallback. The
     * asset identifier is `<pox_5_sbtc_contract>::sbtc-token`.
     *
     * Fails closed (returns undefined) when the field is absent, malformed, or its
     * contract address does not belong to the network this SDK operates on. An explicit
     * override is honored ONLY when it exactly matches the contract the node reports; it
     * cannot bypass network validation or select a different token.
     */
    private resolveSbtcAsset;
    /**
     * Resolves the paired-STX lock amount for a bond. The amount is normally derived
     * from the bond's sats value (`contractMin`). An explicit override is an EXPERT
     * path: it is only honored when a `maxBondStxUstx` policy is configured on the SDK,
     * and only within `[contractMin, maxBondStxUstx]`. This prevents an erroneous or
     * malicious override from locking an unbounded amount of STX for the full bond
     * term. The override is intentionally NOT reachable through the REST server.
     */
    /**
     * When a signer-manager adapter allowlist is configured (registry non-empty), refuse
     * a manager that is not on it BEFORE any funds move — defense in depth over the
     * contract's own signer-grant gate. An empty registry imposes no allowlist.
     */
    private signerManagerAllowedError;
    private resolveBondStxAmount;
    /** Renders `fetchEligibleRegisterForBond` reason codes into a readable string. */
    private describeBondReasons;
    /**
     * Rotates a paired bond's signer manager before the bond period starts
     * (canonical `update-bond-registration`). Runs the contract eligibility preflight
     * first, then records the new manager so reward discovery routes to it.
     */
    updateBondRegistration: (signerManager: string, oldSignerManager: string, opts?: {
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
        signerCalldata?: Uint8Array | string;
    }) => Promise<CreateBondResult>;
    /**
     * Post-signing re-check for a register-for-bond broadcast (createBond, createSbtcBond,
     * rollSbtcBond, renewBond). Re-runs the eligibility gate at the CURRENT tip — with a
     * freshly fetched poxInfo, never a pre-broadcast snapshot — so a signature that sat in
     * Fireblocks approval is not broadcast into a now-certain contract rejection
     * (prepare-phase entry, bond start, closed rollover window). Returns a reason string to
     * discard the tx, or undefined to proceed.
     *
     * `requireZeroCustody` guards createSbtcBond specifically: its sBTC post-condition asserts
     * the GROSS amount, which is only valid with no prior custody. If custody appeared during
     * the approval window the call is now a rollover — register-for-bond would move only the
     * net difference and the gross post-condition would abort — so discard and route to
     * rollSbtcBond instead.
     *
     * `expectedCustodySats` guards every path whose post-conditions were BUILT from a custody
     * read (the net-delta rollover, and the pox-5 custody-refund condition on native paths):
     * if live custody differs from the baked value, the signed conditions no longer match
     * what the contract will transfer, so discard rather than broadcast a doomed abort.
     *
     * `outputs` threads the SPV lockup proof through for the native-BTC paths, whose
     * eligibility check covers the proof-dependent gates as well.
     */
    private revalidateRegisterForBond;
    /**
     * Guards the durable record slot at (address, bondIndex) before a write would
     * overwrite it with a record for a DIFFERENT lock. The store holds ONE record per
     * slot, and a native-BTC record may be the only in-SDK pointer to committed Bitcoin
     * (e.g. a renewal whose L2 leg failed) — clobbering it would strand the UTXO behind
     * an out-of-band address scan, and a lost fundingExternalId would drop the
     * idempotency key that prevents a second Fireblocks funding.
     *
     * Refuses when the existing native record either
     *  - has a funding in flight (stage "funding-requested", txid not yet known), or
     *  - has ANY unspent Bitcoin at its lock address — matched by the recorded outpoint
     *    when present, but falling back to any-UTXO-at-address so a stale recorded txid
     *    (e.g. an RBF replacement) with real BTC at the address still refuses.
     * A fully spent lock (already recovered) allows the overwrite. An unreadable store
     * or Bitcoin state refuses (UNKNOWN, never "safe").
     *
     * `newLockAddress` exempts a record for the SAME lock the caller is about to write —
     * those flows own their resume/conflict logic; omit it for sBTC registrations, whose
     * records never legitimately share a slot with a live native lock.
     */
    private nativeRecordOverwriteGuard;
    /**
     * pox-5→staker sBTC custody-refund post-condition for calls that custody NO sBTC.
     *
     * `register-for-bond` (native lockup) and the STX-only `stake` path both run the
     * contract's internal roll-sbtc with a new sBTC amount of 0, so when the staker
     * currently custodies sBTC the contract refunds the ENTIRE custodied amount from
     * pox-5 during the call. In Deny mode that transfer must be covered or the node
     * aborts the transaction after the signature is spent — on the bond paths, after
     * the Bitcoin is already committed.
     *
     * Returns the FT condition (empty when custody is 0) plus the custody amount so the
     * caller can bake it into its post-signing re-check. Throws when custody is non-zero
     * but the network sBTC asset cannot be resolved: an uncovered refund must refuse to
     * build rather than sign permissively.
     */
    private custodyRefundPostConditions;
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
        signerCalldata?: Uint8Array | string;
    }) => Promise<CreateTransactionResponse>;
    /**
     * Rolls an existing sBTC-backed position into the next bond period at a (possibly)
     * different sBTC amount. Distinct from the native-BTC `renewBond` (which spends a
     * Bitcoin L1 UTXO); an sBTC rollover is a pure L2 `register-for-bond` that moves only
     * the NET sBTC difference (answers.md §3c):
     *   - increase (new > custodied): the staker sends `new − custodied`;
     *   - decrease (new < custodied): the PoX-5 boot contract sends `custodied − new` back;
     *   - unchanged: no sBTC moves, so no sBTC post-condition is attached.
     * The paired STX leg always asserts the FULL resulting STX lock (answers.md §2a/§2c/§4).
     * The prior custody is read from the contract via `get-staker-custodied-sbtc` so the
     * delta is bounded from chain state, never from a caller-supplied "old" amount.
     *
     * NOTE: sBTC paths are not yet exercised end-to-end on a live network (PoX-5 testnet is
     * not active — answers.md §7); the deterministic post-condition logic is unit-tested,
     * but validate the full flow against a live node before production use.
     *
     * @param nextBondIndex - The bond index to roll into.
     * @param newSbtcSats - The target sBTC amount (sats) for the new position.
     * @param signerManager - The signer-manager principal governing the new position.
     */
    rollSbtcBond: (nextBondIndex: number, newSbtcSats: bigint, signerManager: string, opts?: {
        sbtcAsset?: {
            contractAddress: string;
            contractName: string;
            assetName: string;
        };
        amountUstxOverride?: bigint;
        note?: string;
        nonce?: bigint;
        externalId?: string;
        signerCalldata?: Uint8Array | string;
    }) => Promise<CreateTransactionResponse>;
    /**
     * Withdraws sBTC from an sBTC-backed membership (`unstake-sbtc`). The pox-5
     * contract transfers the requested sBTC back to the staker, so the call runs in
     * Deny mode with two post-conditions: a will-perform-PoX condition for the PoX
     * action, and an exact FT condition asserting the contract sends exactly
     * `amountToWithdrawSats`. If the sBTC asset cannot be resolved for this network
     * the call refuses to build rather than signing an unbounded withdrawal.
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
     * Verifies the early-exit cosigner service still holds the key committed into `bond`'s
     * early-unlock-bytes. Throws (fail closed) on mismatch or an unreachable/misconfigured
     * service — including an unprovisioned mainnet URL. Shared by the funding-time preflight
     * and the irreversible announce gate so both apply the identical check.
     */
    private verifyCommittedCosignerKey;
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
     * Resolves the exact lock UTXO to spend for a recovery. Prefers the immutable
     * recorded funding outpoint; when no record exists, an operator may supply an
     * explicit outpoint, which is validated (unspent, correct P2WSH address/script,
     * and exact expected value) before it is returned. Only when neither is present
     * does it fall back to a single unambiguous output at the lock address.
     */
    /** True if `addr` is a well-formed BTC address for the active Bitcoin network. */
    private isValidBtcAddressForNetwork;
    /**
     * Resolves the destination for a native-BTC recovery spend. Under RAW signing the
     * destination is invisible to Fireblocks, so recovery DEFAULTS to the vault's own
     * derived BTC address; any other (external) destination must be explicitly approved
     * via `btcRecoveryAllowlist`. Wrong-network / malformed addresses are rejected
     * before signing.
     */
    private resolveRecoveryDestination;
    private resolveRecoveryUtxo;
    /**
     * Reports a native-BTC bond position by index from the immutable durable lock
     * record plus live Bitcoin UTXO state — independent of Stacks membership, which
     * `announce-l1-early-exit` zeroes and maturity drops. This keeps a mature or
     * exited bond visible and recoverable after its on-chain membership disappears.
     * A Bitcoin lookup failure is reported as UNKNOWN (null), never silently as spent.
     */
    getHistoricalBondPosition: (bondIndex: number) => Promise<HistoricalBondPositionResponse>;
    /**
     * Spends the matured P2WSH UTXO back to a destination BTC address via the
     * OP_IF (CLTV) branch. Only callable after `unlockHeight` has passed on the
     * BTC chain. No early-exit signer set required — unilateral staker signature.
     */
    unlockMaturedBond: (destinationBtcAddress?: string, opts?: {
        feeSats?: bigint;
        bondIndex?: number;
        outpointOverride?: {
            txid: string;
            vout: number;
        };
        knownUtxo?: {
            txid: string;
            vout: number;
            value: number;
        };
    }) => Promise<UnlockBtcResponse>;
    /**
     * Spends the P2WSH UTXO via the OP_ELSE (early-exit) branch. The cosigner
     * leg comes from the external KMS signing service (see cosigner.service.ts).
     * Call `announceEarlyExit()` on L2 first and wait for it to settle — this is
     * pre-checked on-chain before the cosigner is contacted.
     */
    spendEarlyExitUtxo: (destinationBtcAddress?: string, opts?: {
        feeSats?: bigint;
        bondIndex?: number;
        outpointOverride?: {
            txid: string;
            vout: number;
        };
        knownUtxo?: {
            txid: string;
            vout: number;
            value: number;
        };
    }) => Promise<SpendEarlyExitResponse>;
    /**
     * Replaces a still-unconfirmed recovery spend (from unlockMaturedBond or
     * spendEarlyExitUtxo) with a higher-fee transaction (BIP-125 RBF).
     *
     * A recovery spend is one input (the lock UTXO) and one output (the destination), so
     * the fee can only be raised by REDUCING the destination amount — this method never
     * claims to preserve the received amount. It:
     *   - preserves the original lock input and destination address;
     *   - requires the new absolute fee to exceed the original AND to clear the BIP-125
     *     rule-4 increment (≥ 1 sat/vB over the original, so the replacement pays for its
     *     own relay bandwidth) — since the size is fixed, a higher absolute fee is also a
     *     higher fee rate;
     *   - refuses to create a dust output;
     *   - rebuilds, re-authorizes, and re-signs through Fireblocks (fresh signatures);
     *   - rejects if the original is already confirmed or can no longer be found
     *     (dropped/replaced), and if the still-unspent lock UTXO has been spent by a
     *     confirmed transaction the rebuild's UTXO lookup rejects it.
     * The response carries old/new fee and old/new destination amount for display.
     *
     * @param originalTxid - The txid of the recovery spend being replaced.
     * @param newFeeSats - The new absolute fee in sats (must exceed the original fee).
     * @param opts.kind - Force the spend branch; defaults to inferring from bond maturity.
     */
    replaceBtcRecoveryFee: (originalTxid: string, newFeeSats: bigint, opts?: {
        bondIndex?: number;
        kind?: "matured" | "early-exit";
    }) => Promise<BtcFeeReplacementResponse>;
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
    /**
     * Projected burn height at which a bond's paired STX unlocks, taken from the
     * dependency's bond phase schedule (the start of the 'unlocked' phase). This is a
     * PROJECTION for display: post-enrollment, the account's node-reported unlock height
     * is the authoritative value and should be preferred where available.
     */
    private projectedStxUnlockBurnHeight;
    private bondGapCycles;
    /**
     * Distribution "calculation height" — the burn height at which the reward waterfall
     * snapshots the active-bond set. calculate-rewards must submit exactly the bonds
     * active at THIS height, not at the drifting live burn height; near a boundary the
     * two can fall in different cycles, which is the defect FBS-41 fixes.
     *
     * The contract evaluates `(- (distribution-cycle-to-burn-height
     * (current-distribution-cycle)) u1)` — one block BEFORE the current distribution-
     * cycle boundary (pox-5 calculate-rewards). This mirrors that exactly via the same
     * dependency helpers the authoritative fetchEligibleCalculateRewards preflight uses,
     * replacing the earlier reward-cycle-start guess that missed every other
     * distribution half-cycle. Fail-safe either way: a wrong height only makes the node
     * REJECT calculate-rewards (no misdistribution).
     */
    private calculationHeight;
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
    private sumOverCycles;
    /**
     * Executes the two-step signer-manager reward claim for a single reward cycle.
     * @param claimBondIndices - Bond indices passed to claim-rewards (empty for STX-only stakes).
     * @param stakerBondIndices - One claim-staker-rewards call per entry; `undefined` claims the
     * STX-only share via none() instead of some(bondIndex).
     * @returns The advanced nonce, and an error message if any step failed.
     */
    private executeClaimCycle;
    /**
     * Claims ALL accumulated sBTC rewards for the given bond indices.
     * Handles the full flow internally: calculate → distribute → claim staker share.
     *
     * The signer manager that governs each reward cycle is resolved from chain
     * (get-signer-cycle-membership) rather than the local record, so signer rotation
     * between cycles routes each cycle's claim to the correct manager and historical
     * cycles remain claimable after a restart with an empty cache. A chain read failure
     * refuses the claim (unknown, never silently "no rewards").
     *
     * Resumable by design: the per-cycle plan is rebuilt from chain on every call and
     * includes only cycles/bonds with a still-positive signer accrual or staker
     * entitlement, so a re-invocation after a partial failure resumes at the first
     * unclaimed leg without repeating confirmed work — the chain is the progress record,
     * not a local file. Both claim legs are contract-idempotent, so re-running a leg that
     * already settled is benign. On failure the response carries the partial `results`
     * and `txHashes` plus the error; call again to resume.
     */
    claimRewards: (bondIndices: number[], opts?: {
        note?: string;
        nonce?: bigint;
    }) => Promise<ClaimRewardsResponse>;
    /**
     * Claims accumulated sBTC rewards for an STX-only staker (no BTC bonds).
     *
     * The signer manager is resolved PER CYCLE from get-signer-cycle-membership (not the
     * current stake), so historical cycles route correctly across signer rotation and
     * stay claimable after the stake expires when an explicit cycle range is supplied.
     * Claimability per cycle is the complementary pair: the staker entitlement
     * (get-earned-staker-rewards, positive only AFTER someone runs claim-rewards) OR the
     * signer-level accrual (get-earned, positive only BEFORE) — the latter additionally
     * requiring this staker to hold shares for the cycle. Gating on the staker read alone
     * would deadlock a self-managed signer, whose first claim-rewards is reachable only
     * through this method. A read failure refuses rather than reading as "no rewards".
     */
    claimStxOnlyRewards: (opts?: {
        note?: string;
        nonce?: bigint;
        fromCycle?: number;
        toCycle?: number;
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
     *     at least RBF_MIN_FEE_MULTIPLIER × the original fee. `newRecipient`/`newAmount` are
     *     optional overrides for token_transfer only.
     *   - `nonceOverride` only: tx is NOT visible in the explorer. SDK skips lookup entirely.
     *     `originalTxId` is unused — omit it. Only STX transfers supported. `newRecipient` and
     *     `newAmount` are required since there is nothing to reconstruct.
     *
     * @param newFee - New fee in STX. Must be > 0 and ≤ MAX_FEE_STX.
     * @param originalTxId - TX ID to look up and replace. Required unless using nonceOverride.
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
