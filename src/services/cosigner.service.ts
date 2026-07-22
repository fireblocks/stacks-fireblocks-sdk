import { hexToBytes, bytesToHex } from "@stacks/common";
import { env } from "../config";
import { EARLY_EXIT_SIGNER } from "../utils/constants";

/**
 * Client for the external KMS cosigner service used by the bond early-exit
 * (OP_ELSE) spend path. The service exposes two auth-less endpoints:
 * `GET /public-key` (account xpub metadata) and `POST /sign` (co-signature
 * over a BIP-143 sighash it computes itself from the supplied tx context).
 */

export interface CosignRequest {
  tx: string; // unsigned reclaim tx, hex
  input_index: number;
  sighash_type: "01";
  bip32_derivation: string;
  prevout: { script_pub_key: string; value: number };
  witness_script: string;
}

export interface CosignResponse {
  signature: string; // DER, low-S, no sighash byte
  sighash: string; // 32-byte digest the service signed, hex
  public_key: string; // 33-byte compressed pubkey, hex
  sighash_type: string;
}

export interface CosignerPublicKeyResponse {
  key_id: number;
  xpub: string;
  derivation_path: string;
  fingerprint: string;
  network: string;
}

// Leaf 0/0 below the service's account xpub — the key whose
// `0x21 <P> 0xac` script is embedded as the bond's early-unlock-bytes.
export const COSIGNER_BIP32_DERIVATION = "m/48'/1'/0'/2'/0/0";

export const resolveCosignerUrl = (testnet: boolean): string => {
  const url =
    env.EARLY_EXIT_SIGNER_URL ||
    EARLY_EXIT_SIGNER[testnet ? "testnet" : "mainnet"];
  if (!url) {
    throw new Error(
      "Early-exit cosigner URL not configured (set EARLY_EXIT_SIGNER_URL)",
    );
  }
  return url;
};

export class CosignerService {
  constructor(private baseUrl: string) {}

  public getPublicKey = async (): Promise<CosignerPublicKeyResponse> => {
    const res = await fetch(`${this.baseUrl}/public-key`);
    if (!res.ok) {
      throw new Error(`Cosigner public-key request failed (${res.status})`);
    }
    return res.json() as Promise<CosignerPublicKeyResponse>;
  };

  public sign = async (req: CosignRequest): Promise<CosignResponse> => {
    const res = await fetch(`${this.baseUrl}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      throw new Error(`Cosigner sign request failed (${res.status})`);
    }
    return res.json() as Promise<CosignResponse>;
  };

  /**
   * Requests the cosigner leg of an early-exit reclaim and verifies it before
   * returning. The service computes its own sighash from the tx context we
   * send, so the returned `sighash` MUST match our locally computed one —
   * this comparison is the only thing preventing a substituted signature
   * over a different transaction. The returned pubkey is also bound to the
   * bond's early-unlock-bytes (`0x21 <P> 0xac`, i.e. buildUnlockScript(P)).
   *
   * Returns the DER signature with the SIGHASH_ALL byte appended, ready for
   * witness assembly.
   */
  public cosignEarlyExit = async (args: {
    unsignedTxHex: string;
    prevoutScriptPubKeyHex: string;
    prevoutValueSats: number;
    witnessScriptHex: string;
    expectedSighash: Uint8Array;
    expectedUnlockBytes: Uint8Array;
  }): Promise<Uint8Array> => {
    const res = await this.sign({
      tx: args.unsignedTxHex,
      input_index: 0,
      sighash_type: "01",
      bip32_derivation: COSIGNER_BIP32_DERIVATION,
      prevout: {
        script_pub_key: args.prevoutScriptPubKeyHex,
        value: args.prevoutValueSats,
      },
      witness_script: args.witnessScriptHex,
    });

    if (res.sighash.toLowerCase() !== bytesToHex(args.expectedSighash)) {
      throw new Error("Cosigner sighash mismatch — refusing signature");
    }

    const pubkey = hexToBytes(res.public_key);
    const unlockScript = new Uint8Array([0x21, ...pubkey, 0xac]);
    if (bytesToHex(unlockScript) !== bytesToHex(args.expectedUnlockBytes)) {
      throw new Error(
        "Cosigner public key does not match bond early-unlock-bytes",
      );
    }

    const der = hexToBytes(res.signature);
    const sig = new Uint8Array(der.length + 1);
    sig.set(der, 0);
    sig[der.length] = 0x01; // SIGHASH_ALL
    return sig;
  };
}
