/**
 * StacksSDK provides a unified interface for interacting with Stacks through Fireblocks services.
 *
 * This SDK allows you to:
 * - Retrieve Stacks account address and public key associated with a Fireblocks vault account.
 * - Query balances and transaction history for the Stacks account.
 * - Create transactions using Fireblocks raw signing.
 *
 * Usage:
 * ```typescript
 * const sdk = await StacksSDK.create(vaultAccountId, fireblocksConfig);
 * const balance = await sdk.getBalance();
 * ```
 *
 * @remarks
 * - Use the static `create` method to instantiate the SDK asynchronously.
 * - Ensure the Fireblocks vault account is properly configured and accessible.
 * - Ensure Fireblocks workspace configuration like API Key, API Secret and Base Path are set up correctly.
 * @public
 */
import { StacksService } from "./services/stacks.service";
import { type StacksNetwork } from "@stacks/network";
import { FireblocksService } from "./services/fireblocks.service";
import { CosignerService, resolveCosignerUrl } from "./services/cosigner.service";
import {
  AnnounceEarlyExitResponse,
  BondPositionResponse,
  HistoricalBondPositionResponse,
  RequirementsResponse,
  CheckStatusData,
  CheckStatusResponse,
  CreateBondResult,
  CreateTransactionResponse,
  DerivedLock,
  UnlockBtcResponse,
  SpendEarlyExitResponse,
  BtcFeeReplacementResponse,
  RenewBondResult,
  CalculateRewardsResponse,
  ClaimRewardsResponse,
  ClaimResultItem,
  EarnedRewardsResponse,
  BondLockAddressResponse,
  FundBondLockResponse,
  FundVaultResponse,
  FireblocksConfig,
  GetAccountNonceResponse,
  GetFtBalancesResponse,
  GetNativeBalanceResponse,
  GetPoxInfoResponse,
  GetTransactionHistoryResponse,
  GetTransactionStatusResponse,
  BtcTxStatusResponse,
  StakerInfoResponse,
  VerifySignerGrantResponse,
  TokenType,
  Transaction,
  TransactionDetails,
  TransactionType,
} from "./services/types";
import { DEFAULT_POX_FEE_USTX, helperConstants, pagination_defaults, POX4_ERRORS, RBF_MIN_FEE_MULTIPLIER, stacks_info } from "./utils/constants";
import {
  NetworkProfile,
  resolveNetworkProfile,
  stacksNetworkFromProfile,
  validateNetworkProfile,
} from "./utils/network";
import { BondLockRecord, InMemoryLockRecordStore, LockRecordStore } from "./staking/bonds/unlock-bytes-store";
import { SignerManagerRegistry } from "./staking/signer-manager-adapter";
import { createHash } from "crypto";
import { parseOptionalFee, ValidationError } from "./utils/validation";
import { formatErrorMessage } from "./utils/errorHandling";
import { checkFeeReplacement, ParsedRecoveryTx } from "./utils/rbf";
import { validateApiCredentials } from "./utils/fireblocks.utils";
import {
  assertResultSuccess,
  concatSignature,
  getDecimalsFromFtInfo,
  getTokenInfo,
  isSafeToSubmit,
  type PoxInfo,
  microToStx,
  microToToken,
  parseAssetId,
  parseClarityErrCode,
  stxToMicro,
  tokenToMicro,
  validateAddress,
} from "./utils/helpers";
import {
  Cl,
  ClarityType,
  ClarityValue,
  createMessageSignature,
  fetchCallReadOnlyFunction,
  hexToCV,
  Pc,
  PostCondition,
  PostConditionMode,
  PostConditionWire,
  sigHashPreSign,
  StacksTransactionWire,
  uintCV,
  principalCV,
  noneCV,
  makeUnsignedContractCall,
  contractPrincipalCV,
  bufferCV,
} from "@stacks/transactions";
import {
  buildCalculateRewards,
  fetchEligibleRegisterForBond,
  fetchEligibleAnnounceL1EarlyExit,
  fetchEligibleUpdateBondRegistration,
  fetchEligibleUnstakeSbtc,
  fetchEligibleStake,
  fetchEligibleStakeUpdate,
  fetchEligibleUnstake,
  fetchEligibleCalculateRewards,
  describePox5Error,
  fetchStakerInfo,
  fetchPoxInfo as fetchPox5Info,
  fetchVerifySignerKeyGrant,
  fetchSignerInfo,
  fetchSignerGrantMessageHash,
  fetchBondMembership,
  fetchBond,
  fetchBondStatus,
  fetchBondAllowance,
  fetchHasAnnouncedL1EarlyExit,
  fetchAccountStatus,
  fetchEarned,
  fetchEarnedStakerRewards,
  fetchLastRewardComputeHeight,
  fetchSignerCycleMembership,
  fetchConstructLockupOutputScript,
  isInPreparePhase,
  isBondActiveAtHeight,
  firstPox5RewardCycle,
  bondPeriodToRewardCycle,
  burnHeightToRewardCycle,
  BOND_END_OFFSET_PERIODS,
  buildUnlockScript,
  buildLockScript,
  buildLockAddress,
  buildRegisterMetadata,
  buildLockProof,
  computeBondUnlockHeight,
  computeRegisterPreimage,
  minUstxForSatsAmount,
  type PoxInfo as Pox5PoxInfo,
} from "@stacks/bitcoin-staking";
import * as btc from '@scure/btc-signer';
import { sha256 } from '@noble/hashes/sha2';
import { Signature as Secp256k1Signature } from '@noble/secp256k1';

import { hexToBytes, bytesToHex, signatureVrsToRsv } from "@stacks/common";
import { toDerSignature } from "./utils/der";

export class StacksSDK {
  private fireblocksService: FireblocksService;
  private chainService: StacksService;
  private vaultAccountId: string | number;
  private address: string | undefined;
  private btcRewardsAddress: string | undefined;
  private publicKey: string | undefined;
  private cachedTransactions: Transaction[] = [];
  private testnet: boolean = false;
  private maxBondStxUstx: bigint | undefined;
  private btcRecoveryAllowlist: string[] = [];
  private signerManagerRegistry: SignerManagerRegistry = new SignerManagerRegistry();
  private verifyEarlyExitCosignerAtFunding = false;
  // Cached immutable per-network sBTC asset (resolved from /v2/pox); success-only.
  private sbtcAssetCache: { contractAddress: string; contractName: string; assetName: string } | undefined;
  // A recovery/rollover spend is ~1 P2WSH input + 1 output; conservative vsize used
  // for Esplora fee estimation.
  private readonly RECOVERY_SPEND_VBYTES = 150;
  // Never create a Bitcoin output at or below this (P2WPKH dust threshold, sats).
  private readonly BTC_DUST_LIMIT_SATS = BigInt(330);
  private networkProfile!: NetworkProfile;
  private _pox5Network!: StacksNetwork;
  private lockRecordStore: LockRecordStore = new InMemoryLockRecordStore();
  private lockRecordStoreIsDurable = false;

  /**
   * Sets the durable bond lock-record backend (default: in-memory, non-durable).
   *
   * The record captures the immutable recovery state of a native BTC bond
   * (unlock bytes, lock address, unlock height, locked amount, funding outpoint).
   * A durable, shared backend is required for any deployment that creates native
   * BTC bonds — losing a record for an unspent lock can strand BTC.
   */
  public setLockRecordStore = (store: LockRecordStore): void => {
    this.lockRecordStore = store;
    this.lockRecordStoreIsDurable = true;
  };

  /**
   * Native-BTC funding is refused unless a durable, healthy lock-record store is
   * configured. Losing a record for an unspent BTC lock can strand funds, so the
   * default in-memory store (not durable across restarts / pool eviction) is not
   * allowed to fund, and a configured durable store must pass its health check
   * immediately before funding. Returns an error message when funding must be
   * refused, or undefined when the store is safe to use.
   */
  private assertDurableLockStore = async (): Promise<string | undefined> => {
    if (!this.lockRecordStoreIsDurable) {
      return (
        "Native-BTC funding requires a durable lock-record store (the default in-memory store " +
        "is not durable across restarts/pool eviction and can STRAND BTC on recovery). " +
        "Configure one via setLockRecordStore()/the pool lockRecordStore option before creating a bond."
      );
    }
    if (this.lockRecordStore.checkHealth) {
      try {
        await this.lockRecordStore.checkHealth();
      } catch (error) {
        return `Lock-record store failed its health check — refusing to fund: ${formatErrorMessage(error)}`;
      }
    }
    return undefined;
  };

  /**
   * Deterministic Fireblocks external id for a bond's BTC funding transfer, derived
   * from the vault, network, bond index, and lock address. Because it is stable for a
   * given enrollment, a retry reuses the same id and Fireblocks de-duplicates the
   * transfer — a second funding transaction is never created for the same lock, even
   * across a process crash. A genuine replacement (e.g. fee bump) must use a new id.
   */
  private deriveFundingExternalId = (bondIndex: number, lockAddress: string): string => {
    const material = `${this.vaultAccountId}:${this.networkProfile.name}:bond:${bondIndex}:${lockAddress}`;
    const digest = createHash("sha256").update(material).digest("hex").slice(0, 40);
    return `bond-fund-${digest}`;
  };

  private constructor(
    vaultAccountId: string | number,
    fireblocksConfig?: FireblocksConfig,
  ) {
    try {
      // Validate Fireblocks API credentials before initializing services
      if (fireblocksConfig) {
        validateApiCredentials(
          fireblocksConfig.apiKey,
          fireblocksConfig.apiSecret ?? "",
          vaultAccountId,
        );
      }
      this.fireblocksService = new FireblocksService(fireblocksConfig);
      this.maxBondStxUstx = fireblocksConfig?.maxBondStxUstx;
      this.btcRecoveryAllowlist = fireblocksConfig?.btcRecoveryAllowlist ?? [];
      this.signerManagerRegistry = new SignerManagerRegistry(fireblocksConfig?.signerManagerAdapters ?? []);
      this.verifyEarlyExitCosignerAtFunding = fireblocksConfig?.verifyEarlyExitCosignerAtFunding ?? false;
      // Single network profile shared by every consumer. An explicit `network` name
      // takes precedence over the legacy `testnet` boolean.
      this.networkProfile = resolveNetworkProfile({
        network: fireblocksConfig?.network,
        testnet: fireblocksConfig?.testnet,
        stacksApiUrl: fireblocksConfig?.stacksApiUrl,
      });
      // Both testnet-family profiles (public-testnet, private-devnet) use testnet
      // address formats, BTC networks, and faucet gating.
      this.testnet = this.networkProfile.name !== "mainnet";
      this._pox5Network = stacksNetworkFromProfile(this.networkProfile);
      this.chainService = new StacksService(this.testnet, {
        baseUrl: this.networkProfile.stacksApiUrl,
        chainId: this.networkProfile.chainId,
        magicBytes: this.networkProfile.magicBytes,
      });
    } catch (error) {
      throw new Error(
        `Failed to initialize services: ${formatErrorMessage(error)}`,
      );
    }
    if (typeof vaultAccountId === "string") {
      // Trim spaces and ensure only digit characters remain
      this.vaultAccountId =
        vaultAccountId
          .trim()
          .replace(/^\s+|\s+$/g, "")
          .replace(/\D/g, "") || vaultAccountId.trim();
    } else {
      this.vaultAccountId = vaultAccountId;
    }
  }

  /**
   * Creates an instance of StacksSDK.
   * @param vaultAccountId - The Fireblocks vault account ID.
   * @param fireblocksConfig - Optional Fireblocks configuration.
   * @returns A Promise that resolves to an instance of StacksSDK.
   * @throws Will throw an error if the instance creation fails.
   */

