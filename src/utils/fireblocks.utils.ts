import {
  Fireblocks,
  VaultsApiGetPublicKeyInfoRequest,
  SignedMessageAlgorithmEnum,
} from "@fireblocks/ts-sdk";
import { derivationPath } from "./constants";
import { formatErrorMessage } from "./errorHandling";
import * as fs from "fs";

// Validate Fireblocks API credentials and vaultAccountId
export const validateApiCredentials = (
  apiKey: string,
  secretKeyPath: string,
  vaultAccountId?: string | number,
): void => {
  // Validate API key is a valid UUID (v4)
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV4Regex.test(apiKey)) {
    throw new Error("API key is not a valid UUID v4.");
  }

  // Validate secret key path exists and is a file
  if (!fs.existsSync(secretKeyPath) || !fs.statSync(secretKeyPath).isFile()) {
    throw new Error(`Secret key file does not exist at path: ${secretKeyPath}`);
  }

  // Validate vaultAccountId if provided
  if (vaultAccountId !== undefined) {
    if (
      typeof vaultAccountId !== "number" &&
      (typeof vaultAccountId !== "string" ||
        isNaN(Number(vaultAccountId)) ||
        vaultAccountId.trim() === "")
    ) {
      throw new Error(
        "vaultAccountId must be a number or a string representing a number.",
      );
    }
  }
};

// Retrieves the public key for a given vault account ID using the Fireblocks SDK.
export const getPublicKeyForDerivationPath = async (
  fireblocksSDK: Fireblocks,
  vaultAccountId: string,
  testnet?: boolean,
): Promise<string> => {
  const requestParams: VaultsApiGetPublicKeyInfoRequest = {
    derivationPath: `[${derivationPath.purpose}, ${
      testnet ? derivationPath.coinTypeTestnet : derivationPath.coinTypeMainnet
    }, ${vaultAccountId}, ${derivationPath.change}, ${
      derivationPath.addressIndex
    }]`,
    algorithm: SignedMessageAlgorithmEnum.EcdsaSecp256K1,
    compressed: true,
  };
  try {
    const response = await fireblocksSDK.vaults.getPublicKeyInfo(requestParams);
    const publicKey = response.data.publicKey;
    if (!publicKey) {
      throw new Error("Public key not found for the given vault account ID.");
    }
    return publicKey;
  } catch (error: any) {
    throw new Error(`Error fetching public key: ${formatErrorMessage(error)}`);
  }
};

// // Retrieves the asset addresses for a given vault account ID using the Fireblocks SDK.
// export const getAssetAddressesByVaultID = async (
//   vaultID: string | number,
//   assetId: string,
//   fireblocksSDK: Fireblocks,
// ): Promise<void> => {
//   const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
//   if (!Number.isInteger(id) || id < 0) {
//     throw new Error("vaultID must be a valid non-negative integer.");
//   }

//   try {
//     const assetAdresses =
//       await fireblocksSDK.vaults.getVaultAccountAssetAddressesPaginated({
//         vaultAccountId: String(id),
//         assetId: assetId,
//       });

//     // return publicKey;
//   } catch (error: any) {
//     throw new Error(
//       `Failed to get public key by vault ID: ${formatErrorMessage(error)}`,
//     );
//   }
// };

// Checks if a wallet exists in the given vault account ID for a given asset ID.
export const checkWalletExistsInVault = async (
  vaultID: string | number,
  assetId: string,
  fireblocksSDK: Fireblocks,
): Promise<boolean> => {
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
  } catch (error: any) {
    if (error.message === "Not found") {
      return false;
    }
    throw error;
  }
};

// Creates a wallet in the given vault account ID for a given asset ID.
export const createAssetWalletInVault = async (
  vaultID: string | number,
  assetId: string,
  fireblocksSDK: Fireblocks,
): Promise<void> => {
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
      throw new Error(
        `Create asset wallet in vault failed: No response data received.`,
      );
    }
  } catch (error: any) {
    throw new Error(
      `Failed to create asset wallet in vault: code: $ ${error.data.code}, Message: ${error.data.message || error}`,
    );
  }
};
