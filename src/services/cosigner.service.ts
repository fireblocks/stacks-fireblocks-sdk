import { hexToBytes, bytesToHex } from "@stacks/common";
import { Signature as Secp256k1Signature, verify as secp256k1Verify } from "@noble/secp256k1";
import { HDKey } from "@scure/bip32";
import { env } from "../config";
import { EARLY_EXIT_SIGNER } from "../utils/constants";

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

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
  constructor(
    private baseUrl: string,
    private requestTimeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
  ) {}

  private fetchWithTimeout = async (url: string, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw new Error(`Cosigner request to ${url} timed out after ${this.requestTimeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };

  public getPublicKey = async (): Promise<CosignerPublicKeyResponse> => {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/public-key`);
    if (!res.ok) {
      throw new Error(`Cosigner public-key request failed (${res.status})`);
    }
    return res.json() as Promise<CosignerPublicKeyResponse>;
  };

  /**
   * Derives the leaf public key (0/0 below the service's advertised account xpub —
   * the key committed into a bond's early-unlock-bytes) straight from `/public-key`.
   * Reaching the service also proves it is online and pins its advertised identity.
   */
  public getLeafPublicKey = async (): Promise<Uint8Array> => {
    const info = await this.getPublicKey();
    const account = HDKey.fromExtendedKey(info.xpub);
    const leaf = account.deriveChild(0).deriveChild(0);
    if (!leaf.publicKey) {
      throw new Error("Cosigner xpub did not yield a leaf public key");
    }
    return leaf.publicKey;
  };

  /**
   * Verifies BEFORE Bitcoin is funded that the cosigner service actually holds the
   * key committed into the proposed lock script. The lock script's early-exit branch
   * is `0x21 <P> 0xac` (buildUnlockScript(P)); if the service's derived leaf key does
   * not reproduce the bond's early-unlock-bytes, early exit would be impossible, so
   * funding must be refused. A 403 / unreachable service throws here as well, so the
   * check fails closed and names the failing service.
   */
  public verifyCommittedKey = async (expectedUnlockBytes: Uint8Array): Promise<void> => {
    const pubkey = await this.getLeafPublicKey();
    const unlockScript = new Uint8Array([0x21, ...pubkey, 0xac]);
    if (bytesToHex(unlockScript) !== bytesToHex(expectedUnlockBytes)) {
      throw new Error(
        `Early-exit cosigner key at ${this.baseUrl} does not match the bond's committed lock script — refusing to fund (early exit would be impossible for this bond).`,
      );
    }
  };

  public sign = async (req: CosignRequest): Promise<CosignResponse> => {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/sign`, {
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
    let parsedSig: Secp256k1Signature;
    try {
      parsedSig = Secp256k1Signature.fromDER(der);
    } catch (error) {
      throw new Error(`Cosigner returned a malformed DER signature: ${(error as Error).message}`);
    }
    if (parsedSig.hasHighS()) {
      throw new Error("Cosigner signature is not canonical (high-S) — refusing signature");
    }
    if (!secp256k1Verify(parsedSig, args.expectedSighash, pubkey, { strict: true })) {
      throw new Error("Cosigner signature failed local verification against the expected sighash and public key");
    }

    const sig = new Uint8Array(der.length + 1);
    sig.set(der, 0);
    sig[der.length] = 0x01; // SIGHASH_ALL
    return sig;
  };
}
