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
  TokenType,
  Transaction,
  TransactionDetails,
  TransactionType,
} from "./services/types";
import { pagination_defaults, POX4_ERRORS, RBF_MIN_FEE_MULTIPLIER } from "./utils/constants";
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
  StacksTransactionWire,
  uintCV,
  principalCV,
  noneCV,
} from "@stacks/transactions";

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
      const txs = await this.chainService.getTransactionHistory(
        this.address,
        limit,
        offset,
      );

      const existingHashes = new Set(
        this.cachedTransactions.map((tx) => tx.transaction_hash),
      );

      const newTransactions = txs.filter(
        (tx) => !existingHashes.has(tx.transaction_hash),
      );

      this.cachedTransactions = [
        ...this.cachedTransactions,
        ...newTransactions,
      ];
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
    if (nonce !== undefined) return nonce;
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
      );

      const rawSignature = await this.fireblocksService.signTransaction(
        transactionToSign.preSignSigHash,
        this.vaultAccountId.toString(),
        note || "",
      );

      const signature = concatSignature(rawSignature.fullSig, rawSignature.v);

      (transactionToSign.unsignedTx as any).auth.spendingCondition.signature =
        createMessageSignature(signature);

      const result = await this.chainService.broadcastTransaction(
        transactionToSign.unsignedTx,
      );
      return result;
    } catch (error) {
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
  }): Promise<any> => {
    const {
      functionName, poolAddress, poolContractName, amount, maxAmount,
      lockPeriod, extendCycles, signerKey, signerSig65Hex, startBurnHeight,
      authId, note, nonce,
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
            this.publicKey, poolAddress, amount!, lockPeriod!, resolvedNonce,
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

      const rawSignature = await this.fireblocksService.signTransaction(
        transactionToSign.preSignSigHash, this.vaultAccountId.toString(), note || "",
      );

      const signature = concatSignature(rawSignature.fullSig, rawSignature.v);
      (transactionToSign.unsignedContractCall as any).auth.spendingCondition.signature =
        createMessageSignature(signature);

      return await this.chainService.broadcastTransaction(transactionToSign.unsignedContractCall);
    } catch (error) {
      throw new Error(
        `Failed to build, sign or send contract call transaction: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Creates a native coin transaction to transfer funds to a recipient address.
   * @param recipientAddress - The address of the recipient.
   * @param amount - The amount to transfer in native coin.
   * @param grossTransaction - Optional flag indicating if the transaction is gross, if so fee will be deducted from recipient (default is false).
   * @param note - Optional note to be attached to the transaction in raw signing.
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
   * @param amount - The amount to transfer in native coin.
   * @param token - The type of fungible token to transfer.
   * @param note - Optional note to be attached to the transaction in raw signing.
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
   * @param amount - The amount of STX to stack.
   * @param lockPeriod - The lock period in cycles.
   * @returns A promise that resolves to a {CreateTransactionResponse}.
   * @throws {Error} If the address, public key, or vault ID are not set, or if the delegate process fails.
   */

  public delegateToPool = async (
    poolsAddress: string,
    poolContractName: string,
    amount: number,
    lockPeriod: number,
    nonce?: bigint,
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
   * @returns A promise that resolves to a {CreateTransactionResponse}.
   * @throws {Error} If the address, public key, or vault ID are not set, or if the process fails.
   */

  public allowContractCaller = async (
    poolsAddress: string,
    poolContractName: string,
    nonce?: bigint,
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
   * @returns A promise that resolves to a {CreateTransactionResponse}.
   * @throws {Error} If the address, public key, or vault ID are not set, or if the process fails.
   */

  public revokeDelegation = async (nonce?: bigint): Promise<CreateTransactionResponse> => {
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
      const [delegationData, balanceResponse] = await Promise.all([
        this.chainService.checkDelegationStatus(this.address), // may be null
        this.chainService.makeBalanceCalls(this.address),
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
   * Check eligibility for solo stacking.
   * @returns A promise that resolves to an object indicating eligibility and reason if not eligible.
   */
  public checkEligibility = async (
    pox: any,
    amount: number,
  ): Promise<{ eligible: boolean; reason?: string }> => {
    try {
      const status = await this.checkStatus();
      if (!status.success) {
        throw new Error(
          `Failed to check account status before solo stacking STX: ${status.error}`,
        );
      }

      if (status.data?.delegation.is_delegated) {
        return {
          eligible: false,
          reason: `Account already has an active delegation to ${status.data.delegation.delegated_to}, please revoke existing delegation first.`,
        };
      }

      const safteyCheckResponse = isSafeToSubmit(pox);
      if (!safteyCheckResponse.safe) {
        return {
          eligible: false,
          reason: `Too close to prepare phase boundary, try again next cycle`,
        };
      }

      if (stxToMicro(amount) < BigInt(pox.min_amount_ustx)) {
        return {
          eligible: false,
          reason: `Amount to stack is less than the minimum required amount of ${microToStx(BigInt(pox.min_amount_ustx))} STX.`,
        };
      }

      const balance = await this.getBalance();
      if (!balance.success) {
        throw new Error(
          `Could not fetch account balance to check funds sufficiency`,
        );
      }

      if (stxToMicro(amount) > stxToMicro(balance.balance)) {
        return {
          eligible: false,
          reason: `Amount to stack is greater than the available balance of ${balance.balance} STX.`,
        };
      }

      return {
        eligible: true,
      };
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
   * @param amount - The amount of STX to stack.
   * @param maxAmount - The maximum authorized amount of STX to stack (must be >= amount).
   * @param lockPeriod - The number of cycles to lock the STX.
   * @param authId - Authorization ID for the transaction.
   * @returns A response indicating success or failure of the transaction.
   */
  public stackSolo = async (
    signerKey: string,
    signerSig65Hex: string,
    amount: number,
    maxAmount: number,
    lockPeriod: number,
    authId: bigint,
    nonce?: bigint,
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
        nonce,
      });

      const assertResult = assertResultSuccess(result);
      if (assertResult.success === false) {
        return {
          success: false,
          error: `Failed to solo stack STX: ${assertResult.error}`,
        };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (txStatus.success && txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          error: txStatus.data?.tx_error || "Transaction failed at the contract level.",
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
   * @param increaseBy - The amount of STX to add to the existing stack.
   * @param maxAmount - The new maximum amount of the stack after increase.
   * @param authId - Authorization ID for the transaction.
   * @returns A response indicating success or failure of the transaction.
   */
  public increaseStackedAmount = async (
    signerKey: string,
    signerSig65Hex: string,
    increaseBy: number,
    maxAmount: number,
    authId: bigint,
    nonce?: bigint,
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
        nonce,
      });

      const assertResult = assertResultSuccess(result);
      if (assertResult.success === false) {
        return {
          success: false,
          error: `Failed to increase stacked amount: ${assertResult.error}`,
        };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (txStatus.success && txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          error: txStatus.data?.tx_error || "Transaction failed at the contract level.",
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
   * @param increaseBy - The amount of STX to add to the existing stack.
   * @param maxAmount - Maximum amount authorized for the stack
   * @param authId - Authorization ID for the transaction.
   * @returns A response indicating success or failure of the transaction.
   */
  public extendStackingPeriod = async (
    signerKey: string,
    signerSig65Hex: string,
    extendCycles: number,
    maxAmount: number,
    authId: bigint,
    nonce?: bigint,
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
        nonce,
      });

      const assertResult = assertResultSuccess(result);
      if (assertResult.success === false) {
        return {
          success: false,
          error: `Failed to extend stacking period: ${assertResult.error}`,
        };
      }

      const txStatus = await this.waitForTxSettlement(result.txid);
      if (txStatus.success && txStatus.data?.tx_status !== "success") {
        return {
          success: false,
          error: txStatus.data?.tx_error || "Transaction failed at the contract level.",
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
   * Replaces a pending STX transaction with a new one using the same nonce but a higher fee.
   * Supports both native STX token_transfer and contract_call transactions.
   * @param originalTxId - The transaction ID of the transaction to replace.
   * @param newFee - The new fee in STX. Must be at least RBF_MIN_FEE_MULTIPLIER × the original.
   * @param newRecipient - For token_transfer only: optional new recipient. Defaults to original.
   * @param newAmount - For token_transfer only: optional new amount in STX. Defaults to original.
   * @param nonceOverride - Bypasses the Hiro indexer lookup. Use when the original tx is a
   *   future-nonce tx not visible in the explorer. When set, newRecipient and newAmount are
   *   required (only STX transfers supported on this path).
   * @returns A promise that resolves to a {CreateTransactionResponse}.
   */
  public replaceTransaction = async (
    originalTxId: string,
    newFee: number,
    newRecipient?: string,
    newAmount?: number,
    nonceOverride?: bigint,
  ): Promise<CreateTransactionResponse> => {
    if (!this.address || !this.publicKey || !this.vaultAccountId) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }

    try {
      const feeBigInt = stxToMicro(newFee);

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

        const transactionToSign = await this.chainService.serializeTransaction(
          this.address, this.publicKey, newRecipient, amountUstx,
          TransactionType.STX, undefined, undefined, undefined, undefined,
          nonce, feeBigInt,
        );

        const rawSignature = await this.fireblocksService.signTransaction(
          transactionToSign.preSignSigHash, this.vaultAccountId.toString(),
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
      const originalTxResponse = await this.getTxStatusById(originalTxId);

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

      const nonce = BigInt(fullTx.nonce);
      let unsignedTxWire: any;
      let preSignSigHash: string;

      if (fullTx.tx_type === "token_transfer") {
        const recipient = newRecipient ?? fullTx.token_transfer.recipient_address;
        const amountUstx = newAmount !== undefined
          ? stxToMicro(newAmount)
          : BigInt(fullTx.token_transfer.amount);

        if (!validateAddress(recipient, this.testnet)) {
          return { success: false, error: "Invalid recipient address" };
        }

        const serialized = await this.chainService.serializeTransaction(
          this.address, this.publicKey, recipient, amountUstx,
          TransactionType.STX, undefined, undefined, undefined, undefined,
          nonce, feeBigInt,
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

        const serialized = await this.chainService.serializeContractCall(
          this.publicKey, contractAddress, contractName, functionName, functionArgs,
          nonce, feeBigInt,
        );
        unsignedTxWire = serialized.unsignedContractCall;
        preSignSigHash = serialized.preSignSigHash;
      }

      const rawSignature = await this.fireblocksService.signTransaction(
        preSignSigHash, this.vaultAccountId.toString(),
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
