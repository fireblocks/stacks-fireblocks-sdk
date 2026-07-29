"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CosignerService = exports.resolveCosignerUrl = exports.COSIGNER_BIP32_DERIVATION = void 0;
const common_1 = require("@stacks/common");
const secp256k1_1 = require("@noble/secp256k1");
const config_1 = require("../config");
const constants_1 = require("../utils/constants");
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
// Leaf 0/0 below the service's account xpub — the key whose
// `0x21 <P> 0xac` script is embedded as the bond's early-unlock-bytes.
exports.COSIGNER_BIP32_DERIVATION = "m/48'/1'/0'/2'/0/0";
const resolveCosignerUrl = (testnet) => {
    const url = config_1.env.EARLY_EXIT_SIGNER_URL ||
        constants_1.EARLY_EXIT_SIGNER[testnet ? "testnet" : "mainnet"];
    if (!url) {
        throw new Error("Early-exit cosigner URL not configured (set EARLY_EXIT_SIGNER_URL)");
    }
    return url;
};
exports.resolveCosignerUrl = resolveCosignerUrl;
class CosignerService {
    constructor(baseUrl, requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
        this.baseUrl = baseUrl;
        this.requestTimeoutMs = requestTimeoutMs;
        this.fetchWithTimeout = async (url, init) => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);
            try {
                return await fetch(url, Object.assign(Object.assign({}, init), { signal: controller.signal }));
            }
            catch (error) {
                if (error.name === "AbortError") {
                    throw new Error(`Cosigner request to ${url} timed out after ${this.requestTimeoutMs}ms`);
                }
                throw error;
            }
            finally {
                clearTimeout(timer);
            }
        };
        this.getPublicKey = async () => {
            const res = await this.fetchWithTimeout(`${this.baseUrl}/public-key`);
            if (!res.ok) {
                throw new Error(`Cosigner public-key request failed (${res.status})`);
            }
            return res.json();
        };
        this.sign = async (req) => {
            const res = await this.fetchWithTimeout(`${this.baseUrl}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req),
            });
            if (!res.ok) {
                throw new Error(`Cosigner sign request failed (${res.status})`);
            }
            return res.json();
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
        this.cosignEarlyExit = async (args) => {
            const res = await this.sign({
                tx: args.unsignedTxHex,
                input_index: 0,
                sighash_type: "01",
                bip32_derivation: exports.COSIGNER_BIP32_DERIVATION,
                prevout: {
                    script_pub_key: args.prevoutScriptPubKeyHex,
                    value: args.prevoutValueSats,
                },
                witness_script: args.witnessScriptHex,
            });
            if (res.sighash.toLowerCase() !== (0, common_1.bytesToHex)(args.expectedSighash)) {
                throw new Error("Cosigner sighash mismatch — refusing signature");
            }
            const pubkey = (0, common_1.hexToBytes)(res.public_key);
            const unlockScript = new Uint8Array([0x21, ...pubkey, 0xac]);
            if ((0, common_1.bytesToHex)(unlockScript) !== (0, common_1.bytesToHex)(args.expectedUnlockBytes)) {
                throw new Error("Cosigner public key does not match bond early-unlock-bytes");
            }
            const der = (0, common_1.hexToBytes)(res.signature);
            let parsedSig;
            try {
                parsedSig = secp256k1_1.Signature.fromDER(der);
            }
            catch (error) {
                throw new Error(`Cosigner returned a malformed DER signature: ${error.message}`);
            }
            if (parsedSig.hasHighS()) {
                throw new Error("Cosigner signature is not canonical (high-S) — refusing signature");
            }
            if (!(0, secp256k1_1.verify)(parsedSig, args.expectedSighash, pubkey, { strict: true })) {
                throw new Error("Cosigner signature failed local verification against the expected sighash and public key");
            }
            const sig = new Uint8Array(der.length + 1);
            sig.set(der, 0);
            sig[der.length] = 0x01; // SIGHASH_ALL
            return sig;
        };
    }
}
exports.CosignerService = CosignerService;
