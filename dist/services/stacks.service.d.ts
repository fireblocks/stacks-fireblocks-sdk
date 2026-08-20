/**
 * The StacksService class provides a high-level interface for interacting with the Stacks blockchain
 * using the Stacks SDK. It supports building, serializing, signing, submitting, and tracking transactions,
 * as well as querying account balances, coin data, and transaction history.
 *
 * @remarks
 * This service abstracts the complexity of direct SDK usage and provides utility methods for common blockchain operations.
 */
import { ContractCallTransaction, TokenType, Transaction, TransactionType } from "./types";
import { StacksNetwork } from "@stacks/network";
import { ClarityValue, PostConditionMode, PostConditionWire, StacksTransactionWire } from "@stacks/transactions";
export declare class StacksService {
    private axiosClient;
    private stackBaseUrl;
    private network;
    private testnet;
    /**
     * @param testnet - Whether this is a testnet-class network (address versioning).
     * @param profile - Optional explicit network settings. When provided (by
     *   StacksSDK, the single owner of network resolution), the base URL,
     *   chain id, and magic bytes come from the resolved profile so this service and
     *   the PoX-5 client always describe the same chain. When omitted, falls back to
     *   env/default resolution for standalone use.
     */
    constructor(testnet?: boolean, profile?: {
        baseUrl: string;
        chainId: number;
        magicBytes: string;
    }, hiroApiKey?: string);
    /**
     * Fetches the current PoX contract address and name.
     * @returns An object containing the PoX contract address and name
     */
    private getPoxContractInfo;
    /**
     * Formats a compressed secp256k1 public key hex into a Stacks address.
     * @param pubKey - The compressed secp256k1 public key in hex format.
     * @returns - The corresponding Stacks address.
     */
    formatAddress: (pubKey: string) => string;
    /**
     * Returns nonce information for the given address, accounting for pending mempool transactions.
     *
     * - confirmedNonce: the next nonce per on-chain confirmed state.
     * - pendingTxCount: number of this address's transactions currently in the mempool.
     * - nextAvailable: the first nonce not already taken by a pending tx (gap-aware).
     *   Use this when submitting a new transaction that should confirm as soon as possible.
     *
     * Note: if a pending tx is evicted from the mempool (e.g. fee too low), its nonce is freed
     * but nextAvailable will remain elevated until the confirmed nonce catches up.
     *
     * @param address - The Stacks address to query.
     */
    /**
     * Returns only the confirmed on-chain nonce, skipping the mempool scan.
     * @param address - The Stacks address to query.
     */
    getConfirmedNonce: (address: string) => Promise<bigint>;
    getAccountNonce: (address: string) => Promise<{
        confirmedNonce: bigint;
        pendingTxCount: number;
        nextAvailable: bigint;
    }>;
    /**
     * Makes a call to the Stacks balances endpoint for a given address.
     * @param address - The Stacks address to query balances for.
     * @returns - The response from the balances endpoint.
     */
    makeBalanceCalls: (address: string) => Promise<any>;
    /**
     * Retrieves the native STX balance for a given address from makeBalanceCalls response.
     * @param address - The Stacks address to query balance for.
     * @returns - The native STX balance.
     */
    getNativeBalance: (address: string) => Promise<number>;
    /**
     * Retrieves the fungible token balances for a given address from makeBalanceCalls response.
     * @param address - The Stacks address to query balances for.
     * @returns - The fungible token balances.
     */
    getFTBalancesForAddress: (address: string) => Promise<Record<string, {
        balance: string;
    }>>;
    /**
     * Fetches the decimals for a given fungible token contract.
     * @param contractAddress - The address of the fungible token contract.
     * @param contractName - The name of the fungible token contract.
     * @returns - The number of decimals for the fungible token.
     */
    fetchFtDecimals: (contractAddress: string, contractName: string) => Promise<number>;
    /**
     * Estimates the transaction fee for STX transfer.
     * @param recipientAddress - The recipient's Stacks address.
     * @param amountUstx - The amount to transfer in microSTX (ustx).
     * @returns - The estimated transaction fee in microSTX (ustx).
     */
    estimateTxFee: (recipientAddress: string, amountUstx: bigint) => Promise<number>;
    /**
     * Estimates the transaction fee for a contract call.
     * @param contractAddress - The address of the contract.
     * @param contractName - The name of the contract.
     * @param functionName - The name of the function to call.
     * @param functionArgs - The arguments to pass to the function.
     * @returns - The estimated transaction fee in microSTX (ustx).
     */
    estimateContractCallFee: (contractAddress: string, contractName: string, functionName: string, functionArgs: ClarityValue[]) => Promise<number>;
    /**
     * Checks the delegation status of a given address.
     * @param address
     * @returns
     */
    checkDelegationStatus: (address: string) => Promise<any>;
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
    buildUnsignedTransaction: (sender: string, senderPublicKey: string, recipient: string, amount: bigint, type?: TransactionType, token?: TokenType, customTokenContractAddress?: string, customTokenContractName?: string, customTokenAssetName?: string, nonce?: bigint, fee?: bigint, memo?: string) => Promise<StacksTransactionWire>;
    /**
     *  Builds an unsigned contract call transaction.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @param contractAddress - The address of the contract.
     * @param contractName - The name of the contract.
     * @param functionName - The name of the function to call.
     * @param functionArgs - The arguments to pass to the function.
     * @returns - The unsigned Stacks contract call transaction.
     */
    buildUnsignedContractCall: (senderPublicKey: string, contractAddress: string, contractName: string, functionName: string, functionArgs: ClarityValue[], nonce?: bigint, postConditionMode?: PostConditionMode, postConditions?: PostConditionWire[]) => Promise<StacksTransactionWire>;
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
    serializeTransaction: (sender: string, senderPublicKey: string, recipient: string, amount: bigint, type?: TransactionType, token?: TokenType, customTokenContractAddress?: string, customTokenContractName?: string, customTokenAssetName?: string, nonce?: bigint, fee?: bigint, memo?: string) => Promise<{
        unsignedTx: StacksTransactionWire;
        preSignSigHash: string;
    }>;
    /**
     *  Serializes a contract call transaction.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @param contractAddress - The address of the contract.
     * @param contractName - The name of the contract.
     * @param functionName - The name of the function to call.
     * @param functionArgs - The arguments to pass to the function.
     * @returns - The serialized unsigned Stacks contract call transaction and pre-signature hash.
     */
    serializeContractCall: (senderPublicKey: string, contractAddress: string, contractName: string, functionName: string, functionArgs: ClarityValue[], nonce?: bigint, fee?: bigint, postConditions?: PostConditionWire[], postConditionMode?: PostConditionMode) => Promise<{
        unsignedContractCall: StacksTransactionWire;
        preSignSigHash: string;
    }>;
    /**
     *  Broadcasts a signed transaction to the Stacks network.
     * @param signedTransaction - The signed Stacks transaction to broadcast.
     * @returns - The result of the broadcast operation.
     */
    broadcastTransaction: (signedTransaction: StacksTransactionWire, network?: StacksNetwork) => Promise<any>;
    /**
     *  Retrieves the status of a transaction from the Stacks network.
     * @param txid - The transaction ID to check the status for.
     * @returns - Json object containing transaction details.
     */
    getTxStatusById: (txid: string) => Promise<any>;
    /**
     * Parses a raw list of Stacks API transaction items into typed Transaction objects.
     */
    private parseTransactionItems;
    /**
     * Fetches one page of confirmed transactions for a given address.
     * Pagination is handled by the caller.
     * @param address - The Stacks address.
     * @param limit - Page size (max 50).
     * @param offset - Page offset.
     * @returns An array of parsed transactions for this page.
     */
    getTransactionHistory: (address: string, limit?: number, offset?: number) => Promise<Transaction[]>;
    /**
     * Fetches one page of pending (mempool) transactions for a given address.
     * Pagination is handled by the caller.
     * @param address - The Stacks address.
     * @param limit - Page size (max 50).
     * @param offset - Page offset.
     * @returns An array of parsed pending transactions for this page.
     */
    getMempoolTransactions: (address: string, limit?: number, offset?: number) => Promise<Transaction[]>;
    /**
     *  Fetches PoX contract information from the Stacks network.
     * @returns - The PoX contract information.
     */
    fetchPoxInfo: () => Promise<any>;
    /**
     * Delegates STX to a specified address for a given lock period.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @param delegateTo - The address to delegate STX to.
     * @param amount - The amount of STX to delegate (in microSTX).
     * @param lockPeriod - Number of cycles to lock the delegation for.
     * @returns - The unsigned delegate STX transaction.
     */
    delegateStx: (senderPublicKey: string, delegateTo: string, amount: bigint, lockPeriod: number, nonce?: bigint, poolContractName?: string) => Promise<{
        unsignedContractCall: StacksTransactionWire;
        preSignSigHash: string;
    }>;
    /**
     * Revokes STX delegation.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @returns - The unsigned revoke delegation transaction.
     */
    revokeStxDelegation: (senderPublicKey: string, nonce?: bigint) => Promise<{
        unsignedContractCall: StacksTransactionWire;
        preSignSigHash: string;
    }>;
    /**
     * Allows the delegatee to call pox contract to lock delegated STX on the delegater's behalf.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @param delegateTo - The address to delegate STX to.
     * @param amount - The amount of STX to delegate (in microSTX).
     * @param lockPeriod - Number of cycles to lock the delegation for.
     * @returns - The unsigned delegate STX transaction.
     */
    allowPoxContractCaller: (senderPublicKey: string, poolAddress: string, poolContractName: string, nonce?: bigint) => Promise<{
        unsignedContractCall: StacksTransactionWire;
        preSignSigHash: string;
    }>;
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
    soloStack: (senderPublicKey: string, signerKey: string, amountUstx: bigint, btcRewardAddress: string, lockPeriod: number, maxAmountUstx: bigint, signerSig65Hex: string, startBurnHeight: number, authId: bigint, nonce?: bigint) => Promise<{
        unsignedContractCall: StacksTransactionWire;
        preSignSigHash: string;
    }>;
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
    increaseStackedStx: (senderPublicKey: string, signerKey: string, increaseBy: bigint, maxAmountUstx: bigint, signerSig65Hex: string, authId: bigint, nonce?: bigint) => Promise<{
        unsignedContractCall: StacksTransactionWire;
        preSignSigHash: string;
    }>;
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
    extendStackingPeriod: (senderPublicKey: string, signerKey: string, btcRewardAddress: string, extendCycles: number, maxAmountUstx: bigint, signerSig65Hex: string, authId: bigint, nonce?: bigint) => Promise<{
        unsignedContractCall: StacksTransactionWire;
        preSignSigHash: string;
    }>;
    /**
     * Serializes a generic contract call to a given contract address and name with specified function and arguments.
     * @param senderPublicKey - The compressed secp256k1 public key in hex format of the transaction sender.
     * @param contractAddress - The address of the contract to call.
     * @param contractName - The name of the contract to call.
     * @param functionName - The name of the function to call on the contract.
     * @param functionArgs - The arguments to pass to the contract function - must be an array of ClarityValue objects in the same order and types as the function parameters.
     * @returns the serialized unsigned contract call transaction and pre-signature hash.
     */
    makeContractCall: (senderPublicKey: string, contractAddress: string, contractName: string, functionName: string, functionArgs: ClarityValue[], postConditions?: PostConditionWire[], postConditionMode?: PostConditionMode) => Promise<{
        unsignedContractCall: StacksTransactionWire;
        preSignSigHash: string;
    }>;
    /**
     * Fetches contract call transactions for an address, excluding STX and FT transfers.
     * @param address - The Stacks address to query.
     * @param limit - The maximum number of transactions to retrieve.
     * @param offset - The offset for pagination.
     * @returns An array of contract call transactions.
     */
    getContractCallHistory: (address: string, limit?: number, offset?: number) => Promise<ContractCallTransaction[]>;
}
