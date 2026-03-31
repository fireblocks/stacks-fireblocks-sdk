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
exports.createAssetWalletInVault = exports.checkWalletExistsInVault = exports.getPublicKeyForDerivationPath = exports.validateApiCredentials = void 0;
const ts_sdk_1 = require("@fireblocks/ts-sdk");
const constants_1 = require("./constants");
const errorHandling_1 = require("./errorHandling");
const fs = __importStar(require("fs"));
// Validate Fireblocks API credentials and vaultAccountId
const validateApiCredentials = (apiKey, secretKeyOrPem, vaultAccountId) => {
    // Validate API key is a valid UUID (v4)
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(apiKey)) {
        throw new Error("API key is not a valid UUID v4.");
    }
    // Check if it's an inline PEM string or a file path
    const looksLikePem = secretKeyOrPem.includes("-----BEGIN") &&
        secretKeyOrPem.includes("PRIVATE KEY");
    if (!looksLikePem) {
        // It's a file path - validate it exists
        if (!fs.existsSync(secretKeyOrPem) ||
            !fs.statSync(secretKeyOrPem).isFile()) {
            throw new Error(`Secret key file does not exist at path: ${secretKeyOrPem}`);
        }
    }
    // Validate vaultAccountId if provided
    if (vaultAccountId !== undefined) {
        if (typeof vaultAccountId !== "number" &&
            (typeof vaultAccountId !== "string" ||
                isNaN(Number(vaultAccountId)) ||
                vaultAccountId.trim() === "")) {
            throw new Error("vaultAccountId must be a number or a string representing a number.");
        }
    }
};
exports.validateApiCredentials = validateApiCredentials;
// Retrieves the public key for a given vault account ID using the Fireblocks SDK.
const getPublicKeyForDerivationPath = async (fireblocksSDK, vaultAccountId, testnet) => {
    const requestParams = {
        derivationPath: `[${constants_1.derivationPath.purpose}, ${testnet ? constants_1.derivationPath.coinTypeTestnet : constants_1.derivationPath.coinTypeMainnet}, ${vaultAccountId}, ${constants_1.derivationPath.change}, ${constants_1.derivationPath.addressIndex}]`,
        algorithm: ts_sdk_1.SignedMessageAlgorithmEnum.EcdsaSecp256K1,
        compressed: true,
    };
    try {
        const response = await fireblocksSDK.vaults.getPublicKeyInfo(requestParams);
        const publicKey = response.data.publicKey;
        if (!publicKey) {
            throw new Error("Public key not found for the given vault account ID.");
        }
        return publicKey;
    }
    catch (error) {
        throw new Error(`Error fetching public key: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
    }
};
exports.getPublicKeyForDerivationPath = getPublicKeyForDerivationPath;
// Checks if a wallet exists in the given vault account ID for a given asset ID.
const checkWalletExistsInVault = async (vaultID, assetId, fireblocksSDK) => {
    const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
    if (!Number.isInteger(id) || id < 0) {
        throw new Error("vaultID must be a valid non-negative integer.");
    }
    try {
        const response = await fireblocksSDK.vaults.getVaultAccountAsset({
            vaultAccountId: String(id),
            assetId,
        });
        if (response && response.data) {
            return true;
        }
        return false;
    }
    catch (error) {
        if (error.message === "Not found") {
            return false;
        }
        throw error;
    }
};
exports.checkWalletExistsInVault = checkWalletExistsInVault;
// Creates a wallet in the given vault account ID for a given asset ID.
const createAssetWalletInVault = async (vaultID, assetId, fireblocksSDK) => {
    const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
    if (!Number.isInteger(id) || id < 0) {
        throw new Error("vaultID must be a valid non-negative integer.");
    }
    try {
        const response = await fireblocksSDK.vaults.createVaultAccountAsset({
            vaultAccountId: String(id),
            assetId,
        });
        if (!response || !response.data || response.statusCode !== 200) {
            throw new Error(`Create asset wallet in vault failed: No response data received.`);
        }
    }
    catch (error) {
        throw new Error(`Failed to create asset wallet in vault: code: $ ${error.data.code}, Message: ${error.data.message || error}`);
    }
};
exports.createAssetWalletInVault = createAssetWalletInVault;
