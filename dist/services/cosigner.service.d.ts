/**
 * Client for the external KMS cosigner service used by the bond early-exit
 * (OP_ELSE) spend path. The service exposes two auth-less endpoints:
 * `GET /public-key` (account xpub metadata) and `POST /sign` (co-signature
 * over a BIP-143 sighash it computes itself from the supplied tx context).
 */
export interface CosignRequest {
    tx: string;
    input_index: number;
    sighash_type: "01";
    bip32_derivation: string;
    prevout: {
        script_pub_key: string;
        value: number;
    };
    witness_script: string;
}
export interface CosignResponse {
    signature: string;
    sighash: string;
    public_key: string;
    sighash_type: string;
}
export interface CosignerPublicKeyResponse {
    key_id: number;
    xpub: string;
    derivation_path: string;
    fingerprint: string;
    network: string;
}
export declare const COSIGNER_BIP32_DERIVATION = "m/48'/1'/0'/2'/0/0";
export declare const resolveCosignerUrl: (testnet: boolean) => string;
export declare class CosignerService {
    private baseUrl;
    private requestTimeoutMs;
    constructor(baseUrl: string, requestTimeoutMs?: number);
    private fetchWithTimeout;
    getPublicKey: () => Promise<CosignerPublicKeyResponse>;
    sign: (req: CosignRequest) => Promise<CosignResponse>;
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
    cosignEarlyExit: (args: {
        unsignedTxHex: string;
        prevoutScriptPubKeyHex: string;
        prevoutValueSats: number;
        witnessScriptHex: string;
        expectedSighash: Uint8Array;
        expectedUnlockBytes: Uint8Array;
    }) => Promise<Uint8Array>;
}
