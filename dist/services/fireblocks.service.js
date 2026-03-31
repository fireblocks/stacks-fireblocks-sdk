"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireblocksService = void 0;
/**
 * Service class for interacting with the Fireblocks SDK.
 *
 * Provides methods to initialize the Fireblocks SDK , retrieve public keys and raw sign transactions
 * by vault ID, and sign transactions using Fireblocks.
 *
 * Handles configuration via environment variables or explicit configuration objects.
 */
const ts_sdk_1 = require("@fireblocks/ts-sdk");
const config_1 = require("../config");
const fs_1 = __importStar(require("fs"));
const fireblocks_utils_1 = require("../utils/fireblocks.utils");
const errorHandling_1 = require("../utils/errorHandling");
const FireblocksSigner_1 = require("../utils/FireblocksSigner");
const secretKeyPath = process.env.FIREBLOCKS_SECRET_KEY_PATH || "";
const basePath = process.env.FIREBLOCKS_BASE_PATH || ts_sdk_1.BasePath.US;
class FireblocksService {
    constructor(fireblocksConfig) {
        this.testnet = false;
        /**
         * @returns The initialized Fireblocks SDK instance of this Service class.
         */
        this.getFireblocksSDK = () => {
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
        this.getPublicKeyByVaultID = async (vaultID) => {
            const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
            if (!Number.isInteger(id) || id < 0) {
                throw new Error("vaultID must be a valid non-negative integer.");
            }
            try {
                const publicKey = await (0, fireblocks_utils_1.getPublicKeyForDerivationPath)(this.fireblocksSDK, vaultID.toString(), this.testnet);
                return publicKey;
            }
            catch (error) {
                throw new Error(`Failed to get public key by vault ID: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        /**
         * Ensures a BTC (or BTC_TEST) wallet exists in the given Fireblocks vault ID.
         * @param vaultID - The Fireblocks vault ID as a string or number. Must be a valid non-negative integer.
         * @throws {Error} If the vault ID is invalid or if any error occurs during the process.
         */
        this.ensureBtcWalletExists = async (vaultID) => {
            const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
            if (!Number.isInteger(id) || id < 0) {
                throw new Error("vaultID must be a valid non-negative integer.");
            }
            try {
                const assetId = this.testnet ? "BTC_TEST" : "BTC";
                const walletExists = await (0, fireblocks_utils_1.checkWalletExistsInVault)(id, assetId, this.fireblocksSDK);
                if (!walletExists) {
                    await (0, fireblocks_utils_1.createAssetWalletInVault)(id, assetId, this.fireblocksSDK);
                }
            }
            catch (error) {
                throw new Error(`Failed to ensure BTC wallet exists for vault ID ${vaultID}: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
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
        this.getBtcSegwitAddressForVaultID = async (vaultID) => {
            const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
            if (!Number.isInteger(id) || id < 0) {
                throw new Error("vaultID must be a valid non-negative integer.");
            }
            try {
                const assetId = this.testnet ? "BTC_TEST" : "BTC";
                await this.ensureBtcWalletExists(id);
                const assetAdresses = await this.fireblocksSDK.vaults.getVaultAccountAssetAddressesPaginated({
                    vaultAccountId: String(id),
                    assetId,
                });
                if (!assetAdresses ||
                    !assetAdresses.data ||
                    !assetAdresses.data.addresses) {
                    throw new Error("No addresses found for the given vault account ID.");
                }
                for (const addrObj of assetAdresses.data.addresses) {
                    if (addrObj.type === "Permanent" &&
                        addrObj.addressFormat === "SEGWIT") {
                        return addrObj.address;
                    }
                }
                throw new Error("No Segwit address found for the given vault account ID.");
            }
            catch (error) {
                throw new Error(`Failed to get BTC address for vault ID: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
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
        this.signTransaction = async (content, vaultAccountId, txNote) => {
            try {
                const signature = await this.fireblocksSigner.rawSign(content, vaultAccountId, txNote || "", this.testnet);
                return signature;
            }
            catch (error) {
                console.error("Error in signTransaction:", (0, errorHandling_1.formatErrorMessage)(error));
                throw new Error(`Failed to sign transaction: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
        };
        this.testnet = (fireblocksConfig === null || fireblocksConfig === void 0 ? void 0 : fireblocksConfig.testnet) || false;
        let privateKey;
        if (fireblocksConfig && fireblocksConfig.apiSecret) {
            privateKey =
                fireblocksConfig.apiSecret.endsWith(".pem") ||
                    fireblocksConfig.apiSecret.endsWith(".key")
                    ? (0, fs_1.readFileSync)(fireblocksConfig.apiSecret, "utf8")
                    : fireblocksConfig.apiSecret;
        }
        else {
            privateKey = fs_1.default.readFileSync(secretKeyPath, "utf8");
        }
        this.fireblocksSDK = new ts_sdk_1.Fireblocks({
            apiKey: fireblocksConfig
                ? fireblocksConfig.apiKey
                : config_1.config.fireblocks.API_KEY,
            secretKey: privateKey,
            basePath: fireblocksConfig && fireblocksConfig.basePath
                ? fireblocksConfig.basePath
                : basePath,
        });
        this.fireblocksSigner = new FireblocksSigner_1.FireblocksSigner(this.fireblocksSDK);
    }
}
exports.FireblocksService = FireblocksService;
