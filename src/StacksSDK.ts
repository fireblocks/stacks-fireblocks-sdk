/**
 * StacksSDK provides a unified interface for interacting with Stacks through Fireblocks services.
 *
 * This SDK allows you to:
 * - Retrieve Stacks account address and public key associated with a Fireblocks vault account.
 * - Query balances and transaction history for the Stacks account.
 * - Create TA transactions using Fireblocks raw signing.
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
  CreateTransactionResponse,
  FireblocksConfig,
  GetNativeBalanceResponse,
  Transaction,
} from "./services/types";
import { stacks_info, pagination_defaults } from "./utils/constants";
import { formatErrorMessage } from "./utils/errorHandling";
import { validateApiCredentials } from "./utils/fireblocks.utils";
import { concatSignature, microToStx, stxToMicro } from "./utils/helpers";
import e from "express";
import { createMessageSignature } from "@stacks/transactions/dist/wire/create";

export class StacksSDK {
  private fireblocksService: FireblocksService;
  private chainService: StacksService;
  private vaultAccountId: string | number;
  private address: string | undefined;
  private publicKey: string | undefined;
  private chachedTransactions: Transaction[] = [];
  private testnet: boolean = false;

  private constructor(
    vaultAccountId: string | number,
    fireblocksConfig?: FireblocksConfig
  ) {
    try {
      // Validate Fireblocks API credentials before initializing services
      if (fireblocksConfig) {
        validateApiCredentials(
          fireblocksConfig.apiKey,
          fireblocksConfig.apiSecret ?? "",
          vaultAccountId
        );
      }
      this.fireblocksService = new FireblocksService(fireblocksConfig);
      this.testnet = fireblocksConfig?.testnet || false;
      this.chainService = new StacksService(this.testnet);
    } catch (error) {
      throw new Error(
        `Failed to initialize services: ${formatErrorMessage(error)}`
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
    fireblocksConfig?: FireblocksConfig
  ): Promise<StacksSDK> => {
    try {
      const instance = new StacksSDK(vaultAccountId, fireblocksConfig);
      instance.publicKey =
        await instance.fireblocksService.getPublicKeyByVaultID(vaultAccountId);
      instance.address = instance.chainService.formatAddress(
        instance.publicKey
      );
      return instance;
    } catch (error) {
      throw new Error(
        `Failed to create StacksSDK instance: ${formatErrorMessage(error)}`
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
   * Retrieves the TAO balance for the current Stacks address.
   *
   * @returns A promise that resolves to a {GetTaoBalanceResponse} containing the TAO balance information.
   * @throws {Error} If the Stacks address is not set or if the balance retrieval fails.
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
   * Retrieves the transaction history for the current Stacks address.
   *
   * @param limit - The maximum number of transactions to return (default is 50).
   * @param offset - The offset for pagination (default is 0).
   * @returns A promise that resolves to an array of {TaoTransaction} containing transaction history.
   * @throws {Error} If the Stacks address/Taostats api key are not set or if the transaction history retrieval fails.
   */
  public getTransactionHistory = async (
    getCachedTransactions: boolean = true, // Must be manually set to false to fetch fresh transactions
    limit: number = pagination_defaults.limit,
    offset: number = pagination_defaults.page
  ): Promise<Transaction[]> => {
    if (getCachedTransactions) {
      console.log("Using cached transactions");
      return this.chachedTransactions;
    }

    if (!this.address) {
      console.log(
        "StacksSDK.getTransactionsHistory() error: address is not set."
      );
      throw new Error("Stacks address is not set.");
    }

    try {
      const txs = await this.chainService.getTransactionHistory(
        this.address,
        limit,
        offset
      );

      const existingHashes = new Set(
        this.chachedTransactions.map((tx) => tx.transaction_hash)
      );

      const newTransactions = txs.filter(
        (tx) => !existingHashes.has(tx.transaction_hash)
      );

      this.chachedTransactions = [
        ...this.chachedTransactions,
        ...newTransactions,
      ];
      return txs;
    } catch (error) {
      throw new Error(
        `Failed to get transaction history: ${formatErrorMessage(error)}`
      );
    }
  };

  /**
   * Creates a TAO transaction to transfer funds to a recipient address.
   * @param recipientAddress - The address of the recipient.
   * @param amount - The amount to transfer in TAO.
   * @param inPlanck - Optional flag indicating if the amount is in Planck (default is false).
   * @param grossTransaction - Optional flag indicating if the transaction is gross, if so fee will be deducted from recipient (default is false).
   * @param note - Optional note to be attached to the transaction in raw signing.
   * @param testnet - Optional flag indicating if the transaction is for the testnet (default is false).
   * @returns A promise that resolves to a {SignAndSendTransactionResponse}.
   * @throws {Error} If the Stacks address, public key, or vault ID are not set, or if the transaction creation fails.
   */

  public createNativeTransaction = async (
    recipientAddress: string,
    amount: number,
    inMicro: boolean = false,
    grossTransaction: boolean = false,
    note?: string,
    testnet?: boolean
  ): Promise<CreateTransactionResponse> => {
    if (!this.address || !this.publicKey || !this.vaultAccountId) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }

    let microAmount;

    if (!inMicro) {
      microAmount = stxToMicro(amount);
      console.log(
        `Converted amount to micro: ${microAmount} (from ${microToStx(
          microAmount
        )} STX)`
      );
    } else {
      microAmount = amount;
      amount = microToStx(microAmount);
      console.log(`Amount is in micro: ${microAmount} microSTX`);
    }

    const fee = await this.chainService.estimateTxFee(
      this.address,
      recipientAddress,
      amount
    );

    const feeMicro = stxToMicro(fee);

    if (grossTransaction) {
      console.log("Creating gross transaction");
      console.log(`Estimated fee: ${fee} TAO`);
      amount -= feeMicro;
      console.log(`Net amount to transfer: ${microToStx(amount)} TAO`);
    }

    const balancerResponse = await this.getBalance();
    if (!balancerResponse.success) {
      throw new Error(
        `createNativeTransaction Error: Failed to get balance: ${
          balancerResponse.error || "unknown error"
        }`
      );
    }

    const balance = balancerResponse.balance;

    if (amount <= 0) {
      throw new Error(
        `Amount after fee deduction must be greater than zero. Current amount: ${amount} planck`
      );
    }

    if (amount + fee > balance) {
      throw new Error(
        `No sufficient balance. Available: ${balance} STX, Required: ${amount} STX (including estimated fee of ${fee} STX)`
      );
    }

    try {
      const transactionToSign = await this.chainService.serializeTransaction(
        this.publicKey,
        recipientAddress,
        amount
      );

      const rawSignature = await this.fireblocksService.signTransaction(
        transactionToSign,
        this.vaultAccountId.toString(),
        note || ""
      );

      const signature = concatSignature(rawSignature.fullSig, rawSignature.v);

      (transactionToSign.unsignedTx as any).auth.spendingCondition.signature =
        createMessageSignature(signature);

      const result = await this.chainService.brodcastTransaction(
        transactionToSign.unsignedTx
      );

      if (!result || result.err) {
        console.error(
          `Transaction broadcast failed: ${
            formatErrorMessage(result?.err) || "unknown error"
          }`
        );
        return {
          success: false,
          error: result?.err ? formatErrorMessage(result.err) : "unknown error",
        };
      }

      return {
        success: true,
        txHash: result.txid,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to create TAO transaction: ${formatErrorMessage(error)}`
      );
    }
  };
}
