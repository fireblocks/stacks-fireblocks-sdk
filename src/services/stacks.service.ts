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
  bufferCV,
  ClarityValue,
  contractPrincipalCV,
  createContractCallPayload,
  createTokenTransferPayload,
  cvToValue,
  fetchCallReadOnlyFunction,
  fetchFeeEstimateTransaction,
  makeUnsignedContractCall,
  makeUnsignedSTXTokenTransfer,
  noneCV,
  Pc,
  PostConditionMode,
  principalCV,
  publicKeyToAddress,
  serializePayload,
  sigHashPreSign,
  someCV,
  StacksTransactionWire,
  standardPrincipalCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { formatErrorMessage } from "../utils/errorHandling";
import {
  btcAddressToPoxTuple,
  getDecimalsFromFtInfo,
  getTokenInfo,
  isCompressedSecp256k1PubKeyHex,
  untilBurnHeightForCycles,
  validateAddress,
} from "../utils/helpers";
import {
  api_constants,
  helperConstants,
  pagination_defaults,
  poxInfo,
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


/**
 * Fetches the current PoX contract address and name.
 * @returns An object containing the PoX contract address and name
 */
private getPoxContractInfo = async (): Promise<{ contractAddress: string; contractName: string }> => {
  const poxResponse = await this.fetchPoxInfo();
  
  if (poxResponse?.data?.contract_id) {
    const [contractAddress, contractName] = poxResponse.data.contract_id.split(".");
    return { contractAddress, contractName };
  }
  
  // Fallback to static config
  return this.network === STACKS_TESTNET ? poxInfo.testnet : poxInfo.mainnet;
};

  /**
   * Formats a compressed secp256k1 public key hex into a Stacks address.
   * @param pubKey - The compressed secp256k1 public key in hex format.
   * @returns - The corresponding Stacks address.
   */
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
        isTestnet ? "testnet" : "mainnet",
      );
      return address;
    } catch (error) {
      console.error(
        "formatAddress : Error formatting address:",
        formatErrorMessage(error),
      );
      throw new Error(`Failed to format address: ${error}`);
    }
  };

  /**
   * Makes a call to the Stacks balances endpoint for a given address.
   * @param address - The Stacks address to query balances for.
   * @returns - The response from the balances endpoint.
   */
  public makeBalanceCalls = async (address: string): Promise<any> => {
    try {
      const response = await this.axiosClient.get(
        `${this.stackBaseUrl}/extended/v1/address/${address}/balances`,
      );

      if (!response || !response.data || response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error(
        `Error calling Stacks balances endpoint: ${formatErrorMessage(error)}`,
      );
      throw new Error(
        `Failed to call Stacks balances endpoint for address ${address}: ${formatErrorMessage(
          error,
        )}`,
      );
    }
  };

  /**
   * Retrieves the native STX balance for a given address from makeBalanceCalls response.
   * @param address - The Stacks address to query balance for.
   * @returns - The native STX balance.
   */
  public getNativeBalance = async (address: string): Promise<number> => {
    try {
      const response = await this.makeBalanceCalls(address);
      const balance =
        Number(response.data.stx.balance) / 10 ** stacks_info.stxDecimals;
      return balance;
    } catch (error) {
      console.error(
        "getNativeBalance : Error fetching native balance:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to fetch native balance for address ${address}: ${formatErrorMessage(
          error,
        )}`,
      );
    }
  };


  /**
   * Retrieves the fungible token balances for a given address from makeBalanceCalls response.
   * @param address - The Stacks address to query balances for.
   * @returns - The fungible token balances.
   */
  public getFTBalancesForAddress = async (address: string): Promise<any> => {
    try {
      const response = await this.makeBalanceCalls(address);
      const ftObject = response.data.fungible_tokens;
      return ftObject;
    } catch (error) {
      console.error(
        "getFTBalancesForAddress : Error fetching fungible token balances:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to fetch native balance for address ${address}: ${formatErrorMessage(
          error,
        )}`,
      );
    }
  };

  /**
   * Fetches the decimals for a given fungible token contract.
   * @param contractAddress - The address of the fungible token contract.
   * @param contractName - The name of the fungible token contract.
   * @returns - The number of decimals for the fungible token.
   */

  public fetchFtDecimals = async (
    contractAddress: string,
    contractName: string,
  ): Promise<number> => {
    try {
      const network = this.network;
      const res = await fetchCallReadOnlyFunction({
        contractName,
        contractAddress,
        functionName: "get-decimals",
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      });

      const val = (res as any).value.value as number;
      return Number(val);
    } catch (error) {
      console.error("Error fetching FT decimals:", formatErrorMessage(error));
      throw new Error(
        `Failed to fetch FT decimals: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Estimates the transaction fee for STX transfer.
   * @param recipientAddress - The recipient's Stacks address.
   * @param amountUstx - The amount to transfer in microSTX (ustx).
   * @returns - The estimated transaction fee in microSTX (ustx).
   */
  public estimateTxFee = async (
    recipientAddress: string,
    amountUstx: bigint,
  ): Promise<number> => {
    try {
      const payload = createTokenTransferPayload(recipientAddress, amountUstx);

      const payloadHex = serializePayload(payload);

      const [, medium] = await fetchFeeEstimateTransaction({
        payload: payloadHex,
        network: this.network,
      });

      return medium.fee;
    } catch (error) {
      console.error(
        "Error estimating transaction fee:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to estimate transaction fee: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Estimates the transaction fee for a contract call.
   * @param contractAddress - The address of the contract.
   * @param contractName - The name of the contract.
   * @param functionName - The name of the function to call.
   * @param functionArgs - The arguments to pass to the function.
   * @returns - The estimated transaction fee in microSTX (ustx).
   */
  public estimateContractCallFee = async (
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: ClarityValue[],
  ): Promise<number> => {
    try {
      const payload = createContractCallPayload(
        contractAddress,
        contractName,
        functionName,
        functionArgs,
      );

      const payloadHex = serializePayload(payload);

      const [, medium] = await fetchFeeEstimateTransaction({
        payload: payloadHex,
        network: this.network,
      });

      return medium.fee;
    } catch (error) {
      console.error(
        "Error estimating contract call fee:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to estimate contract call fee: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Checks the delegation status of a given address.
   * @param address
   * @returns
   */

  public checkDelegationStatus = async (address: string): Promise<any> => {
    try {
      if (!validateAddress(address, this.network === STACKS_TESTNET)) {
        throw new Error("Invalid Stacks address");
      }

      const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();

      const cv = await fetchCallReadOnlyFunction({
        contractAddress: poxAddr,
        contractName: poxName,
        functionName: "get-delegation-info",
        functionArgs: [principalCV(address)],
        network: this.network,
        senderAddress: address,
      });

      if (!cv) {
        throw new Error("No response from get-delegation-info");
      }

      return cvToValue(cv);
    } catch (error) {
      console.error(
        "Error checking delegation status:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to check delegation status: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Builds an unsigned transaction for STX transfer or fungible token transfer.
   * @param sender - The sender's Stacks address.
   * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
   * @param recipient - The recipient's Stacks address.
   * @param amount - The amount to transfer (in STX or token units).
   * @param type - The type of transaction (STX or FungibleToken).
   * @param token - The type of fungible token (required if type is FungibleToken).
   * @returns - The unsigned Stacks transaction.
   */
  public buildUnsignedTransaction = async (
    sender: string,
    senderPublicKey: string,
    recipient: string,
    amount: bigint,
    type: TransactionType = TransactionType.STX,
    token?: TokenType,
    customTokenContractAddress?: string,
    customTokenContractName?: string,
    customTokenAssetName?: string,
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
          `Token type must be provided for fungible token transfers`,
        );
      }

      // if custom token, validate contract address, name, and asset name are provided
      if (token === TokenType.CUSTOM) {
        if (!customTokenContractAddress || !customTokenContractName || !customTokenAssetName) {
          throw new Error(
            `Custom token contract address, name, and asset name must be provided for CUSTOM token type`,
          );
        }
      }

      const tokenInfo = getTokenInfo(token, this.network === STACKS_TESTNET ? "testnet" : "mainnet");

      if (type === TransactionType.FungibleToken && token !== TokenType.CUSTOM && !tokenInfo) {
        throw new Error(`Token ${token} is not supported on ${this.network}`);
      }

      let unsignedTx: StacksTransactionWire;

      if (type === TransactionType.FungibleToken) {
        const ftContractAddress =
          token === TokenType.CUSTOM
            ? customTokenContractAddress!
            : tokenInfo!.contractAddress;
        const ftContractName =
          token === TokenType.CUSTOM
            ? customTokenContractName!
            : tokenInfo!.contractName;
        // Asset name may differ from contract name (e.g., usdcx contract has usdcx-token asset)
        const ftAssetName =
          token === TokenType.CUSTOM
            ? customTokenAssetName!
            : tokenInfo!.assetName;

        // Create post-condition: sender sends exactly `amount` of this token
        const postCondition = Pc.principal(sender)
          .willSendEq(amount)
          .ft(`${ftContractAddress}.${ftContractName}`, ftAssetName);

        unsignedTx = await makeUnsignedContractCall({
          contractAddress: ftContractAddress,
          contractName: ftContractName,
          functionName: "transfer",
          functionArgs: [
            uintCV(amount),
            principalCV(sender),
            principalCV(recipient),
            noneCV(),
          ],
          publicKey: senderPublicKey,
          network: this.network,
          postConditionMode: PostConditionMode.Deny,
          postConditions: [postCondition],
        });
      } else {
        unsignedTx = await makeUnsignedSTXTokenTransfer({
          recipient,
          amount,
          publicKey: senderPublicKey,
          network: this.network,
        });
      }

      return unsignedTx;
    } catch (error) {
      console.error(
        "Error building unsigned transaction:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to build unsigned transaction: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   *  Builds an unsigned contract call transaction.
   * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
   * @param contractAddress - The address of the contract.
   * @param contractName - The name of the contract.
   * @param functionName - The name of the function to call.
   * @param functionArgs - The arguments to pass to the function.
   * @returns - The unsigned Stacks contract call transaction.
   */
  public buildUnsignedContractCall = async (
    senderPublicKey: string,
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: ClarityValue[],
  ): Promise<StacksTransactionWire> => {
    try {
      if (!validateAddress(contractAddress, this.network === STACKS_TESTNET)) {
        throw new Error("Invalid recipient address");
      }

      if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
        throw new Error("Invalid compressed secp256k1 public key hex format");
      }

      if (!contractName || !functionName) {
        throw new Error("Contract name and function name must be provided");
      }

      const unsignedContractCall = await makeUnsignedContractCall({
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        publicKey: senderPublicKey,
        network: this.network,
        postConditionMode: PostConditionMode.Deny,
      });

      return unsignedContractCall;
    } catch (error) {
      console.error(
        "Error building unsigned transaction:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to build unsigned transaction: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Serializes a transaction for STX transfer or fungible token transfer.
   * @param sender - The sender's Stacks address.
   * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
   * @param recipient - The recipient's Stacks address.
   * @param amount - The amount to transfer.
   * @param type - The type of transaction (STX or FungibleToken).
   * @param token - The type of fungible token (required if type is FungibleToken).
   * @returns - The serialized unsigned Stacks transaction and pre-signature hash.
   */
  public serializeTransaction = async (
    sender: string,
    senderPublicKey: string,
    recipient: string,
    amount: bigint,
    type: TransactionType = TransactionType.STX,
    token?: TokenType,
    customTokenContractAddress?: string,
    customTokenContractName?: string,
    customTokenAssetName?: string,
  ): Promise<{
    unsignedTx: StacksTransactionWire;
    preSignSigHash: string;
  }> => {
    try {
      if (type == TransactionType.FungibleToken && !token) {
        throw new Error(
          "Token type must be provided for FungibleToken transactions",
        );
      }

      if (token === TokenType.CUSTOM) {
        if (!customTokenContractAddress || !customTokenContractName || !customTokenAssetName) {
          throw new Error(
            "Custom token contract address, name, and asset name must be provided for CUSTOM token type",
          );
        }
      }

      const unsignedTx = await this.buildUnsignedTransaction(
        sender,
        senderPublicKey,
        recipient,
        amount,
        type,
        token,
        customTokenContractAddress,
        customTokenContractName,
        customTokenAssetName,
      );
      const sigHash = unsignedTx.signBegin();

      const preSignSigHash = sigHashPreSign(
        sigHash,
        unsignedTx.auth.authType,
        unsignedTx.auth.spendingCondition.fee,
        unsignedTx.auth.spendingCondition.nonce,
      );

      return { unsignedTx, preSignSigHash };
    } catch (error) {
      console.error(
        "Error serializing transaction:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to serialize transaction: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   *  Serializes a contract call transaction.
   * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
   * @param contractAddress - The address of the contract.
   * @param contractName - The name of the contract.
   * @param functionName - The name of the function to call.
   * @param functionArgs - The arguments to pass to the function.
   * @returns - The serialized unsigned Stacks contract call transaction and pre-signature hash.
   */
  public serializeContractCall = async (
    senderPublicKey: string,
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: ClarityValue[],
  ): Promise<{
    unsignedContractCall: StacksTransactionWire;
    preSignSigHash: string;
  }> => {
    try {
      const unsignedContractCall = await this.buildUnsignedContractCall(
        senderPublicKey,
        contractAddress,
        contractName,
        functionName,
        functionArgs,
      );
      const sigHash = unsignedContractCall.signBegin();

      const preSignSigHash = sigHashPreSign(
        sigHash,
        unsignedContractCall.auth.authType,
        unsignedContractCall.auth.spendingCondition.fee,
        unsignedContractCall.auth.spendingCondition.nonce,
      );

      return { unsignedContractCall, preSignSigHash };
    } catch (error) {
      console.error(
        "Error serializing transaction:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to serialize transaction: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   *  Broadcasts a signed transaction to the Stacks network.
   * @param signedTransaction - The signed Stacks transaction to broadcast.
   * @returns - The result of the broadcast operation.
   */
  public broadcastTransaction = async (
    signedTransaction: StacksTransactionWire,
  ): Promise<any> => {
    try {
      const result = await broadcastTransaction({
        transaction: signedTransaction,
      });

      return result;
    } catch (error) {
      console.error(
        "Error broadcasting transaction:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to broadcast transaction: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   *  Retrieves the status of a transaction from the Stacks network.
   * @param txid - The transaction ID to check the status for.
   * @returns - Json object containing transaction details.
   */
  public getTxStatusById = async (txid: string): Promise<any> => {
    try {
      const response = await this.axiosClient.get(
        `${this.stackBaseUrl}/extended/v1/tx/${txid}`,
      );

      if (!response || !response.data || response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.data;
    } catch (error) {
      console.error(
        `Error getting transaction status: ${formatErrorMessage(error)}`,
      );
      throw new Error(
        `Failed to get transaction status for txid ${txid}: ${formatErrorMessage(
          error,
        )}`,
      );
    }
  };

  /**
   * Parses a raw list of Stacks API transaction items into typed Transaction objects.
   */
  private parseTransactionItems = async (
    items: any[],
    address: string,
  ): Promise<Transaction[]> => {
    const txs: Transaction[] = [];

    for (const tx of items) {
      const base = {
        transaction_hash: tx.tx_id as string,
        timestamp: tx.block_time_iso,
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
        const contractAddress = contractId.split(".")[0];
        let decimals = getDecimalsFromFtInfo(contractId);

        // if decimals is 0 => not found in ftInfo => custom token
        if (decimals == 0) {
          decimals = await this.fetchFtDecimals(contractAddress, contractName);
        }

        const amountInt = BigInt(rawAmount);
        const amount =
          decimals > 0 ? Number(amountInt) / 10 ** decimals : Number(amountInt);

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
  };

  /**
   * Retrieves the transaction history for a given address.
   * Automatically paginates through multiple Stacks API requests when limit > stacks_api_page_size.
   * @param address - The Stacks address to retrieve the transaction history for.
   * @param limit - The maximum number of transactions to retrieve.
   * @param offset - The starting offset for pagination.
   * @returns An array of transactions associated with the address.
   */
  public getTransactionHistory = async (
    address: string,
    limit: number = pagination_defaults.limit,
    offset: number = pagination_defaults.page,
  ): Promise<Transaction[]> => {
    if (!validateAddress(address, this.network === STACKS_TESTNET)) {
      throw new Error("Invalid Stacks address");
    }

    try {
      const allTxs: Transaction[] = [];
      let currentOffset = offset;
      let remaining = limit;

      while (remaining > 0) {
        const pageSize = Math.min(remaining, helperConstants.stacks_api_page_size);
        const response = await this.axiosClient.get(
          `${this.stackBaseUrl}/extended/v1/address/${address}/transactions?limit=${pageSize}&offset=${currentOffset}`,
        );

        if (!response || !response.data || response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }

        const items = (response.data.results || []) as any[];
        if (items.length === 0) break;

        const txs = await this.parseTransactionItems(items, address);
        allTxs.push(...txs);

        if (items.length < pageSize) break; // no more data on the chain

        currentOffset += pageSize;
        remaining -= pageSize;
      }

      return allTxs;
    } catch (error) {
      throw new Error(
        `Failed to fetch transaction history: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   *  Fetches PoX contract information from the Stacks network.
   * @returns - The PoX contract information.
   */
  public fetchPoxInfo = async (): Promise<any> => {
    try {
      const response = await this.axiosClient.get(
        `${this.stackBaseUrl}/v2/pox`,
      );

      if (!response || !response.data || response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error(`Error fetching pox info: ${formatErrorMessage(error)}`);
      throw new Error(`Failed to fetch PoX info from network: ${formatErrorMessage(error)}`);
    }
  };

  /**
   * Delegates STX to a specified address for a given lock period.
   * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
   * @param delegateTo - The address to delegate STX to.
   * @param amount - The amount of STX to delegate (in microSTX).
   * @param lockPeriod - Number of cycles to lock the delegation for.
   * @returns - The unsigned delegate STX transaction.
   */
  public delegateStx = async (
    senderPublicKey: string,
    delegateTo: string,
    amount: bigint,
    lockPeriod: number, // Number of cycles
  ): Promise<{
    unsignedContractCall: StacksTransactionWire;
    preSignSigHash: string;
  }> => {
    try {
      if (!validateAddress(delegateTo, this.network === STACKS_TESTNET)) {
        throw new Error("Invalid delegateTo address");
      }

      if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
        throw new Error("Invalid compressed secp256k1 public key hex format");
      }

      const poxResponse = await this.fetchPoxInfo();

      const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();

      if (!poxResponse || !poxResponse.data || poxResponse.status !== 200) {
        throw new Error("Failed to fetch PoX contract info from the network");
      }

      const until_burn_ht = await untilBurnHeightForCycles(
        lockPeriod,
        poxResponse,
      );

      const serializedContractCall = await this.serializeContractCall(
        senderPublicKey,
        poxAddr,
        poxName,
        "delegate-stx",
        [
          uintCV(amount),
          standardPrincipalCV(delegateTo),
          someCV(uintCV(until_burn_ht)),
          noneCV(),
        ],
      );

      return serializedContractCall;
    } catch (error) {
      console.error(
        "Error building delegate STX transaction:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to build delegate STX transaction: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Revokes STX delegation.
   * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
   * @returns - The unsigned revoke delegation transaction.
   */
  public revokeStxDelegation = async (
    senderPublicKey: string,
  ): Promise<{
    unsignedContractCall: StacksTransactionWire;
    preSignSigHash: string;
  }> => {
    try {
      if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
        throw new Error("Invalid compressed secp256k1 public key hex format");
      }

      const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();

      const serializedContractCall = await this.serializeContractCall(
        senderPublicKey,
        poxAddr,
        poxName,
        "revoke-delegate-stx",
        [],
      );

      return serializedContractCall;
    } catch (error) {
      console.error(
        "Error building revoke STX delegation transaction:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to build revoke STX delegation transaction: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Allows the delegatee to call pox contract to lock delegated STX on the delegater's behalf.
   * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
   * @param delegateTo - The address to delegate STX to.
   * @param amount - The amount of STX to delegate (in microSTX).
   * @param lockPeriod - Number of cycles to lock the delegation for.
   * @returns - The unsigned delegate STX transaction.
   */
  public allowPoxContractCaller = async (
    senderPublicKey: string,
    poolAddress: string,
    poolContractName: string,
  ): Promise<{
    unsignedContractCall: StacksTransactionWire;
    preSignSigHash: string;
  }> => {
    try {
      if (!validateAddress(poolAddress, this.network === STACKS_TESTNET)) {
        throw new Error("Invalid pool address");
      }

      if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
        throw new Error("Invalid compressed secp256k1 public key hex format");
      }

      if (!poolContractName) {
        throw new Error("Pool contract name must be provided");
      }

      const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();

      const serializedContractCall = await this.serializeContractCall(
        senderPublicKey,
        poxAddr,
        poxName,
        "allow-contract-caller",
        [contractPrincipalCV(poolAddress, poolContractName), noneCV()],
      );

      return serializedContractCall;
    } catch (error) {
      console.error(
        "Error building allow contract caller transaction:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to allow contract caller: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Solo stacks STX on Stacks PoX to earn rewards directly.
   * @param senderPublicKey
   * @param address
   * @param amountUstx
   * @param btcRewardAddress
   * @param lockPeriod
   * @param maxAmountUstx
   * @param authId
   * @returns the unsigned solo stack transaction.
   */
  public soloStack = async (
    senderPublicKey: string,
    signerKey: string,
    amountUstx: bigint,
    btcRewardAddress: string,
    lockPeriod: number,
    maxAmountUstx: bigint,
    signerSig65Hex: string,
    startBurnHeight: number,
    authId: bigint,
  ): Promise<{
    unsignedContractCall: StacksTransactionWire;
    preSignSigHash: string;
  }> => {
    try {

    if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
      throw new Error("Invalid compressed secp256k1 public key hex format");
    }

      const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();

      const { version, hashbytes } = btcAddressToPoxTuple(btcRewardAddress);

      const serializedContractCall = await this.serializeContractCall(
        senderPublicKey,
        poxAddr,
        poxName,
        "stack-stx",
        [
          uintCV(amountUstx),
          tupleCV({
            version: bufferCV(Uint8Array.from([version])),
            hashbytes: bufferCV(hashbytes),
          }),
          uintCV(startBurnHeight),
          uintCV(lockPeriod),
          someCV(bufferCV(Buffer.from(signerSig65Hex, "hex"))),
          bufferCV(Buffer.from(signerKey, "hex")),
          uintCV(maxAmountUstx),
          uintCV(authId),
        ],
      );

      return serializedContractCall;
    } catch (error) {
      console.error(
        "Error building solo stack transaction:",
        formatErrorMessage(error),
      );
      throw new Error(`Failed to solo stack: ${formatErrorMessage(error)}`);
    }
  };

/**
 * Increases the amount of STX in an existing solo stacking position.
 * @param senderPublicKey - Public key of the transaction sender
 * @param signerKey - Signer public key (33-byte compressed hex)
 * @param increaseBy - Amount of microSTX to add to existing stack
 * @param maxAmountUstx - Maximum total amount of microSTX to be stacked after increase 
 * @param signerSig65Hex - 65-byte signer signature (hex)
 * @param authId - Random integer for replay protection (must match signature)
 * @returns the unsigned stack-increase transaction.
 */
  public increaseStackedStx = async (
    senderPublicKey: string,
    signerKey: string,
    increaseBy: bigint,
    maxAmountUstx: bigint,
    signerSig65Hex: string,
    authId: bigint,
  ): Promise<{
    unsignedContractCall: StacksTransactionWire;
    preSignSigHash: string;
  }> => {
    try {
      if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
        throw new Error("Invalid compressed secp256k1 public key hex format");
      }

      const { contractAddress: poxAddr, contractName: poxName } = 
        await this.getPoxContractInfo();
    
      const serializedContractCall = await this.serializeContractCall(
        senderPublicKey,
        poxAddr,
        poxName,
        "stack-increase",
        [
          uintCV(increaseBy),                                    // increase-by
          someCV(bufferCV(Buffer.from(signerSig65Hex, "hex"))), // signer-sig
          bufferCV(Buffer.from(signerKey, "hex")),              // signer-key
          uintCV(maxAmountUstx),                                 // max-amount
          uintCV(authId),                                        // auth-id
        ],
      );

      return serializedContractCall;
    } catch (error) {
      console.error(
        "Error building stack-increase transaction:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to increase stacked STX: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
 * Extends the stacking period of an existing solo stacking position.
 * @param senderPublicKey - Public key of the transaction sender
 * @param signerKey - Signer public key (33-byte compressed hex)
 * @param extendCycles - cycles to extend the stacking period by
 * @param maxAmountUstx - Maximum total amount of microSTX to be stacked
 * @param signerSig65Hex - 65-byte signer signature (hex)
 * @param authId - Random integer for replay protection (must match signature)
 * @returns the unsigned stack-extend transaction.
 */
  public extendStackingPeriod = async (
    senderPublicKey: string,
    signerKey: string,
    btcRewardAddress: string,
    extendCycles: number,
    maxAmountUstx: bigint,
    signerSig65Hex: string,
    authId: bigint,
  ): Promise<{
    unsignedContractCall: StacksTransactionWire;
    preSignSigHash: string;
  }> => {
    try {
      if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
        throw new Error("Invalid compressed secp256k1 public key hex format");
      }

      const { contractAddress: poxAddr, contractName: poxName } = 
        await this.getPoxContractInfo();

      const { version, hashbytes } = btcAddressToPoxTuple(btcRewardAddress);
    
      const serializedContractCall = await this.serializeContractCall(
        senderPublicKey,
        poxAddr,
        poxName,
        "stack-extend",
        [
          uintCV(extendCycles), // extend-cycles
          tupleCV({                                              // 2. pox-addr
          version: bufferCV(Uint8Array.from([version])),
          hashbytes: bufferCV(hashbytes),
          }),                                    
          someCV(bufferCV(Buffer.from(signerSig65Hex, "hex"))), // signer-sig
          bufferCV(Buffer.from(signerKey, "hex")),              // signer-key
          uintCV(maxAmountUstx),                                 // max-amount
          uintCV(authId),                                        // auth-id
        ],
      );

      return serializedContractCall;
    } catch (error) {
      console.error(
        "Error building stack-extend transaction:",
        formatErrorMessage(error),
      );
      throw new Error(
        `Failed to extend stacking period: ${formatErrorMessage(error)}`,
      );
    }
  };
}
