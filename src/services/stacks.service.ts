/**
 * The StacksService class provides a high-level interface for interacting with the Stacks blockchain
 * using the Stacks SDK. It supports building, serializing, signing, submitting, and tracking transactions,
 * as well as querying account balances, coin data, and transaction history.
 *
 * @remarks
 * This service abstracts the complexity of direct SDK usage and provides utility methods for common blockchain operations.
 */

import axios, { AxiosInstance } from "axios";
import { TokenType, Transaction, TransactionType } from "./types";
import { STACKS_TESTNET, STACKS_MAINNET, StacksNetwork } from "@stacks/network";
import {
  broadcastTransaction,
  createTokenTransferPayload,
  fetchCallReadOnlyFunction,
  fetchFeeEstimateTransaction,
  makeUnsignedContractCall,
  makeUnsignedSTXTokenTransfer,
  noneCV,
  principalCV,
  publicKeyToAddress,
  serializePayload,
  sigHashPreSign,
  StacksTransactionWire,
  uintCV,
} from "@stacks/transactions";
import { formatErrorMessage } from "../utils/errorHandling";
import {
  getDecimalsFromFtInfo,
  isCompressedSecp256k1PubKeyHex,
  validateAddress,
} from "../utils/helpers";
import {
  api_constants,
  ftInfo,
  pagination_defaults,
  stacks_info,
} from "../utils/constants";

export class StacksService {
  private axiosClient: AxiosInstance;
  private stackBaseUrl: string;
  private network: StacksNetwork;

  constructor(testnet: boolean = false) {
    this.axiosClient = axios.create();
    this.stackBaseUrl = testnet
      ? api_constants.stacks_testnet_rpc
      : api_constants.stacks_mainnet_rpc;
    this.network = testnet ? STACKS_TESTNET : STACKS_MAINNET;
  }

  public formatAddress = (pubKey: string): string => {
    try {
      if (!pubKey || typeof pubKey !== "string") {
        throw new Error("Public key must be a non-empty string");
      }

      if (!isCompressedSecp256k1PubKeyHex(pubKey)) {
        throw new Error("Invalid compressed secp256k1 public key hex format");
      }

      const isTestnet = this.network === STACKS_TESTNET;
      const address = publicKeyToAddress(
        pubKey,
        isTestnet ? "testnet" : "mainnet"
      );
      return address;
    } catch (error) {
      console.error(
        "formatAddress : Error formatting address:",
        formatErrorMessage(error)
      );
      throw new Error(`Failed to format address: ${error}`);
    }
  };

  public makeBalanceCalls = async (address: string): Promise<any> => {
    try {
      const response = await this.axiosClient.get(
        `${this.stackBaseUrl}/extended/v1/address/${address}/balances`
      );

      if (!response || !response.data || response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      console.error(
        `Error calling Stacks balances endpoint: ${formatErrorMessage(error)}`
      );
    }
  };

  public getNativeBalance = async (address: string): Promise<number> => {
    try {
      const response = await this.makeBalanceCalls(address);
      const balance =
        Number(response.data.stx.balance) / 10 ** stacks_info.stxDecimals;
      return balance;
    } catch (error) {
      console.error(
        "getNativeBalance : Error fetching native balance:",
        formatErrorMessage(error)
      );
      throw new Error(
        `Failed to fetch native balance for address ${address}: ${formatErrorMessage(
          error
        )}`
      );
    }
  };

  public getFTBalancesForAddress = async (address: string): Promise<any> => {
    try {
      const response = await this.makeBalanceCalls(address);
      const ftObject = response.data.fungible_tokens;
      return ftObject;
    } catch (error) {
      console.error(
        "getNativeBalance : Error fetching native balance:",
        formatErrorMessage(error)
      );
      throw new Error(
        `Failed to fetch native balance for address ${address}: ${formatErrorMessage(
          error
        )}`
      );
    }
  };

  public fetchFtDecimals = async (
    senderAddress: string,
    contractAddress: string,
    contractName: string
  ): Promise<number> => {
    const network = this.network;
    const res = await fetchCallReadOnlyFunction({
      contractName,
      contractAddress,
      functionName: "get-decimals",
      functionArgs: [],
      network,
      senderAddress,
    });

    const val = (res as any).value.value as number;
    return Number(val);
  };

  public estimateTxFee = async (
    recipientAddress: string,
    amountUstx: bigint
  ): Promise<number> => {
    try {
      const payload = createTokenTransferPayload(recipientAddress, amountUstx);

      const payloadHex = serializePayload(payload);

      const [low] = await fetchFeeEstimateTransaction({
        payload: payloadHex,
        network: this.network,
      });

      return low.fee;
    } catch (error) {
      console.error(
        "Error estimating transaction fee:",
        formatErrorMessage(error)
      );
    }
  };

  public buildUnsignedTransaction = async (
    sender: string,
    senderPublicKey: string,
    recipient: string,
    amount: bigint,
    type: TransactionType = TransactionType.STX,
    token?: TokenType
  ): Promise<StacksTransactionWire> => {
    try {
      if (!validateAddress(recipient, this.network === STACKS_TESTNET)) {
        throw new Error("Invalid recipient address");
      }

      if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
        throw new Error("Invalid compressed secp256k1 public key hex format");
      }

      if (type == TransactionType.FungibleToken && !token) {
        throw new Error(
          `Token type must be provided for fungible token transfers`
        );
      }

      const unsignedTx =
        type == TransactionType.FungibleToken
          ? await makeUnsignedContractCall({
              contractAddress: ftInfo[token]?.contractAddress,
              contractName: ftInfo[token]?.contractName,
              functionName: "transfer",
              functionArgs: [
                uintCV(amount),
                principalCV(sender),
                principalCV(recipient),
                noneCV(),
              ],
              publicKey: senderPublicKey,
              network: this.network,
              postConditionMode: 1 as any,
            })
          : await makeUnsignedSTXTokenTransfer({
              recipient,
              amount,
              publicKey: senderPublicKey,
              network: this.network,
            });

      return unsignedTx;
    } catch (error) {
      console.error(
        "Error building unsigned transaction:",
        formatErrorMessage(error)
      );
      throw new Error(
        `Failed to build unsigned transaction: ${formatErrorMessage(error)}`
      );
    }
  };

