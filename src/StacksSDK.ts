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
  CreateTransactionResponse,
  FireblocksConfig,
  GetFtBalancesResponse,
  GetNativeBalanceResponse,
  TokenType,
  Transaction,
  TransactionType,
} from "./services/types";
import { pagination_defaults } from "./utils/constants";
import { formatErrorMessage } from "./utils/errorHandling";
import { validateApiCredentials } from "./utils/fireblocks.utils";
import {
  concatSignature,
  getDecimalsFromFtInfo,
  microToStx,
  microToToken,
  parseAssetId,
  stxToMicro,
  tokenToMicro,
  validateAddress,
} from "./utils/helpers";
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
   * Retrieves the fungible tokens balances for the current address.
   *
   * @returns A promise that resolves to a {GetFtBalancesResponse} containing the fungible tokens balances.
   * @throws {Error} If the address is not set or if the balance retrieval fails.
   */
  public getFtBalances = async (): Promise<GetFtBalancesResponse> => {
    if (!this.address) {
      console.log(
        "StacksSDK.getTransactionsHistory() error: address is not set."
      );
      throw new Error("Stacks address is not set.");
    }

    try {
      let data: {
        token: string;
        balance: number;
      }[] = [];

      const balances = await this.chainService.getFTBalancesForAddress(
        this.address
      );

      for (const [assetId, info] of Object.entries(balances)) {
        const { contractAddress, contractName, tokenName } =
          parseAssetId(assetId);
        const decimals = getDecimalsFromFtInfo(assetId);
        let balance = {
          token: tokenName,
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
        `Error fetching fungible tokens balances: ${formatErrorMessage(error)}`
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
    token?: TokenType
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

      let microAmount =
        type == TransactionType.FungibleToken
          ? tokenToMicro(amount, token)
          : stxToMicro(amount);

      const microfee = await this.chainService.estimateTxFee(
        recipientAddress,
        microAmount
      );

      const fee = microToStx(microfee);

      const balanceResponse =
        type == TransactionType.FungibleToken
          ? await this.getFtBalances()
          : await this.getBalance();

      if (!balanceResponse.success) {
        throw new Error(
          `Could not fetch account balance to check funds sufficiency`
        );
      }

      // if its a gross STX transfer, deduct fee from transferred amount
      if (type == TransactionType.STX && grossTransaction) {
        console.log(
          `Gross transaction: deducting fee ${fee} STX from amount ${amount} STX`
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
      // to do : check amount against balance
      if (type == TransactionType.FungibleToken) {
        balance = (balanceResponse as GetFtBalancesResponse).data?.find(
          (b) => b.token === token
        )?.balance;
      } else {
        balance = (balanceResponse as GetNativeBalanceResponse).balance;
      }

      if (amount + fee > balance) {
        return {
          validParams: false,
          reason: `Insufficient funds. Available balance: ${balance}, required: ${amount}`,
        };
      }

      // Recalculate microAmount after any adjustments
      microAmount =
        type == TransactionType.FungibleToken
          ? tokenToMicro(amount, token)
          : stxToMicro(amount);

      console.log(
        `Converted amount to micro: ${microAmount} (from ${amount} ${
          token ? token : "STX"
        })`
      );

      return {
        validParams: true,
        finalAmount: microAmount,
      };
    } catch (error) {
      throw new Error(
        `Parameter validation failed: ${formatErrorMessage(error)}`
      );
    }
  };

  // Builds, signs and sends a transaction using Fireblocks raw signing.
  private buildSignSendTransaction = async (
    recipientAddress: string,
    microAmount: bigint,
    type: TransactionType = TransactionType.STX,
    token?: TokenType,
    note?: string
  ): Promise<any> => {
    try {
      const transactionToSign = await this.chainService.serializeTransaction(
        this.address,
        this.publicKey,
        recipientAddress,
        microAmount,
        type,
        token
      );

      const rawSignature = await this.fireblocksService.signTransaction(
        transactionToSign.preSignSigHash,
        this.vaultAccountId.toString(),
        note || ""
      );

      const signature = concatSignature(rawSignature.fullSig, rawSignature.v);

      (transactionToSign.unsignedTx as any).auth.spendingCondition.signature =
        createMessageSignature(signature);

      const result = await this.chainService.brodcastTransaction(
        transactionToSign.unsignedTx
      );
      return result;
    } catch (error) {
      throw new Error(
        `Failed to build, sign or send transaction: ${formatErrorMessage(
          error
        )}`
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
    note?: string
  ): Promise<CreateTransactionResponse> => {
    if (!this.address || !this.publicKey || !this.vaultAccountId) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }

    try {
      const paramsValidationResponse = await this.checkParamsAndAdjustAmount(
        recipientAddress,
        amount,
        grossTransaction,
        TransactionType.STX
      );

      if (!paramsValidationResponse.validParams) {
        return {
          success: false,
          error: `Invalid transaction parameters: ${paramsValidationResponse.reason}`,
        };
      }

      const microAmount = paramsValidationResponse.finalAmount as bigint;

      const result = await this.buildSignSendTransaction(
        recipientAddress,
        microAmount,
        TransactionType.STX,
        undefined,
        note
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
        `Failed to create transaction: ${formatErrorMessage(error)}`
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
    note?: string
  ): Promise<CreateTransactionResponse> => {
    if (!this.address || !this.publicKey || !this.vaultAccountId) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }

    try {
      const paramsValidationResponse = await this.checkParamsAndAdjustAmount(
        recipientAddress,
        amount,
        undefined, // Gross transaction not applicable for FT transfers
        TransactionType.FungibleToken,
        token
      );

      if (!paramsValidationResponse.validParams) {
        return {
          success: false,
          error: `Invalid transaction parameters: ${paramsValidationResponse.reason}`,
        };
      }

      const microAmount = paramsValidationResponse.finalAmount as bigint;

      const result = await this.buildSignSendTransaction(
        recipientAddress,
        microAmount,
        TransactionType.FungibleToken,
        token,
        note
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
        `Failed to create transaction: ${formatErrorMessage(error)}`
      );
    }
  };
}

// async function main() {
//   const sdk = await StacksSDK.create(230, {
//     apiKey: "79169abd-695f-40e8-8762-47bfb6072b63",
//     apiSecret: "./secrets/fireblocks_secret.key",
//     testnet: true,
//   });

//   const res = await sdk.createNativeTransaction(
//     "ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3",
//     1,
//     true,
//     "Test FT transaction from StacksSDK"
//   );

//   console.log(res);
// }

// main();
