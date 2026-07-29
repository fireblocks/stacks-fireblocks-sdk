import { Fireblocks } from "@fireblocks/ts-sdk";
export declare const validateApiCredentials: (apiKey: string, secretKeyOrPem: string, vaultAccountId?: string | number) => void;
export declare const getPublicKeyForDerivationPath: (fireblocksSDK: Fireblocks, vaultAccountId: string, testnet?: boolean) => Promise<string>;
export declare const checkWalletExistsInVault: (vaultID: string | number, assetId: string, fireblocksSDK: Fireblocks) => Promise<boolean>;
export declare const createAssetWalletInVault: (vaultID: string | number, assetId: string, fireblocksSDK: Fireblocks) => Promise<void>;