  public serializeTransaction = async (
    sender: string,
    senderPublicKey: string,
    recipient: string,
    amount: bigint,
    type: TransactionType = TransactionType.STX,
    token?: TokenType
  ): Promise<{
    unsignedTx: StacksTransactionWire;
    preSignSigHash: string;
  }> => {
    try {
      const unsignedTx = await this.buildUnsignedTransaction(
        sender,
        senderPublicKey,
        recipient,
        amount,
        type,
        token
      );
      const sigHash = unsignedTx.signBegin();

      const preSignSigHash = sigHashPreSign(
        sigHash,
        unsignedTx.auth.authType,
        unsignedTx.auth.spendingCondition.fee,
        unsignedTx.auth.spendingCondition.nonce
      );

      return { unsignedTx, preSignSigHash };
    } catch (error) {
      console.error(
        "Error serializing transaction:",
        formatErrorMessage(error)
      );
      throw new Error(
        `Failed to serialize transaction: ${formatErrorMessage(error)}`
      );
    }
  };

  public brodcastTransaction = async (
    unsignedTransaction: StacksTransactionWire
  ): Promise<any> => {
    try {
      const result = await broadcastTransaction({
        transaction: unsignedTransaction,
      });
      return result;
    } catch (error) {
      console.error(
        "Error broadcasting transaction:",
        formatErrorMessage(error)
      );
      throw new Error(
        `Failed to broadcast transaction: ${formatErrorMessage(error)}`
      );
    }
  };

  public getTransactionHistory = async (
    address: string,
    limit: number = pagination_defaults.limit,
    offset: number = pagination_defaults.page
  ): Promise<Transaction[]> => {
    if (!validateAddress(address, this.network === STACKS_TESTNET)) {
      throw new Error("Invalid Stacks address");
    }

    const response = await this.axiosClient.get(
      `${this.stackBaseUrl}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`
    );

    if (!response || !response.data || response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }

    try {
      const items = (response.data.results || []) as any[];
      const txs: Transaction[] = [];

      for (const tx of items) {
        const base = {
          transaction_hash: tx.tx_id as string,
          success: tx.tx_status === "success",
        };

        // Native STX transfers
        if (tx.tx_type === "token_transfer" && tx.token_transfer) {
          const amountMicro = BigInt(tx.token_transfer.amount || "0");
          const amount = Number(amountMicro) / 1_000_000; // STX has 6 decimals

          txs.push({
            type: TransactionType.STX,
            sender: tx.sender_address,
            recipient: tx.token_transfer.recipient_address,
            amount,
            tokenName: undefined,
            tokenContractAddress: undefined,
            ...base,
          });

          continue;
        }

        // Fungible Token transfers
        if (
          tx.tx_type === "contract_call" &&
          tx.contract_call &&
          tx.contract_call.function_name === "transfer" &&
          Array.isArray(tx.contract_call.function_args) &&
          tx.contract_call.function_args.length >= 3
        ) {
          const [amountArg, senderArg, recipientArg] =
            tx.contract_call.function_args;

          const amountRepr = amountArg?.repr as string | undefined;
          const senderRepr = senderArg?.repr as string | undefined;
          const recipientRepr = recipientArg?.repr as string | undefined;

          const rawAmount =
            amountRepr && amountRepr.startsWith("u")
              ? amountRepr.slice(1)
              : "0";

          const sender =
            senderRepr && senderRepr.startsWith("'")
              ? senderRepr.slice(1)
              : tx.sender_address;

          const recipient =
            recipientRepr && recipientRepr.startsWith("'")
              ? recipientRepr.slice(1)
              : address;

          const contractId = tx.contract_call.contract_id as string;
          const contractName = contractId.split(".").slice(-1)[0];
          const decimals = getDecimalsFromFtInfo(contractId);

          const amountInt = BigInt(rawAmount);
          const amount =
            decimals > 0
              ? Number(amountInt) / 10 ** decimals
              : Number(amountInt);

          txs.push({
            type: TransactionType.FungibleToken,
            tokenName: contractName,
            tokenContractAddress: contractId,
            sender,
            recipient,
            amount,
            ...base,
          });

          continue;
        }
      }

      return txs;
    } catch (error) {
      throw new Error(
        `Failed to fetch transaction history: ${formatErrorMessage(error)}`
      );
    }
  };
}
