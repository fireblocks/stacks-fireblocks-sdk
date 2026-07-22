import { hexToBytes, bytesToHex } from "@stacks/common";
import {
  CosignerService,
  resolveCosignerUrl,
  COSIGNER_BIP32_DERIVATION,
} from "../services/cosigner.service";
import { env } from "../config";
import { EARLY_EXIT_SIGNER } from "../utils/constants";

const BASE_URL = "https://cosigner.example/v1";

const SIGHASH_HEX = "ab".repeat(32);
const PUBKEY_HEX = "02" + "11".repeat(32);
const DER_SIG_HEX = "30440220" + "cd".repeat(64); // opaque DER blob for the test
const UNLOCK_BYTES = new Uint8Array([0x21, ...hexToBytes(PUBKEY_HEX), 0xac]);

const signResponse = (overrides: Partial<Record<string, string>> = {}) => ({
  signature: DER_SIG_HEX,
  sighash: SIGHASH_HEX,
  public_key: PUBKEY_HEX,
  sighash_type: "01",
  ...overrides,
});

const mockFetchOnce = (status: number, body: unknown) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
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
  expectedSighash: hexToBytes(SIGHASH_HEX),
  expectedUnlockBytes: UNLOCK_BYTES,
});

describe("CosignerService", () => {
  const originalFetch = global.fetch;
  let service: CosignerService;

  beforeEach(() => {
    global.fetch = jest.fn();
    service = new CosignerService(BASE_URL);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("cosignEarlyExit", () => {
    it("returns the DER signature with SIGHASH_ALL appended on the happy path", async () => {
      mockFetchOnce(200, signResponse());

      const sig = await service.cosignEarlyExit(cosignArgs());

      expect(bytesToHex(sig)).toBe(DER_SIG_HEX + "01");
      expect(sig[sig.length - 1]).toBe(0x01);
    });

    it("sends the correct request body to POST /sign", async () => {
      mockFetchOnce(200, signResponse());

      await service.cosignEarlyExit(cosignArgs());

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/sign`,
        expect.objectContaining({ method: "POST" }),
      );
      const body = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );
      expect(body).toEqual({
        tx: "0200000001abcd",
        input_index: 0,
        sighash_type: "01",
        bip32_derivation: COSIGNER_BIP32_DERIVATION,
        prevout: { script_pub_key: "0020" + "ee".repeat(32), value: 50000 },
        witness_script: "51",
      });
    });

    it("accepts an uppercase sighash from the service", async () => {
      mockFetchOnce(200, signResponse({ sighash: SIGHASH_HEX.toUpperCase() }));

      await expect(
        service.cosignEarlyExit(cosignArgs()),
      ).resolves.toBeInstanceOf(Uint8Array);
    });

    it("throws on sighash mismatch and never returns a signature", async () => {
      mockFetchOnce(200, signResponse({ sighash: "ff".repeat(32) }));

      await expect(service.cosignEarlyExit(cosignArgs())).rejects.toThrow(
        /sighash mismatch/i,
      );
    });

    it("throws when the returned pubkey does not match the bond early-unlock-bytes", async () => {
      mockFetchOnce(200, signResponse({ public_key: "03" + "22".repeat(32) }));

      await expect(service.cosignEarlyExit(cosignArgs())).rejects.toThrow(
        /does not match bond early-unlock-bytes/i,
      );
    });

    it("throws with the status on a non-2xx response", async () => {
      mockFetchOnce(502, { message: "bad gateway" });

      await expect(service.cosignEarlyExit(cosignArgs())).rejects.toThrow(
        /502/,
      );
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
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/public-key`);
    });

    it("throws with the status on a non-2xx response", async () => {
      mockFetchOnce(404, {});

      await expect(service.getPublicKey()).rejects.toThrow(/404/);
    });
  });
});

describe("resolveCosignerUrl", () => {
  // When EARLY_EXIT_SIGNER_URL is set in the local .env these defaults don't
  // apply, so only assert the fallback behavior when it is unset.
  const envOverrideSet = env.EARLY_EXIT_SIGNER_URL !== "";
  const itNoOverride = envOverrideSet ? it.skip : it;

  itNoOverride("falls back to the documented testnet URL", () => {
    expect(resolveCosignerUrl(true)).toBe(EARLY_EXIT_SIGNER.testnet);
  });

  itNoOverride("throws on mainnet until a URL is provisioned", () => {
    expect(() => resolveCosignerUrl(false)).toThrow(/EARLY_EXIT_SIGNER_URL/);
  });
});
