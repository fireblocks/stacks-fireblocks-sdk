/**
 * Service class for interacting with the Fireblocks SDK.
 *
 * Provides methods to initialize the Fireblocks SDK , retrieve public keys and raw sign transactions
 * by vault ID, and sign transactions using Fireblocks.
 *
 * Handles configuration via environment variables or explicit configuration objects.
 */
import {
  BasePath,
  Fireblocks,
  TransactionOperation,
  TransferPeerPathType,
} from "@fireblocks/ts-sdk";
import { config } from "../config";
import fs, { readFileSync } from "fs";
import {
  checkWalletExistsInVault,
  createAssetWalletInVault,
  getPublicKeyForDerivationPath,
} from "../utils/fireblocks.utils";
import { FireblocksConfig } from "./types";
import { formatErrorMessage } from "../utils/errorHandling";
import { FireblocksSigner } from "../utils/FireblocksSigner";

const secretKeyPath = process.env.FIREBLOCKS_SECRET_KEY_PATH || "";
const basePath = process.env.FIREBLOCKS_BASE_PATH || BasePath.US;

export class FireblocksService {
  private readonly fireblocksSDK: Fireblocks;
  private readonly fireblocksSigner: FireblocksSigner;
  private testnet: boolean = false;

  constructor(fireblocksConfig?: FireblocksConfig) {
    this.testnet = fireblocksConfig?.testnet || false;
    let privateKey: string;
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
    } catch (error) {
      // Rethrown unchanged: callers already report the vault and failing operation.
      throw error instanceof Error ? error : new Error(formatErrorMessage(error));
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

  public createBitcoinTransaction = async (
    destination: string,
    amountSats: bigint,
    vaultAccountId: string | number,
    note?: string,
    externalId?: string,
    // Invoked the instant Fireblocks accepts the request and assigns an id — BEFORE the
    // confirmation poll, which can throw (30-min timeout, or a terminal Blocked/Cancelled/
    // Failed/Rejected status). The caller persists the id here so a later retry can await
    // or resolve the SAME transfer instead of re-submitting under the (now-consumed)
    // external id.
    onSubmitted?: (fireblocksId: string) => Promise<void> | void,
  ): Promise<{ fireblocksId: string; btcTxid: string }> => {
    const assetId = this.testnet ? 'BTC_TEST' : 'BTC';
    const whole = amountSats / BigInt(100000000);
    const frac = (amountSats % BigInt(100000000)).toString().padStart(8, '0');
    const amountBtc = `${whole.toString()}.${frac}`;

    const response = await this.fireblocksSDK.transactions.createTransaction({
      transactionRequest: {
        operation: TransactionOperation.Transfer,
        assetId,
        source: { type: TransferPeerPathType.VaultAccount, id: String(vaultAccountId) },
        destination: { type: TransferPeerPathType.OneTimeAddress, oneTimeAddress: { address: destination } },
        amount: amountBtc,
        note: note || 'BTC bond lock',
        externalTxId: externalId,
      },
    });

    const fireblocksId = response.data.id;
    if (!fireblocksId) throw new Error('Fireblocks BTC transaction creation returned no ID');
    await onSubmitted?.(fireblocksId);

    const btcTxid = await this.awaitBitcoinTransaction(fireblocksId);
    return { fireblocksId, btcTxid };
  };

  /**
   * Polls an already-submitted Fireblocks BTC transfer (by its Fireblocks id) to
   * completion and returns its Bitcoin txid. Used to resume a funding attempt whose
   * confirmation poll timed out or crashed after the transfer was accepted.
   */
  public awaitBitcoinTransaction = async (fireblocksId: string): Promise<string> => {
    const completedTx = await this.fireblocksSigner.getTxStatus(fireblocksId);
    const btcTxid = completedTx.txHash;
    if (!btcTxid) throw new Error(`BTC transaction ${fireblocksId} completed but has no txHash`);
    return btcTxid;
  };

  /**
   * Looks up a prior BTC transfer by its external id (the deterministic funding id) and
   * awaits its Bitcoin txid. Used when a retry's re-submit is rejected as a duplicate
   * external id (Fireblocks error 1438): the transfer already exists, so resolve it
   * rather than failing. Returns null when Fireblocks has no transaction for the id.
   */
  public resolveBitcoinTransactionByExternalId = async (
    externalId: string,
  ): Promise<{ fireblocksId: string; btcTxid: string } | null> => {
    let existing;
    try {
      existing = await this.fireblocksSDK.transactions.getTransactionByExternalId({ externalTxId: externalId });
    } catch {
      return null; // 404 / not found — no prior transfer under this id
    }
    const fireblocksId = existing?.data?.id;
    if (!fireblocksId) return null;
    const btcTxid = await this.awaitBitcoinTransaction(fireblocksId);
    return { fireblocksId, btcTxid };
  };

  /** True when an error is Fireblocks' duplicate-external-id rejection (code 1438). */
  public static isDuplicateExternalIdError = (error: unknown): boolean => {
    const anyErr = error as { response?: { data?: { code?: number } }; code?: number; message?: string };
    return (
      anyErr?.response?.data?.code === 1438 ||
      anyErr?.code === 1438 ||
      (typeof anyErr?.message === 'string' && anyErr.message.includes('1438'))
    );
  };

  public signTransaction = async (
    content: string,
    vaultAccountId: string,
    txNote?: string,
    externalId?: string,
  ): Promise<any> => {
    try {
      const signature = await this.fireblocksSigner.rawSign(
        content,
        vaultAccountId,
        txNote || "",
        this.testnet,
        externalId,
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
