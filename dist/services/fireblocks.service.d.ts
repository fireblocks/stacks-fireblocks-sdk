/**
 * Service class for interacting with the Fireblocks SDK.
 *
 * Provides methods to initialize the Fireblocks SDK , retrieve public keys and raw sign transactions
 * by vault ID, and sign transactions using Fireblocks.
 *
 * Handles configuration via environment variables or explicit configuration objects.
 */
import { Fireblocks } from "@fireblocks/ts-sdk";
import { FireblocksConfig } from "./types";
export declare class FireblocksService {
    private readonly fireblocksSDK;
    private readonly fireblocksSigner;
    private testnet;
    constructor(fireblocksConfig?: FireblocksConfig);
    /**
     * @returns The initialized Fireblocks SDK instance of this Service class.
     */
    getFireblocksSDK: () => Fireblocks;
    /**
     * Retrieves the public key associated with a given Fireblocks vault ID.
     *
     * This method converts the provided `vaultID` to a non-negative integer, validates it,
     * and then retrieves the corresponding public key using the Fireblocks SDK.
     *
     * @param vaultID - The Fireblocks vault ID as a string or number. Must be a valid non-negative integer.
     * @returns A promise that resolves to the public key as a string.
     * @throws {Error} If the vault ID is invalid or if any error occurs during the process.
     */
    getPublicKeyByVaultID: (vaultID: string | number) => Promise<string>;
    /**
     * Ensures a BTC (or BTC_TEST) wallet exists in the given Fireblocks vault ID.
     * @param vaultID - The Fireblocks vault ID as a string or number. Must be a valid non-negative integer.
     * @throws {Error} If the vault ID is invalid or if any error occurs during the process.
     */
    ensureBtcWalletExists: (vaultID: string | number) => Promise<void>;
    /**
     * Retrieves the public key associated with a given Fireblocks vault ID.
     *
     * This method converts the provided `vaultID` to a non-negative integer, validates it,
     * and then retrieves the corresponding public key using the Fireblocks SDK.
     *
     * @param vaultID - The Fireblocks vault ID as a string or number. Must be a valid non-negative integer.
     * @returns A promise that resolves to the public key as a string.
     * @throws {Error} If the vault ID is invalid or if any error occurs during the process.
     */
    getBtcSegwitAddressForVaultID: (vaultID: string | number) => Promise<string>;
    /**
     * Signs a transaction with the given vault account ID using the Fireblocks SDK and Fireblocks-signer.
     *
     * This method prepares and sends a transaction from the specified sender to the recipient
     * // descripe parameters
     * @param content - The content of the transaction to sign.
     * @param vaultAccountId - The Fireblocks vault account ID as a string or number.
     * @param txNote - An optional note for the transaction.
     * @returns A promise that resolves to the signature when the transaction is successfully signed.
     * @throws {Error} If any parameter is invalid or if the transaction fails.
     **/
    createBitcoinTransaction: (destination: string, amountSats: bigint, vaultAccountId: string | number, note?: string, externalId?: string) => Promise<{
        fireblocksId: string;
        btcTxid: string;
    }>;
    signTransaction: (content: string, vaultAccountId: string, txNote?: string, externalId?: string) => Promise<any>;
}