  public static create = async (
    vaultAccountId: string | number,
    fireblocksConfig?: FireblocksConfig,
  ): Promise<StacksSDK> => {
    try {
      const instance = new StacksSDK(vaultAccountId, fireblocksConfig);
      // Fail construction on a definite chain-id / PoX-contract mismatch.
      await validateNetworkProfile(instance.networkProfile);
      instance.publicKey =
        await instance.fireblocksService.getPublicKeyByVaultID(vaultAccountId);
      instance.address = instance.chainService.formatAddress(
        instance.publicKey,
      );
      instance.btcRewardsAddress =
        await instance.fireblocksService.getBtcSegwitAddressForVaultID(
          vaultAccountId,
        );
      return instance;
    } catch (error) {
      throw new Error(
        `Failed to create StacksSDK instance: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Retrieves the Stacks account public key associated with the Fireblocks vault account.
   * @returns The Stacks account public key or empty string if not set.
   */
  public getPublicKey = (): string => {
    return this.publicKey || "";
  };

  /**
   * Retrieves the Stacks account address associated with the Fireblocks vault account.
   * @returns The Stacks account address or empty string if not set.
   */
  public getAddress = (): string => {
    return this.address || "";
  };

  /**
   * Retrieves the BTC rewards address associated with the Fireblocks vault account (derived from the same public key).
   * @returns The BTC rewards address or empty string if not set.
   */
  public getBtcRewardsAddress = (): string => {
    return this.btcRewardsAddress || "";
  };

  /**
   * Returns the P2WPKH address for the vault's public key on the active Bitcoin network.
   * On testnet this is a bcrt1… regtest address (for use as unlock destination on private-1).
   * On mainnet this is a bc1… address.
   */
  public getBtcVaultAddress = (): string => {
    if (!this.publicKey) return '';
    const pub = hexToBytes(this.publicKey);
    return btc.p2wpkh(pub, this.btcNetwork).address!;
  };

  /**
   * Retrieves the native coin balance for the current address.
   *
   * @returns A promise that resolves to a {GetNativeBalanceResponse} containing the native balance information.
   * @throws {Error} If the address is not set or if the balance retrieval fails.
   */
  public getBalance = async (): Promise<GetNativeBalanceResponse> => {
    if (!this.address) {
      console.log("StacksSDK.getBalance() error: address is not set.");
      throw new Error("Stacks address is not set.");
    }
    try {
      const balance = await this.chainService.getNativeBalance(this.address);
      return {
        success: true,
        balance: balance,
      };
    } catch (error) {
      console.log(`Failed to get balance: ${formatErrorMessage(error)}`);
      return {
        success: false,
        error: formatErrorMessage(error),
      };
    }
  };

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
  public getAccountNonce = async (): Promise<GetAccountNonceResponse> => {
    if (!this.address) {
      throw new Error("Stacks address is not set.");
    }
    try {
      const result = await this.chainService.getAccountNonce(this.address);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: formatErrorMessage(error) };
    }
  };

  /**
   * Retrieves the status of a transaction by its ID.
   * @param txId - The transaction ID.
   * @returns A promise that resolves to a {GetTransactionStatusResponse} containing the transaction status information.
   * @throws {Error} If the transaction ID is invalid or if the status retrieval fails.
   */
  public getTxStatusById = async (
    txId: string,
  ): Promise<GetTransactionStatusResponse> => {
    if (!txId || typeof txId !== "string") {
      console.log("StacksSDK.getTxStatusById() error: invalid transaction ID.");
      throw new Error("Transaction ID is invalid.");
    }
    try {
      const transaction = await this.chainService.getTxStatusById(txId);

      if (!transaction) {
        return { success: false, error: "Transaction not found." };
      }

      const txDetails: TransactionDetails = {
        tx_id: transaction.tx_id,
        tx_status: transaction.tx_status,
        tx_result: transaction.tx_result,
        full_tx_details: transaction,
      };

      // Only populate an error for TERMINAL non-success states — a `pending` /
      // `submitted` tx in the mempool is not a failure and must not be labeled one.
      const status = String(transaction.tx_status);
      const isTerminalFailure =
        status === "abort_by_response" ||
        status === "abort_by_post_condition" ||
        status.startsWith("dropped");

      if (isTerminalFailure) {
        const vmError: string | undefined = (transaction as any).vm_error;

        if (status === "abort_by_post_condition") {
          // A post-condition abort rolls back the contract's (ok ...) return value,
          // so surface the VM post-condition failure rather than the stale return.
          txDetails.tx_error = vmError || "Post-condition check failure";
        } else {
          const errorNumber = parseClarityErrCode(transaction.tx_result);
          // Only use the PoX-4 error table for PoX-4 contract calls.
          const isPoX4Transaction =
            transaction.tx_type === "contract_call" &&
            transaction.contract_call?.contract_id?.includes("pox-4");

          if (isPoX4Transaction && errorNumber !== null && POX4_ERRORS[errorNumber]) {
            txDetails.tx_error = POX4_ERRORS[errorNumber].name;
          } else if (errorNumber !== null) {
            txDetails.tx_error = `Contract error code: ${errorNumber}`;
          } else {
            txDetails.tx_error = vmError || transaction.tx_result?.repr || "Transaction failed";
          }
        }
      }

      return {
        success: true,
        chain: 'stacks',
        data: txDetails,
      };
    } catch (error) {
      console.log(
        `Failed to get transaction status: ${formatErrorMessage(error)}`,
      );
      return {
        success: false,
        chain: 'stacks',
        error: formatErrorMessage(error),
      };
    }
  };

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
  public getBtcTxStatus = async (btcTxid: string): Promise<BtcTxStatusResponse> => {
    if (!/^[0-9a-fA-F]{64}$/.test(btcTxid)) {
      return { success: false, chain: 'bitcoin', error: `Invalid BTC txid: ${btcTxid}` };
    }
    try {
      const res = await fetch(`${this.esploraBase()}/tx/${btcTxid}`);
      if (res.status === 404) {
        return { success: true, chain: 'bitcoin', data: { txid: btcTxid, found: false, confirmed: false, confirmations: 0 } };
      }
      if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
      const tx = await res.json();
      const confirmed = !!tx?.status?.confirmed;
      const blockHeight: number | null = tx?.status?.block_height ?? null;
      let confirmations = 0;
      if (confirmed && typeof blockHeight === 'number') {
        const tip = await fetch(`${this.esploraBase()}/blocks/tip/height`).then(r => r.text()).then(Number);
        confirmations = Number.isFinite(tip) ? Math.max(0, tip - blockHeight + 1) : 0;
      }
      return {
        success: true,
        chain: 'bitcoin',
        data: {
          txid: btcTxid,
          found: true,
          confirmed,
          block_height: blockHeight,
          block_hash: tx?.status?.block_hash ?? null,
          confirmations,
        },
      };
    } catch (error) {
      return { success: false, chain: 'bitcoin', error: `Could not read BTC tx ${btcTxid} status (UNKNOWN, not "unconfirmed"): ${formatErrorMessage(error)}` };
    }
  };


  /**
   * Waits for a transaction to be settled (either success or failure) by polling its status.
   * @param txId - The transaction ID.
   * @param intervalMs - The interval in milliseconds between status checks (default is 3000ms).
   * @param maxAttempts - The maximum number of attempts to check the status (default is 20).
   * @returns A promise that resolves to a {GetTransactionStatusResponse} containing the final transaction status.
   */
  private waitForTxSettlement = async (
    txId: string,
    timeoutMs = 30 * 60 * 1000, // 30 min — covers mainnet block times of ~10 min
    intervalMs = 15_000,
  ): Promise<GetTransactionStatusResponse> => {
    const deadline = Date.now() + timeoutMs;
    let lastTransientError: string | undefined;

    while (Date.now() < deadline) {
      const status = await this.getTxStatusById(txId);

      if (status.success) {
        const txStatus = status.data?.tx_status;
        if (txStatus !== "submitted" && txStatus !== "pending") {
          return status; // settled — success or a real on-chain error
        }
      } else {
        // A freshly broadcast tx is routinely absent from the indexer ("not found"
        // / 404) or briefly unreachable. Treat an unreadable status as transient
        // and keep polling until the deadline — do NOT report a succeeding
        // operation as failed on the first read hiccup.
        lastTransientError = status.error;
      }

      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await new Promise(res => setTimeout(res, Math.min(intervalMs, remaining)));
    }

    return {
      success: false,
      error: `Transaction ${txId} timed out waiting for confirmation after ${timeoutMs / 60_000} minutes${lastTransientError ? ` (last read error: ${lastTransientError})` : ""}.`,
    };
  };

  /**
   * Retrieves the fungible tokens balances for the current address.
   *
   * @returns A promise that resolves to a {GetFtBalancesResponse} containing the fungible tokens balances.
   * @throws {Error} If the address is not set or if the balance retrieval fails.
   */
  public getFtBalances = async (): Promise<GetFtBalancesResponse> => {
    if (!this.address) {
      console.log(
        "StacksSDK.getTransactionsHistory() error: address is not set.",
      );
      throw new Error("Stacks address is not set.");
    }

    try {
      const data: {
        token: string;
        tokenContractName: string;
        tokenContractAddress: string;
        balance: number;
      }[] = [];

      const balances = await this.chainService.getFTBalancesForAddress(
        this.address,
      );

      for (const [assetId, info] of Object.entries(balances)) {
        const { contractAddress, contractName, tokenName } =
          parseAssetId(assetId);
        let decimals = getDecimalsFromFtInfo(assetId);

        // if decimals is 0 => not found in ftInfo => custom token
        if (decimals == 0) {
          decimals = await this.chainService.fetchFtDecimals(
            contractAddress,
            contractName,
          );
        }

        const balance = {
          token: tokenName,
          tokenContractName: contractName,
          tokenContractAddress: contractAddress,
          balance: microToToken((info as any).balance, decimals),
        };
        data.push(balance);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(
        `Error fetching fungible tokens balances: ${formatErrorMessage(error)}`,
      );
      return {
        success: false,
        error: formatErrorMessage(error),
      };
    }
  };

  /**
   * Retrieves the transaction history for the current address.
   *
   * @param getCachedTransactions - Whether to return cached transactions (default is true).
   * @param limit - The maximum number of transactions to return (default is 50).
   * @param offset - The offset for pagination (default is 0).
   * @returns A promise that resolves to an array of {Transaction} containing transaction history.
   * @throws {Error} If the address is not set or if the transaction history retrieval fails.
   */
  public getTransactionHistory = async (
    getCachedTransactions: boolean = true, // Must be manually set to false to fetch fresh transactions
    limit: number = pagination_defaults.limit,
    offset: number = pagination_defaults.page,
    fetchAll: boolean = false,
    fetchPending: boolean = false,
  ): Promise<GetTransactionHistoryResponse> => {
    if (getCachedTransactions) {
      console.log("Using cached transactions");
      return { success: true, data: this.cachedTransactions };
    }

    if (!this.address) {
      console.log(
        "StacksSDK.getTransactionsHistory() error: address is not set.",
      );
      throw new Error("Stacks address is not set.");
    }

    try {
      const pageSize = helperConstants.stacks_api_page_size;

      const fetchPages = async (
        fetcher: (o: number) => Promise<any[]>,
      ): Promise<any[]> => {
        const all: any[] = [];
        let currentOffset = offset;
        while (true) {
          const page = await fetcher(currentOffset);
          all.push(...page);
          if (page.length < pageSize) break;
          if (!fetchAll && all.length >= limit) break;
          currentOffset += pageSize;
        }
        return fetchAll ? all : all.slice(0, limit);
      };

      const confirmedTxs = await fetchPages((o) =>
        this.chainService.getTransactionHistory(this.address!, pageSize, o),
      );

      const pendingTxs = fetchPending
        ? await fetchPages((o) =>
            this.chainService.getMempoolTransactions(this.address!, pageSize, o),
          )
        : [];

      const txs = [...pendingTxs, ...confirmedTxs];

      const existingHashes = new Set(
        this.cachedTransactions.map((tx) => tx.transaction_hash),
      );
      const newConfirmed = confirmedTxs.filter(
        (tx) => !existingHashes.has(tx.transaction_hash),
      );
      this.cachedTransactions = [...this.cachedTransactions, ...newConfirmed];

      return { success: true, data: txs };
    } catch (error) {
      return {
        success: false,
        error: formatErrorMessage(error),
      };
    }
  };

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
  private checkParamsAndAdjustAmount = async (
    recipientAddress: string,
    amount: number,
    grossTransaction: boolean | undefined = false,
    type: TransactionType = TransactionType.STX,
    token?: TokenType,
    customTokenContractAddress?: string,
    customTokenContractName?: string,
  ): Promise<{
    validParams: boolean;
    finalAmount?: number | bigint;
    reason?: string;
  }> => {
    try {
      if (!validateAddress(recipientAddress, this.testnet)) {
        return {
          validParams: false,
          reason: `Not a valid recipient address`,
        };
      }

      // Reject a transfer to the vault's own address before any balance lookup or
      // Fireblocks signing — Stacks rejects a self-transfer at the chain level.
      if (this.address && recipientAddress.toUpperCase() === this.address.toUpperCase()) {
        return {
          validParams: false,
          reason: `Recipient address cannot equal the sender's own address`,
        };
      }

      if (amount <= 0) {
        return {
          validParams: false,
          reason: `Transfer amount must be greater than zero`,
        };
      }

      if (type == TransactionType.FungibleToken && !token) {
        return {
          validParams: false,
          reason: `Token type must be provided for fungible token transfers`,
        };
      }

      if (token === TokenType.CUSTOM) {
        if (!customTokenContractAddress || !customTokenContractName) {
          return {
            validParams: false,
            reason: `Custom token contract address and name must be provided for CUSTOM token type`,
          };
        }
      }

      let microAmount =
        type == TransactionType.FungibleToken
          ? await tokenToMicro(
              amount,
              token,
              this.chainService,
              customTokenContractAddress,
              customTokenContractName,
            )
          : stxToMicro(amount);

      let microfee = 0;
      let fee = 0;

      if (type == TransactionType.STX) {
        microfee = await this.chainService.estimateTxFee(
          recipientAddress,
          microAmount,
        );
        fee = microToStx(microfee);
      } else if (type == TransactionType.FungibleToken) {
        // Estimate fee for FT contract call
        const tokenInfo = token !== TokenType.CUSTOM
          ? getTokenInfo(token, this.testnet ? "testnet" : "mainnet")
          : undefined;
        const ftContractAddress = tokenInfo?.contractAddress ?? customTokenContractAddress!;
        const ftContractName = tokenInfo?.contractName ?? customTokenContractName!;

        // Build SIP-010 transfer args for fee estimation
        const functionArgs = [
          uintCV(microAmount),
          principalCV(this.address!),
          principalCV(recipientAddress),
          noneCV(),
        ];

        microfee = await this.chainService.estimateContractCallFee(
          ftContractAddress,
          ftContractName,
          "transfer",
          functionArgs,
        );
        fee = microToStx(microfee);
      }

      // For FT transfers, check STX balance covers gas fee
      if (type == TransactionType.FungibleToken) {
        const stxBalanceResponse = await this.getBalance();
        if (!stxBalanceResponse.success) {
          throw new Error("Could not fetch STX balance to check gas funds");
        }
        if (stxBalanceResponse.balance < fee) {
          return {
            validParams: false,
            reason: `Insufficient STX for gas fee. Available: ${stxBalanceResponse.balance} STX, required: ${fee} STX`,
          };
        }
      }

      const balanceResponse =
        type == TransactionType.FungibleToken
          ? await this.getFtBalances()
          : await this.getBalance();

      if (!balanceResponse.success) {
        throw new Error(
          `Could not fetch account balance to check funds sufficiency`,
        );
      }

      // if its a gross STX transfer, deduct fee from transferred amount
      if (type == TransactionType.STX && grossTransaction) {
        console.log(
          `Gross transaction: deducting fee ${fee} STX from amount ${amount} STX`,
        );
        amount -= fee;
        if (amount <= 0) {
          return {
            validParams: false,
            reason: `Amount after fee deduction is zero or negative`,
          };
        }
      }

      let balance;
      if (type == TransactionType.FungibleToken) {
        // For known tokens, match by contract name from tokenInfo
        // For custom tokens, match by contract address
        const tokenInfo = token !== TokenType.CUSTOM
          ? getTokenInfo(token, this.testnet ? "testnet" : "mainnet")
          : undefined;

        balance = (balanceResponse as GetFtBalancesResponse).data?.find(
          (b) =>
            (tokenInfo && b.tokenContractName === tokenInfo.contractName) ||
            (customTokenContractAddress && b.tokenContractAddress === customTokenContractAddress),
        )?.balance;
      } else {
        balance = (balanceResponse as GetNativeBalanceResponse).balance;
      }

      if ((type === TransactionType.FungibleToken ? amount : amount + fee) > balance) {  
        return {
          validParams: false,
          reason: `Insufficient funds. Available balance: ${balance}, required: ${amount}`,
        };
      }

      // Recalculate microAmount after any adjustments
      microAmount =
        type == TransactionType.FungibleToken
          ? await tokenToMicro(
              amount,
              token,
              this.chainService,
              customTokenContractAddress,
              customTokenContractName,
            )
          : stxToMicro(amount);

      console.log(
        `Converted amount to micro: ${microAmount} (from ${amount} ${
          token ? token : "STX"
        })`,
      );

      return {
        validParams: true,
        finalAmount: microAmount,
      };
    } catch (error) {
      throw new Error(
        `Parameter validation failed: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Resolves the nonce to use for a transaction. If an explicit nonce is
   * provided it is returned as-is. Otherwise the gap-aware nextAvailable
   * value from getAccountNonce() is used, keeping our auto-nonce consistent
   * with what GET /:vaultId/nonce reports.
   */
  // Serializes the nonce-resolution → sign → broadcast critical section per SDK
  // instance (one instance per vault/principal in the pool). Without this, two
  // concurrent operations for the same principal read the same auto-nonce and one
  // replaces or invalidates the other after both consumed a Fireblocks signature.
  // Only the short critical section is serialized — chain-confirmation waits run
  // outside it, so a slow bond enrollment does not block unrelated recovery ops.
  private txChain: Promise<unknown> = Promise.resolve();
  private runNonceExclusive = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = this.txChain.then(fn, fn);
    this.txChain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };

  private resolveNonce = async (nonce?: bigint): Promise<bigint> => {
    if (nonce !== undefined) {
      // Validating an explicit nonce needs only the confirmed value, so the mempool scan is skipped.
      const confirmedNonce = await this.chainService.getConfirmedNonce(this.address!);
      if (nonce < confirmedNonce) {
        throw new ValidationError(
          `Nonce ${nonce} is below the confirmed nonce (${confirmedNonce}). This transaction would be rejected.`,
        );
      }
      return nonce;
    }
    const { nextAvailable } = await this.chainService.getAccountNonce(this.address!);
    return nextAvailable;
  };

  /**
   *  Builds, signs, and sends an STX or fungible token transfer transaction.
   * @param recipientAddress - The address of the recipient.
   * @param microAmount - The amount to transfer in micro units.
   * @param type - The type of transaction (default is native coin).
   * @param token - The token type for fungible token transfers.
   * @param note - Optional note to be attached to the transaction in raw signing.
   * @returns - A promise that resolves to the transaction broadcast result.
   */
  private buildSignSendTransfer = async (
    recipientAddress: string,
    microAmount: bigint,
    type: TransactionType = TransactionType.STX,
    token?: TokenType,
    customTokenContractAddress?: string,
    customTokenContractName?: string,
    customTokenAssetName?: string,
    note?: string,
    nonce?: bigint,
    feeUstx?: bigint,
    memo?: string,
    externalId?: string,
  ): Promise<any> => {
    try {
      // Serialize nonce resolution → sign → broadcast so concurrent transfers for
      // this vault cannot pick the same nonce.
      return await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(nonce);
        const transactionToSign = await this.chainService.serializeTransaction(
          this.address,
          this.publicKey,
          recipientAddress,
          microAmount,
          type,
          token,
          customTokenContractAddress,
          customTokenContractName,
          customTokenAssetName,
          resolvedNonce,
          feeUstx,
          memo,
        );

        const defaultNote = type === TransactionType.FungibleToken
          ? `Transferring ${microToStx(microAmount)} ${customTokenContractName ?? token ?? "token"} to ${recipientAddress}`
          : `Transferring ${microToStx(microAmount)} STX to ${recipientAddress}`;

        const rawSignature = await this.fireblocksService.signTransaction(
          transactionToSign.preSignSigHash,
          this.vaultAccountId.toString(),
          note || defaultNote,
          externalId,
        );

        const signature = concatSignature(rawSignature.fullSig, rawSignature.v);

        (transactionToSign.unsignedTx as any).auth.spendingCondition.signature =
          createMessageSignature(signature);

        return await this.chainService.broadcastTransaction(
          transactionToSign.unsignedTx,
        );
      });
    } catch (error) {
      if (error instanceof ValidationError) return { success: false, error: error.message };
      throw new Error(
        `Failed to build, sign or send transaction: ${formatErrorMessage(
          error,
        )}`,
      );
    }
  };

  private buildSignSendContractCall = async (options: {
    functionName:
      | "delegate-stx"
      | "allow-contract-caller"
      | "revoke-delegate-stx"
      | "solo-stack"
      | "increase-stack-amount"
      | "extend-stack-period";
    poolAddress?: string;
    poolContractName?: string;
    amount?: bigint;
    maxAmount?: bigint;
    lockPeriod?: number;
    extendCycles?: number;
    signerKey?: string;
    signerSig65Hex?: string;
    startBurnHeight?: number;
    authId?: bigint;
    note?: string;
    nonce?: bigint;
    externalId?: string;
  }): Promise<any> => {
    const {
      functionName, poolAddress, poolContractName, amount, maxAmount,
      lockPeriod, extendCycles, signerKey, signerSig65Hex, startBurnHeight,
      authId, note, nonce, externalId,
    } = options;

    try {
      if (functionName === "allow-contract-caller" && (!poolContractName || !poolAddress)) {
        throw new Error("Pool contract name and address must be provided for allow-contract-caller");
      }

      if (functionName === "delegate-stx" && (!amount || !lockPeriod || !poolAddress)) {
        throw new Error("Amount, lock period, and pool address must be provided for delegate-stx");
      }

      if (functionName === "solo-stack" &&
        (!amount || !lockPeriod || !signerSig65Hex || !startBurnHeight || !signerKey || maxAmount == null || authId == null)
      ) {
        throw new Error("Amount, lock period, signer signature, start burn height, signer key, max amount, and auth ID must be provided for solo-stack");
      }

      if (functionName === "increase-stack-amount" &&
        (!amount || !signerSig65Hex || !signerKey || authId == null || maxAmount == null)
      ) {
        throw new Error("Amount, signer signature, signer key, auth ID and max amount must be provided for increase-stack-amount");
      }

      if (functionName === "extend-stack-period" &&
        (!extendCycles || !signerSig65Hex || !signerKey || authId == null || maxAmount == null)
      ) {
        throw new Error("Extend cycles, signer signature, signer key, auth ID and max amount must be provided for extend-stack-period");
      }

      // Serialize nonce resolution → sign → broadcast so concurrent contract
      // calls for this vault cannot pick the same nonce.
      return await this.runNonceExclusive(async () => {
      const resolvedNonce = await this.resolveNonce(nonce);

      let transactionToSign: {
        unsignedContractCall: StacksTransactionWire;
        preSignSigHash: string;
      };

      switch (functionName) {
        case "allow-contract-caller":
          transactionToSign = await this.chainService.allowPoxContractCaller(
            this.publicKey, poolAddress, poolContractName!, resolvedNonce,
          );
          break;
        case "delegate-stx":
          transactionToSign = await this.chainService.delegateStx(
            this.publicKey, poolAddress, amount!, lockPeriod!, resolvedNonce, poolContractName,
          );
          break;
        case "revoke-delegate-stx":
          transactionToSign = await this.chainService.revokeStxDelegation(
            this.publicKey, resolvedNonce,
          );
          break;
        case "solo-stack":
          transactionToSign = await this.chainService.soloStack(
            this.publicKey, signerKey, amount, this.btcRewardsAddress,
            lockPeriod, maxAmount, signerSig65Hex, startBurnHeight, authId, resolvedNonce,
          );
          break;
        case "increase-stack-amount":
          transactionToSign = await this.chainService.increaseStackedStx(
            this.publicKey, signerKey!, amount!, maxAmount!, signerSig65Hex!, authId!, resolvedNonce,
          );
          break;
        case "extend-stack-period":
          transactionToSign = await this.chainService.extendStackingPeriod(
            this.publicKey, signerKey!, this.btcRewardsAddress!, extendCycles!,
            maxAmount!, signerSig65Hex!, authId!, resolvedNonce,
          );
          break;
        default:
          throw new Error(`Unknown contract call function: ${functionName}`);
      }

      const defaultNote = poolAddress && poolContractName
        ? `Calling ${functionName} on ${poolAddress}.${poolContractName}`
        : `Calling ${functionName}`;

      const rawSignature = await this.fireblocksService.signTransaction(
        transactionToSign.preSignSigHash, this.vaultAccountId.toString(), note || defaultNote, externalId,
      );

      const signature = concatSignature(rawSignature.fullSig, rawSignature.v);
      (transactionToSign.unsignedContractCall as any).auth.spendingCondition.signature =
        createMessageSignature(signature);

      return await this.chainService.broadcastTransaction(transactionToSign.unsignedContractCall);
      });
    } catch (error) {
      if (error instanceof ValidationError) return { success: false, error: error.message };
      throw new Error(
        `Failed to build, sign or send contract call transaction: ${formatErrorMessage(error)}`,
      );
    }
  };

  private pox5SignAndBroadcast = async (
    tx: StacksTransactionWire,
    note: string,
    externalId?: string,
    // Optional post-signing gate re-check. Returns a reason string when a
    // time-dependent condition changed during approval (so the tx must be discarded),
    // or undefined when it is still valid.
    revalidate?: () => Promise<string | undefined>,
  ): Promise<{ txid?: string; error?: string; reason?: string }> => {
    const sigHash = tx.signBegin();
    const preSignSigHash = sigHashPreSign(
      sigHash,
      tx.auth.authType,
      (tx.auth.spendingCondition as any).fee,
      (tx.auth.spendingCondition as any).nonce,
    );
    const rawSignature = await this.fireblocksService.signTransaction(
      preSignSigHash, this.vaultAccountId.toString(), note, externalId,
    );
    const signature = concatSignature(rawSignature.fullSig, rawSignature.v);
    (tx as any).auth.spendingCondition.signature = createMessageSignature(signature);

    // Time-dependent gates (prepare phase, bond window, eligibility) can change while
    // Fireblocks approval is pending. Re-check AFTER signing and BEFORE broadcast; if
    // any required value changed, discard the signed transaction rather than
    // broadcasting one the node will reject. No transaction is submitted in that case.
    if (revalidate) {
      const changed = await revalidate();
      if (changed) {
        return { error: `Transaction discarded after signing — ${changed}. No transaction was submitted; retry to sign against current state.` };
      }
    }

    return this.chainService.broadcastTransaction(tx, this.pox5Network);
  };

  // Resolved once at construction from the single network profile, so
  // PoX-5 contract reads, transaction construction, and broadcast use the same
  // chain id / magic bytes / base URL as StacksService's nonce and balance reads.
  private get pox5Network(): StacksNetwork {
    return this._pox5Network;
  }

  /**
   * Encodes optional signer-manager calldata as a Clarity `(optional (buff))`. Some
   * signer managers require calldata; when none is supplied this is `none`, preserving
   * the prior hardcoded behavior.
   */
  private encodeSignerCalldata = (calldata?: Uint8Array | string): ClarityValue =>
    calldata === undefined
      ? Cl.none()
      : Cl.some(typeof calldata === "string" ? Cl.bufferFromHex(calldata) : Cl.buffer(calldata));

  // ─── PoX-5 Solo STX ──────────────────────────────────────────────────────────

  /**
   * Stakes STX through a signer-manager (PoX-5). Replaces pox-4 stackSolo.
   * @param amountStx - Amount of STX to stake (number). Converted to microSTX internally.
   * @param numCycles - Number of cycles to lock (1–96).
   * @param signerManager - The signer-manager contract principal (must have an on-chain grant).
   * @param note - Optional Fireblocks transaction note.
   * @param nonce - Optional nonce override.
   * @param externalId - Optional Fireblocks external ID for idempotency.
   */
  public stake = async (
    amountStx: number,
    numCycles: number,
    signerManager: string,
    note?: string,
    nonce?: bigint,
    externalId?: string,
    signerCalldata?: Uint8Array | string,
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }

      const pox = await fetchPox5Info({ network: this.pox5Network });

      const eligibilityCheck = await this.checkEligibility(pox, amountStx);
      if (!eligibilityCheck.eligible) {
        return { success: false, error: `Account not eligible for staking: ${eligibilityCheck.reason}` };
      }

      const amountUstx = stxToMicro(amountStx);

      // Authoritative contract-gate preflight (signer grant, lock period, overlap)
      // before spending a signature — checkEligibility above does not cover these.
      const preflight = await fetchEligibleStake({
        staker: this.address,
        signerManager,
        amountUstx,
        numCycles,
        startBurnHt: pox.currentBurnchainBlockHeight,
        poxInfo: pox,
        network: this.pox5Network,
      });
      if (!preflight.ok) {
        const reasons = (preflight as { reasons?: number[] }).reasons ?? [];
        return { success: false, error: `Account not eligible for staking: ${this.describeBondReasons(reasons)}` };
      }

      const result = await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(nonce);
        const tx = await this.buildPox5Call(
          "stake",
          [
            Cl.address(signerManager),
            Cl.uint(amountUstx),
            Cl.uint(numCycles),
            Cl.uint(pox.currentBurnchainBlockHeight),
            this.encodeSignerCalldata(signerCalldata),
          ],
          {
            nonce: resolvedNonce,
            // Deny mode bounding the STX lock to exactly the staked amount.
            postConditionMode: PostConditionMode.Deny,
            postConditions: [Pc.origin().willSendEq(amountUstx).ustxToLock()],
          },
        );
        return this.pox5SignAndBroadcast(tx, note || `stake ${amountStx} STX for ${numCycles} cycles`, externalId, async () => {
          // Re-run the authoritative contract-gate check at the current tip: the chain
          // may have advanced (into the prepare phase, past the signer grant, or into a
          // cycle where the tx's start-burn-ht is stale) while the signature was pending
          // Fireblocks approval. startBurnHt stays the value baked into the signed tx.
          const recheck = await fetchEligibleStake({
            staker: this.address!,
            signerManager,
            amountUstx,
            numCycles,
            startBurnHt: pox.currentBurnchainBlockHeight,
            poxInfo: await fetchPox5Info({ network: this.pox5Network }),
            network: this.pox5Network,
          });
          if (!recheck.ok) {
            const reasons = (recheck as { reasons?: number[] }).reasons ?? [];
            return `staking eligibility changed during approval: ${this.describeBondReasons(reasons)}`;
          }
          return undefined;
        });
      });

      if (!result || result.error || !result.txid || result.reason) {
        console.error('stake broadcast rejected:', JSON.stringify(result));
        const parts = [result?.error, result?.reason, (result as any)?.reason_data ? JSON.stringify((result as any).reason_data) : undefined].filter(Boolean);
        return { success: false, error: parts.join(' — ') || 'Failed to broadcast stake transaction' };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          unsettled: !txStatus.success,
          error: txStatus.error || txStatus.data?.tx_error || "Stake transaction failed at the contract level.",
          txHash: result.txid,
        };
      }

      return { success: true, txHash: result.txid };
    } catch (error) {
      return { success: false, error: `Failed to stake: ${formatErrorMessage(error)}` };
    }
  };

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
  public updateStake = async (
    signerManager: string,
    oldSignerManager: string,
    cyclesToExtend?: number,
    increaseByStx?: number,
    note?: string,
    nonce?: bigint,
    externalId?: string,
    signerCalldata?: Uint8Array | string,
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }

      const amountIncrease = increaseByStx ? stxToMicro(increaseByStx) : BigInt(0);

      // Authoritative contract-gate preflight before spending a signature.
      const preflight = await fetchEligibleStakeUpdate({
        staker: this.address,
        signerManager,
        oldSignerManager,
        cyclesToExtend: cyclesToExtend ?? 0,
        amountIncrease,
        network: this.pox5Network,
      });
      if (!preflight.ok) {
        const reasons = (preflight as { reasons?: number[] }).reasons ?? [];
        return { success: false, error: `Cannot update stake: ${this.describeBondReasons(reasons)}` };
      }

      const result = await this.runNonceExclusive(async () => {
        // stake-update always re-locks the position, so the contract's SIP-044
        // stacking-lock event reports the RESULTING TOTAL lock (current position +
        // any increase) — not the increment, and not a generic PoX action. The
        // node's action gate requires that exact total be covered whether the update
        // increases the amount, extends cycles, or only rotates the signer. The
        // current position is read INSIDE the serialized section so a concurrent
        // update on the same vault cannot read a stale base; a failed or "not staked"
        // read fails closed rather than understating the total (which would abort the
        // transaction after the signature is spent).
        const current = await fetchStakerInfo({ address: this.address!, network: this.pox5Network });
        if (!current?.staked) {
          return { error: "Cannot update stake: no active staking position found for this account." };
        }
        const currentAmountUstx = BigInt(current.details.amountUstx);
        const postCondition = Pc.origin().willSendEq(currentAmountUstx + amountIncrease).ustxToLock();

        const resolvedNonce = await this.resolveNonce(nonce);
        const tx = await this.buildPox5Call(
          "stake-update",
          [
            Cl.address(signerManager),
            Cl.address(oldSignerManager),
            Cl.uint(cyclesToExtend ?? 0),
            Cl.uint(amountIncrease),
            this.encodeSignerCalldata(signerCalldata),
          ],
          {
            nonce: resolvedNonce,
            postConditionMode: PostConditionMode.Deny,
            postConditions: [postCondition],
          },
        );
        return this.pox5SignAndBroadcast(tx, note || "update stake position", externalId, async () => {
          // Re-run the authoritative contract-gate check at the current tip: the position,
          // signer grant, or phase may have changed while the signature was pending
          // Fireblocks approval.
          const recheck = await fetchEligibleStakeUpdate({
            staker: this.address!,
            signerManager,
            oldSignerManager,
            cyclesToExtend: cyclesToExtend ?? 0,
            amountIncrease,
            network: this.pox5Network,
          });
          if (!recheck.ok) {
            const reasons = (recheck as { reasons?: number[] }).reasons ?? [];
            return `stake-update eligibility changed during approval: ${this.describeBondReasons(reasons)}`;
          }
          return undefined;
        });
      });

      if (!result || result.error || !result.txid || result.reason) {
        return { success: false, error: result?.error || result?.reason || "Failed to broadcast update-stake transaction" };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          unsettled: !txStatus.success,
          error: txStatus.error || txStatus.data?.tx_error || "Update-stake transaction failed at the contract level.",
          txHash: result.txid,
        };
      }

      return { success: true, txHash: result.txid };
    } catch (error) {
      return { success: false, error: `Failed to update stake: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Unlocks a PoX-5 staking position early (sets unlock to end of current cycle).
   * Reverts if called during the prepare phase — the SDK checks this before submitting.
   * @param note - Optional Fireblocks transaction note.
   * @param nonce - Optional nonce override.
   * @param externalId - Optional Fireblocks external ID for idempotency.
   */
  public unstake = async (
    oldSignerManager: string,
    note?: string,
    nonce?: bigint,
    externalId?: string,
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }

      const pox = await fetchPox5Info({ network: this.pox5Network });
      if (isInPreparePhase({ burnHeight: pox.currentBurnchainBlockHeight, poxInfo: pox })) {
        return { success: false, error: "Cannot unstake during the prepare phase — wait for the reward phase to begin." };
      }

      // Authoritative contract-gate preflight (active stake, signer match, phase).
      const preflight = await fetchEligibleUnstake({
        staker: this.address,
        oldSignerManager,
        poxInfo: pox,
        network: this.pox5Network,
      });
      if (!preflight.ok) {
        const reasons = (preflight as { reasons?: number[] }).reasons ?? [];
        return { success: false, error: `Cannot unstake: ${this.describeBondReasons(reasons)}` };
      }

      const result = await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(nonce);
        const tx = await this.buildPox5Call(
          "unstake",
          [Cl.address(oldSignerManager)],
          {
            nonce: resolvedNonce,
            // Deny mode; unstake performs a PoX unlock with no fixed transfer.
            postConditionMode: PostConditionMode.Deny,
            postConditions: [Pc.origin().willPerformPox()],
          },
        );
        return this.pox5SignAndBroadcast(tx, note || "unstake STX", externalId, async () => {
          // The chain may have advanced into the prepare phase while the signature was
          // pending Fireblocks approval — unstake reverts there, so discard if so.
          const nowPox = await fetchPox5Info({ network: this.pox5Network });
          return isInPreparePhase({ burnHeight: nowPox.currentBurnchainBlockHeight, poxInfo: nowPox })
            ? "the chain entered the prepare phase during approval"
            : undefined;
        });
      });

