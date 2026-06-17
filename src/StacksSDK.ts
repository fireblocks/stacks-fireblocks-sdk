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
import { STACKS_MAINNET, STACKS_TESTNET, type StacksNetwork } from "@stacks/network";
import { FireblocksService } from "./services/fireblocks.service";
import {
  CheckStatusData,
  CheckStatusResponse,
  CreateTransactionResponse,
  FireblocksConfig,
  GetAccountNonceResponse,
  GetFtBalancesResponse,
  GetNativeBalanceResponse,
  GetPoxInfoResponse,
  GetTransactionHistoryResponse,
  GetTransactionStatusResponse,
  StakerInfoResponse,
  VerifySignerGrantResponse,
  TokenType,
  Transaction,
  TransactionDetails,
  TransactionType,
} from "./services/types";
import { helperConstants, pagination_defaults, POX4_ERRORS, RBF_MIN_FEE_BUMP_USTX } from "./utils/constants";
import { parseOptionalFee, ValidationError } from "./utils/validation";
import { formatErrorMessage } from "./utils/errorHandling";
import { validateApiCredentials } from "./utils/fireblocks.utils";
import {
  assertResultSuccess,
  concatSignature,
  getDecimalsFromFtInfo,
  getTokenInfo,
  isSafeToSubmit,
  microToStx,
  microToToken,
  parseAssetId,
  parseClarityErrCode,
  stxToMicro,
  tokenToMicro,
  validateAddress,
} from "./utils/helpers";
import {
  createMessageSignature,
  hexToCV,
  Pc,
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
  buildStake,
  buildStakeUpdate,
  buildUnstake,
  buildGrantSignerKey,
  buildRevokeSignerGrant,
  fetchStakerInfo,
  fetchPoxInfo as fetchPox5Info,
  fetchVerifySignerKeyGrant,
  fetchSignerInfo,
  fetchSignerGrantMessageHash,
  isInPreparePhase,
  type PoxInfo as Pox5PoxInfo,
} from "@stacks/bitcoin-staking";
import { hexToBytes } from "@stacks/common"; 

export class StacksSDK {
  private fireblocksService: FireblocksService;
  private chainService: StacksService;
  private vaultAccountId: string | number;
  private address: string | undefined;
  private btcRewardsAddress: string | undefined;
  private publicKey: string | undefined;
  private cachedTransactions: Transaction[] = [];
  private testnet: boolean = false;

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
      this.testnet = fireblocksConfig?.testnet || false;
      this.chainService = new StacksService(this.testnet);
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

      if (transaction.tx_status !== "success") {
        const errorNumber = parseClarityErrCode(transaction.tx_result);

        // Only use PoX-4 error table for PoX contract calls
        const isPoXTransaction =
          transaction.tx_type === "contract_call" &&
          transaction.contract_call?.contract_id?.includes("pox-4");

        if (isPoXTransaction && errorNumber !== null && POX4_ERRORS[errorNumber]) {
          txDetails.tx_error = POX4_ERRORS[errorNumber].name;
        } else if (errorNumber !== null) {
          txDetails.tx_error = `Contract error code: ${errorNumber}`;
        } else {
          txDetails.tx_error = transaction.tx_result?.repr || "Transaction failed";
        }
      }

