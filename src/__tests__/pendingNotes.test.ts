/**
 * The retry note on a pending result says what a retry really does for that call.
 *
 * The default note promises "nothing was broadcast" and offers "retry with the same
 * externalId". BTC recovery calls accept no externalId, and renewBond's register leg runs
 * after the Bitcoin is re-locked, with a request id that follows the transaction bytes.
 */

import { getPublicKey } from "@noble/secp256k1";
import * as btc from "@scure/btc-signer";
import { TransactionStateEnum } from "@fireblocks/ts-sdk";
import { StacksSDK } from "../StacksSDK";
import { FireblocksTransferError } from "../utils/FireblocksSigner";

const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const pending = () =>
  new FireblocksTransferError(
    "Signing request fb-raw-7 timed out after 30m: still PENDING_AUTHORIZATION",
    {
      operation: "RAW",
      status: TransactionStateEnum.PendingAuthorization,
      vendorId: "fb-raw-7",
    },
  );

const makeSdk = (): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = "ST000000000000000000002AMW42H";
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  return sdk;
};

/** A valid address on the SDK's Bitcoin network, derived rather than written out. */
const addressFor = (sdk: any): string => {
  const sk = Uint8Array.from({ length: 32 }, (_, i) => (i === 31 ? 1 : 0));
  return btc.p2wpkh(getPublicKey(sk, true), sdk.btcNetwork).address!;
};

describe("a BTC recovery call has no externalId to retry with", () => {
  it("unlockMaturedBond's pending note does not offer one", async () => {
    const sdk = makeSdk();
    const destination = addressFor(sdk);
    sdk.deriveLock = jest.fn().mockResolvedValue({
      bondIndex: 4,
      unlockHeight: 100,
      lockScript: new Uint8Array([0x51]),
      lockingAddress: destination,
    });
    sdk.resolveRecoveryDestination = jest
      .fn()
      .mockReturnValue({ address: destination });
    sdk.readBtcTipHeight = jest.fn().mockResolvedValue(200);
    sdk.signBtcSighash = jest.fn().mockRejectedValue(pending());

    const res = await sdk.unlockMaturedBond(destination, {
      feeSats: BigInt(1_000),
      knownUtxo: { txid: "ab".repeat(32), vout: 0, value: 100_000 },
    });

    expect(res.pendingFireblocksId).toBe("fb-raw-7");
    expect(res.error).toMatch(/nothing was broadcast/i);
    expect(res.error).toMatch(/reject this one/i);
    expect(res.error).not.toMatch(/externalId/);
  });
});
