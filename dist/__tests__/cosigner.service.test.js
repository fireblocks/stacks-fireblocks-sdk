"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@stacks/common");
const secp256k1_1 = require("@noble/secp256k1");
const cosigner_service_1 = require("../services/cosigner.service");
const config_1 = require("../config");
const constants_1 = require("../utils/constants");
const BASE_URL = "https://cosigner.example/v1";
const SIGHASH_HEX = "ab".repeat(32);
const TEST_PRIVATE_KEY_HEX = "11".repeat(32);
const PUBKEY_HEX = (0, common_1.bytesToHex)((0, secp256k1_1.getPublicKey)(TEST_PRIVATE_KEY_HEX, true));
const UNLOCK_BYTES = new Uint8Array([0x21, ...(0, common_1.hexToBytes)(PUBKEY_HEX), 0xac]);
let DER_SIG_HEX;
const signResponse = (overrides = {}) => (Object.assign({ signature: DER_SIG_HEX, sighash: SIGHASH_HEX, public_key: PUBKEY_HEX, sighash_type: "01" }, overrides));
const mockFetchOnce = (status, body) => {
    global.fetch.mockResolvedValueOnce({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
        text: async () => JSON.stringify(body),
    });
};
const cosignArgs = () => ({
    unsignedTxHex: "0200000001abcd",
    prevoutScriptPubKeyHex: "0020" + "ee".repeat(32),
    prevoutValueSats: 50000,
    witnessScriptHex: "51",
    expectedSighash: (0, common_1.hexToBytes)(SIGHASH_HEX),
    expectedUnlockBytes: UNLOCK_BYTES,
});
describe("CosignerService", () => {
    const originalFetch = global.fetch;
    let service;
    beforeAll(async () => {
        DER_SIG_HEX = (0, common_1.bytesToHex)(await (0, secp256k1_1.sign)((0, common_1.hexToBytes)(SIGHASH_HEX), TEST_PRIVATE_KEY_HEX));
    });
    beforeEach(() => {
        global.fetch = jest.fn();
        service = new cosigner_service_1.CosignerService(BASE_URL);
    });
    afterAll(() => {
        global.fetch = originalFetch;
    });
    describe("cosignEarlyExit", () => {
        it("returns the DER signature with SIGHASH_ALL appended on the happy path", async () => {
            mockFetchOnce(200, signResponse());
            const sig = await service.cosignEarlyExit(cosignArgs());
            expect((0, common_1.bytesToHex)(sig)).toBe(DER_SIG_HEX + "01");
            expect(sig[sig.length - 1]).toBe(0x01);
        });
        it("sends the correct request body to POST /sign", async () => {
            mockFetchOnce(200, signResponse());
            await service.cosignEarlyExit(cosignArgs());
            expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/sign`, expect.objectContaining({ method: "POST" }));
            const body = JSON.parse(global.fetch.mock.calls[0][1].body);
            expect(body).toEqual({
                tx: "0200000001abcd",
                input_index: 0,
                sighash_type: "01",
                bip32_derivation: cosigner_service_1.COSIGNER_BIP32_DERIVATION,
                prevout: { script_pub_key: "0020" + "ee".repeat(32), value: 50000 },
                witness_script: "51",
            });
        });
        it("accepts an uppercase sighash from the service", async () => {
            mockFetchOnce(200, signResponse({ sighash: SIGHASH_HEX.toUpperCase() }));
            await expect(service.cosignEarlyExit(cosignArgs())).resolves.toBeInstanceOf(Uint8Array);
        });
        it("throws on sighash mismatch and never returns a signature", async () => {
            mockFetchOnce(200, signResponse({ sighash: "ff".repeat(32) }));
            await expect(service.cosignEarlyExit(cosignArgs())).rejects.toThrow(/sighash mismatch/i);
        });
        it("throws when the returned pubkey does not match the bond early-unlock-bytes", async () => {
            mockFetchOnce(200, signResponse({ public_key: "03" + "22".repeat(32) }));
            await expect(service.cosignEarlyExit(cosignArgs())).rejects.toThrow(/does not match bond early-unlock-bytes/i);
        });
        it("throws with the status on a non-2xx response", async () => {
            mockFetchOnce(502, { message: "bad gateway" });
            await expect(service.cosignEarlyExit(cosignArgs())).rejects.toThrow(/502/);
        });
    });
    describe("getPublicKey", () => {
        it("returns the service metadata", async () => {
            const meta = {
                key_id: 1,
                xpub: "tpubTEST",
                derivation_path: "48'/1'/0'/2'",
                fingerprint: "deadbeef",
                network: "testnet",
            };
            mockFetchOnce(200, meta);
            await expect(service.getPublicKey()).resolves.toEqual(meta);
            expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/public-key`, expect.objectContaining({ signal: expect.any(AbortSignal) }));
        });
        it("throws with the status on a non-2xx response", async () => {
            mockFetchOnce(404, {});
            await expect(service.getPublicKey()).rejects.toThrow(/404/);
        });
        it("times out an unresponsive request instead of hanging indefinitely", async () => {
            jest.useFakeTimers();
            const timeoutMs = 1000;
            service = new cosigner_service_1.CosignerService(BASE_URL, timeoutMs);
            global.fetch.mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => {
                var _a;
                (_a = init.signal) === null || _a === void 0 ? void 0 : _a.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
            }));
            const result = service.getPublicKey();
            const assertion = expect(result).rejects.toThrow(/timed out/i);
            jest.advanceTimersByTime(timeoutMs);
            await assertion;
            jest.useRealTimers();
        });
    });
});
describe("resolveCosignerUrl", () => {
    // When EARLY_EXIT_SIGNER_URL is set in the local .env these defaults don't
    // apply, so only assert the fallback behavior when it is unset.
    const envOverrideSet = config_1.env.EARLY_EXIT_SIGNER_URL !== "";
    const itNoOverride = envOverrideSet ? it.skip : it;
    itNoOverride("falls back to the documented testnet URL", () => {
        expect((0, cosigner_service_1.resolveCosignerUrl)(true)).toBe(constants_1.EARLY_EXIT_SIGNER.testnet);
    });
    itNoOverride("throws on mainnet until a URL is provisioned", () => {
        expect(() => (0, cosigner_service_1.resolveCosignerUrl)(false)).toThrow(/EARLY_EXIT_SIGNER_URL/);
    });
});