      if (!result || result.error || !result.txid || result.reason) {
        return { success: false, error: result?.error || result?.reason || "Failed to broadcast unstake transaction" };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          unsettled: !txStatus.success,
          error: txStatus.error || txStatus.data?.tx_error || "Unstake transaction failed at the contract level.",
          txHash: result.txid,
        };
      }

      return { success: true, txHash: result.txid };
    } catch (error) {
      return { success: false, error: `Failed to unstake: ${formatErrorMessage(error)}` };
    }
  };

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
  public grantSignerKey = async (
    signerManager: string,
    authId: bigint,
    note?: string,
    nonce?: bigint,
    externalId?: string,
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }

      const [smAddress, smName] = signerManager.split(".");
      if (!smAddress || !smName) {
        throw new Error(`Invalid signer-manager principal: ${signerManager}. Expected ST….contract-name`);
      }

      // The two Fireblocks operations below (grant message signature and the
      // register-self transaction) must carry DISTINCT external ids, or Fireblocks
      // rejects the second as a duplicate. Derive deterministic per-leg ids that
      // stay correlated to the caller's single operation id.
      const grantExternalId = externalId ? `${externalId}-grant` : undefined;
      const registerExternalId = externalId ? `${externalId}-register` : undefined;

      // Serialize the whole nonce-bearing critical section (both Fireblocks legs
      // plus broadcast) against other operations for this vault.
      const result = await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(nonce);

        // Signature is over the signer-manager contract (register-self grants for current-contract)
        const grantMsgHash = await fetchSignerGrantMessageHash({
          signerManager,
          authId,
          network: this.pox5Network,
        });

        const rawGrantSig = await this.fireblocksService.signTransaction(
          grantMsgHash, this.vaultAccountId.toString(), note || "sign grant signer key message", grantExternalId,
        );
        // pox-5's grant-signer-key verifies this via Clarity's secp256k1-recover?,
        // which expects RSV (r + s + recovery-byte-last) — NOT the VRS format
        // concatSignature produces for Stacks transaction auth signatures.
        const signerSignature = signatureVrsToRsv(concatSignature(rawGrantSig.fullSig, rawGrantSig.v));

        // Call <signerManager>.register-self instead of pox-5.grant-signer-key directly.
        // register-self args: (signer-manager <trait>) (signer-key (buff 33)) (auth-id uint) (signer-sig (buff 65))
        const tx = await makeUnsignedContractCall({
          contractAddress: smAddress,
          contractName: smName,
          functionName: "register-self",
          functionArgs: [
            contractPrincipalCV(smAddress, smName),       // signer-manager trait = the contract itself
            bufferCV(hexToBytes(this.publicKey!)),        // signer-key (buff 33)
            uintCV(authId),                               // auth-id
            bufferCV(hexToBytes(signerSignature)),        // signer-sig (buff 65)
          ],
          publicKey: this.publicKey!,
          fee: DEFAULT_POX_FEE_USTX,
          nonce: resolvedNonce,
          network: this.pox5Network,
          postConditionMode: PostConditionMode.Deny,
          postConditions: [],
        });

        return this.pox5SignAndBroadcast(tx, note || "register signer (register-self)", registerExternalId);
      });

      if (!result || result.error || !result.txid || result.reason) {
        return { success: false, error: result?.error || result?.reason || "Failed to broadcast register-self transaction" };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          unsettled: !txStatus.success,
          error: txStatus.error || txStatus.data?.tx_error || "register-self transaction failed at the contract level.",
          txHash: result.txid,
        };
      }

      return { success: true, txHash: result.txid };
    } catch (error) {
      return { success: false, error: `Failed to register signer key: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Revokes an existing signer key grant from a signer-manager (PoX-5).
   * @param signerManager - The signer-manager contract principal.
   * @param signerKey - 33-byte compressed secp256k1 public key (hex) to revoke.
   * @param note - Optional Fireblocks transaction note.
   * @param nonce - Optional nonce override.
   * @param externalId - Optional Fireblocks external ID for idempotency.
   */
  public revokeSignerGrant = async (
    signerManager: string,
    signerKey: string,
    note?: string,
    nonce?: bigint,
    externalId?: string,
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }

      const result = await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(nonce);
        const tx = await this.buildPox5Call(
          "revoke-signer-grant",
          [Cl.address(signerManager), Cl.buffer(hexToBytes(signerKey))],
          {
            nonce: resolvedNonce,
            // Deny mode with no post-conditions: revoking a signer grant records no
            // PoX/Stacking action and moves no assets, so there is nothing for the
            // node's action gate to cover. A will-perform-PoX condition here would be
            // uncovered and the node would reject the transaction after signing.
            postConditionMode: PostConditionMode.Deny,
            postConditions: [],
          },
        );
        return this.pox5SignAndBroadcast(tx, note || "revoke signer grant", externalId);
      });

      if (!result || result.error || !result.txid || result.reason) {
        return { success: false, error: result?.error || result?.reason || "Failed to broadcast revoke-signer-grant transaction" };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          unsettled: !txStatus.success,
          error: txStatus.error || txStatus.data?.tx_error || "Revoke signer grant transaction failed at the contract level.",
          txHash: result.txid,
        };
      }

      return { success: true, txHash: result.txid };
    } catch (error) {
      return { success: false, error: `Failed to revoke signer grant: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Fetches the current PoX-5 staking position for this vault account.
   */
  public getStakerInfo = async (): Promise<StakerInfoResponse> => {
    try {
      if (!this.address) {
        throw new Error("Address is not set");
      }

      const info = await fetchStakerInfo({ address: this.address, network: this.pox5Network });
      if (!info.staked) {
        return { success: true, staked: false };
      }

      return {
        success: true,
        staked: true,
        details: {
          amount_stx: microToStx(info.details.amountUstx),
          firstRewardCycle: info.details.firstRewardCycle,
          numCycles: info.details.numCycles,
          signerManager: info.details.signer,
        },
      };
    } catch (error) {
      return { success: false, error: `Failed to fetch staker info: ${formatErrorMessage(error)}` };
    }
  };

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
  public verifySignerGrant = async (
    signerManager: string,
    txid?: string,
  ): Promise<VerifySignerGrantResponse> => {
    try {
      if (!this.publicKey) throw new Error("Public key is not set");

      const notes: string[] = [];
      let txStatus: string | null = null;

      if (txid) {
        const poll = await this.waitForTxSettlement(txid);
        txStatus = poll.data?.tx_status ?? null;
        if (txStatus !== 'success') {
          notes.push(`Transaction ${txid} did not succeed (status: ${txStatus ?? 'unknown'}). A broadcast txid does not guarantee contract success — Stacks mines aborted transactions.`);
          return { success: true, grant_exists: false, signer_registered: false, ready_to_stake: false, tx_status: txStatus, notes };
        }
      }

      const signerKey = this.publicKey;
      const [grantExists, signerInfo] = await Promise.all([
        fetchVerifySignerKeyGrant({ signerKey, signerManager, network: this.pox5Network }),
        fetchSignerInfo({ signerManager, network: this.pox5Network }),
      ]);

      const signerRegistered = !!signerInfo?.signerKey;
      const registeredKey = signerInfo?.signerKey ?? null;

      if (!grantExists) {
        notes.push('No unconsumed grant found for this (signerKey, signerManager) pair. Either the grant was never created, has already been consumed (authId reuse), or was revoked.');
      }
      if (!signerRegistered) {
        notes.push('The signer-manager has no registered signer key. The grant alone is not sufficient — registration (register-self or admin path) must also complete before stakes are accepted.');
      }
      if (grantExists && signerRegistered && registeredKey !== signerKey) {
        notes.push(`The registered key (${registeredKey}) does not match the expected signerKey. The signer-manager may be registered to a different signer.`);
      }

      const readyToStake = grantExists && signerRegistered && registeredKey === signerKey;

      return {
        success: true,
        grant_exists: grantExists,
        signer_registered: signerRegistered,
        registered_key: registeredKey,
        ready_to_stake: readyToStake,
        tx_status: txStatus,
        notes: notes.length ? notes : undefined,
      };
    } catch (error) {
      return { success: false, error: `Failed to verify signer grant: ${formatErrorMessage(error)}` };
    }
  };

  public getPox5Info = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const info = await fetchPox5Info({ network: this.pox5Network });
      // bigint fields are not JSON-serializable; stringify them for transport.
      const data = JSON.parse(JSON.stringify(info, (_, v) => typeof v === 'bigint' ? v.toString() : v));
      return { success: true, data };
    } catch (error) {
      return { success: false, error: `Failed to fetch PoX-5 info: ${formatErrorMessage(error)}` };
    }
  };

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

  public createNativeTransaction = async (
    recipientAddress: string,
    amount: number,
    grossTransaction: boolean = false,
    note?: string,
    nonce?: bigint,
    fee?: number,
    memo?: string,
    externalId?: string,
  ): Promise<CreateTransactionResponse> => {
    if (!this.address || !this.publicKey || !this.vaultAccountId) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }

    try {
      const paramsValidationResponse = await this.checkParamsAndAdjustAmount(
        recipientAddress,
        amount,
        grossTransaction,
        TransactionType.STX,
      );

      if (!paramsValidationResponse.validParams) {
        return {
          success: false,
          error: `Invalid transaction parameters: ${paramsValidationResponse.reason}`,
        };
      }

      const microAmount = paramsValidationResponse.finalAmount as bigint;

      const result = await this.buildSignSendTransfer(
        recipientAddress,
        microAmount,
        TransactionType.STX,
        undefined, // token
        undefined, // customTokenContractAddress
        undefined, // customTokenContractName
        undefined, // customTokenAssetName
        note,
        nonce,
        fee !== undefined ? stxToMicro(fee) : undefined,
        memo,
        externalId,
      );

      if (!result || result.error || !result.txid || result.reason) {
        const errorAndReason =
          result.error && result.reason
            ? `${result.error} - ${result.reason}`
            : result.error || result.reason || "unknown error";
        console.error(
          `Transaction broadcast failed: ${formatErrorMessage(errorAndReason)}`,
        );
        return {
          success: false,
          error: result?.error
            ? formatErrorMessage(errorAndReason)
            : "unknown error",
        };
      }

      return {
        success: true,
        txHash: result.txid,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to create transaction: ${formatErrorMessage(error)}`,
      );
    }
  };

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

  public createFTTransaction = async (
    recipientAddress: string,
    amount: number,
    token: TokenType,
    customTokenContractAddress?: string,
    customTokenContractName?: string,
    customTokenAssetName?: string,
    note?: string,
    nonce?: bigint,
    externalId?: string,
  ): Promise<CreateTransactionResponse> => {
    if (!this.address || !this.publicKey || !this.vaultAccountId) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }

    // if custom token, validate contract address, name, and asset name are provided
    if (token === TokenType.CUSTOM) {
      if (!customTokenContractAddress || !customTokenContractName || !customTokenAssetName) {
        return {
          success: false,
          error: `Custom token contract address, name, and asset name must be provided for CUSTOM token type`,
        };
      }
    }

    console.log(
      `Creating FT transaction: ${amount} ${token} to ${recipientAddress}`,
    );

    try {
      const paramsValidationResponse = await this.checkParamsAndAdjustAmount(
        recipientAddress,
        amount,
        undefined, // Gross transaction not applicable for FT transfers
        TransactionType.FungibleToken,
        token,
        customTokenContractAddress,
        customTokenContractName,
      );

      if (!paramsValidationResponse.validParams) {
        return {
          success: false,
          error: `Invalid transaction parameters: ${paramsValidationResponse.reason}`,
        };
      }

      const microAmount = paramsValidationResponse.finalAmount as bigint;
      const result = await this.buildSignSendTransfer(
        recipientAddress,
        microAmount,
        TransactionType.FungibleToken,
        token,
        customTokenContractAddress,
        customTokenContractName,
        customTokenAssetName,
        note,
        nonce,
        undefined, // feeUstx
        undefined, // memo
        externalId,
      );

      if (!result || result.error || !result.txid || result.reason) {
        const errorAndReason =
          result?.error && result?.reason
            ? `${result.error} - ${result.reason}`
            : result?.error || result?.reason || "unknown error";
        console.error(
          `FT transaction broadcast failed: ${formatErrorMessage(errorAndReason)}`,
        );
        return {
          success: false,
          error: formatErrorMessage(errorAndReason),
        };
      }

      return {
        success: true,
        txHash: result.txid,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to create transaction: ${formatErrorMessage(error)}`,
      );
    }
  };

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

  public delegateToPool = async (
    poolsAddress: string,
    poolContractName: string,
    amount: number,
    lockPeriod: number,
    nonce?: bigint,
    externalId?: string,
  ): Promise<CreateTransactionResponse> => {
    if (this.testnet) {
      console.log(`[WARNING] delegateToPool is not supported on testnet.`);
      return {
        success: false,
        error: `delegateToPool is not supported on testnet.`,
      };
    }

    if (!this.address || !this.publicKey || !this.vaultAccountId) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }

    try {
      const status = await this.checkStatus();
      if (!status.success) {
        return {
          success: false,
          error: `Failed to check account status before delegating STX: ${status.error}`,
        };
      }

      if (status.data?.delegation.is_delegated) {
        return {
          success: false,
          error: `Account already has an active delegation to ${status.data.delegation.delegated_to}, if you wish to change delegation please revoke existing delegation first, run checkStatus for more info.`,
        };
      }

      console.log(
        `Delegating ${amount} STX to pool: ${poolsAddress} for ${lockPeriod} cycles`,
      );

      // Delegate STX to pool address
      const delegateResult = await this.buildSignSendContractCall({
        functionName: "delegate-stx",
        poolAddress: poolsAddress,
        poolContractName,
        amount: stxToMicro(amount),
        lockPeriod,
        nonce,
        externalId,
      });

      const assertDelegateResult = assertResultSuccess(delegateResult);
      if (assertDelegateResult.success === false) {
        return {
          success: false,
          error: `Failed to delegate STX: ${assertDelegateResult.error}`,
        };
      }

      console.log(
        `Successfully delegated ${amount} STX to pool ${poolsAddress}.${poolContractName}`,
      );
      return {
        success: true,
        txHash: delegateResult.txid,
      };
    } catch (error: any) {
      console.error(`Error delegating to pool: ${formatErrorMessage(error)}`);
      return {
        success: false,
        error: `Failed to delegate to pool: ${formatErrorMessage(error)}`,
      };
    }
  };

  /**
   * Allows a stacking pool to lock delegated STX on behalf of the delegator.
   * @param poolsAddress - The address of the stacking pool.
   * @param poolContractName - The contract name of the stacking pool.
   * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
   * @returns A promise that resolves to a {CreateTransactionResponse}.
   * @throws {Error} If the address, public key, or vault ID are not set, or if the process fails.
   */

  public allowContractCaller = async (
    poolsAddress: string,
    poolContractName: string,
    nonce?: bigint,
    externalId?: string,
  ): Promise<CreateTransactionResponse> => {
    if (this.testnet) {
      console.log(`[WARNING] allowContractCaller is not supported on testnet.`);
      return {
        success: false,
        error: `allowContractCaller is not supported on testnet.`,
      };
    }

    if (!this.address || !this.publicKey || !this.vaultAccountId) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }

    console.log(
      `Allowing ${poolsAddress}.${poolContractName} as PoX contract caller on behalf of ${this.address}`,
    );

    try {
      // Allow contract caller
      const allowCallerResult = await this.buildSignSendContractCall({
        functionName: "allow-contract-caller",
        poolAddress: poolsAddress,
        poolContractName,
        nonce,
        externalId,
      });

      const assertAllowCallerResult = assertResultSuccess(allowCallerResult);
      if (assertAllowCallerResult.success === false) {
        return {
          success: false,
          error: `Failed to allow contract caller: ${assertAllowCallerResult.error}`,
        };
      }

      console.log(
        `Successfully allowed contract caller for pool ${poolsAddress}.${poolContractName}`,
      );

      return {
        success: true,
        txHash: allowCallerResult.txid,
      };
    } catch (error: any) {
      console.error(
        `Error allowing contract caller: ${formatErrorMessage(error)}`,
      );
      return {
        success: false,
        error: `Failed to allow contract caller: ${formatErrorMessage(error)}`,
      };
    }
  };

  /**
   * Revoke any STX delegation to any address for this account.
   * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
   * @returns A promise that resolves to a {CreateTransactionResponse}.
   * @throws {Error} If the address, public key, or vault ID are not set, or if the process fails.
   */

  public revokeDelegation = async (nonce?: bigint, externalId?: string): Promise<CreateTransactionResponse> => {
    if (this.testnet) {
      console.log(`[WARNING] revokeDelegation is not supported on testnet.`);
      return {
        success: false,
        error: `revokeDelegation is not supported on testnet.`,
      };
    }

    if (!this.address || !this.publicKey || !this.vaultAccountId) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }

    console.log(`Revoking STX delegations from address: ${this.address}`);

    try {
      // Revoke any existing delegations.
      const revokeResult = await this.buildSignSendContractCall({
        functionName: "revoke-delegate-stx",
        nonce,
        externalId,
      });

      const assertDelegateResult = assertResultSuccess(revokeResult);
      if (assertDelegateResult.success === false) {
        return {
          success: false,
          error: `Failed to delegate STX: ${assertDelegateResult.error}`,
        };
      }

      console.log(
        `Successfully revoked STX delegations from address ${this.address}`,
      );
      return {
        success: true,
        txHash: revokeResult.txid,
      };
    } catch (error: any) {
      console.error(`Error revoking delegation: ${formatErrorMessage(error)}`);
      return {
        success: false,
        error: `Failed to revoke delegation: ${formatErrorMessage(error)}`,
      };
    }
  };

  // --- BTC Bond helpers ---

  private esploraBase(): string {
    return this.networkProfile.esploraBaseUrl;
  }

  /**
   * Estimates a Bitcoin fee (sats) for a spend of ~`vbytes` from Esplora's
   * `/fee-estimates`, so recovery/rollover spends are broadcast with an adequate fee
   * rather than a fixed guess that can strand a transaction unconfirmed. Falls back to
   * a conservative floor if the estimate is unavailable, so recovery is never blocked.
   */
  private estimateBtcFeeSats = async (vbytes: number, confTarget = 6): Promise<bigint> => {
    try {
      const res = await fetch(`${this.esploraBase()}/fee-estimates`);
      if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
      const rates = (await res.json()) as Record<string, number>;
      const rate = rates[String(confTarget)] ?? rates['6'] ?? rates['1'];
      if (typeof rate !== 'number' || !(rate > 0)) throw new Error('no usable fee rate');
      return BigInt(Math.ceil(rate * vbytes));
    } catch {
      // Fee-estimate endpoint unavailable: fall back to a 500-sat floor (or 2 sat/vB
      // for larger spends) so recovery is never blocked. This is a flat fallback, so an
      // RBF bump during an outage still needs an explicit higher opts.feeSats to satisfy
      // BIP-125's fee-increase rule.
      return BigInt(Math.max(500, vbytes * 2));
    }
  };

  private waitForBtcConfirmations = async (
    btcTxid: string,
    required = 3,
    pollMs = 30_000,
    timeoutMs = 90 * 60_000,
  ): Promise<{ blockHash: string }> => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const tx = await fetch(`${this.esploraBase()}/tx/${btcTxid}`).then(r => r.json());
      if (tx?.status?.confirmed && tx.status.block_hash) {
        const confirmations = tx.status.block_height
          ? (await fetch(`${this.esploraBase()}/blocks/tip/height`).then(r => r.json())) - tx.status.block_height + 1
          : 0;
        if (confirmations >= required) return { blockHash: tx.status.block_hash };
      }
      await new Promise(r => setTimeout(r, pollMs));
    }
    throw new Error(`BTC tx ${btcTxid} did not reach ${required} confirmations within ${timeoutMs / 60000} minutes`);
  };

  /**
   * Fetches the confirmed BTC transaction, its block header, and its Merkle proof from
   * Esplora, and builds the SPV lockup proof for `register-for-bond` / `renew-bond`.
   * @param outputScript - Expected P2WSH output script the lock transaction must pay to.
   * @param unlockHeight - Burn height at which the lock becomes spendable.
   */
  private assembleLockupProof = async (
    btcTxid: string,
    blockHash: string,
    outputScript: Uint8Array,
    unlockHeight: number,
  ) => {
    const [txHex, headerHex, merkleProof, blockMeta] = await Promise.all([
      fetch(`${this.esploraBase()}/tx/${btcTxid}/hex`).then(r => r.text()),
      fetch(`${this.esploraBase()}/block/${blockHash}/header`).then(r => r.text()),
      fetch(`${this.esploraBase()}/tx/${btcTxid}/merkle-proof`).then(r => r.json()),
      fetch(`${this.esploraBase()}/block/${blockHash}`).then(r => r.json()),
    ]);
    return {
      ...buildLockProof({
        txHex,
        header: headerHex,
        merkleProof,
        txCount: blockMeta.tx_count,
        expectedScript: outputScript,
      }),
      unlockBurnHeight: unlockHeight,
    };
  };

  /**
   * Builds an unsigned `register-for-bond` contract call with the corrected output
   * tuple. The pinned `@stacks/bitcoin-staking` `lockupToCV` omits the
   * `unlock-burn-height` field that the pox-5 contract requires per output, so the
   * node rejects every native enrollment/renewal with a `BadFunctionArgument`
   * tuple-type mismatch — and only after the Bitcoin has already been committed.
   * We construct the arguments locally against the current ABI instead of
   * delegating to the dependency builder.
   */
  private buildRegisterForBondTx = async (args: {
    bondIndex: number;
    signerManager: string;
    amountUstx: bigint;
    // Native BTC lockup (SPV proof + unlock bytes)…
    outputs?: Awaited<ReturnType<StacksSDK["assembleLockupProof"]>>[];
    unlockBytes?: Uint8Array | string;
    // …or an sBTC lockup (amount only). Exactly one form must be supplied.
    sbtcSats?: bigint;
    nonce: bigint;
    postConditionMode?: PostConditionMode;
    postConditions?: PostCondition[];
    signerCalldata?: Uint8Array | string;
  }): Promise<StacksTransactionWire> => {
    const buf = (v: Uint8Array | string) =>
      typeof v === "string" ? Cl.bufferFromHex(v) : Cl.buffer(v);
    const bootAddr = (this.pox5Network as any).bootAddress as string;

    // sBTC lockup is the (err uint) response variant; native BTC is the (ok tuple).
    const lockupCV = args.sbtcSats !== undefined
      ? Cl.error(Cl.uint(args.sbtcSats))
      : Cl.ok(
      Cl.tuple({
        outputs: Cl.list(
          (args.outputs ?? []).map((o) =>
            Cl.tuple({
              height: Cl.uint(o.height),
              tx: buf(o.tx),
              "output-index": Cl.uint(o.outputIndex),
              header: buf(o.header),
              "leaf-hashes": Cl.list(o.leafHashes.map((h) => buf(h))),
              "tx-count": Cl.uint(o.txCount),
              "tx-index": Cl.uint(o.txIndex),
              amount: Cl.uint(o.amount),
              // The field the dependency builder drops, but the contract requires.
              "unlock-burn-height": Cl.uint(o.unlockBurnHeight),
            }),
          ),
        ),
        "staker-unlock-bytes": buf(args.unlockBytes ?? new Uint8Array()),
      }),
    );

    return makeUnsignedContractCall({
      contractAddress: bootAddr,
      contractName: "pox-5",
      functionName: "register-for-bond",
      functionArgs: [
        Cl.uint(args.bondIndex),
        Cl.address(args.signerManager),
        Cl.uint(args.amountUstx),
        lockupCV,
        this.encodeSignerCalldata(args.signerCalldata),
      ],
      publicKey: this.publicKey!,
      fee: DEFAULT_POX_FEE_USTX,
      nonce: args.nonce,
      network: this.pox5Network,
      // Fail closed: fund-moving PoX-5 calls must opt IN to any asset movement, so
      // the default is Deny with no conditions rather than permissive Allow.
      postConditionMode: args.postConditionMode ?? PostConditionMode.Deny,
      postConditions: args.postConditions ?? [],
    });
  };

  /**
   * Builds an unsigned pox-5 contract call via the fork's `makeUnsignedContractCall`
   * (top-level @stacks/transactions), which — unlike the `@stacks/bitcoin-staking`
   * builders' pinned nested copy — understands the `staking`/`pox` post-condition
   * wire types. Used for the fund-moving PoX-5 calls that must carry deny-mode
   * post-conditions; the dependency builders cannot serialize those here.
   */
  private buildPox5Call = async (
    functionName: string,
    functionArgs: ClarityValue[],
    opts: {
      nonce: bigint;
      postConditions?: PostCondition[];
      postConditionMode?: PostConditionMode;
    },
  ): Promise<StacksTransactionWire> => {
    const bootAddr = (this.pox5Network as any).bootAddress as string;
    return makeUnsignedContractCall({
      contractAddress: bootAddr,
      contractName: "pox-5",
      functionName,
      functionArgs,
      publicKey: this.publicKey!,
      fee: DEFAULT_POX_FEE_USTX,
      nonce: opts.nonce,
      network: this.pox5Network,
      // Fail closed: default to Deny with no conditions so a caller must explicitly
      // authorize any asset movement rather than inheriting permissive Allow.
      postConditionMode: opts.postConditionMode ?? PostConditionMode.Deny,
      postConditions: opts.postConditions ?? [],
    });
  };

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
  private resolveSbtcAsset = async (
    override?: { contractAddress: string; contractName: string; assetName: string },
  ): Promise<{ contractAddress: string; contractName: string; assetName: string } | undefined> => {
    // The network's sBTC contract is immutable, so the successfully-resolved value is
    // cached and reused on the common (no-override) path — e.g. the per-cycle reward
    // claim loop — instead of re-reading /v2/pox each time. Only successes are cached.
    let resolved = this.sbtcAssetCache;
    if (!resolved) {
      let sbtcContractId: string | undefined;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15_000);
        try {
          const res = await fetch(`${this.networkProfile.stacksApiUrl}/v2/pox`, { signal: controller.signal });
          if (!res.ok) return undefined;
          const body = (await res.json()) as { pox_5_sbtc_contract?: unknown };
          if (typeof body.pox_5_sbtc_contract === "string") {
            sbtcContractId = body.pox_5_sbtc_contract;
          }
        } finally {
          clearTimeout(timer);
        }
      } catch {
        return undefined;
      }
      if (!sbtcContractId) return undefined;

      const [contractAddress, contractName] = sbtcContractId.split(".");
      if (!contractAddress || !contractName) return undefined;

      // The contract must belong to the selected network — this rejects a mainnet
      // asset resolved against a testnet node and vice versa.
      if (!validateAddress(contractAddress, this.testnet)) return undefined;

      resolved = { contractAddress, contractName, assetName: "sbtc-token" };
      this.sbtcAssetCache = resolved;
    }

    // An override may only re-select the exact contract the node reports; it cannot
    // point the post-condition at a different token or bypass network validation.
    if (
      override &&
      (override.contractAddress !== resolved.contractAddress ||
        override.contractName !== resolved.contractName ||
        override.assetName !== resolved.assetName)
    ) {
      return undefined;
    }

    return resolved;
  };

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
  private signerManagerAllowedError = (signerManager: string): string | undefined => {
    if (this.signerManagerRegistry.size > 0 && !this.signerManagerRegistry.has(signerManager)) {
      return `Signer manager ${signerManager} is not in the configured signerManagerAdapters allowlist — refusing to proceed.`;
    }
    return undefined;
  };

  private resolveBondStxAmount = (
    contractMin: bigint,
    override?: bigint,
  ): { amountUstx: bigint } | { error: string } => {
    if (override === undefined) return { amountUstx: contractMin };
    if (this.maxBondStxUstx === undefined) {
      return { error: "A paired-STX amount override requires an explicit maxBondStxUstx policy on the SDK; none is configured." };
    }
    if (override < contractMin) {
      return { error: `Paired-STX override ${microToStx(override)} STX is below the contract minimum ${microToStx(contractMin)} STX for this bond.` };
    }
    if (override > this.maxBondStxUstx) {
      return { error: `Paired-STX override ${microToStx(override)} STX exceeds the configured maxBondStxUstx ceiling ${microToStx(this.maxBondStxUstx)} STX.` };
    }
    return { amountUstx: override };
  };

  /** Renders `fetchEligibleRegisterForBond` reason codes into a readable string. */
  private describeBondReasons = (reasons: number[]): string =>
    reasons
      .map((r) => {
        const d = describePox5Error(r);
        return d ? `${d.name} (${d.description})` : `code ${r}`;
      })
      .join("; ");

  /**
   * Rotates a paired bond's signer manager before the bond period starts
   * (canonical `update-bond-registration`). Runs the contract eligibility preflight
   * first, then records the new manager so reward discovery routes to it.
   */
  public updateBondRegistration = async (
    signerManager: string,
    oldSignerManager: string,
    opts?: { note?: string; nonce?: bigint; externalId?: string },
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }

      // The contract rotates the signer of the staker's CURRENT bond membership; it
      // receives no bond index. Read that membership here (fetchBondMembership throws
      // on a read failure, so a transport error fails closed before any signature is
      // spent) so the local record is updated under the chain-derived bond, never a
      // stale caller-supplied index.
      const membershipBefore = await fetchBondMembership({ address: this.address, network: this.pox5Network });
      if (!membershipBefore) {
        return { success: false, error: "No active bond membership to rotate the signer for." };
      }

      const eligible = await fetchEligibleUpdateBondRegistration({
        staker: this.address,
        signerManager,
        oldSignerManager,
        network: this.pox5Network,
      });
      if (!eligible.ok) {
        const reasons = (eligible as { reasons?: number[] }).reasons ?? [];
        return { success: false, error: `Cannot update bond registration: ${this.describeBondReasons(reasons)}` };
      }

      const result = await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(opts?.nonce);
        const tx = await this.buildPox5Call(
          "update-bond-registration",
          [Cl.address(signerManager), Cl.address(oldSignerManager), Cl.none()],
          {
            nonce: resolvedNonce,
            // Deny mode; a pre-start signer swap moves no assets but the contract
            // still records a PoX action, which the node's action gate requires be
            // covered by a will-perform-PoX condition.
            postConditionMode: PostConditionMode.Deny,
            postConditions: [Pc.origin().willPerformPox()],
          },
        );
        return this.pox5SignAndBroadcast(tx, opts?.note ?? `update-bond-registration-${membershipBefore.bondIndex}`, opts?.externalId);
      });

      if (!result?.txid || result.error || result.reason) {
        return { success: false, error: result?.error ?? result?.reason ?? "broadcast failed" };
      }

      const settled = await this.waitForTxSettlement(result.txid);
      if (!settled.success || settled.data?.tx_status !== "success") {
        return { success: false, unsettled: !settled.success, error: settled.data?.tx_error ?? "update-bond-registration failed on-chain", txHash: result.txid };
      }

      // Re-read membership after settlement. If the affected bond changed during the
      // operation, report the mismatch rather than silently rewriting another bond's
      // record. A failed re-read falls back to the pre-call bond (this call rotates
      // the signer of the same bond; it does not move the staker between bonds).
      const membershipAfter = await fetchBondMembership({ address: this.address, network: this.pox5Network }).catch(() => null);
      if (membershipAfter && membershipAfter.bondIndex !== membershipBefore.bondIndex) {
        return {
          success: true,
          txHash: result.txid,
          warning: `Signer rotation confirmed, but the active bond changed from ${membershipBefore.bondIndex} to ${membershipAfter.bondIndex} during the operation; local record not updated — re-run reward discovery to reconcile.`,
        };
      }

      const derivedBondIndex = membershipBefore.bondIndex;
      const existing = await this.lockRecordStore.loadRecord(this.address, derivedBondIndex).catch(() => null);
      if (!existing) {
        return {
          success: true,
          txHash: result.txid,
          warning: `Signer rotation confirmed for bond ${derivedBondIndex}, but no durable lock record exists to update — reward routing for this bond may be stale until a record is present.`,
        };
      }
      // Record the rotated manager so reward discovery uses it for this bond
      // (pre-start rotation governs the whole bond period).
      await this.lockRecordStore.saveRecord(this.address, derivedBondIndex, { ...existing, signerManager });

      return { success: true, txHash: result.txid };
    } catch (error) {
      return { success: false, error: `Failed to update bond registration: ${formatErrorMessage(error)}` };
    }
  };

  // --- PoX-5 BTC Bond methods ---

  /**
   * Creates a native-BTC PoX-5 bond: locks BTC on L1 via Fireblocks and registers
   * the paired STX position on L2 with a full SPV proof.
   *
   * Steps: allowlist check → bond params → STX ratio → lock script → send BTC via
   * Fireblocks → wait for confirmations → assemble SPV proof → register-for-bond.
   *
   * NOTE: This call blocks until Bitcoin confirmations are received (~30 min typical).
   */
  public createBond = async (
    bondIndex: number,
    btcAmountSats: bigint,
    signerManager: string,
    opts?: { note?: string; nonce?: bigint; externalId?: string; confirmations?: number; btcTxid?: string; amountUstxOverride?: bigint; signerCalldata?: Uint8Array | string },
  ): Promise<CreateBondResult> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error('Address, Public Key or Vault ID are not set');
      }
      const storeError = await this.assertDurableLockStore();
      if (storeError) return { success: false, error: storeError };

      const smAllowError = this.signerManagerAllowedError(signerManager);
      if (smAllowError) return { success: false, error: smAllowError };

      // Step 1 — allowlist check
      const allowance = await fetchBondAllowance({ bondIndex, address: this.address, network: this.pox5Network });
      if (allowance < btcAmountSats) {
        return { success: false, error: `Not allowlisted for ${btcAmountSats} sats on bond ${bondIndex} (cap: ${allowance} sats)` };
      }

      // Step 2 — fetch bond params + pox info in parallel
      const [pox, bond] = await Promise.all([
        fetchPox5Info({ network: this.pox5Network }),
        fetchBond({ bondIndex, network: this.pox5Network }),
      ]);
      if (!bond) return { success: false, error: `Bond ${bondIndex} not found` };

      // Step 3 — required paired STX. The amount is derived from the bond's sats
      // value; any override is bounded by the SDK's maxBondStxUstx policy.
      const contractMinUstx = minUstxForSatsAmount({
        sats: btcAmountSats,
        stxValueRatio: bond.stxValueRatio,
        minUstxRatioBps: bond.minUstxRatioBps,
      });
      const amountResolution = this.resolveBondStxAmount(contractMinUstx, opts?.amountUstxOverride);
      if ("error" in amountResolution) return { success: false, error: amountResolution.error };
      const amountUstx = amountResolution.amountUstx;

      const accountStatus = await fetchAccountStatus({ address: this.address, network: this.pox5Network });
      // Fee-first liquidity rule, matching the contract: the Stacks transaction fee
      // must be paid from UNLOCKED balance, and the required paired-STX lock may be
      // satisfied by unlocked-after-fee PLUS already-locked STX (so a rollover that
      // reuses a still-locked position is not falsely rejected). The node's
      // /v2/accounts `balance` is the unlocked amount and already excludes `locked`.
      const unlockedStx = accountStatus.balance;
      const lockedStx = accountStatus.locked ?? BigInt(0);
      if (unlockedStx < DEFAULT_POX_FEE_USTX) {
        return { success: false, error: `Insufficient unlocked STX for the transaction fee: need ${microToStx(DEFAULT_POX_FEE_USTX)} STX unlocked but only ${microToStx(unlockedStx)} available` };
      }
      if ((unlockedStx - DEFAULT_POX_FEE_USTX) + lockedStx < amountUstx) {
        return { success: false, error: `Insufficient STX to lock ${microToStx(amountUstx)} STX: unlocked-after-fee ${microToStx(unlockedStx - DEFAULT_POX_FEE_USTX)} + locked ${microToStx(lockedStx)} is short` };
      }

      // Step 3b — evaluate every deterministic contract gate BEFORE moving any
      // Bitcoin. This covers prepare phase, ERR_ALREADY_STAKED, ERR_TOO_MUCH_SATS,
      // ERR_BOND_ALREADY_STARTED, STX ratio, and the signer-manager grant — all of
      // which the contract enforces. Without it, a predictable rejection would leave
      // the satoshis irreversibly timelocked with no matching registration.
      const preflight = await fetchEligibleRegisterForBond({
        bondIndex,
        staker: this.address,
        amountUstx,
        satsTotal: btcAmountSats,
        signerManager,
        poxInfo: pox,
        network: this.pox5Network,
      });
      if (!preflight.ok) {
        const reasons = (preflight as { reasons?: number[] }).reasons ?? [];
        return { success: false, error: `Not eligible to register for bond ${bondIndex} (no BTC committed): ${this.describeBondReasons(reasons)}` };
      }

      // Step 4 — compute unlock height
      const firstBondCycle = firstPox5RewardCycle(pox);
      if (firstBondCycle === undefined) return { success: false, error: 'pox-5 not yet configured on this network' };

      // Step 5 — build lock script + derive P2WSH address
      const metadata = buildRegisterMetadata({
        bondIndex,
        poxInfo: pox,
        bitcoinPublicKey: this.publicKey,
        stxAddress: this.address,
        earlyUnlockBytes: bond.earlyUnlockBytes,
        network: this.pox5Network,
      });

      // Step 6 — cross-check script vs contract (prevents funding an unverifiable address)
      // The library's fetchConstructLockupOutputScript doesn't handle (ok (buff N)) returns —
      // call the contract directly and unwrap the ResponseOk wrapper ourselves.
      {
        const bootAddr = (this.pox5Network as any)?.bootAddress ?? (this.testnet ? 'ST000000000000000000002AMW42H' : 'SP000000000000000000002Q6VF78');
        const buf = (v: Uint8Array | string) => typeof v === 'string' ? Cl.bufferFromHex(v) : Cl.buffer(v);
        const rawResult = await fetchCallReadOnlyFunction({
          contractAddress: bootAddr,
          contractName: 'pox-5',
          functionName: 'construct-lockup-output-script',
          functionArgs: [
            Cl.address(this.address!),
            Cl.uint(metadata.unlockHeight),
            buf(metadata.unlockBytes),
            buf(bond.earlyUnlockBytes),
          ],
          senderAddress: bootAddr,
          network: this.pox5Network,
        });
        if (rawResult.type === ClarityType.ResponseErr) {
          return { success: false, error: `construct-lockup-output-script contract error: ${Cl.prettyPrint((rawResult as any).value)}` };
        }
        // Unwrap (ok (buff N)) or plain (buff N)
        const inner = rawResult.type === ClarityType.ResponseOk ? (rawResult as any).value : rawResult;
        const onchainScriptHex: string = inner.value;
        if (bytesToHex(metadata.outputScript) !== onchainScriptHex.replace(/^0x/, '')) {
          return { success: false, error: `Lockup script mismatch — SDK: ${bytesToHex(metadata.outputScript)}, contract: ${onchainScriptHex}` };
        }
      }

      // Early-exit cosigner preflight (opt-in). Before any BTC is locked, verify the
      // cosigner service is reachable AND holds the exact key committed into this
      // bond's lock script — a mismatch or an unreachable service would make early
      // exit impossible, so funding is refused when this policy is enabled.
      if (this.verifyEarlyExitCosignerAtFunding) {
        try {
          const cosigner = new CosignerService(resolveCosignerUrl(this.testnet));
          const earlyUnlockBytes = typeof bond.earlyUnlockBytes === 'string'
            ? hexToBytes(bond.earlyUnlockBytes)
            : bond.earlyUnlockBytes;
          await cosigner.verifyCommittedKey(earlyUnlockBytes);
        } catch (error) {
          return { success: false, error: `Early-exit cosigner preflight failed (no BTC committed): ${formatErrorMessage(error)}` };
        }
      }

      // Deterministic funding id + idempotent resume. Load any prior attempt for this
      // (address, bondIndex) first: if the exact same lock was already funded, we must
      // NOT send a second Bitcoin transaction — resume from the recorded txid instead.
      const fundingExternalId = this.deriveFundingExternalId(bondIndex, metadata.lockAddress);
      const priorRecord = await this.lockRecordStore.loadRecord(this.address, bondIndex).catch(() => null);
      const canResumeFunding =
        priorRecord?.btcTxid !== undefined &&
        priorRecord.lockAddress === metadata.lockAddress;

      // Persist the immutable lock record BEFORE funding, so a crash after the BTC send
      // still leaves enough to recover the outpoint by lock address. The funding
      // outpoint (btcTxid/vout) is filled in once known below.
      const lockRecord: BondLockRecord = {
        bondIndex,
        unlockBytes: metadata.unlockBytes,
        lockAddress: metadata.lockAddress,
        unlockHeight: metadata.unlockHeight,
        amountSats: BigInt(btcAmountSats),
        isL1Lock: true,
        signerManager,
        firstRewardCycle: bondPeriodToRewardCycle({ bondIndex, poxInfo: pox }),
        fundingExternalId,
        stage: "lock-fixed",
      };
      // Persist the fixed lock parameters (address/script/amount/external id) BEFORE
      // any funding attempt, so a crash before funding still leaves recoverable state.
      // The funding branches below advance the stage and fill in the outpoint.
      await this.lockRecordStore.saveRecord(this.address, bondIndex, lockRecord);

      // Step 7 — fund lock address (idempotent).
      let btcTxid: string;
      if (opts?.btcTxid) {
        // Caller-supplied funding (e.g. faucet on regtest) takes precedence.
        btcTxid = opts.btcTxid;
        await this.lockRecordStore.saveRecord(this.address, bondIndex, { ...lockRecord, btcTxid, stage: "btc-broadcast" });
      } else if (canResumeFunding) {
        // Resume: this exact lock was already funded — never send BTC twice.
        btcTxid = priorRecord!.btcTxid!;
      } else {
        // Record intent (with the deterministic external id) before calling Fireblocks,
        // so a crash mid-send is recoverable and a retry reuses the same id — which
        // Fireblocks de-duplicates, preventing a double funding transfer.
        await this.lockRecordStore.saveRecord(this.address, bondIndex, { ...lockRecord, stage: "funding-requested" });
        const result = await this.fireblocksService.createBitcoinTransaction(
          metadata.lockAddress,
          btcAmountSats,
          this.vaultAccountId.toString(),
          opts?.note || `BTC bond ${bondIndex} lock`,
          fundingExternalId,
        );
        btcTxid = result.btcTxid;
        await this.lockRecordStore.saveRecord(this.address, bondIndex, { ...lockRecord, btcTxid, stage: "btc-broadcast" });
      }

      // Step 8 — wait for Bitcoin confirmations
      const { blockHash } = await this.waitForBtcConfirmations(btcTxid, opts?.confirmations ?? 3);
      await this.lockRecordStore.saveRecord(this.address, bondIndex, { ...lockRecord, btcTxid, stage: "btc-confirmed" });

      // Step 9 — assemble SPV proof
      const lockupProof = await this.assembleLockupProof(btcTxid, blockHash, metadata.outputScript, metadata.unlockHeight);

      // Record the resolved funding outpoint so recovery selects by outpoint.
      await this.lockRecordStore.saveRecord(this.address, bondIndex, {
        ...lockRecord,
        btcTxid,
        vout: lockupProof.outputIndex,
        stage: "proof-built",
      });

      // Re-run eligibility with the SPV proof attached to cover the block-header
      // and duplicate-outpoint gates before spending the L2 signature.
      const proofPreflight = await fetchEligibleRegisterForBond({
        bondIndex,
        staker: this.address,
        amountUstx,
        satsTotal: btcAmountSats,
        signerManager,
        poxInfo: pox,
        outputs: [lockupProof],
        network: this.pox5Network,
      });
      if (!proofPreflight.ok) {
        const reasons = (proofPreflight as { reasons?: number[] }).reasons ?? [];
        return {
          success: false,
          error: `SPV proof preflight failed for bond ${bondIndex} (BTC is locked; recover via unlockMaturedBond/spendEarlyExitUtxo): ${this.describeBondReasons(reasons)}`,
          btcTxid,
          vout: lockupProof.outputIndex,
        };
      }

      // Step 10 — register on L2. Only the nonce→sign→broadcast is serialized;
      // the Bitcoin confirmation waits above ran outside the lock.
      const result = await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(opts?.nonce);
        const tx = await this.buildRegisterForBondTx({
          bondIndex,
          signerManager,
          amountUstx,
          outputs: [lockupProof],
          unlockBytes: metadata.unlockBytes,
          nonce: resolvedNonce,
          signerCalldata: opts?.signerCalldata,
          // Bound the paired STX lock to exactly the required amount.
          postConditionMode: PostConditionMode.Deny,
          postConditions: [Pc.origin().willSendEq(amountUstx).ustxToLock()],
        });
        return this.pox5SignAndBroadcast(
          tx,
          opts?.note ?? 'register-for-bond',
          opts?.externalId ? `${opts.externalId}-register` : undefined,
          async () => {
            // BTC is already locked at this point; the bond window / eligibility can
            // still change during L2 approval (e.g. ERR_BOND_ALREADY_STARTED). Re-check
            // against the CURRENT height and discard rather than broadcast a doomed
            // register — the BTC remains recoverable and the L2 tx can be retried.
            const nowPox = await fetchPox5Info({ network: this.pox5Network });
            const recheck = await fetchEligibleRegisterForBond({
              bondIndex,
              staker: this.address!,
              amountUstx,
              satsTotal: btcAmountSats,
              signerManager,
              poxInfo: nowPox,
              outputs: [lockupProof],
              network: this.pox5Network,
            });
            if (!recheck.ok) {
              const reasons = (recheck as { reasons?: number[] }).reasons ?? [];
              return `bond eligibility changed during approval: ${this.describeBondReasons(reasons)}`;
            }
            return undefined;
          },
        );
      });
      if (!result?.txid || result.error || result.reason) {
        console.error('register-for-bond broadcast failed:', JSON.stringify(result));
        const parts = [result?.error, result?.reason, (result as any)?.reason_data ? JSON.stringify((result as any).reason_data) : undefined].filter(Boolean);
        const errMsg = parts.join(' — ') || 'broadcast failed';
        return { success: false, error: errMsg, btcTxid, vout: lockupProof.outputIndex };
      }

      await this.lockRecordStore.saveRecord(this.address, bondIndex, {
        ...lockRecord, btcTxid, vout: lockupProof.outputIndex, stage: "registration-submitted",
      });

      const settled = await this.waitForTxSettlement(result.txid);
      console.log('register-for-bond settlement:', JSON.stringify({ tx_status: settled.data?.tx_status, tx_result: settled.data?.tx_result }));
      if (!settled.success || settled.data?.tx_status !== 'success') {
        const txRepr: string = (settled.data?.tx_result as any)?.repr ?? settled.data?.tx_error ?? '';
        return { success: false, unsettled: !settled.success, error: `[${settled.data?.tx_status}] ${txRepr}`.trim(), stacksTxid: result.txid, btcTxid, vout: lockupProof.outputIndex };
      }

      await this.lockRecordStore.saveRecord(this.address, bondIndex, {
        ...lockRecord, btcTxid, vout: lockupProof.outputIndex, stage: "registration-confirmed",
      });

      return {
        success: true,
        btcTxid,
        vout: lockupProof.outputIndex,
        stacksTxid: result.txid,
        lockingAddress: metadata.lockAddress,
        unlockHeight: metadata.unlockHeight,
        amountUstx: amountUstx.toString(),
      };
    } catch (error) {
      console.error('createBond error:', error);
      return { success: false, error: `Failed to create bond: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Registers an sBTC-backed bond: locks the paired STX and transfers sBTC to the
   * contract in a single L2 call (no Bitcoin L1 lock / SPV proof). The sBTC asset
   * defaults to the built-in sBTC contract for this network; pass `sbtcAsset` to
   * override it. Both legs (STX lock + sBTC transfer) are bounded by post-conditions.
   *
   * NOTE: sBTC paths are not yet exercised end-to-end on a live network; validate
   * before production use.
   */
  public createSbtcBond = async (
    bondIndex: number,
    sbtcSats: bigint,
    signerManager: string,
    opts?: {
      sbtcAsset?: { contractAddress: string; contractName: string; assetName: string };
      amountUstxOverride?: bigint;
      note?: string;
      nonce?: bigint;
      externalId?: string;
      signerCalldata?: Uint8Array | string;
    },
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error('Address, Public Key or Vault ID are not set');
      }

      const smAllowError = this.signerManagerAllowedError(signerManager);
      if (smAllowError) return { success: false, error: smAllowError };

      const sbtcAsset = await this.resolveSbtcAsset(opts?.sbtcAsset);
      if (!sbtcAsset) {
        return { success: false, error: 'Could not resolve the network sBTC asset (/v2/pox pox_5_sbtc_contract); refusing to build. Any override must exactly match the contract the node reports.' };
      }

      const [pox, bond] = await Promise.all([
        fetchPox5Info({ network: this.pox5Network }),
        fetchBond({ bondIndex, network: this.pox5Network }),
      ]);
      if (!bond) return { success: false, error: `Bond ${bondIndex} not found` };

      const contractMinUstx = minUstxForSatsAmount({
        sats: sbtcSats,
        stxValueRatio: bond.stxValueRatio,
        minUstxRatioBps: bond.minUstxRatioBps,
      });
      const amountResolution = this.resolveBondStxAmount(contractMinUstx, opts?.amountUstxOverride);
      if ("error" in amountResolution) return { success: false, error: amountResolution.error };
      const amountUstx = amountResolution.amountUstx;

      // Evaluate all deterministic gates before moving any sBTC.
      const preflight = await fetchEligibleRegisterForBond({
        bondIndex,
        staker: this.address,
        amountUstx,
        satsTotal: sbtcSats,
        signerManager,
        poxInfo: pox,
        network: this.pox5Network,
      });
      if (!preflight.ok) {
        const reasons = (preflight as { reasons?: number[] }).reasons ?? [];
        return { success: false, error: `Not eligible to register sBTC bond ${bondIndex}: ${this.describeBondReasons(reasons)}` };
      }

      const sbtcContractId: `${string}.${string}` = `${sbtcAsset.contractAddress}.${sbtcAsset.contractName}`;
      const result = await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(opts?.nonce);
        const tx = await this.buildRegisterForBondTx({
          bondIndex,
          signerManager,
          amountUstx,
          sbtcSats,
          nonce: resolvedNonce,
          signerCalldata: opts?.signerCalldata,
          // Bound both legs: the paired STX lock and the exact sBTC transfer (the
          // staker is the tx origin, so origin sends both).
          postConditionMode: PostConditionMode.Deny,
          postConditions: [
            Pc.origin().willSendEq(amountUstx).ustxToLock(),
            Pc.origin().willSendEq(sbtcSats).ft(sbtcContractId, sbtcAsset.assetName),
          ],
        });
        return this.pox5SignAndBroadcast(tx, opts?.note ?? `register-sbtc-bond-${bondIndex}`, opts?.externalId);
      });

      if (!result?.txid || result.error || result.reason) {
        return { success: false, error: result?.error ?? result?.reason ?? 'broadcast failed' };
      }
      const settled = await this.waitForTxSettlement(result.txid);
      if (!settled.success || settled.data?.tx_status !== 'success') {
        const repr: string = (settled.data?.tx_result as any)?.repr ?? settled.data?.tx_error ?? '';
        return { success: false, unsettled: !settled.success, error: `[${settled.data?.tx_status}] ${repr}`.trim(), txHash: result.txid };
      }

      // Record for reward discovery (sBTC-backed; no BTC outpoint).
      await this.lockRecordStore.saveRecord(this.address, bondIndex, {
        bondIndex,
        unlockBytes: new Uint8Array(),
        lockAddress: '',
        unlockHeight: 0,
        amountSats: sbtcSats,
        isL1Lock: false,
        signerManager,
        firstRewardCycle: bondPeriodToRewardCycle({ bondIndex, poxInfo: pox }),
      });

      return { success: true, txHash: result.txid };
    } catch (error) {
      return { success: false, error: `Failed to create sBTC bond: ${formatErrorMessage(error)}` };
    }
  };

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
  public unstakeSbtc = async (
    signerManager: string,
    amountToWithdrawSats: bigint,
    sbtcAsset?: { contractAddress: string; contractName: string; assetName: string },
    opts?: { note?: string; nonce?: bigint; externalId?: string },
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error('Address, Public Key or Vault ID are not set');
      }

      const eligible = await fetchEligibleUnstakeSbtc({
        staker: this.address,
        signerManager,
        amountToWithdrawSats,
        network: this.pox5Network,
      });
      if (!eligible.ok) {
        const reasons = (eligible as { reasons?: number[] }).reasons ?? [];
        return { success: false, error: `Cannot unstake sBTC: ${this.describeBondReasons(reasons)}` };
      }

      // unstake-sbtc records a PoX action AND returns the withdrawn sBTC from the
      // pox-5 contract to the staker. Both must be covered in Deny mode: a
      // will-perform-PoX condition for the PoX action, and an exact FT condition on
      // the contract for the outgoing sBTC. Refuse to build when the sBTC asset
      // cannot be resolved for this network — signing an unbounded (Allow-mode) sBTC
      // withdrawal is not acceptable under RAW signing, where Fireblocks cannot see
      // the payload.
      const resolvedSbtc = await this.resolveSbtcAsset(sbtcAsset);
      if (!resolvedSbtc) {
        return { success: false, error: 'Could not resolve the network sBTC asset (/v2/pox pox_5_sbtc_contract); refusing to build an unbounded sBTC withdrawal.' };
      }
      const bootAddr = (this.pox5Network as any).bootAddress as string;
      const pox5ContractId: `${string}.${string}` = `${bootAddr}.pox-5`;
      const sbtcContractId: `${string}.${string}` = `${resolvedSbtc.contractAddress}.${resolvedSbtc.contractName}`;
      const postConditionMode: PostConditionMode = PostConditionMode.Deny;
      const postConditions: PostCondition[] = [
        Pc.origin().willPerformPox(),
        Pc.principal(pox5ContractId).willSendEq(amountToWithdrawSats).ft(sbtcContractId, resolvedSbtc.assetName),
      ];

      const result = await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(opts?.nonce);
        const tx = await this.buildPox5Call(
          'unstake-sbtc',
          [Cl.address(signerManager), Cl.uint(amountToWithdrawSats)],
          { nonce: resolvedNonce, postConditionMode, postConditions },
        );
        return this.pox5SignAndBroadcast(tx, opts?.note ?? 'unstake-sbtc', opts?.externalId);
      });

      if (!result?.txid || result.error || result.reason) {
        return { success: false, error: result?.error ?? result?.reason ?? 'broadcast failed' };
      }
      const settled = await this.waitForTxSettlement(result.txid);
      if (!settled.success || settled.data?.tx_status !== 'success') {
        return { success: false, unsettled: !settled.success, error: settled.data?.tx_error ?? 'unstake-sbtc failed on-chain', txHash: result.txid };
      }
      return { success: true, txHash: result.txid };
    } catch (error) {
      return { success: false, error: `Failed to unstake sBTC: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Returns the current PoX-5 bond position for this vault's address, enriched
   * with live L1 lock state (if BTC-locked) and accrued sats rewards.
   */
  public getBondPosition = async (): Promise<BondPositionResponse> => {
    try {
      if (!this.address) throw new Error('Address is not set');

      // No substituting catch here: fetchBondMembership/fetchStakerInfo return
      // undefined / {staked:false} on genuine absence and throw on a read failure,
      // so a transport error surfaces as an error rather than a false "no position".
      const [pox, membership, stxOnly] = await Promise.all([
        fetchPox5Info({ network: this.pox5Network }),
        fetchBondMembership({ address: this.address, network: this.pox5Network }),
        fetchStakerInfo({ address: this.address, network: this.pox5Network }),
      ]);

      const stxOnlyData = stxOnly?.staked ? {
        amount_stx: microToStx(stxOnly.details.amountUstx),
        first_reward_cycle: stxOnly.details.firstRewardCycle,
        num_cycles: stxOnly.details.numCycles,
        signer_manager: stxOnly.details.signer,
      } : null;

      if (!membership) {
        return { success: true, data: { bond: null, stx_only: stxOnlyData } };
      }

      // Sum earned sats across all past cycles for a stable, accurate total
      const firstEarningCycle = bondPeriodToRewardCycle({ bondIndex: membership.bondIndex, poxInfo: pox });
      const earnedSats = await this.sumOverCycles(
        this.cycleRange(firstEarningCycle, pox.rewardCycleId),
        cycle => fetchEarned({
          signerManager: membership.signer,
          rewardCycle: cycle,
          bondIndex: membership.bondIndex,
          network: this.pox5Network,
        }).catch(() => BigInt(0)),
      );

      // L1 lock state (BTC-locked positions only)
      let unlock_height: number | null = null;
      let locking_address: string | null = null;
      let still_locked: boolean | null = null;
      let blocks_until_unlock: number | null = null;

      if (membership.isL1Lock) {
        const bond = await fetchBond({ bondIndex: membership.bondIndex, network: this.pox5Network });
        if (bond) {
          const meta = buildRegisterMetadata({
            bondIndex: membership.bondIndex,
            poxInfo: pox,
            bitcoinPublicKey: this.publicKey!,
            stxAddress: this.address,
            earlyUnlockBytes: bond.earlyUnlockBytes,
            network: this.pox5Network,
          });
          unlock_height = meta.unlockHeight;
          locking_address = meta.lockAddress;
          blocks_until_unlock = Math.max(0, meta.unlockHeight - pox.currentBurnchainBlockHeight);

          // Determine still-locked by outpoint from the durable record (not by an
          // amount that early exit zeroes). A read failure stays indeterminate
          // (null) rather than being reported as unlocked.
          try {
            const res = await fetch(`${this.esploraBase()}/address/${meta.lockAddress}/utxo`);
            if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
            const utxos: Array<{ txid: string; vout: number; value: number }> = await res.json();
            const record = await this.lockRecordStore.loadRecord(this.address, membership.bondIndex);
            still_locked =
              record?.btcTxid !== undefined && record.vout !== undefined
                ? utxos.some((u) => u.txid === record.btcTxid && u.vout === record.vout)
                : utxos.length > 0;
          } catch {
            still_locked = null; // indeterminate — not "unlocked"
          }
        }
      }

      const amountSatsBn = membership.amountSats;
      const amountBtc = (Number(amountSatsBn) / 1e8).toFixed(8);
      const earnedBtc = (Number(earnedSats) / 1e8).toFixed(8);

      const firstRewardCycle = bondPeriodToRewardCycle({ bondIndex: membership.bondIndex, poxInfo: pox });
      const cyclesUntilRewards = Math.max(0, firstRewardCycle - pox.rewardCycleId);

      return {
        success: true,
        data: {
          bond: {
            bond_index: membership.bondIndex,
            amount_stx: microToStx(membership.amountUstx),
            amount_ustx: membership.amountUstx.toString(),
            amount_sats: amountSatsBn.toString(),
            amount_btc: amountBtc,
            signer_manager: membership.signer,
            is_l1_lock: membership.isL1Lock,
            first_reward_cycle: firstRewardCycle,
            cycles_until_rewards: cyclesUntilRewards,
            unlock_height,
            locking_address,
            still_locked,
            blocks_until_unlock,
            earned_sats: earnedSats.toString(),
            earned_btc: earnedBtc,
          },
          stx_only: stxOnlyData,
        },
      };
    } catch (error) {
      return { success: false, error: `Failed to get bond position: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Announces an L1 early exit for an active BTC-locked bond (L2 leg only).
   * Zeroes the L2 amountSats; paired STX remains locked through the bond's normal
   * unlock cycle. The L1 BTC recovery (OP_ELSE spend) is a separate step requiring
   * the early-exit signer set.
   */
  public announceEarlyExit = async (
    opts?: { note?: string; nonce?: bigint; externalId?: string },
  ): Promise<AnnounceEarlyExitResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error('Address, Public Key or Vault ID are not set');
      }

      const membership = await fetchBondMembership({ address: this.address, network: this.pox5Network });

      if (!membership) return { success: false, error: 'No active bond membership found' };
      if (!membership.isL1Lock) return { success: false, error: 'Early exit only applies to L1-locked (native BTC) bonds' };

      // Reject deterministically-invalid announcements (e.g. during the prepare
      // phase, which the contract always rejects) before spending a nonce, a fee,
      // and a Fireblocks signature.
      const eligible = await fetchEligibleAnnounceL1EarlyExit({
        staker: this.address,
        oldSignerManager: membership.signer,
        network: this.pox5Network,
      });
      if (!eligible.ok) {
        const reasons = (eligible as { reasons?: number[] }).reasons ?? [];
        return { success: false, error: `Cannot announce early exit: ${this.describeBondReasons(reasons)}` };
      }

      const result = await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(opts?.nonce);
        const tx = await this.buildPox5Call(
          "announce-l1-early-exit",
          [Cl.address(this.address!), Cl.address(membership.signer)],
          {
            nonce: resolvedNonce,
            // Deny mode; announcing early exit performs a PoX state change only.
            postConditionMode: PostConditionMode.Deny,
            postConditions: [Pc.origin().willPerformPox()],
          },
        );
        return this.pox5SignAndBroadcast(tx, opts?.note ?? 'announce-l1-early-exit', opts?.externalId, async () => {
          // Re-run the eligibility gate (covers prepare-phase and membership) after
          // approval; discard the signed tx if it no longer holds.
          const recheck = await fetchEligibleAnnounceL1EarlyExit({
            staker: this.address!,
            oldSignerManager: membership.signer,
            network: this.pox5Network,
          });
          if (!recheck.ok) {
            const reasons = (recheck as { reasons?: number[] }).reasons ?? [];
            return `eligibility changed during approval: ${this.describeBondReasons(reasons)}`;
          }
          return undefined;
        });
      });
      if (!result?.txid || result.error || result.reason) {
        return { success: false, error: result?.error ?? result?.reason ?? 'broadcast failed' };
      }

      const settled = await this.waitForTxSettlement(result.txid);
      if (!settled.success || settled.data?.tx_status !== 'success') {
        return { success: false, unsettled: !settled.success, error: settled.data?.tx_error ?? 'announce-l1-early-exit failed on-chain', txHash: result.txid };
      }

      return { success: true, txHash: result.txid };
    } catch (error) {
      return { success: false, error: `Failed to announce early exit: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Returns the P2WSH lock address (bcrt1… on testnet, bc1… on mainnet) for a given bond index.
   * Use this to know where to send BTC before calling createBond with a pre-funded btcTxid.
   */
  public getBondLockAddress = async (bondIndex: number): Promise<BondLockAddressResponse> => {
    try {
      if (!this.address || !this.publicKey) throw new Error('Address or Public Key not set');
      const [pox, bond] = await Promise.all([
        fetchPox5Info({ network: this.pox5Network }),
        fetchBond({ bondIndex, network: this.pox5Network }),
      ]);
      if (!bond) return { success: false, error: `Bond ${bondIndex} not found` };
      const metadata = buildRegisterMetadata({
        bondIndex,
        poxInfo: pox,
        bitcoinPublicKey: this.publicKey,
        stxAddress: this.address,
        earlyUnlockBytes: bond.earlyUnlockBytes,
        network: this.pox5Network,
      });
      return { success: true, data: { lockAddress: metadata.lockAddress, unlockHeight: metadata.unlockHeight } };
    } catch (error) {
      return { success: false, error: `Failed to get bond lock address: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Funds the bond lock address via the private-1 BTC faucet (testnet only).
   * Returns the faucet txid — pass it as btcTxid in createBond to skip the Fireblocks send.
   */
  public fundBondLockAddress = async (bondIndex: number): Promise<FundBondLockResponse> => {
    if (!this.testnet) return { success: false, error: 'Faucet funding is only available on testnet' };
    try {
      const lockResult = await this.getBondLockAddress(bondIndex);
      if (!lockResult.success || !lockResult.data?.lockAddress) return { success: false, error: lockResult.error };
      const { lockAddress } = lockResult.data;
      const res = await fetch(
        `${this.networkProfile.stacksApiUrl}/extended/v1/faucets/btc?address=${lockAddress}`,
        { method: 'POST' },
      );
      const body = await res.json() as { success: boolean; txid?: string; error?: string };
      if (!body.success) return { success: false, error: body.error ?? 'Faucet request failed' };
      return { success: true, data: { txid: body.txid, lockAddress } };
    } catch (error) {
      return { success: false, error: `Failed to fund bond lock address: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Funds the vault's STX address via the private-1 STX faucet (testnet only).
   * Pass staking=true to request the stacking-sized faucet amount.
   */
  public fundVault = async (staking = false): Promise<FundVaultResponse> => {
    if (!this.testnet) return { success: false, error: 'Faucet funding is only available on testnet' };
    try {
      const address = await this.getAddress() as string;
      const url = `${this.networkProfile.stacksApiUrl}/extended/v1/faucets/stx?address=${address}${staking ? '&stacking=true' : ''}`;
      const res = await fetch(url, { method: 'POST' });
      const body = await res.json() as { success: boolean; txId?: string; error?: string };
      if (!body.success) return { success: false, error: body.error ?? 'Faucet request failed' };
      return { success: true, data: { txid: body.txId ?? '', address } };
    } catch (error) {
      return { success: false, error: `Failed to fund vault: ${formatErrorMessage(error)}` };
    }
  };

  public getRequirements = async (opts?: {
    bondIndex?: number;
    btcAmountSats?: bigint;
    signerManager?: string;
  }): Promise<RequirementsResponse> => {
    try {
      const pox = await fetchPox5Info({ network: this.pox5Network });
      const safetyCheck = isSafeToSubmit(pox);
      const isPreparePh = isInPreparePhase({ burnHeight: pox.currentBurnchainBlockHeight, poxInfo: pox });

      const cycle = {
        id: pox.rewardCycleId,
        current_burn_height: pox.currentBurnchainBlockHeight,
        is_prepare_phase: isPreparePh,
      };

      const stx_only = {
        safe_to_submit: safetyCheck.safe,
        blocks_until_deadline: Math.max(0, safetyCheck.blocksUntilBoundary - stacks_info.stacking.solo.safetyBlocks),
        blocks_until_safe: safetyCheck.safe
          ? null
          : pox.prepareCycleLength + safetyCheck.blocksUntilBoundary,
      };

      // Derive the boundary bond directly from the cycle instead of scanning from
      // zero (live bond indices grow unbounded). boundary is the first bond whose
      // locked period starts at or after the current cycle:
      //   current  = boundary - 1 (the bond actively locked right now)
      //   next open = boundary or boundary+1 (whichever has open/eligible status)
      const firstBondCycle = bondPeriodToRewardCycle({ bondIndex: 0, poxInfo: pox });
      const boundary = Math.max(0, Math.ceil((pox.rewardCycleId - firstBondCycle) / this.bondGapCycles(pox)));
      const currentBondIndex: number | null = boundary > 0 ? boundary - 1 : null;
      let nextOpenBondIndex: number | null = null;
      for (const candidate of [boundary, boundary + 1]) {
        const s = await fetchBondStatus({ bondIndex: candidate, poxInfo: pox, network: this.pox5Network });
        if (s === 'open' || s === 'eligible') {
          nextOpenBondIndex = candidate;
          break;
        }
      }

      // Helper to fetch full bond details for a given index
      const fetchBondDetails = async (idx: number) => {
        const [bond, status, allowance] = await Promise.all([
          fetchBond({ bondIndex: idx, network: this.pox5Network }),
          fetchBondStatus({ bondIndex: idx, poxInfo: pox, network: this.pox5Network }),
          this.address
            ? fetchBondAllowance({ bondIndex: idx, address: this.address, network: this.pox5Network }).catch(() => BigInt(0))
            : Promise.resolve(BigInt(0)),
        ]);
        if (!bond) return null;
        return {
          bond_index: idx,
          bond_phase: status,
          open_and_allowlisted: allowance > BigInt(0) && (status === 'open' || status === 'eligible'),
          stx_value_ratio: bond.stxValueRatio.toString(),
          target_rate_bps: bond.targetRateBps,
          min_ustx_ratio_bps: bond.minUstxRatioBps,
          your_allowance_sats: allowance.toString(),
          _bond: bond,
        };
      };

      // Fetch current and next open bond in parallel
      const [currentDetails, nextOpenDetails] = await Promise.all([
        currentBondIndex !== null ? fetchBondDetails(currentBondIndex) : Promise.resolve(null),
        nextOpenBondIndex !== null ? fetchBondDetails(nextOpenBondIndex) : Promise.resolve(null),
      ]);

      if (currentDetails === null && nextOpenDetails === null && opts?.bondIndex === undefined) {
        return { success: true, data: { cycle, stx_only } };
      }

      const btc_bond: NonNullable<NonNullable<RequirementsResponse['data']>['btc_bond']> = {
        current_bond: currentDetails ? {
          bond_index: currentDetails.bond_index,
          bond_phase: currentDetails.bond_phase,
          open_and_allowlisted: currentDetails.open_and_allowlisted,
          stx_value_ratio: currentDetails.stx_value_ratio,
          target_rate_bps: currentDetails.target_rate_bps,
          min_ustx_ratio_bps: currentDetails.min_ustx_ratio_bps,
          your_allowance_sats: currentDetails.your_allowance_sats,
        } : null,
        next_open_bond: nextOpenDetails ? {
          bond_index: nextOpenDetails.bond_index,
          bond_phase: nextOpenDetails.bond_phase,
          open_and_allowlisted: nextOpenDetails.open_and_allowlisted,
          stx_value_ratio: nextOpenDetails.stx_value_ratio,
          target_rate_bps: nextOpenDetails.target_rate_bps,
          min_ustx_ratio_bps: nextOpenDetails.min_ustx_ratio_bps,
          your_allowance_sats: nextOpenDetails.your_allowance_sats,
        } : null,
      };

      // Add btcAmountSats calculation to next_open_bond if provided
      if (opts?.btcAmountSats !== undefined && nextOpenDetails?._bond) {
        const minUstx = minUstxForSatsAmount({
          sats: opts.btcAmountSats,
          stxValueRatio: nextOpenDetails._bond.stxValueRatio,
          minUstxRatioBps: nextOpenDetails._bond.minUstxRatioBps,
        });
        btc_bond.next_open_bond!.min_stx_for_sats = microToStx(minUstx);
        btc_bond.next_open_bond!.min_ustx_for_sats = minUstx.toString();
      }

      // If caller passed an explicit bondIndex, fetch and attach as requested_bond
      if (opts?.bondIndex !== undefined) {
        const reqDetails = await fetchBondDetails(opts.bondIndex);
        if (reqDetails) {
          btc_bond.requested_bond = {
            bond_index: reqDetails.bond_index,
            bond_phase: reqDetails.bond_phase,
            open_and_allowlisted: reqDetails.open_and_allowlisted,
            stx_value_ratio: reqDetails.stx_value_ratio,
            target_rate_bps: reqDetails.target_rate_bps,
            min_ustx_ratio_bps: reqDetails.min_ustx_ratio_bps,
            your_allowance_sats: reqDetails.your_allowance_sats,
          };
          if (opts.btcAmountSats !== undefined) {
            const minUstx = minUstxForSatsAmount({
              sats: opts.btcAmountSats,
              stxValueRatio: reqDetails._bond.stxValueRatio,
              minUstxRatioBps: reqDetails._bond.minUstxRatioBps,
            });
            btc_bond.requested_bond.min_stx_for_sats = microToStx(minUstx);
            btc_bond.requested_bond.min_ustx_for_sats = minUstx.toString();

            // With the signer manager also supplied, run the full contract
            // eligibility so callers get an authoritative go/no-go before funding
            // BTC — not just the allowlist/phase partial signal.
            if (opts.signerManager && this.address) {
              const eligibility = await fetchEligibleRegisterForBond({
                bondIndex: opts.bondIndex,
                staker: this.address,
                amountUstx: minUstx,
                satsTotal: opts.btcAmountSats,
                signerManager: opts.signerManager,
                poxInfo: pox,
                network: this.pox5Network,
              });
              btc_bond.requested_bond.eligible = eligibility.ok;
              btc_bond.requested_bond.eligibility_reasons = eligibility.ok
                ? []
                : ((eligibility as { reasons?: number[] }).reasons ?? []).map((r) => {
                    const d = describePox5Error(r);
                    return d ? d.name : `code ${r}`;
                  });
            }
          }
        }
      }

      return { success: true, data: { cycle, stx_only, btc_bond } };
    } catch (error) {
      return { success: false, error: `Failed to fetch requirements: ${formatErrorMessage(error)}` };
    }
  };

  // ─── §11: BTC signing helpers (private) ─────────────────────────────────────

  // Private-1 regtest uses bech32 prefix 'bcrt', not 'tb' (testnet3).
  private get btcNetwork(): typeof btc.NETWORK {
    const prefix = this.networkProfile.bech32Prefix;
    if (prefix === undefined) return btc.NETWORK;
    return { ...btc.TEST_NETWORK, bech32: prefix };
  }

  // Build the P2WSH output script (OP_0 <32-byte-sha256-of-witnessScript>)
  private p2wshOutputScript = (witnessScript: Uint8Array): Uint8Array => {
    const hash = sha256(witnessScript);
    const out = new Uint8Array(34);
    out[0] = 0x00; // OP_0
    out[1] = 0x20; // PUSH 32
    out.set(hash, 2);
    return out;
  };

  private broadcastBtc = async (rawHex: string): Promise<string> => {
    const res = await fetch(`${this.esploraBase()}/tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: rawHex,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`BTC broadcast failed (${res.status}): ${body}`);
    }
    return res.text(); // esplora returns the txid as plain text
  };

  private btcDerSig = (fullSigHex: string): Uint8Array => {
    // fullSigHex is r||s as 128 hex chars — normalize to low-S then DER-encode
    const parsed = Secp256k1Signature.fromCompact(fullSigHex);
    const normalized = parsed.hasHighS() ? parsed.normalizeS() : parsed;
    const compact = normalized.toCompactRawBytes();
    const r = compact.slice(0, 32);
    const s = compact.slice(32, 64);
    return toDerSignature(r, s); // minimal DER + SIGHASH_ALL
  };

  private signBtcSighash = async (sighash: Uint8Array): Promise<Uint8Array> => {
    const rawSig = await this.fireblocksService.signTransaction(
      bytesToHex(sighash),
      this.vaultAccountId.toString(),
      'BTC P2WSH spend',
    );
    return this.btcDerSig(rawSig.fullSig);
  };

  private btcSegwitSighash = (
    tx: btc.Transaction,
    inputIndex: number,
    witnessScript: Uint8Array,
    amountSats: bigint,
  ): Uint8Array => {
    // preimageWitnessV0 already returns SHA256d(BIP143 preimage) — do not hash again
    return tx.preimageWitnessV0(inputIndex, witnessScript, btc.SigHash.ALL, amountSats);
  };

  private setP2wshWitness = (
    tx: btc.Transaction,
    inputIndex: number,
    items: Uint8Array[],
  ): void => {
    tx.updateInput(inputIndex, { finalScriptWitness: items });
  };

  // ─── §5: deriveLock (private) ─────────────────────────────────────────────

  private deriveLock = async (address?: string, bondIndexOverride?: number): Promise<DerivedLock | null> => {
    const addr = address ?? this.address!;
    const [pox, membership] = await Promise.all([
      fetchPox5Info({ network: this.pox5Network }),
      fetchBondMembership({ address: addr, network: this.pox5Network }).catch(() => null),
    ]);

    // An explicit bondIndex override takes precedence over the current membership.
    // Membership is overwritten on each registration, so recovery of an earlier
    // still-unspent bond must be addressable by its index directly.
    const bondIndex = bondIndexOverride ?? membership?.bondIndex;
    if (bondIndex === undefined) return null;

    // A non-L1 (sBTC) current membership blocks native recovery only when NO
    // override was supplied. With an override we resolve the requested bond.
    if (membership && !membership.isL1Lock && bondIndexOverride === undefined) return null;

    // Prefer the durable record captured at funding — it carries the immutable
    // unlock bytes, lock address, amount, and funding outpoint that the mutable
    // membership state loses after early exit / maturity.
    const record = await this.lockRecordStore.loadRecord(addr, bondIndex);

    // Reject explicitly when the override resolves to an sBTC-backed record.
    if (record && record.isL1Lock === false) return null;

    const bond = await fetchBond({ bondIndex, network: this.pox5Network });
    if (!bond) throw new Error(`Bond ${bondIndex} not found`);

    // The on-chain lock script commits to the unlockBytes used at bond creation, so a
    // persisted value takes precedence over re-deriving from the current public key.
    const unlockBytes = record?.unlockBytes
      ?? buildUnlockScript(hexToBytes(this.publicKey!));

    const unlockHeight = record?.unlockHeight ?? computeBondUnlockHeight({ bondIndex, poxInfo: pox });
    const lockScriptOpts = {
      stxAddress: addr,
      unlockHeight,
      unlockBytes,
      earlyUnlockBytes: bond.earlyUnlockBytes,
    };

    return {
      bondIndex,
      unlockHeight,
      lockScript: buildLockScript(lockScriptOpts),
      lockingAddress: record?.lockAddress ?? buildLockAddress({ ...lockScriptOpts, network: this.pox5Network }),
      earlyUnlockBytes: typeof bond.earlyUnlockBytes === 'string' ? hexToBytes(bond.earlyUnlockBytes) : bond.earlyUnlockBytes,
      unlockBytes,
      // Use the immutable recorded amount; membership.amountSats is zeroed by
      // announce-l1-early-exit and absent after maturity, so never default to 0
      // for matching (selection is by outpoint below).
      amountSats: record?.amountSats ?? membership?.amountSats ?? BigInt(0),
      // Reaching here means a native L1 lock (the guard above rejects sBTC records,
      // and record-less derivations are native by construction), so a mismatched
      // sBTC membership must not mislabel it.
      isL1Lock: record?.isL1Lock ?? true,
      btcTxid: record?.btcTxid,
      vout: record?.vout,
    };
  };

  /**
   * Locates the lock UTXO to spend. Selects by the recorded funding
   * outpoint when available; otherwise falls back to a single unspent output at
   * the bond-specific lock address. A transport failure is surfaced as an error
   * ("unknown"), never silently treated as "already spent" — the previous
   * amount-equality match returned an empty list on both a zeroed amount and a
   * failed read, making a still-locked output look spent.
   */
  private findLockUtxo = async (
    lockingAddress: string,
    outpoint?: { txid?: string; vout?: number },
    opts?: { expectedAmountSats?: bigint; isOperatorOverride?: boolean },
  ): Promise<{ txid: string; vout: number; value: number }> => {
    let utxos: Array<{ txid: string; vout: number; value: number }>;
    try {
      const res = await fetch(`${this.esploraBase()}/address/${lockingAddress}/utxo`);
      if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
      utxos = await res.json();
    } catch (error) {
      throw new Error(
        `Could not read lock UTXOs for ${lockingAddress} — treat as UNKNOWN, not spent: ${formatErrorMessage(error)}`,
      );
    }

    // Preferred: select by the exact recorded (or operator-supplied) outpoint.
    if (outpoint?.txid !== undefined && outpoint.vout !== undefined) {
      // Membership in the address's UTXO set proves the outpoint is UNSPENT and its
      // scriptPubKey is the bond's P2WSH (Esplora only returns outputs paying that
      // address) — an unrelated dust output at the same address is ignored.
      const match = utxos.find((u) => u.txid === outpoint.txid && u.vout === outpoint.vout);
      if (!match) {
        throw new Error(
          `Lock outpoint ${outpoint.txid}:${outpoint.vout} not found at ${lockingAddress} — it may already be spent, or the override is wrong.`,
        );
      }
      // A trusted recorded outpoint is spent as-is; an OPERATOR OVERRIDE is also
      // cross-checked against the expected lock amount WHEN that amount is known
      // (> 0). In the record-less recovery case the amount is unknown (0), so the
      // value cannot be cross-checked — the unspent + at-lock-address (script) checks
      // above still apply, which is the whole point of allowing the override there.
      if (
        opts?.isOperatorOverride &&
        opts.expectedAmountSats !== undefined &&
        opts.expectedAmountSats > BigInt(0) &&
        BigInt(match.value) !== opts.expectedAmountSats
      ) {
        throw new Error(
          `Override outpoint ${outpoint.txid}:${outpoint.vout} has value ${match.value} sats but the expected lock amount is ${opts.expectedAmountSats} sats — rejecting.`,
        );
      }
      return match;
    }

    // Fallback: a single unspent output at the bond-specific address.
    if (utxos.length === 1) return utxos[0];
    if (utxos.length === 0) {
      throw new Error(`No unspent lock output found at ${lockingAddress}.`);
    }
    throw new Error(
      `Ambiguous lock UTXO: ${utxos.length} unspent outputs at ${lockingAddress}; a durable lock record or an explicit outpoint override is required to select the correct one.`,
    );
  };

  /**
   * Resolves the exact lock UTXO to spend for a recovery. Prefers the immutable
   * recorded funding outpoint; when no record exists, an operator may supply an
   * explicit outpoint, which is validated (unspent, correct P2WSH address/script,
   * and exact expected value) before it is returned. Only when neither is present
   * does it fall back to a single unambiguous output at the lock address.
   */
  /** True if `addr` is a well-formed BTC address for the active Bitcoin network. */
  private isValidBtcAddressForNetwork = (addr: string): boolean => {
    try {
      btc.Address(this.btcNetwork).decode(addr);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Resolves the destination for a native-BTC recovery spend. Under RAW signing the
   * destination is invisible to Fireblocks, so recovery DEFAULTS to the vault's own
   * derived BTC address; any other (external) destination must be explicitly approved
   * via `btcRecoveryAllowlist`. Wrong-network / malformed addresses are rejected
   * before signing.
   */
  private resolveRecoveryDestination = (
    requested?: string,
  ): { address: string } | { error: string } => {
    const vaultAddress = this.getBtcVaultAddress();
    if (!vaultAddress) {
      return { error: "Cannot resolve the vault BTC address (public key not set)." };
    }
    if (!requested) return { address: vaultAddress };

    if (!this.isValidBtcAddressForNetwork(requested)) {
      return { error: `Destination ${requested} is not a valid BTC address for this network.` };
    }
    if (requested !== vaultAddress && !this.btcRecoveryAllowlist.includes(requested)) {
      return {
        error:
          `External BTC destination ${requested} is not approved. Recovery defaults to the vault's ` +
          `own address; add the destination to btcRecoveryAllowlist to permit it.`,
      };
    }
    return { address: requested };
  };

  private resolveRecoveryUtxo = async (
    lock: { lockingAddress: string; btcTxid?: string; vout?: number; amountSats: bigint },
    override?: { txid: string; vout: number },
  ): Promise<{ txid: string; vout: number; value: number }> => {
    if (lock.btcTxid !== undefined && lock.vout !== undefined) {
      return this.findLockUtxo(lock.lockingAddress, { txid: lock.btcTxid, vout: lock.vout });
    }
    if (override) {
      return this.findLockUtxo(lock.lockingAddress, override, {
        expectedAmountSats: lock.amountSats,
        isOperatorOverride: true,
      });
    }
    return this.findLockUtxo(lock.lockingAddress);
  };

  /**
   * Reports a native-BTC bond position by index from the immutable durable lock
   * record plus live Bitcoin UTXO state — independent of Stacks membership, which
   * `announce-l1-early-exit` zeroes and maturity drops. This keeps a mature or
   * exited bond visible and recoverable after its on-chain membership disappears.
   * A Bitcoin lookup failure is reported as UNKNOWN (null), never silently as spent.
   */
  public getHistoricalBondPosition = async (
    bondIndex: number,
  ): Promise<HistoricalBondPositionResponse> => {
    try {
      if (!this.address || !this.publicKey) throw new Error("Address or Public Key not set");

      const lock = await this.deriveLock(undefined, bondIndex);
      if (!lock) return { success: false, error: `No native-BTC lock found for bond ${bondIndex}` };

      let still_locked: boolean | null = null;
      let recovered: boolean | null = null;
      let matured: boolean | null = null;
      try {
        const [utxosRes, tipText] = await Promise.all([
          fetch(`${this.esploraBase()}/address/${lock.lockingAddress}/utxo`),
          fetch(`${this.esploraBase()}/blocks/tip/height`).then((r) => r.text()),
        ]);
        if (!utxosRes.ok) throw new Error(`Esplora HTTP ${utxosRes.status}`);
        const utxos: Array<{ txid: string; vout: number }> = await utxosRes.json();
        const tipHeight = Number(tipText);

        // Prefer the exact recorded outpoint; fall back to any output at the address.
        const isUnspent =
          lock.btcTxid !== undefined && lock.vout !== undefined
            ? utxos.some((u) => u.txid === lock.btcTxid && u.vout === lock.vout)
            : utxos.length > 0;
        still_locked = isUnspent;
        recovered = !isUnspent;
        matured = Number.isFinite(tipHeight) ? tipHeight >= lock.unlockHeight : null;
      } catch {
        // Bitcoin lookup failed — indeterminate, not "recovered".
        still_locked = null;
        recovered = null;
        matured = null;
      }

      return {
        success: true,
        data: {
          bond_index: lock.bondIndex,
          amount_sats: lock.amountSats.toString(),
          amount_btc: (Number(lock.amountSats) / 1e8).toFixed(8),
          lock_address: lock.lockingAddress,
          unlock_height: lock.unlockHeight,
          btc_txid: lock.btcTxid ?? null,
          vout: lock.vout ?? null,
          still_locked,
          recovered,
          matured,
        },
      };
    } catch (error) {
      return { success: false, error: `Failed to get historical bond position: ${formatErrorMessage(error)}` };
    }
  };

  // ─── §6: unlockMaturedBond ────────────────────────────────────────────────

  /**
   * Spends the matured P2WSH UTXO back to a destination BTC address via the
   * OP_IF (CLTV) branch. Only callable after `unlockHeight` has passed on the
   * BTC chain. No early-exit signer set required — unilateral staker signature.
   */
  public unlockMaturedBond = async (
    destinationBtcAddress?: string,
    opts?: { feeSats?: bigint; bondIndex?: number; outpointOverride?: { txid: string; vout: number } },
  ): Promise<UnlockBtcResponse> => {
    try {
      const dest = this.resolveRecoveryDestination(destinationBtcAddress);
      if ('error' in dest) return { success: false, error: dest.error };
      const destination = dest.address;

      const lock = await this.deriveLock(undefined, opts?.bondIndex);
      if (!lock) return { success: false, error: 'No L1-locked bond membership found' };

      const tipHeight = await fetch(`${this.esploraBase()}/blocks/tip/height`)
        .then(r => r.text()).then(Number);
      if (tipHeight < lock.unlockHeight) {
        return { success: false, error: `Bond not matured: BTC tip ${tipHeight} < unlock height ${lock.unlockHeight}` };
      }

      const utxo = await this.resolveRecoveryUtxo(lock, opts?.outpointOverride);

      const feeSats = opts?.feeSats ?? await this.estimateBtcFeeSats(this.RECOVERY_SPEND_VBYTES);
      const actualUtxoSats = BigInt(utxo.value);
      const outputAmount = actualUtxoSats - feeSats;
      // Never create a dust output. BIP-125 replacement is done by re-invoking with a
      // higher opts.feeSats — the spend signals RBF and rebuilds from the still-unspent
      // lock outpoint, so a confirmed original is rejected by the UTXO lookup above.
      if (outputAmount < this.BTC_DUST_LIMIT_SATS) return { success: false, error: `Fee ${feeSats} sats leaves ${outputAmount} sats, below the dust limit ${this.BTC_DUST_LIMIT_SATS} — lower the fee (locked ${actualUtxoSats} sats).` };

      const p2wshScript = this.p2wshOutputScript(lock.lockScript);

      const tx = new btc.Transaction({ lockTime: lock.unlockHeight });
      tx.addInput({
        txid: utxo.txid,
        index: utxo.vout,
        sequence: 0xfffffffd, // BIP-125 replaceable (still < 0xffffffff, so CLTV holds)
        witnessUtxo: { script: p2wshScript, amount: actualUtxoSats },
        witnessScript: lock.lockScript,
      });
      tx.addOutputAddress(destination, outputAmount, this.btcNetwork);

      const sighash = this.btcSegwitSighash(tx, 0, lock.lockScript, actualUtxoSats);
      const stakerSig = await this.signBtcSighash(sighash);

      this.setP2wshWitness(tx, 0, [stakerSig, new Uint8Array([1]), lock.lockScript]);

      const rawHex = bytesToHex(tx.extract());

      const btcTxid = await this.broadcastBtc(rawHex);
      return { success: true, btcTxid };
    } catch (error) {
      return { success: false, error: `Failed to unlock matured bond: ${formatErrorMessage(error)}` };
    }
  };

  // ─── §7B: spendEarlyExitUtxo ─────────────────────────────────────────────

  /**
   * Spends the P2WSH UTXO via the OP_ELSE (early-exit) branch. The cosigner
   * leg comes from the external KMS signing service (see cosigner.service.ts).
   * Call `announceEarlyExit()` on L2 first and wait for it to settle — this is
   * pre-checked on-chain before the cosigner is contacted.
   */
  public spendEarlyExitUtxo = async (
    destinationBtcAddress?: string,
    opts?: { feeSats?: bigint; bondIndex?: number; outpointOverride?: { txid: string; vout: number } },
  ): Promise<SpendEarlyExitResponse> => {
    try {
      const dest = this.resolveRecoveryDestination(destinationBtcAddress);
      if ('error' in dest) return { success: false, error: dest.error };
      const destination = dest.address;

      const lock = await this.deriveLock(undefined, opts?.bondIndex);
      if (!lock) return { success: false, error: 'No L1-locked bond membership found' };

      const announced = await fetchHasAnnouncedL1EarlyExit({
        bondIndex: lock.bondIndex,
        staker: this.address!,
        network: this.pox5Network,
      });
      if (!announced) {
        return { success: false, error: 'announce-l1-early-exit not settled — call announceEarlyExit first and wait for it to confirm' };
      }

      const utxo = await this.resolveRecoveryUtxo(lock, opts?.outpointOverride);

      const feeSats = opts?.feeSats ?? await this.estimateBtcFeeSats(this.RECOVERY_SPEND_VBYTES);
      const actualUtxoSats = BigInt(utxo.value);
      const outputAmount = actualUtxoSats - feeSats;
      // Never create a dust output. BIP-125 replacement is done by re-invoking with a
      // higher opts.feeSats — the spend signals RBF and rebuilds from the still-unspent
      // lock outpoint, so a confirmed original is rejected by the UTXO lookup above.
      if (outputAmount < this.BTC_DUST_LIMIT_SATS) return { success: false, error: `Fee ${feeSats} sats leaves ${outputAmount} sats, below the dust limit ${this.BTC_DUST_LIMIT_SATS} — lower the fee (locked ${actualUtxoSats} sats).` };

      const p2wshScript = this.p2wshOutputScript(lock.lockScript);

      const tx = new btc.Transaction();
      // OP_ELSE path has no CLTV gate — lockTime not required
      tx.addInput({
        txid: utxo.txid,
        index: utxo.vout,
        sequence: 0xfffffffd, // BIP-125 replaceable (still < 0xffffffff, so CLTV holds)
        witnessUtxo: { script: p2wshScript, amount: actualUtxoSats },
        witnessScript: lock.lockScript,
      });
      tx.addOutputAddress(destination, outputAmount, this.btcNetwork);

      const sighash = this.btcSegwitSighash(tx, 0, lock.lockScript, actualUtxoSats);
      // Unsigned serialization (no scriptSig, no witness) — the cosigner
      // service recomputes the sighash from this tx plus the prevout context.
      const unsignedTxHex = bytesToHex(tx.toBytes(false, false));

      const cosigner = new CosignerService(resolveCosignerUrl(this.testnet));
      const [stakerSig, earlyExitSig] = await Promise.all([
        this.signBtcSighash(sighash),
        cosigner.cosignEarlyExit({
          unsignedTxHex,
          prevoutScriptPubKeyHex: bytesToHex(p2wshScript),
          prevoutValueSats: Number(actualUtxoSats),
          witnessScriptHex: bytesToHex(lock.lockScript),
          expectedSighash: sighash,
          expectedUnlockBytes: lock.earlyUnlockBytes,
        }),
      ]);
      const preimage = computeRegisterPreimage(this.address!);

      // OP_ELSE witness: [ <stakerSig>, <earlyExitSig>, <preimage>, <0=FALSE>, <witnessScript> ]
      this.setP2wshWitness(tx, 0, [stakerSig, earlyExitSig, preimage, new Uint8Array([]), lock.lockScript]);

      const btcTxid = await this.broadcastBtc(bytesToHex(tx.extract()));
      return { success: true, btcTxid };
    } catch (error) {
      return { success: false, error: `Failed to spend early exit UTXO: ${formatErrorMessage(error)}` };
    }
  };

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
  public replaceBtcRecoveryFee = async (
    originalTxid: string,
    newFeeSats: bigint,
    opts?: { bondIndex?: number; kind?: 'matured' | 'early-exit' },
  ): Promise<BtcFeeReplacementResponse> => {
    try {
      if (!/^[0-9a-fA-F]{64}$/.test(originalTxid)) {
        return { success: false, error: `Invalid original txid: ${originalTxid}` };
      }
      if (newFeeSats <= BigInt(0)) {
        return { success: false, error: 'newFeeSats must be positive' };
      }

      // 1. Fetch the original tx; reject if confirmed or gone (already replaced/dropped).
      let orig: any;
      try {
        const res = await fetch(`${this.esploraBase()}/tx/${originalTxid}`);
        if (res.status === 404) {
          return { success: false, error: `Original tx ${originalTxid} not found — it may already be confirmed and pruned, or replaced/dropped from the mempool. Read its current state before replacing.` };
        }
        if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
        orig = await res.json();
      } catch (error) {
        return { success: false, error: `Could not read original tx ${originalTxid} (treat as UNKNOWN, not replaceable): ${formatErrorMessage(error)}` };
      }
      if (orig?.status?.confirmed) {
        return { success: false, error: `Original tx ${originalTxid} is already confirmed (block ${orig.status.block_height}) — nothing to replace.` };
      }

      // 2. Resolve the bond lock so the replacement can be verified to spend THIS bond's
      //    lock output (and never an unrelated transaction).
      const lock = await this.deriveLock(undefined, opts?.bondIndex);
      if (!lock) return { success: false, error: 'No L1-locked bond found to replace a recovery spend for.' };

      // 3. Parse the original tx and run the pure BIP-125 fee-rule + shape validation.
      const vin0 = Array.isArray(orig.vin) ? orig.vin[0] : undefined;
      const parsed: ParsedRecoveryTx = {
        confirmed: !!orig?.status?.confirmed,
        blockHeight: orig?.status?.block_height,
        feeSats: BigInt(orig.fee ?? 0),
        // vsize from weight (ceil(weight/4)); Esplora reports weight, not vsize directly.
        vsize: orig.weight ? Math.ceil(Number(orig.weight) / 4) : this.RECOVERY_SPEND_VBYTES,
        destination: Array.isArray(orig.vout) ? orig.vout[0]?.scriptpubkey_address : undefined,
        destinationSats: BigInt((Array.isArray(orig.vout) ? orig.vout[0]?.value : 0) ?? 0),
        outputCount: Array.isArray(orig.vout) ? orig.vout.length : 0,
        lockOutpoint: vin0 ? { txid: vin0.txid as string, vout: vin0.vout as number } : undefined,
        prevoutAddress: vin0?.prevout?.scriptpubkey_address,
      };
      const check = checkFeeReplacement(
        parsed, newFeeSats, lock.lockingAddress,
        lock.btcTxid !== undefined && lock.vout !== undefined ? { txid: lock.btcTxid, vout: lock.vout } : undefined,
      );
      if (!check.ok) return { success: false, error: (check as { error: string }).error };

      // 4. Determine the spend branch. Default: matured OP_IF once past unlockHeight,
      //    otherwise the OP_ELSE early-exit path.
      let branch = opts?.kind;
      if (!branch) {
        const tipHeight = await fetch(`${this.esploraBase()}/blocks/tip/height`).then(r => r.text()).then(Number);
        branch = Number.isFinite(tipHeight) && tipHeight >= lock.unlockHeight ? 'matured' : 'early-exit';
      }

      // 5. Rebuild through the existing spend path with the new fee, preserving the
      //    original destination (re-authorized inside the spend) and lock outpoint. The
      //    spend refuses a dust output and re-signs fresh, satisfying the dust and
      //    fresh-authorization rules.
      const spendOpts = { feeSats: newFeeSats, bondIndex: opts?.bondIndex, outpointOverride: check.lockOutpoint };
      const spend = branch === 'matured'
        ? await this.unlockMaturedBond(check.destination, spendOpts)
        : await this.spendEarlyExitUtxo(check.destination, spendOpts);
      if (!spend.success || !spend.btcTxid) {
        return { success: false, error: spend.error ?? 'Replacement spend failed.' };
      }

      return {
        success: true,
        btcTxid: spend.btcTxid,
        replacement: {
          oldFeeSats: check.oldFeeSats.toString(),
          newFeeSats: check.newFeeSats.toString(),
          oldDestinationSats: check.oldDestinationSats.toString(),
          newDestinationSats: check.newDestinationSats.toString(),
          feeRateOldSatVb: check.feeRateOldSatVb,
          feeRateNewSatVb: check.feeRateNewSatVb,
          destination: check.destination,
          branch,
        },
      };
    } catch (error) {
      return { success: false, error: `Failed to replace recovery fee: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Returns the early-exit cosigner service's account xpub and metadata —
   * useful for verifying the configured service matches a bond's
   * early-unlock-bytes before attempting an early-exit spend.
   */
  public getEarlyExitPublicKey = async () => {
    const cosigner = new CosignerService(resolveCosignerUrl(this.testnet));
    return cosigner.getPublicKey();
  };

  // ─── §8: renewBond ───────────────────────────────────────────────────────

  /**
   * Rolls the current bond into the next period atomically:
   * 1. Spends the matured prior P2WSH → next bond's locking address (OP_IF branch)
   * 2. Assembles the SPV proof for the new output
   * 3. Calls register-for-bond for nextBondIndex on L2
   *
   * Must be called inside the re-lock window (after prior unlockHeight, before next bond starts).
   */
  public renewBond = async (
    nextBondIndex: number,
    signerManager: string,
    opts?: { feeSats?: bigint; note?: string; nonce?: bigint; externalId?: string; confirmations?: number },
  ): Promise<RenewBondResult> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error('Address, Public Key or Vault ID are not set');
      }
      const storeError = await this.assertDurableLockStore();
      if (storeError) return { success: false, error: storeError };

      // 1. Resolve prior lock
      const prior = await this.deriveLock();
      if (!prior) return { success: false, error: 'No current L1 bond to renew' };

      const tipHeight = await fetch(`${this.esploraBase()}/blocks/tip/height`)
        .then(r => r.text()).then(Number);
      if (tipHeight < prior.unlockHeight) {
        return { success: false, error: `Prior bond not matured: BTC tip ${tipHeight} < unlock height ${prior.unlockHeight}` };
      }

      const utxo = await this.findLockUtxo(prior.lockingAddress, { txid: prior.btcTxid, vout: prior.vout });

      // 2. Compute next lock parameters
      const [pox, nextBond] = await Promise.all([
        fetchPox5Info({ network: this.pox5Network }),
        fetchBond({ bondIndex: nextBondIndex, network: this.pox5Network }),
      ]);
      if (!nextBond) return { success: false, error: `Next bond ${nextBondIndex} not found` };

      const nextMeta = buildRegisterMetadata({
        bondIndex: nextBondIndex,
        poxInfo: pox,
        bitcoinPublicKey: this.publicKey,
        stxAddress: this.address,
        earlyUnlockBytes: nextBond.earlyUnlockBytes,
        network: this.pox5Network,
      });

      // Cross-check next lock script against contract
      const onchainNext = await fetchConstructLockupOutputScript({
        stxAddress: this.address,
        unlockHeight: nextMeta.unlockHeight,
        unlockBytes: nextMeta.unlockBytes,
        earlyUnlockBytes: nextBond.earlyUnlockBytes,
        network: this.pox5Network,
      });
      if (bytesToHex(nextMeta.outputScript) !== bytesToHex(onchainNext)) {
        return { success: false, error: 'Next bond lockup script mismatch — NOT proceeding' };
      }

      // Persist unlockBytes for the new bond period before spending
      // 3. Build the atomic BTC spend: prior P2WSH → next locking address.
      // Spend against the actual on-chain output value, not the mutable membership
      // amount (which early exit zeroes and maturity drops).
      const feeSats = opts?.feeSats ?? await this.estimateBtcFeeSats(this.RECOVERY_SPEND_VBYTES);
      const actualUtxoSats = BigInt(utxo.value);
      const outputAmount = actualUtxoSats - feeSats;
      // Never create a dust output. BIP-125 replacement is done by re-invoking with a
      // higher opts.feeSats — the spend signals RBF and rebuilds from the still-unspent
      // lock outpoint, so a confirmed original is rejected by the UTXO lookup above.
      if (outputAmount < this.BTC_DUST_LIMIT_SATS) return { success: false, error: `Fee ${feeSats} sats leaves ${outputAmount} sats, below the dust limit ${this.BTC_DUST_LIMIT_SATS} — lower the fee (locked ${actualUtxoSats} sats).` };

      // Required paired STX for the next bond, derived from the re-locked amount.
      const amountUstx = minUstxForSatsAmount({
        sats: outputAmount,
        stxValueRatio: nextBond.stxValueRatio,
        minUstxRatioBps: nextBond.minUstxRatioBps,
      });

      // Evaluate the next bond's deterministic gates BEFORE re-locking the Bitcoin.
      // Otherwise a predictable rejection would leave the funds committed to a
      // script whose bond the staker never joined.
      const preflight = await fetchEligibleRegisterForBond({
        bondIndex: nextBondIndex,
        staker: this.address,
        amountUstx,
        satsTotal: outputAmount,
        signerManager,
        poxInfo: pox,
        network: this.pox5Network,
      });
      if (!preflight.ok) {
        const reasons = (preflight as { reasons?: number[] }).reasons ?? [];
        return { success: false, error: `Next bond ${nextBondIndex} not eligible (no BTC re-locked): ${this.describeBondReasons(reasons)}` };
      }

      const priorP2wshScript = this.p2wshOutputScript(prior.lockScript);

      const btcTx = new btc.Transaction({ lockTime: prior.unlockHeight });
      btcTx.addInput({
        txid: utxo.txid,
        index: utxo.vout,
        sequence: 0xfffffffd, // BIP-125 replaceable (still < 0xffffffff, so CLTV holds)
        witnessUtxo: { script: priorP2wshScript, amount: actualUtxoSats },
        witnessScript: prior.lockScript,
      });
      btcTx.addOutputAddress(nextMeta.lockAddress, outputAmount, this.btcNetwork);

      const sighash = this.btcSegwitSighash(btcTx, 0, prior.lockScript, actualUtxoSats);
      const stakerSig = await this.signBtcSighash(sighash);
      this.setP2wshWitness(btcTx, 0, [stakerSig, new Uint8Array([1]), prior.lockScript]);

      // Persist the next bond's immutable lock record before spending, so a crash
      // after the re-lock broadcast leaves a recoverable outpoint reference.
      await this.lockRecordStore.saveRecord(this.address, nextBondIndex, {
        bondIndex: nextBondIndex,
        unlockBytes: nextMeta.unlockBytes,
        lockAddress: nextMeta.lockAddress,
        unlockHeight: nextMeta.unlockHeight,
        amountSats: outputAmount,
        isL1Lock: true,
        signerManager,
        firstRewardCycle: bondPeriodToRewardCycle({ bondIndex: nextBondIndex, poxInfo: pox }),
      });

      const btcTxid = await this.broadcastBtc(bytesToHex(btcTx.extract()));

      // 4. Wait for confirmations on the new lock output
      const { blockHash } = await this.waitForBtcConfirmations(btcTxid, opts?.confirmations ?? 3);

      // 5. Assemble SPV proof for the new lock output
      const lockupProof = await this.assembleLockupProof(btcTxid, blockHash, nextMeta.outputScript, nextMeta.unlockHeight);

      // Record the resolved funding outpoint now that it is known.
      await this.lockRecordStore.saveRecord(this.address, nextBondIndex, {
        bondIndex: nextBondIndex,
        unlockBytes: nextMeta.unlockBytes,
        lockAddress: nextMeta.lockAddress,
        unlockHeight: nextMeta.unlockHeight,
        amountSats: outputAmount,
        isL1Lock: true,
        signerManager,
        firstRewardCycle: bondPeriodToRewardCycle({ bondIndex: nextBondIndex, poxInfo: pox }),
        btcTxid,
        vout: lockupProof.outputIndex,
      });

      // Re-run eligibility with the SPV proof before spending the L2 signature.
      const proofPreflight = await fetchEligibleRegisterForBond({
        bondIndex: nextBondIndex,
        staker: this.address,
        amountUstx,
        satsTotal: outputAmount,
        signerManager,
        poxInfo: pox,
        outputs: [lockupProof],
        network: this.pox5Network,
      });
      if (!proofPreflight.ok) {
        const reasons = (proofPreflight as { reasons?: number[] }).reasons ?? [];
        return { success: false, error: `SPV proof preflight failed for bond ${nextBondIndex} (BTC re-locked; recover via unlockMaturedBond/spendEarlyExitUtxo): ${this.describeBondReasons(reasons)}`, btcTxid, vout: lockupProof.outputIndex };
      }

      // Register on L2. Only the nonce→sign→broadcast is serialized; the Bitcoin
      // confirmation waits above ran outside the lock.
      const result = await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(opts?.nonce);
        const stacksTx = await this.buildRegisterForBondTx({
          bondIndex: nextBondIndex,
          signerManager,
          amountUstx,
          outputs: [lockupProof],
          unlockBytes: nextMeta.unlockBytes,
          nonce: resolvedNonce,
          // Bound the paired STX lock to exactly the required amount.
          postConditionMode: PostConditionMode.Deny,
          postConditions: [Pc.origin().willSendEq(amountUstx).ustxToLock()],
        });
        return this.pox5SignAndBroadcast(stacksTx, opts?.note ?? `renew-bond-${nextBondIndex}`, opts?.externalId);
      });
      if (!result?.txid || result.error || result.reason) {
        return { success: false, error: result?.error ?? result?.reason ?? 'broadcast failed', btcTxid, vout: lockupProof.outputIndex };
      }

      const settled = await this.waitForTxSettlement(result.txid);
      if (!settled.success || settled.data?.tx_status !== 'success') {
        const txRepr: string = (settled.data?.tx_result as any)?.repr ?? settled.data?.tx_error ?? '';
        return { success: false, unsettled: !settled.success, error: `[${settled.data?.tx_status}] ${txRepr}`.trim(), stacksTxid: result.txid, btcTxid, vout: lockupProof.outputIndex };
      }

      return {
        success: true,
        btcTxid,
        vout: lockupProof.outputIndex,
        stacksTxid: result.txid,
        lockingAddress: nextMeta.lockAddress,
        unlockHeight: nextMeta.unlockHeight,
        amountUstx: amountUstx.toString(),
      };
    } catch (error) {
      return { success: false, error: `Failed to renew bond: ${formatErrorMessage(error)}` };
    }
  };

  // ─── §9: Rewards ─────────────────────────────────────────────────────────

  /**
   * Derives the bond-period indices that can be active at the current burn height
   * from the cycle, rather than scanning a fixed range from zero. Bond indices grow
   * without bound, so a hardcoded cap silently operates on an empty set once the
   * live index exceeds it. The window is anchored on the latest started bond and
   * spans BOND_END_OFFSET_PERIODS periods (≤ 6 bonds).
   */
  // Cycles between consecutive bond periods (derived rather than importing the
  // constant, which the dependency does not export at the type level).
  private bondGapCycles = (pox: Pox5PoxInfo): number =>
    bondPeriodToRewardCycle({ bondIndex: 1, poxInfo: pox }) -
    bondPeriodToRewardCycle({ bondIndex: 0, poxInfo: pox });

  /**
   * Distribution "calculation height" — the burn height at which the reward waterfall
   * snapshots the active-bond set. calculate-rewards must submit exactly the bonds
   * active at THIS height, not at the drifting live burn height; near a reward-cycle
   * boundary the two can fall in different cycles, which is the defect FBS-41 fixes.
   *
   * EDUCATED GUESS (verify on a live node, then replace with the real accessor): the
   * protocol answers do not cover this and the dependency exposes no
   * `distribution-cycle-to-burn-height` / `current-distribution-cycle` read-only
   * function, so we anchor to the START of the current reward cycle — a stable,
   * deterministic snapshot within the current cycle rather than the drifting live
   * height. We deliberately do NOT subtract a block (that would fall into the
   * previous cycle and derive the active set one cycle off). Fail-safe: a wrong
   * height only makes the node REJECT calculate-rewards (no misdistribution), and
   * fetchEligibleCalculateRewards gates the submission before any signature is spent.
   */
  private calculationHeight = (pox: Pox5PoxInfo): number =>
    pox.firstBurnchainBlockHeight + pox.rewardCycleId * pox.rewardCycleLength;

  private activeBondWindow = (pox: Pox5PoxInfo, burnHeight: number): number[] => {
    const currentCycle = burnHeightToRewardCycle({ burnHeight, poxInfo: pox });
    const firstBondCycle = bondPeriodToRewardCycle({ bondIndex: 0, poxInfo: pox });
    const gap = this.bondGapCycles(pox);
    const latest = currentCycle <= firstBondCycle
      ? 0
      : Math.floor((currentCycle - firstBondCycle) / gap);
    const windowStart = Math.max(0, latest - (BOND_END_OFFSET_PERIODS - 1));
    const candidates: number[] = [];
    for (let i = windowStart; i <= latest + 1; i++) candidates.push(i); // +1 lookahead
    return candidates;
  };

  private getActiveBondsSorted = async (): Promise<number[]> => {
    const pox = await fetchPox5Info({ network: this.pox5Network });
    // FBS-41: derive the active set at the distribution calculation height — shared by
    // both the window and the per-bond active check — so calculate-rewards submits the
    // set the contract expects rather than the drifting live-height set.
    const calcHeight = this.calculationHeight(pox);
    const candidates = this.activeBondWindow(pox, calcHeight);
    const results = await Promise.all(
      candidates.map(async i => {
        const bond = await fetchBond({ bondIndex: i, network: this.pox5Network }).catch(() => null);
        if (!bond) return null;
        const active = isBondActiveAtHeight({ bondIndex: i, burnHeight: calcHeight, poxInfo: pox });
        if (!active) return null;
        return { i, stxValueRatio: bond.stxValueRatio };
      }),
    );
    return results
      .filter((r): r is { i: number; stxValueRatio: bigint } => r !== null)
      .sort((a, b) => {
        if (b.stxValueRatio > a.stxValueRatio) return 1;
        if (b.stxValueRatio < a.stxValueRatio) return -1;
        return a.i - b.i;
      })
      .map(r => r.i);
  };

  /**
   * Triggers the PoX-5 reward distribution waterfall for the current cycle.
   * Must include ALL active bonds, sorted descending by stxValueRatio (ascending bondIndex as tiebreaker).
   * ERR_DISTRIBUTION_ALREADY_COMPUTED (u30) is benign — rewards were already settled.
   */
  public calculateRewards = async (
    opts?: { note?: string; nonce?: bigint },
  ): Promise<CalculateRewardsResponse> => {
    try {
      if (!this.publicKey || !this.vaultAccountId) throw new Error('SDK not initialized');
      const bondIndices = await this.getActiveBondsSorted();

      // Authoritative preflight (cycle not already computed, bonds ordered by ratio).
      const preflight = await fetchEligibleCalculateRewards({ bondIndices, network: this.pox5Network });
      if (!preflight.ok) {
        const reasons = (preflight as { reasons?: number[] }).reasons ?? [];
        return { success: false, error: `Cannot calculate rewards: ${this.describeBondReasons(reasons)}` };
      }

      const result = await this.runNonceExclusive(async () => {
        const resolvedNonce = await this.resolveNonce(opts?.nonce);
        const tx = await buildCalculateRewards({
          bondIndices,
          publicKey: this.publicKey,
          fee: DEFAULT_POX_FEE_USTX,
          nonce: resolvedNonce,
          network: this.pox5Network,
        });
        return this.pox5SignAndBroadcast(tx, opts?.note ?? 'calculate-rewards');
      });
      if (!result?.txid || result.error || result.reason) {
        return { success: false, error: result?.error ?? result?.reason ?? 'broadcast failed' };
      }
      const settled = await this.waitForTxSettlement(result.txid);
      if (!settled.success || settled.data?.tx_status !== 'success') {
        return { success: false, unsettled: !settled.success, error: settled.data?.tx_error ?? 'calculate-rewards failed on-chain', txHash: result.txid };
      }
      return { success: true, txHash: result.txid };
    } catch (error) {
      return { success: false, error: `Failed to calculate rewards: ${formatErrorMessage(error)}` };
    }
  };

  private cycleRange = (startCycle: number, endCycleExclusive: number): number[] => {
    const cycles: number[] = [];
    for (let cycle = startCycle; cycle < endCycleExclusive; cycle++) cycles.push(cycle);
    return cycles;
  };

  /**
   * Resolves a fetcher across cycles in fixed-size batches. Contract reads are issued
   * one batch at a time to keep a wide cycle range from exhausting node connections.
   */
  private mapCyclesLimited = async (
    cycles: number[],
    fetcher: (cycle: number) => Promise<bigint>,
    concurrency = 10,
  ): Promise<bigint[]> => {
    const values: bigint[] = [];
    for (let i = 0; i < cycles.length; i += concurrency) {
      values.push(...await Promise.all(cycles.slice(i, i + concurrency).map(fetcher)));
    }
    return values;
  };

  private sumOverCycles = async (
    cycles: number[],
    fetcher: (cycle: number) => Promise<bigint>,
  ): Promise<bigint> => {
    const values = await this.mapCyclesLimited(cycles, fetcher);
    return values.reduce((sum, v) => sum + v, BigInt(0));
  };


  /**
   * Executes the two-step signer-manager reward claim for a single reward cycle.
   * @param claimBondIndices - Bond indices passed to claim-rewards (empty for STX-only stakes).
   * @param stakerBondIndices - One claim-staker-rewards call per entry; `undefined` claims the
   * STX-only share via none() instead of some(bondIndex).
   * @returns The advanced nonce, and an error message if any step failed.
   */
  private executeClaimCycle = async (
    signerContractAddress: string,
    signerContractName: string,
    cycle: number,
    claimBondIndices: number[],
    stakerBondIndices: (number | undefined)[],
    // Explicit starting nonce (from the caller), consumed by the FIRST leg of the whole
    // claim and validated by resolveNonce; every later leg auto-resolves.
    nonceHolder: { value?: bigint },
    note: string | undefined,
    txHashes: string[],
    results: ClaimResultItem[],
  ): Promise<{ error?: string; unsettled?: boolean }> => {
    // Bound the sBTC that PoX-5 sends to the signer manager during claim-rewards.
    // total-rewards = get-earned(signer, cycle, none) + Σ get-earned(signer, cycle,
    // some(idx)) over UNIQUE bond indices. The contract pays duplicate indices once
    // but processes them sequentially, so they are deduplicated both before summing
    // (a naive sum would double-count) and before the call.
    const signerManager = `${signerContractAddress}.${signerContractName}`;
    const uniqueBondIndices = [...new Set(claimBondIndices)].sort((a, b) => a - b);

    const sbtcAsset = await this.resolveSbtcAsset();
    if (!sbtcAsset) {
      return { error: `Cannot resolve the network sBTC asset to bound claim-rewards at cycle ${cycle}; refusing to broadcast an unbounded reward claim.` };
    }
    const bootAddr = (this.pox5Network as any).bootAddress as string;
    const pox5ContractId: `${string}.${string}` = `${bootAddr}.pox-5`;
    const sbtcContractId: `${string}.${string}` = `${sbtcAsset.contractAddress}.${sbtcAsset.contractName}`;

    let totalRewards: bigint;
    // Per-bond signer-cohort accrual (captured from the same reads) for reporting.
    const accruedByBond = new Map<number, bigint>();
    let noneAccrued = BigInt(0);
    try {
      // A failed read must NOT default to 0 (that would understate the bound and
      // abort the claim after signing) — Promise.all rejects on any failure.
      const earned = await Promise.all([
        fetchEarned({ signerManager, rewardCycle: cycle, network: this.pox5Network }),
        ...uniqueBondIndices.map((idx) =>
          fetchEarned({ signerManager, rewardCycle: cycle, bondIndex: idx, network: this.pox5Network }),
        ),
      ]);
      totalRewards = earned.reduce((sum, e) => sum + e, BigInt(0));
      noneAccrued = earned[0] ?? BigInt(0);
      uniqueBondIndices.forEach((idx, i) => accruedByBond.set(idx, earned[i + 1] ?? BigInt(0)));
    } catch (error) {
      return { error: `Could not read earned rewards to bound claim-rewards at cycle ${cycle}: ${formatErrorMessage(error)}` };
    }

    // Broadcasts one claim leg under a SHORT nonce lock (resolve nonce → build → sign →
    // broadcast), then polls settlement OUTSIDE the lock — so a stalled multi-cycle
    // claim never holds the vault's nonce lock across settlement waits (FBS-31). A
    // claim's OWN legs never collide because each waits for the prior to settle before
    // resolving. Against CONCURRENT vault operations, nonce uniqueness relies on the
    // same mempool-aware resolveNonce + short-lock pattern used everywhere else in this
    // SDK — consistent with the rest of the code, not a stronger guarantee.
    const broadcastLeg = async (
      buildTx: (nonce: bigint) => Promise<StacksTransactionWire>,
      legNote: string,
    ): Promise<{ txid: string; settled: GetTransactionStatusResponse } | { broadcastError: string }> => {
      const result = await this.runNonceExclusive(async () => {
        // Honor + validate a caller-supplied starting nonce on the first leg only.
        const explicit = nonceHolder.value;
        nonceHolder.value = undefined;
        const n = await this.resolveNonce(explicit);
        const tx = await buildTx(n);
        return this.pox5SignAndBroadcast(tx, legNote);
      });
      if (!result?.txid || result.error || result.reason) {
        return { broadcastError: [result?.error, result?.reason].filter(Boolean).join(' — ') || 'broadcast failed' };
      }
      const settled = await this.waitForTxSettlement(result.txid);
      return { txid: result.txid, settled };
    };

    // Records a per-bond FAILED result for this cycle when the SHARED claim-rewards leg
    // fails before the per-bond staker loop runs, so the structured results still show
    // the cycle rather than silently omitting it.
    const recordCycleFailure = (error: string, signerClaimTxid: string | null) => {
      for (const b of stakerBondIndices) {
        results.push({
          bondIndex: b ?? null,
          rewardCycle: cycle,
          signerManager,
          signerAccruedSats: (b !== undefined ? (accruedByBond.get(b) ?? BigInt(0)) : noneAccrued).toString(),
          stakerPaidSats: null,
          signerClaimTxid,
          stakerClaimTxid: null,
          status: 'failed',
          error,
        });
      }
    };

    // ── Leg 1: signer-manager claim-rewards (PoX-5 sends total-rewards sBTC to the manager) ──
    const smClaim = await broadcastLeg(
      (n) => makeUnsignedContractCall({
        contractAddress: signerContractAddress,
        contractName: signerContractName,
        functionName: 'claim-rewards',
        functionArgs: [Cl.list(uniqueBondIndices.map(i => Cl.uint(i))), Cl.uint(cycle)],
        publicKey: this.publicKey!,
        fee: DEFAULT_POX_FEE_USTX,
        nonce: n,
        network: this.pox5Network,
        // Deny mode: PoX-5 sends exactly total-rewards sBTC to the signer manager for
        // this cycle. Computed from the same chain state read just above.
        postConditionMode: 'deny',
        postConditions: [
          Pc.principal(pox5ContractId).willSendEq(totalRewards).ft(sbtcContractId, sbtcAsset.assetName),
        ],
      }),
      `sm-claim-rewards-cycle-${cycle}`,
    );
    if ('broadcastError' in smClaim) {
      const msg = `signer-manager.claim-rewards broadcast failed at cycle ${cycle}: ${smClaim.broadcastError}`;
      recordCycleFailure(msg, null);
      return { error: msg };
    }
    // u30 (ERR_DISTRIBUTION_ALREADY_COMPUTED) / u32 are benign — rewards already collected.
    const smClaimRepr: string = (smClaim.settled.data?.tx_result as any)?.repr ?? smClaim.settled.data?.tx_error ?? '';
    if (smClaim.settled.data?.tx_status !== 'success' && !smClaimRepr.includes('u30') && !smClaimRepr.includes('u32')) {
      const msg = `signer-manager.claim-rewards failed at cycle ${cycle}: ${smClaimRepr}`;
      recordCycleFailure(msg, smClaim.txid);
      return { unsettled: !smClaim.settled.success, error: msg };
    }
    const signerClaimTxid: string = smClaim.txid;

    // The staker payout is performed by the signer manager from its OWN balance
    // (PoX-5 moves no sBTC on this leg — answers §3b), so the bound is manager-specific
    // and comes from the registered signer-manager adapter. With no registered payout
    // policy the claim is REFUSED rather than signed permissively.
    const stakerPayoutPolicy = this.signerManagerRegistry.get(signerManager)?.payoutPolicy;
    if (stakerBondIndices.length > 0 && !stakerPayoutPolicy) {
      return {
        error: `No registered payout policy for signer manager ${signerManager} — refusing an unbounded staker reward claim at cycle ${cycle}. Register a signerManagerAdapters entry with a payout policy for this manager.`,
      };
    }
    const stakerPayoutAssetId: `${string}.${string}` | undefined = stakerPayoutPolicy
      ? `${stakerPayoutPolicy.asset.contractAddress}.${stakerPayoutPolicy.asset.contractName}`
      : undefined;

    for (const bondIndex of stakerBondIndices) {
      const signerAccruedSats = bondIndex !== undefined
        ? (accruedByBond.get(bondIndex) ?? BigInt(0))
        : noneAccrued;
      // Best-effort read of THIS staker's own entitlement (distinct from the signer
      // cohort's accrual). A reporting read only — a failure does not abort the claim.
      const stakerPaidSats = await fetchEarnedStakerRewards({
        signerManager, rewardCycle: cycle, bondIndex, staker: this.address!, network: this.pox5Network,
      }).catch(() => null);

      const recordResult = (status: 'claimed' | 'failed', stakerClaimTxid: string | null, error?: string) =>
        results.push({
          bondIndex: bondIndex ?? null,
          rewardCycle: cycle,
          signerManager,
          signerAccruedSats: signerAccruedSats.toString(),
          // Only report a paid amount when the payout actually settled; a failed leg
          // paid nothing, so it must not carry the pre-claim entitlement.
          stakerPaidSats: status === 'claimed' && stakerPaidSats !== null ? stakerPaidSats.toString() : null,
          signerClaimTxid,
          stakerClaimTxid,
          status,
          ...(error ? { error } : {}),
        });

      const defaultNote = bondIndex !== undefined
        ? `sm-claim-staker-rewards-cycle-${cycle}-bond-${bondIndex}`
        : `sm-claim-staker-stx-rewards-cycle-${cycle}`;
      const bondSuffix = bondIndex !== undefined ? ` bond ${bondIndex}` : '';

      const smStaker = await broadcastLeg(
        (n) => makeUnsignedContractCall({
          contractAddress: signerContractAddress,
          contractName: signerContractName,
          functionName: 'claim-staker-rewards',
          functionArgs: [
            Cl.address(this.address!),
            Cl.uint(cycle),
            bondIndex !== undefined ? Cl.some(Cl.uint(bondIndex)) : Cl.none(),
          ],
          publicKey: this.publicKey!,
          fee: DEFAULT_POX_FEE_USTX,
          nonce: n,
          network: this.pox5Network,
          // Deny mode: the manager sends the staker at most maxPayoutSats of the
          // policy asset (a deliberate upper bound, per answers §3a).
          postConditionMode: 'deny',
          postConditions: [
            Pc.principal(signerManager)
              .willSendLte(stakerPayoutPolicy!.maxPayoutSats)
              .ft(stakerPayoutAssetId!, stakerPayoutPolicy!.asset.assetName),
          ],
        }),
        note ?? defaultNote,
      );
      if ('broadcastError' in smStaker) {
        recordResult('failed', null, smStaker.broadcastError);
        return { error: `Failed at cycle ${cycle}${bondSuffix}: ${smStaker.broadcastError}` };
      }
      if (!smStaker.settled.success || smStaker.settled.data?.tx_status !== 'success') {
        const stakerRepr: string = (smStaker.settled.data?.tx_result as any)?.repr ?? smStaker.settled.data?.tx_error ?? '';
        recordResult('failed', smStaker.txid, stakerRepr);
        return { unsettled: !smStaker.settled.success, error: `Claim failed on-chain at cycle ${cycle}${bondSuffix}: ${stakerRepr}` };
      }
      recordResult('claimed', smStaker.txid);
      txHashes.push(smStaker.txid);
    }

    return {};
  };

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
  public claimRewards = async (
    bondIndices: number[],
    opts?: { note?: string; nonce?: bigint },
  ): Promise<ClaimRewardsResponse> => {
    try {
      if (!this.publicKey || !this.vaultAccountId) throw new Error('SDK not initialized');
      if (!this.address) throw new Error('Address not set');
      if (bondIndices.length === 0) return { success: false, error: 'No bond indices provided' };

      const staker = this.address;
      const uniqueBonds = [...new Set(bondIndices)].sort((a, b) => a - b);
      const pox = await fetchPox5Info({ network: this.pox5Network });

      // First earning cycle per bond is chain-derived (no local record required), used
      // only to bound the cycle scan below.
      const firstCycleByBond = new Map<number, number>(
        uniqueBonds.map((b) => [b, bondPeriodToRewardCycle({ bondIndex: b, poxInfo: pox })]),
      );
      const minFirstCycle = Math.min(...firstCycleByBond.values());

      const lastComputeHeight = await fetchLastRewardComputeHeight({ network: this.pox5Network }).catch(() => 0);
      const lastComputedCycle = lastComputeHeight > 0
        ? Math.floor((lastComputeHeight - pox.firstBurnchainBlockHeight) / pox.rewardCycleLength)
        : pox.rewardCycleId - 1;

      // Planning phase (OUTSIDE the nonce lock): resolve the per-cycle signer and which
      // requested bonds earned, via chain reads. The chain is the authority for which
      // signer manager governs the staker each cycle — rotation changes future cycles,
      // not past ones — so the local record is a cache only, and this also works after a
      // restart with an empty cache. A read failure refuses rather than reading as "no
      // rewards". Doing the scan here keeps the exclusive nonce lock held only for the
      // broadcast sequence, not the whole read scan.
      const plan: Array<{ cycle: number; signerAddr: string; signerName: string; bonds: number[] }> = [];
      for (let cycle = minFirstCycle; cycle <= lastComputedCycle; cycle++) {
        let cycleMembership: { amountUstx: bigint; signer: string } | undefined;
        try {
          cycleMembership = await fetchSignerCycleMembership({ staker, cycle, network: this.pox5Network });
        } catch (e) {
          return { success: false, error: `Could not resolve signer-cycle membership for cycle ${cycle} (unknown, not zero) — refusing to claim: ${formatErrorMessage(e)}` };
        }
        if (!cycleMembership) continue; // staker was not a member in this cycle

        const signerManager = cycleMembership.signer;
        // Which requested bonds could be earning by this cycle, and which still have work
        // to do under this cycle's signer. A bond is included when EITHER the signer-cohort
        // accrual (leg 1, claim-rewards) OR this staker's own entitlement (leg 2,
        // claim-staker-rewards) is still positive — so a claim that crashed AFTER the
        // signer leg but BEFORE the staker payout resumes on re-invocation instead of
        // stranding the payout (the chain is the progress record; both legs are contract-
        // idempotent so re-running the already-settled leg is benign). A read failure
        // (sentinel -1) refuses rather than skipping a bond that may have rewards.
        const candidateBonds = uniqueBonds.filter((b) => (firstCycleByBond.get(b) ?? 0) <= cycle);
        const earned = await Promise.all(
          candidateBonds.map(async (b) => {
            const [signerSats, stakerSats] = await Promise.all([
              fetchEarned({ signerManager, rewardCycle: cycle, bondIndex: b, network: this.pox5Network }).catch(() => BigInt(-1)),
              fetchEarnedStakerRewards({ signerManager, rewardCycle: cycle, bondIndex: b, staker, network: this.pox5Network }).catch(() => BigInt(-1)),
            ]);
            return { bond: b, signerSats, stakerSats };
          }),
        );
        const failedRead = earned.find((e) => e.signerSats < BigInt(0) || e.stakerSats < BigInt(0));
        if (failedRead) {
          return { success: false, error: `Could not read earned rewards for bond ${failedRead.bond} at cycle ${cycle} (unknown, not zero) — refusing to claim` };
        }
        const claimBonds = earned.filter((e) => e.signerSats > BigInt(0) || e.stakerSats > BigInt(0)).map((e) => e.bond);
        if (claimBonds.length === 0) continue;
        const dot = signerManager.lastIndexOf('.');
        plan.push({ cycle, signerAddr: signerManager.slice(0, dot), signerName: signerManager.slice(dot + 1), bonds: claimBonds });
      }

      if (plan.length === 0) {
        return {
          success: false,
          error: `No rewards available yet for bond(s) ${uniqueBonds.join(', ')} (last_computed_cycle: ${lastComputedCycle}, current_cycle: ${pox.rewardCycleId})`,
        };
      }

      // Execution: NO outer nonce lock — executeClaimCycle takes a SHORT lock per leg
      // and polls settlement outside it (FBS-31), so a stalled multi-cycle claim does
      // not block other vault operations. Legs stay correctly ordered and nonces unique
      // via mempool-aware resolveNonce; each dependent leg waits for the prior to settle.
      const txHashes: string[] = [];
      const results: ClaimResultItem[] = [];
      // A caller-supplied nonce pins only the first leg; later legs auto-resolve.
      const nonceHolder = { value: opts?.nonce };
      for (const item of plan) {
        // claim-rewards takes (list 6 uint) — chunk to at most 6 bonds per call.
        for (let i = 0; i < item.bonds.length; i += 6) {
          const chunk = item.bonds.slice(i, i + 6);
          const result = await this.executeClaimCycle(
            item.signerAddr, item.signerName, item.cycle,
            chunk, chunk, nonceHolder, opts?.note, txHashes, results,
          );
          if (result.error) return { success: false, unsettled: result.unsettled, error: result.error, txHashes, results };
        }
      }
      return { success: true, txHashes, results };
    } catch (error) {
      return { success: false, error: `Failed to claim rewards: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Claims accumulated sBTC rewards for an STX-only staker (no BTC bonds).
   *
   * The signer manager is resolved PER CYCLE from get-signer-cycle-membership (not the
   * current stake), so historical cycles route correctly across signer rotation and
   * stay claimable after the stake expires when an explicit cycle range is supplied.
   * Claimability is gated by the STAKER'S entitlement (get-earned-staker-rewards), not
   * the signer-level total — a non-zero signer amount with a zero staker amount does
   * not trigger a claim — and a read failure refuses rather than reading as "no rewards".
   */
  public claimStxOnlyRewards = async (
    opts?: { note?: string; nonce?: bigint; fromCycle?: number; toCycle?: number },
  ): Promise<ClaimRewardsResponse> => {
    try {
      if (!this.publicKey || !this.vaultAccountId) throw new Error('SDK not initialized');
      if (!this.address) throw new Error('Address not set');
      const staker = this.address;

      const pox = await fetchPox5Info({ network: this.pox5Network });
      const lastComputeHeight = await fetchLastRewardComputeHeight({ network: this.pox5Network }).catch(() => 0);
      const lastComputedCycle = lastComputeHeight > 0
        ? Math.floor((lastComputeHeight - pox.firstBurnchainBlockHeight) / pox.rewardCycleLength)
        : pox.rewardCycleId - 1;

      // An explicit fromCycle lets an EXPIRED stake still claim historical cycles;
      // otherwise the active stake's first reward cycle bounds the scan.
      let startCycle = opts?.fromCycle;
      if (startCycle === undefined) {
        const stakerInfo = await fetchStakerInfo({ address: staker, network: this.pox5Network }).catch(() => null);
        if (!stakerInfo?.staked) {
          return { success: false, error: 'No active STX-only stake found; supply fromCycle (and optionally toCycle) to claim historical cycles after expiry.' };
        }
        startCycle = stakerInfo.details.firstRewardCycle;
      }
      const endCycle = Math.min(opts?.toCycle ?? lastComputedCycle, lastComputedCycle);

      // Planning phase (OUTSIDE the nonce lock): resolve the per-cycle signer and gate
      // by the STAKER'S entitlement (get-earned-staker-rewards), not the signer-level
      // total. A read failure refuses rather than reading as "no rewards".
      const plan: Array<{ cycle: number; signerAddr: string; signerName: string }> = [];
      for (let cycle = startCycle!; cycle <= endCycle; cycle++) {
        let cycleMembership: { amountUstx: bigint; signer: string } | undefined;
        try {
          cycleMembership = await fetchSignerCycleMembership({ staker, cycle, network: this.pox5Network });
        } catch (e) {
          return { success: false, error: `Could not resolve signer-cycle membership for cycle ${cycle} (unknown, not zero) — refusing to claim: ${formatErrorMessage(e)}` };
        }
        if (!cycleMembership) continue;

        const signerManager = cycleMembership.signer;
        let stakerEarned: bigint;
        try {
          stakerEarned = await fetchEarnedStakerRewards({ signerManager, rewardCycle: cycle, staker, network: this.pox5Network });
        } catch (e) {
          return { success: false, error: `Could not read staker-earned rewards at cycle ${cycle} (unknown, not zero) — refusing to claim: ${formatErrorMessage(e)}` };
        }
        if (stakerEarned <= BigInt(0)) continue;
        const dot = signerManager.lastIndexOf('.');
        plan.push({ cycle, signerAddr: signerManager.slice(0, dot), signerName: signerManager.slice(dot + 1) });
      }

      if (plan.length === 0) {
        return { success: false, error: `No STX-only rewards for this staker in cycles ${startCycle}-${endCycle} (last_computed_cycle: ${lastComputedCycle}, current_cycle: ${pox.rewardCycleId})` };
      }

      // Execution: NO outer nonce lock — executeClaimCycle takes a SHORT lock per leg
      // and polls settlement outside it (FBS-31), so a stalled claim does not block
      // other vault operations. Nonces stay unique via mempool-aware resolveNonce.
      const txHashes: string[] = [];
      const results: ClaimResultItem[] = [];
      // A caller-supplied nonce pins only the first leg; later legs auto-resolve.
      const nonceHolder = { value: opts?.nonce };
      for (const item of plan) {
        const result = await this.executeClaimCycle(
          item.signerAddr, item.signerName, item.cycle,
          [], [undefined], nonceHolder, opts?.note, txHashes, results,
        );
        if (result.error) return { success: false, unsettled: result.unsettled, error: result.error, txHashes, results };
      }
      return { success: true, txHashes, results };
    } catch (error) {
      return { success: false, error: `Failed to claim STX-only rewards: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Returns earned sBTC rewards (sats) for a signerManager + optional bondIndex.
   * Includes staker-specific rewards when this vault's address is in the signer set.
   */
  public getEarnedRewards = async (
    signerManager: string,
    bondIndex?: number,
  ): Promise<EarnedRewardsResponse> => {
    try {
      const pox = await fetchPox5Info({ network: this.pox5Network });
      const bondFirstRewardCycle = bondIndex !== undefined
        ? bondPeriodToRewardCycle({ bondIndex, poxInfo: pox })
        : undefined;

      // Without a bondIndex the range is anchored to the staker's own first reward cycle;
      // cycle 0 would scan the whole chain history.
      let startCycle = bondFirstRewardCycle;
      if (startCycle === undefined) {
        const stakerInfo = this.address
          ? await fetchStakerInfo({ address: this.address, network: this.pox5Network }).catch(() => null)
          : null;
        startCycle = stakerInfo?.staked ? stakerInfo.details.firstRewardCycle : pox.rewardCycleId;
      }

      const pastCycles = this.cycleRange(startCycle, pox.rewardCycleId);
      const stakerAddress = this.address;

      const [earned, stakerEarned] = await Promise.all([
        this.sumOverCycles(pastCycles, cycle => fetchEarned({
          signerManager,
          rewardCycle: cycle,
          bondIndex,
          network: this.pox5Network,
        }).catch(() => BigInt(0))),
        stakerAddress
          ? this.sumOverCycles(pastCycles, cycle => fetchEarnedStakerRewards({
              signerManager,
              rewardCycle: cycle,
              bondIndex,
              staker: stakerAddress,
              network: this.pox5Network,
            }).catch(() => BigInt(0)))
          : Promise.resolve(BigInt(0)),
      ]);

      const cyclesUntilRewards = bondFirstRewardCycle !== undefined
        ? Math.max(0, bondFirstRewardCycle - pox.rewardCycleId)
        : undefined;

      return {
        success: true,
        data: {
          current_cycle: pox.rewardCycleId,
          first_reward_cycle: bondFirstRewardCycle,
          cycles_until_rewards: cyclesUntilRewards,
          earned_sats: earned.toString(),
          staker_earned_sats: stakerEarned.toString(),
        },
      };
    } catch (error) {
      return { success: false, error: `Failed to fetch earned rewards: ${formatErrorMessage(error)}` };
    }
  };

  /**
   * Check account status: balance total, locked amount and delegation status.
   * @returns A promise that resolves to a {CreateTransactionResponse}.
   */

  public checkStatus = async (): Promise<CheckStatusResponse> => {
    if (!this.address || !this.publicKey || !this.vaultAccountId) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }

    console.log(`Checking account status for address: ${this.address}`);

    try {
      // Delegation only exists on PoX-4. On PoX-5 the read targets a function that
      // does not exist and always errors, so gate it on the active contract.
      const pox5Info = await fetchPox5Info({ network: this.pox5Network }).catch(() => null);
      const delegationApplicable = pox5Info?.contractId?.includes("pox-4") ?? false;

      const [delegationResult, balanceResponse, stakerInfo, bondMembership] = await Promise.all([
        delegationApplicable
          ? this.chainService.checkDelegationStatus(this.address)
              .then((value) => ({ value, failed: false }))
              .catch(() => ({ value: null, failed: true }))
          : Promise.resolve({ value: null as any, failed: false }),
        this.chainService.makeBalanceCalls(this.address),
        fetchStakerInfo({ address: this.address, network: this.pox5Network }).catch(() => null),
        fetchBondMembership({ address: this.address, network: this.pox5Network }).catch(() => null),
      ]);

      if (!balanceResponse) {
        throw new Error("Failed to fetch balance data");
      }

      const balanceData = balanceResponse.data;

      const stxBalMicro = BigInt(balanceData.balance ?? "0");
      const stxLockedMicro = BigInt(balanceData.locked ?? "0");
      const totalMinerRewardsRecievedMicro = BigInt(
        balanceData.total_miner_rewards_received ?? "0",
      );

      const delegationData = delegationResult.value;
      const isDelegated = !!(delegationData && delegationData.value);

      const amountDelegatedMicro = isDelegated
        ? BigInt(delegationData.value["amount-ustx"]?.value ?? "0")
        : null;

      const delegatedTo = isDelegated
        ? (delegationData.value["delegated-to"]?.value ?? null)
        : null;

      const untilBurnHt = isDelegated
        ? delegationData.value["until-burn-ht"]?.value?.value
          ? Number(delegationData.value["until-burn-ht"].value.value)
          : null
        : null;

      const poxAddrTuple = isDelegated
        ? (delegationData.value["pox-addr"]?.value ?? null) // null if none
        : null;

      const pox5IsStaked = !!stakerInfo?.staked;
      const pox5Details = pox5IsStaked && stakerInfo?.staked ? stakerInfo.details : null;
      const unlockBurnHeight = pox5Details && pox5Info
        ? pox5Info.firstBurnchainBlockHeight
          + (pox5Details.firstRewardCycle + pox5Details.numCycles) * pox5Info.rewardCycleLength
        : null;
      const inPreparePhase = pox5Info
        ? isInPreparePhase({ burnHeight: pox5Info.currentBurnchainBlockHeight, poxInfo: pox5Info })
        : false;

      const statusData: CheckStatusData = {
        balance: {
          stx_total: microToStx(stxBalMicro),
          stx_locked: microToStx(stxLockedMicro),
          lock_tx_id: balanceData.lock_tx_id || null,
          lock_height: balanceData.lock_height || null,
          burnchain_lock_height: balanceData.burnchain_lock_height || null,
          burnchain_unlock_height:
            balanceData.burnchain_unlock_height || null,
          total_miner_rewards_received: microToStx(
            totalMinerRewardsRecievedMicro,
          ),
        },
        delegation: {
          applicable: delegationApplicable,
          is_delegated: isDelegated,
          lookup_failed: delegationResult.failed,
          delegated_to: delegatedTo,
          amount_delegated: amountDelegatedMicro
            ? microToStx(amountDelegatedMicro)
            : null,
          until_burn_ht: untilBurnHt,
          pox_addr: poxAddrTuple,
        },
        stx_only: {
          is_staked: pox5IsStaked,
          amount_stx: pox5Details ? microToStx(pox5Details.amountUstx) : null,
          signer_manager: pox5Details?.signer ?? null,
          first_reward_cycle: pox5Details?.firstRewardCycle ?? null,
          num_cycles: pox5Details?.numCycles ?? null,
          unlock_burn_height: unlockBurnHeight,
          current_burn_height: pox5Info?.currentBurnchainBlockHeight ?? 0,
          current_cycle_id: pox5Info?.rewardCycleId ?? 0,
          is_prepare_phase: inPreparePhase,
          // True when the PoX read failed: the burn-height/cycle/prepare-phase fields
          // above are UNKNOWN (defaulted to 0/false), not authoritative zeros.
          pox_lookup_failed: pox5Info === null,
        },
        bond: bondMembership ? {
          bond_index: bondMembership.bondIndex,
          amount_stx: microToStx(bondMembership.amountUstx),
          amount_sats: bondMembership.amountSats.toString(),
          signer_manager: bondMembership.signer,
          is_l1_lock: bondMembership.isL1Lock,
        } : null,
      };

      return {
        success: true,
        data: statusData,
      };
    } catch (error: any) {
      console.error(`Error checking status: ${formatErrorMessage(error)}`);
      return {
        success: false,
        error: `Failed to check status: ${formatErrorMessage(error)}`,
      };
    }
  };

  /**
   * Check eligibility for PoX-5 staking.
   * @returns A promise that resolves to an object indicating eligibility and reason if not eligible.
   */
  public checkEligibility = async (
    pox: Pox5PoxInfo | PoxInfo,
    amountStx: number,
  ): Promise<{ eligible: boolean; reason?: string }> => {
    try {
      // Can't stake if already in an active PoX-5 position — must call updateStake instead
      const stakerInfo = await fetchStakerInfo({ address: this.address!, network: this.pox5Network });
      if (stakerInfo.staked) {
        return {
          eligible: false,
          reason: `Account already has an active PoX-5 staking position. Use updateStake to modify it.`,
        };
      }

      // Block submission when too close to the prepare phase boundary (not just during it)
      const safetyCheck = isSafeToSubmit(pox);
      if (!safetyCheck.safe) {
        // Accepts either PoX shape: pox-4 uses snake_case, pox-5 camelCase.
        const raw = pox as any;
        const prepareLength = raw.prepare_phase_block_length ?? raw.prepareCycleLength;
        const cycleId = raw.reward_cycle_id ?? raw.rewardCycleId;
        return {
          eligible: false,
          reason: `Too close to prepare phase boundary. Try again in ${prepareLength + safetyCheck.blocksUntilBoundary} blocks (next cycle: ${cycleId + 1}).`,
        };
      }

      const balance = await this.getBalance();
      if (!balance.success) {
        throw new Error(`Could not fetch account balance to check funds sufficiency`);
      }

      if (stxToMicro(amountStx) > stxToMicro(balance.balance)) {
        return {
          eligible: false,
          reason: `Amount to stake (${amountStx} STX) exceeds available balance of ${balance.balance} STX.`,
        };
      }

      return { eligible: true };
    } catch (error) {
      console.error(`Error checking eligibility: ${formatErrorMessage(error)}`);
      return {
        eligible: false,
        reason: `Failed to check eligibility: ${formatErrorMessage(error)}`,
      };
    }
  };

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
  public stackSolo = async (
    signerKey: string,
    signerSig65Hex: string,
    amount: number,
    maxAmount: number,
    lockPeriod: number,
    authId: bigint,
    note?: string,
    nonce?: bigint,
    externalId?: string,
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }

      console.log(`Solo stacking ${amount} STX for ${lockPeriod} cycles`);

      const poxResponse = await this.chainService.fetchPoxInfo();
      const pox = poxResponse.data;

      // Delegation is a pox-4 concept, so the guard only applies when pox-4 is the active
      // contract. On pox-5 networks get-delegation-info does not exist and the read fails.
      const isPox4 = String(pox.contract_id ?? "").includes("pox-4");
      if (isPox4) {
        const status = await this.checkStatus();
        if (!status.success || !status.data) {
          return { success: false, error: `Failed to check account status before solo stacking: ${status.error}` };
        }
        // An unresolved lookup blocks: proceeding would burn a signature on a likely revert.
        if (status.data.delegation.lookup_failed) {
          return { success: false, error: `Could not determine delegation status. Retry once the Stacks API is reachable.` };
        }
        if (status.data.delegation.is_delegated) {
          return {
            success: false,
            error: `Account has an active delegation to ${status.data.delegation.delegated_to}. Revoke it before solo stacking.`,
          };
        }
      }

      if (stxToMicro(amount) < BigInt(pox.min_amount_ustx)) {
        return {
          success: false,
          error: `Amount to stack (${amount} STX) is below the minimum of ${microToStx(BigInt(pox.min_amount_ustx))} STX.`,
        };
      }

      const eligibilityCheck = await this.checkEligibility(pox, amount);
      if (!eligibilityCheck.eligible) {
        return {
          success: false,
          error: `Account not eligible for solo stacking: ${eligibilityCheck.reason}`,
        };
      }

      const startBurnHeight = pox.current_burnchain_block_height;

      const result = await this.buildSignSendContractCall({
        functionName: "solo-stack",
        amount: stxToMicro(amount),
        maxAmount: stxToMicro(maxAmount),
        lockPeriod,
        signerKey,
        signerSig65Hex,
        startBurnHeight,
        authId,
        note,
        nonce,
        externalId,
      });

      const assertResult = assertResultSuccess(result);
      if (assertResult.success === false) {
        return {
          success: false,
          error: `Failed to solo stack STX: ${assertResult.error}`,
        };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          unsettled: !txStatus.success,
          error: txStatus.error || txStatus.data?.tx_error || "Transaction failed at the contract level.",
          txHash: result.txid,
        };
      }

      console.log(`Successfully solo stacked ${amount} STX`);
      return {
        success: true,
        txHash: result.txid,
      };
    } catch (error) {
      console.error(`Error solo stacking: ${formatErrorMessage(error)}`);
      return {
        success: false,
        error: `Failed to solo stack: ${formatErrorMessage(error)}`,
      };
    }
  };

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
  public increaseStackedAmount = async (
    signerKey: string,
    signerSig65Hex: string,
    increaseBy: number,
    maxAmount: number,
    authId: bigint,
    note?: string,
    nonce?: bigint,
    externalId?: string,
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }

      console.log(`Increasing stacked amount by ${increaseBy} STX`);
      
      const result = await this.buildSignSendContractCall({
        functionName: "increase-stack-amount",
        amount: stxToMicro(increaseBy),
        maxAmount: stxToMicro(maxAmount),
        signerKey,
        signerSig65Hex,
        authId,
        note,
        nonce,
        externalId,
      });

      const assertResult = assertResultSuccess(result);
      if (assertResult.success === false) {
        return {
          success: false,
          error: `Failed to increase stacked amount: ${assertResult.error}`,
        };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          unsettled: !txStatus.success,
          error: txStatus.error || txStatus.data?.tx_error || "Transaction failed at the contract level.",
          txHash: result.txid,
        };
      }

      console.log(`Successfully increased stacked amount by ${increaseBy} STX`);
      return {
        success: true,
        txHash: result.txid,
      };
    } catch (error) {
      console.error(`Error increasing stacked amount: ${formatErrorMessage(error)}`);
      return {
        success: false,
        error: `Failed to increase stacked amount: ${formatErrorMessage(error)}`,
      };
    }
  };

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
  public extendStackingPeriod = async (
    signerKey: string,
    signerSig65Hex: string,
    extendCycles: number,
    maxAmount: number,
    authId: bigint,
    note?: string,
    nonce?: bigint,
    externalId?: string,
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }

      console.log(`Extending stacking period by ${extendCycles} cycles`);
      
      const result = await this.buildSignSendContractCall({
        functionName: "extend-stack-period",
        maxAmount: stxToMicro(maxAmount),
        extendCycles,
        signerKey,
        signerSig65Hex,
        authId,
        note,
        nonce,
        externalId,
      });

      const assertResult = assertResultSuccess(result);
      if (assertResult.success === false) {
        return {
          success: false,
          error: `Failed to extend stacking period: ${assertResult.error}`,
        };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          unsettled: !txStatus.success,
          error: txStatus.error || txStatus.data?.tx_error || "Transaction failed at the contract level.",
          txHash: result.txid,
        };
      }

      console.log(`Successfully extended stacking period by ${extendCycles} cycles`);
      return {
        success: true,
        txHash: result.txid,
      };
    } catch (error) {
      console.error(`Error extending stacking period: ${formatErrorMessage(error)}`);
      return {
        success: false,
        error: `Failed to extend stacking period: ${formatErrorMessage(error)}`,
      };
    }
  };


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
  public replaceTransaction = async (
    newFee: number,
    originalTxId?: string,
    newRecipient?: string,
    newAmount?: number,
    nonceOverride?: bigint,
    note?: string,
    externalId?: string,
  ): Promise<CreateTransactionResponse> => {
    if (!this.address || !this.publicKey || !this.vaultAccountId) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }

    try {
      parseOptionalFee(newFee);
      const feeBigInt = stxToMicro(newFee);

      if (!originalTxId && nonceOverride === undefined) {
        return { success: false, error: "Either originalTxId or nonceOverride must be provided" };
      }

      if (nonceOverride !== undefined) {
        // ── Override path: nonce is known, tx may not be visible to the indexer ──
        // Only STX transfers are supported here — no original tx to reconstruct args from.
        if (!newRecipient || newAmount === undefined) {
          return {
            success: false,
            error: "newRecipient and newAmount are required when nonceOverride is provided",
          };
        }
        if (!validateAddress(newRecipient, this.testnet)) {
          return { success: false, error: "Invalid recipient address" };
        }

        const nonce = nonceOverride;
        const amountUstx = stxToMicro(newAmount);

        const confirmedNonce = await this.chainService.getConfirmedNonce(this.address);
        if (nonce < confirmedNonce) {
          return {
            success: false,
            error: `nonceOverride (${nonce}) is below the confirmed nonce (${confirmedNonce}). This transaction would be rejected.`,
          };
        }

        const balance = await this.getBalance();
        if (balance.success) {
          const totalRequired = microToStx(amountUstx + feeBigInt);
          if (balance.balance !== undefined && totalRequired > balance.balance) {
            return {
              success: false,
              error: `Insufficient balance. Required: ${totalRequired} STX, Available: ${balance.balance} STX`,
            };
          }
        }

        const transactionToSign = await this.chainService.serializeTransaction(
          this.address, this.publicKey, newRecipient, amountUstx,
          TransactionType.STX, undefined, undefined, undefined, undefined,
          nonce, feeBigInt,
        );

        const rawSignature = await this.fireblocksService.signTransaction(
          transactionToSign.preSignSigHash, this.vaultAccountId.toString(), note, externalId,
        );
        const signature = concatSignature(rawSignature.fullSig, rawSignature.v);
        (transactionToSign.unsignedTx as any).auth.spendingCondition.signature =
          createMessageSignature(signature);

        const result = await this.chainService.broadcastTransaction(transactionToSign.unsignedTx);
        if (!result || result.error || !result.txid || result.reason) {
          const msg = result?.error && result?.reason
            ? `${result.error} - ${result.reason}`
            : result?.error || result?.reason || "unknown error";
          return { success: false, error: formatErrorMessage(msg) };
        }
        console.log(`Replaced transaction ${originalTxId} with ${result.txid}`);
        return { success: true, txHash: result.txid };
      }

      // ── Lookup path: reconstruct any pending tx type with higher fee ──────────
      const originalTxResponse = await this.getTxStatusById(originalTxId!);

      if (!originalTxResponse.success || !originalTxResponse.data) {
        return { success: false, error: "Could not fetch original transaction details" };
      }

      if (originalTxResponse.data.tx_status !== "pending") {
        return {
          success: false,
          error: `Can only replace pending transactions. Current status: ${originalTxResponse.data.tx_status}`,
        };
      }

      const fullTx = originalTxResponse.data.full_tx_details;

      if (fullTx?.tx_type !== "token_transfer" && fullTx?.tx_type !== "contract_call") {
        return {
          success: false,
          error: `Cannot replace tx of type "${fullTx?.tx_type}". Only token_transfer and contract_call are supported.`,
        };
      }

      if (fullTx.sender_address !== this.address) {
        return {
          success: false,
          error: "Transaction sender does not match this vault account address",
        };
      }

      // Fee check: new fee must be at least RBF_MIN_FEE_MULTIPLIER × original
      const originalFeeUstx = BigInt(fullTx.fee_rate);
      const minFeeUstx = (originalFeeUstx * BigInt(Math.round(RBF_MIN_FEE_MULTIPLIER * 100))) / BigInt(100);
      if (feeBigInt < minFeeUstx) {
        return {
          success: false,
          error: `New fee (${newFee} STX) must be at least ${RBF_MIN_FEE_MULTIPLIER}x the original fee (${microToStx(originalFeeUstx)} STX). Minimum required: ${microToStx(minFeeUstx)} STX`,
        };
      }

      if (fullTx.tx_type === "contract_call" && (newRecipient !== undefined || newAmount !== undefined)) {
        return {
          success: false,
          error: "newRecipient and newAmount can only be changed for native STX transfers. This transaction is a contract_call.",
        };
      }

      const nonce = BigInt(fullTx.nonce);
      let unsignedTxWire: any;
      let preSignSigHash: string;

      if (fullTx.tx_type === "token_transfer") {
        const recipient = newRecipient ?? fullTx.token_transfer.recipient_address;
        const amountUstx = newAmount !== undefined
          ? stxToMicro(newAmount)
          : BigInt(fullTx.token_transfer.amount);
        const memoHex: string | undefined = fullTx.token_transfer.memo;
        const memo = memoHex
          ? Buffer.from(memoHex.startsWith('0x') ? memoHex.slice(2) : memoHex, 'hex').toString('utf8').replace(/\0/g, '') || undefined
          : undefined;

        if (!validateAddress(recipient, this.testnet)) {
          return { success: false, error: "Invalid recipient address" };
        }

        const balanceCheck = await this.getBalance();
        if (balanceCheck.success) {
          const totalRequired = microToStx(amountUstx + feeBigInt);
          if (balanceCheck.balance !== undefined && totalRequired > balanceCheck.balance) {
            return {
              success: false,
              error: `Insufficient balance. Required: ${totalRequired} STX, Available: ${balanceCheck.balance} STX`,
            };
          }
        }

        const serialized = await this.chainService.serializeTransaction(
          this.address, this.publicKey, recipient, amountUstx,
          TransactionType.STX, undefined, undefined, undefined, undefined,
          nonce, feeBigInt, memo,
        );
        unsignedTxWire = serialized.unsignedTx;
        preSignSigHash = serialized.preSignSigHash;
      } else {
        // contract_call — reconstruct with identical args, same nonce, higher fee
        const [contractAddress, contractName] = fullTx.contract_call.contract_id.split(".");
        const functionName = fullTx.contract_call.function_name;
        const functionArgs = (fullTx.contract_call.function_args as any[]).map(
          (arg: { hex: string }) => hexToCV(arg.hex),
        );

        // Reconstruct original post-conditions and mode from the Hiro response.
        // Dropping them (or switching to Allow) would silently remove "exactly N tokens
        // can move" safety guarantees on FT transfers.
        let postConditions: PostConditionWire[];
        let postConditionMode: PostConditionMode;
        try {
          const modeStr = fullTx.post_condition_mode as string;
          postConditionMode = modeStr === "allow" ? PostConditionMode.Allow : PostConditionMode.Deny;
          postConditions = (fullTx.post_conditions as any[]).map((pc: any) => {
            const principalStr = pc.principal.type_id === "principal_contract"
              ? `${pc.principal.address}.${pc.principal.contract_name}`
              : pc.principal.address;
            const pcBuilder = pc.principal.type_id === "principal_origin" ? Pc.origin() : Pc.principal(principalStr);
            const amount = BigInt(pc.amount);
            const withCode = (() => {
              switch (pc.condition_code) {
                case "sent_equal_to":                return pcBuilder.willSendEq(amount);
                case "sent_greater_than":             return pcBuilder.willSendGt(amount);
                case "sent_greater_than_or_equal_to": return pcBuilder.willSendGte(amount);
                case "sent_less_than":                return pcBuilder.willSendLt(amount);
                case "sent_less_than_or_equal_to":    return pcBuilder.willSendLte(amount);
                default: throw new Error(`Unsupported post-condition code: ${pc.condition_code}`);
              }
            })();
            if (pc.type === "stx") return (withCode as any).ustx();
            if (pc.type === "fungible") {
              return (withCode as any).ft(
                `${pc.asset.contract_address}.${pc.asset.contract_name}`,
                pc.asset.asset_name,
              );
            }
            throw new Error(`Unsupported post-condition type: ${pc.type}`);
          });
        } catch {
          return {
            success: false,
            error: "Cannot replace transaction: failed to reconstruct original post-conditions. Refusing to replace to avoid weakening safety guarantees.",
          };
        }

        const balanceCheck = await this.getBalance();
        if (balanceCheck.success) {
          const feeStx = microToStx(feeBigInt);
          if (balanceCheck.balance !== undefined && feeStx > balanceCheck.balance) {
            return {
              success: false,
              error: `Insufficient balance for fee. Required: ${feeStx} STX, Available: ${balanceCheck.balance} STX`,
            };
          }
        }

        const serialized = await this.chainService.serializeContractCall(
          this.publicKey, contractAddress, contractName, functionName, functionArgs,
          nonce, feeBigInt, postConditions, postConditionMode,
        );
        unsignedTxWire = serialized.unsignedContractCall;
        preSignSigHash = serialized.preSignSigHash;
      }

      const rawSignature = await this.fireblocksService.signTransaction(
        preSignSigHash, this.vaultAccountId.toString(), note, externalId,
      );
      const signature = concatSignature(rawSignature.fullSig, rawSignature.v);
      unsignedTxWire.auth.spendingCondition.signature = createMessageSignature(signature);

      const result = await this.chainService.broadcastTransaction(unsignedTxWire);

      if (!result || result.error || !result.txid || result.reason) {
        const errorAndReason =
          result?.error && result?.reason
            ? `${result.error} - ${result.reason}`
            : result?.error || result?.reason || "unknown error";
        return { success: false, error: formatErrorMessage(errorAndReason) };
      }

      console.log(`Replaced transaction ${originalTxId} with ${result.txid}`);
      return { success: true, txHash: result.txid };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { success: false, error: error.message };
      }
      console.error(`Error replacing transaction: ${formatErrorMessage(error)}`);
      return {
        success: false,
        error: `Failed to replace transaction: ${formatErrorMessage(error)}`,
      };
    }
  };

   /**
   * fetches current pox info from blockchain.
   * @returns the pox info response.
   * @throws {Error} If fetching pox info fails.
   */
  public getPoxInfo = async (
  ): Promise<GetPoxInfoResponse> => {
    try {
      const poxResponse = await this.chainService.fetchPoxInfo();
      if(!poxResponse || !poxResponse.data) {
        return {
          success: false,
          error: `Failed to fetch POX info: empty response`,
        }
      }
      
      return {
        success: true,
        data: poxResponse.data,
      }
    } catch (error) {
      console.error(`Error fetching POX info: ${formatErrorMessage(error)}`);
      return {
        success: false,
        error: `Failed to fetch POX info: ${formatErrorMessage(error)}`,
      };
    }
  };
}
