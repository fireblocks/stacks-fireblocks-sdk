import {
  Fireblocks,
  TransactionOperation,
  TransferPeerPathType,
  TransactionRequest,
  TransactionResponse,
  FireblocksResponse,
  TransactionStateEnum,
  SignedMessageSignature,
  VaultsApiGetPublicKeyInfoRequest,
  SignedMessageAlgorithmEnum,
} from "@fireblocks/ts-sdk";
import { derivationPath } from "./constants";
import { formatErrorMessage } from "./errorHandling";
import * as fs from "fs";

export const validateApiCredentials = (
  apiKey: string,
  secretKeyPath: string,
  vaultAccountId?: string | number
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
        "vaultAccountId must be a number or a string representing a number."
      );
    }
  }
};

export const getPublicKeyForDerivationPath = async (
  fireblocksSDK: Fireblocks,
  vaultAccountId: string,
  testnet?: boolean
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