      return {
        success: true,
        data: txDetails,
      };
    } catch (error) {
      console.log(
        `Failed to get transaction status: ${formatErrorMessage(error)}`,
      );
      return {
        success: false,
        error: formatErrorMessage(error),
      };
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
  intervalMs = 3000,
  maxAttempts = 20,
  ): Promise<GetTransactionStatusResponse> => {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getTxStatusById(txId);
      if (!status.success) return status;

      const txStatus = status.data?.tx_status;
      if (txStatus !== "submitted" && txStatus !== "pending") {
        return status; // settled — success or a real error
      }

      await new Promise(res => setTimeout(res, intervalMs));
    }

    return { success: false, error: "Transaction timed out waiting for confirmation." };
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
  private resolveNonce = async (nonce?: bigint): Promise<bigint> => {
    const nonceInfo = await this.chainService.getAccountNonce(this.address!);
    if (nonce !== undefined) {
      if (nonce < nonceInfo.confirmedNonce) {
        throw new ValidationError(
          `Nonce ${nonce} is below the confirmed nonce (${nonceInfo.confirmedNonce}). This transaction would be rejected.`,
        );
      }
      return nonce;
    }
    return nonceInfo.nextAvailable;
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

      const result = await this.chainService.broadcastTransaction(
        transactionToSign.unsignedTx,
      );
      return result;
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
    return this.chainService.broadcastTransaction(tx, this.pox5Network);
  };

  // PoX-5 private testnet uses chain ID 256; address encoding matches standard testnet (ST).
  private static readonly POX5_TESTNET: StacksNetwork = {
    ...STACKS_TESTNET,
    chainId: 256,
    client: { baseUrl: 'https://api.private-1.hiro.so' },
  };

  private get pox5Network(): StacksNetwork {
    return this.testnet ? StacksSDK.POX5_TESTNET : STACKS_MAINNET;
  }

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
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }

      const resolvedNonce = await this.resolveNonce(nonce);
      const pox = await fetchPox5Info({ network: this.pox5Network });

      const eligibilityCheck = await this.checkEligibility(pox, amountStx);
      if (!eligibilityCheck.eligible) {
        return { success: false, error: `Account not eligible for staking: ${eligibilityCheck.reason}` };
      }

      const tx = await buildStake({
        signerManager,
        amountUstx: stxToMicro(amountStx),
        numCycles,
        startBurnHt: pox.currentBurnchainBlockHeight,
        publicKey: this.publicKey,
        fee: BigInt(10000),
        nonce: resolvedNonce,
        network: this.pox5Network,
      });

      const result = await this.pox5SignAndBroadcast(tx, note || `stake ${amountStx} STX for ${numCycles} cycles`, externalId);

      if (!result || result.error || !result.txid || result.reason) {
        return { success: false, error: result?.error || result?.reason || "Failed to broadcast stake transaction" };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
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
  ): Promise<CreateTransactionResponse> => {
    try {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }

      const resolvedNonce = await this.resolveNonce(nonce);
      const pox = await fetchPox5Info({ network: this.pox5Network });

      const safetyCheck = isSafeToSubmit(pox);
      if (!safetyCheck.safe) {
        return { success: false, error: `Too close to prepare phase boundary (${safetyCheck.blocksUntilBoundary} blocks remaining). Try again next cycle (cycle ${pox.rewardCycleId + 1}).` };
      }

      const tx = await buildStakeUpdate({
        signerManager,
        oldSignerManager,
        cyclesToExtend: cyclesToExtend ?? 0,
        amountIncrease: increaseByStx ? stxToMicro(increaseByStx) : BigInt(0),
        publicKey: this.publicKey,
        fee: BigInt(10000),
        nonce: resolvedNonce,
        network: this.pox5Network,
      });

      const result = await this.pox5SignAndBroadcast(tx, note || "update stake position", externalId);

      if (!result || result.error || !result.txid || result.reason) {
        return { success: false, error: result?.error || result?.reason || "Failed to broadcast update-stake transaction" };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
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

      const resolvedNonce = await this.resolveNonce(nonce);

      const tx = await buildUnstake({
        oldSignerManager,
        publicKey: this.publicKey,
        fee: BigInt(10000),
        nonce: resolvedNonce,
        network: this.pox5Network,
      });

      const result = await this.pox5SignAndBroadcast(tx, note || "unstake STX", externalId);

      if (!result || result.error || !result.txid || result.reason) {
        return { success: false, error: result?.error || result?.reason || "Failed to broadcast unstake transaction" };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
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

      const resolvedNonce = await this.resolveNonce(nonce);

      // Signature is over the signer-manager contract (register-self grants for current-contract)
      const grantMsgHash = await fetchSignerGrantMessageHash({
        signerManager,
        authId,
        network: this.pox5Network,
      });

      const rawGrantSig = await this.fireblocksService.signTransaction(
        grantMsgHash, this.vaultAccountId.toString(), note || "sign grant signer key message", externalId,
      );
      const signerSignature = concatSignature(rawGrantSig.fullSig, rawGrantSig.v);

      // Call <signerManager>.register-self instead of pox-5.grant-signer-key directly.
      // register-self args: (signer-manager <trait>) (signer-key (buff 33)) (auth-id uint) (signer-sig (buff 65))
      const tx = await makeUnsignedContractCall({
        contractAddress: smAddress,
        contractName: smName,
        functionName: "register-self",
        functionArgs: [
          contractPrincipalCV(smAddress, smName),       // signer-manager trait = the contract itself
          bufferCV(hexToBytes(this.publicKey)),         // signer-key (buff 33)
          uintCV(authId),                               // auth-id
          bufferCV(hexToBytes(signerSignature)),        // signer-sig (buff 65)
        ],
        publicKey: this.publicKey,
        fee: BigInt(10000),
        nonce: resolvedNonce,
        network: this.pox5Network,
        postConditionMode: PostConditionMode.Deny,
        postConditions: [],
      });

      const result = await this.pox5SignAndBroadcast(tx, note || "register signer (register-self)", externalId);

      if (!result || result.error || !result.txid || result.reason) {
        return { success: false, error: result?.error || result?.reason || "Failed to broadcast register-self transaction" };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          error: txStatus.error || txStatus.data?.tx_error || "register-self transaction failed at the contract level.",
          txHash: result.txid,
        };
      }

      return { success: true, txHash: result.txid };
    } catch (error) {
      return { success: false, error: `Failed to register signer key: ${formatErrorMessage(error)}` };
    }
  };

  // /**
  //  * Grants a one-time signer key authorization to a signer-manager (PoX-5).
  //  * Must be called once before any stake() calls through that signer-manager.
  //  * The vault's own public key is used as the signer key. The grant signature is
  //  * generated internally via Fireblocks raw signing — no external signature needed.
  //  * @param signerManager - The signer-manager contract principal to authorize.
  //  * @param authId - Monotonically increasing unique uint for replay protection. Never reuse.
  //  * @param note - Optional Fireblocks transaction note.
  //  * @param nonce - Optional nonce override.
  //  * @param externalId - Optional Fireblocks external ID for idempotency.
  //  */
  // public grantSignerKey = async (
  //   signerManager: string,
  //   authId: bigint,
  //   note?: string,
  //   nonce?: bigint,
  //   externalId?: string,
  // ): Promise<CreateTransactionResponse> => {
  //   try {
  //     if (!this.address || !this.publicKey || !this.vaultAccountId) {
  //       throw new Error("Address, Public Key or Vault ID are not set");
  //     }

  //     const resolvedNonce = await this.resolveNonce(nonce);

  //     const grantMsgHash = await fetchSignerGrantMessageHash({
  //       signerManager,
  //       authId,
  //       network: this.pox5Network,
  //     });

  //     const rawGrantSig = await this.fireblocksService.signTransaction(
  //       grantMsgHash, this.vaultAccountId.toString(), note || "sign grant signer key message", externalId,
  //     );
  //     const signerSignature = concatSignature(rawGrantSig.fullSig, rawGrantSig.v);

  //     const tx = await buildGrantSignerKey({
  //       signerKey: this.publicKey,
  //       signerManager,
  //       authId,
  //       signerSignature,
  //       publicKey: this.publicKey,
  //       fee: BigInt(10000),
  //       nonce: resolvedNonce,
  //       network: this.pox5Network,
  //     });

  //     const result = await this.pox5SignAndBroadcast(tx, note || "grant signer key", externalId);

  //     if (!result || result.error || !result.txid || result.reason) {
  //       return { success: false, error: result?.error || result?.reason || "Failed to broadcast grant-signer-key transaction" };
  //     }

  //     const txStatus = await this.waitForTxSettlement(result.txid);
  //     if (!txStatus.success || txStatus.data?.tx_status !== "success") {
  //       return {
  //         success: false,
  //         error: txStatus.error || txStatus.data?.tx_error || "Grant signer key transaction failed at the contract level.",
  //         txHash: result.txid,
  //       };
  //     }

  //     return { success: true, txHash: result.txid };
  //   } catch (error) {
  //     return { success: false, error: `Failed to grant signer key: ${formatErrorMessage(error)}` };
  //   }
  // };

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

      const resolvedNonce = await this.resolveNonce(nonce);

      const tx = await buildRevokeSignerGrant({
        signerManager,
        signerKey,
        publicKey: this.publicKey,
        fee: BigInt(10000),
        nonce: resolvedNonce,
        network: this.pox5Network,
      });

      const result = await this.pox5SignAndBroadcast(tx, note || "revoke signer grant", externalId);

      if (!result || result.error || !result.txid || result.reason) {
        return { success: false, error: result?.error || result?.reason || "Failed to broadcast revoke-signer-grant transaction" };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (!txStatus.success || txStatus.data?.tx_status !== "success") {
        return {
          success: false,
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
      console.log("Fetched staker info:", info);
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

  public getPox5Info = async (): Promise<any> => {
    try {
      const info = await fetchPox5Info({ network: this.pox5Network });
      return JSON.parse(JSON.stringify(info, (_, v) => typeof v === 'bigint' ? v.toString() : v));
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
      const [delegationData, balanceResponse, pox5Info, stakerInfo] = await Promise.all([
        this.chainService.checkDelegationStatus(this.address).catch(() => null),
        this.chainService.makeBalanceCalls(this.address),
        fetchPox5Info({ network: this.pox5Network }).catch(() => null),
        fetchStakerInfo({ address: this.address, network: this.pox5Network }).catch(() => null),
      ]);

      if (!balanceResponse) {
        throw new Error("Failed to fetch balance data");
      }

      const balanceData = balanceResponse.data;

      const stxBalMicro = BigInt(balanceData.stx.balance ?? "0");
      const stxLockedMicro = BigInt(balanceData.stx.locked ?? "0");
      const totalMinerRewardsRecievedMicro = BigInt(
        balanceData.stx.total_miner_rewards_received ?? "0",
      );

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
          lock_tx_id: balanceData.stx.lock_tx_id || null,
          lock_height: balanceData.stx.lock_height || null,
          burnchain_lock_height: balanceData.stx.burnchain_lock_height || null,
          burnchain_unlock_height:
            balanceData.stx.burnchain_unlock_height || null,
          total_miner_rewards_received: microToStx(
            totalMinerRewardsRecievedMicro,
          ),
        },
        delegation: {
          is_delegated: isDelegated,
          delegated_to: delegatedTo,
          amount_delegated: amountDelegatedMicro
            ? microToStx(amountDelegatedMicro)
            : null,
          until_burn_ht: untilBurnHt,
          pox_addr: poxAddrTuple,
        },
        pox5: {
          is_staked: pox5IsStaked,
          amount_stx: pox5Details ? microToStx(pox5Details.amountUstx) : null,
          signer_manager: pox5Details?.signer ?? null,
          first_reward_cycle: pox5Details?.firstRewardCycle ?? null,
          num_cycles: pox5Details?.numCycles ?? null,
          unlock_burn_height: unlockBurnHeight,
          current_burn_height: pox5Info?.currentBurnchainBlockHeight ?? 0,
          current_cycle_id: pox5Info?.rewardCycleId ?? 0,
          is_prepare_phase: inPreparePhase,
        },
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
    pox: Pox5PoxInfo,
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
        return {
          eligible: false,
          reason: `Too close to prepare phase boundary (${safetyCheck.blocksUntilBoundary} blocks remaining). Try again next cycle (cycle ${pox.rewardCycleId + 1}).`,
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
   *     strictly greater than the original fee. `newRecipient`/`newAmount` are optional
   *     overrides for token_transfer only.
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

        const nonceInfo = await this.chainService.getAccountNonce(this.address);
        if (nonce < nonceInfo.confirmedNonce) {
          return {
            success: false,
            error: `nonceOverride (${nonce}) is below the confirmed nonce (${nonceInfo.confirmedNonce}). This transaction would be rejected.`,
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

      // Fee check: new fee must exceed the original by at least 1 microSTX
      const originalFeeUstx = BigInt(fullTx.fee_rate);
      const minFeeUstx = originalFeeUstx + RBF_MIN_FEE_BUMP_USTX;
      if (feeBigInt < minFeeUstx) {
        return {
          success: false,
          error: `New fee (${newFee} STX) must be greater than the original fee (${microToStx(originalFeeUstx)} STX).`,
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
          ? Buffer.from(memoHex.slice(2), 'hex').toString('utf8').replace(/\0/g, '') || undefined
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
