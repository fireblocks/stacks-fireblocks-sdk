/**
 * Service class for interacting with the Fireblocks SDK.
 *
 * Provides methods to initialize the Fireblocks SDK , retrieve public keys and raw sign transactions
 * by vault ID, and sign transactions using Fireblocks.
 *
 * Handles configuration via environment variables or explicit configuration objects.
 */
import { BasePath, Fireblocks } from "@fireblocks/ts-sdk";
import { config } from "../config";
import fs, { readFileSync } from "fs";
import {
  checkWalletExistsInVault,
  createAssetWalletInVault,
  getPublicKeyForDerivationPath,
} from "../utils/fireblocks.utils";
import { FireblocksConfig } from "./types";
import { formatErrorMessage } from "../utils/errorHandling";
import { FireblocksSigner } from "../utils/Fireblocks-signer";

const secretKeyPath = process.env.FIREBLOCKS_SECRET_KEY_PATH || "";
const basePath = process.env.FIREBLOCKS_BASE_PATH || BasePath.US;

export class FireblocksService {
  private readonly fireblocksSDK: Fireblocks;
  private readonly fireblocksSigner: FireblocksSigner;
  private testnet: boolean = false;

  constructor(fireblocksConfig?: FireblocksConfig) {
    this.testnet = fireblocksConfig?.testnet || false;
    var privateKey: string;
    if (fireblocksConfig && fireblocksConfig.apiSecret) {
      privateKey =
        fireblocksConfig.apiSecret.endsWith(".pem") ||
        fireblocksConfig.apiSecret.endsWith(".key")
          ? readFileSync(fireblocksConfig.apiSecret, "utf8")
          : fireblocksConfig.apiSecret;
    } else {
      privateKey = fs.readFileSync(secretKeyPath, "utf8");
    }
    this.fireblocksSDK = new Fireblocks({
      apiKey: fireblocksConfig
        ? fireblocksConfig.apiKey
        : config.fireblocks.API_KEY,
      secretKey: privateKey,
      basePath:
        fireblocksConfig && fireblocksConfig.basePath
          ? fireblocksConfig.basePath
          : basePath,
    });

    this.fireblocksSigner = new FireblocksSigner(this.fireblocksSDK);
  }

  /**
   * @returns The initialized Fireblocks SDK instance of this Service class.
   */
  public getFireblocksSDK = (): Fireblocks => {
    return this.fireblocksSDK;
  };

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
  public getPublicKeyByVaultID = async (
    vaultID: string | number,
  ): Promise<string> => {
    const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
    if (!Number.isInteger(id) || id < 0) {
      throw new Error("vaultID must be a valid non-negative integer.");
    }

    try {
      const publicKey = await getPublicKeyForDerivationPath(
        this.fireblocksSDK,
        vaultID.toString(),
        this.testnet,
      );

      return publicKey;
    } catch (error: any) {
      throw new Error(
        `Failed to get public key by vault ID: ${formatErrorMessage(error)}`,
      );
    }
  };

  /**
   * Ensures a BTC (or BTC_TEST) wallet exists in the given Fireblocks vault ID.
   * @param vaultID - The Fireblocks vault ID as a string or number. Must be a valid non-negative integer.
   * @throws {Error} If the vault ID is invalid or if any error occurs during the process.
   */
  public ensureBtcWalletExists = async (
    vaultID: string | number,
  ): Promise<void> => {
    const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
    if (!Number.isInteger(id) || id < 0) {
      throw new Error("vaultID must be a valid non-negative integer.");
    }

    try {
      const assetId = this.testnet ? "BTC_TEST" : "BTC";
      const walletExists = await checkWalletExistsInVault(
        id,
        assetId,
        this.fireblocksSDK,
      );
      if (!walletExists) {
        await createAssetWalletInVault(id, assetId, this.fireblocksSDK);
      }
    } catch (error: any) {
      throw new Error(
        `Failed to ensure BTC wallet exists for vault ID ${vaultID}: ${formatErrorMessage(error)}`,
      );
    }
  };

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
  public getBtcSegwitAddressForVaultID = async (
    vaultID: string | number,
  ): Promise<string> => {
    const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
    if (!Number.isInteger(id) || id < 0) {
      throw new Error("vaultID must be a valid non-negative integer.");
    }

    try {
      const assetId = this.testnet ? "BTC_TEST" : "BTC";

      await this.ensureBtcWalletExists(id);

      const assetAdresses =
        await this.fireblocksSDK.vaults.getVaultAccountAssetAddressesPaginated({
          vaultAccountId: String(id),
          assetId,
        });

      if (
        !assetAdresses ||
        !assetAdresses.data ||
        !assetAdresses.data.addresses
      ) {
        throw new Error("No addresses found for the given vault account ID.");
      }

      for (const addrObj of assetAdresses.data.addresses) {
        if (
          addrObj.type === "Permanent" &&
          addrObj.addressFormat === "SEGWIT"
        ) {
          return addrObj.address;
        }
      }

      throw new Error(
        "No Segwit address found for the given vault account ID.",
      );
    } catch (error: any) {
      throw new Error(
        `Failed to get public key by vault ID: ${formatErrorMessage(error)}`,
      );
    }
  };

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

  public signTransaction = async (
    content: string,
    vaultAccountId: string,
    txNote?: string,
  ): Promise<any> => {
    try {
      const signature = await this.fireblocksSigner.rawSign(
        content,
        vaultAccountId,
        txNote || "",
        this.testnet,
      );
      return signature;
    } catch (error) {
      console.error("Error in signTransaction:", formatErrorMessage(error));
      throw new Error(
        `Failed to sign transaction: ${formatErrorMessage(error)}`,
      );
    }
  };
}
