/**
 * A named resume entry point for the two BTC-committed timeout paths (FBS-29, last ask).
 *
 * `createBond` and `renewBond` return `unsettled: true` when the L2 `register-for-bond`
 * settlement poll times out with the Bitcoin already locked. The resume MACHINERY
 * already worked — re-calling `createBond` with identical arguments detects the
 * persisted record, verifies the funding txid still exists, skips funding, and the SPV
 * preflight's duplicate-outpoint gate catches the case where the first register actually
 * landed. What was missing is that a caller holding `unsettled: true` has no indication
 * that calling a method named `createBond` again is safe rather than a second BTC send,
 * and must re-supply an amount and signer manager it may not have kept.
 *
 * `resumeBondRegistration` reads both from the durable record and delegates, so the
 * resume path stays single-sourced rather than duplicated.
 */

import { StacksSDK } from "../StacksSDK";
import { unsettledTransactionError } from "../utils/errorHandling";

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const MANAGER = `${BOOT_ADDR}.signer-manager`;
const BTC_TXID = "ab".repeat(32);
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const fullRecord = (over: Record<string, unknown> = {}) => ({
  bondIndex: 4,
  unlockBytes: new Uint8Array([1, 2, 3]),
  lockAddress: "tb1qlock",
  unlockHeight: 900,
  amountSats: BigInt(120_000),
  isL1Lock: true,
  signerManager: MANAGER,
  btcTxid: BTC_TXID,
  vout: 0,
  ...over,
});

const makeSdk = (loadRecord: jest.Mock): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  sdk.lockRecordStore = { loadRecord, saveRecord: jest.fn() };
  sdk.createBond = jest
    .fn()
    .mockResolvedValue({ success: true, btcTxid: BTC_TXID });
  return sdk;
};

describe("resumeBondRegistration", () => {
  it("resumes from the record's own funded amount and signer manager", async () => {
    const sdk = makeSdk(jest.fn().mockResolvedValue(fullRecord()));

    const res = await sdk.resumeBondRegistration(4);

    expect(res.success).toBe(true);
    // The funded amount is immutable and the caller does not get to restate it: a resume
    // at a different amount reuses the old UTXO against new preflight values.
    expect(sdk.createBond).toHaveBeenCalledWith(
      4,
      BigInt(120_000),
      MANAGER,
      undefined,
    );
  });

  it("refuses when no record exists for the bond", async () => {
    const sdk = makeSdk(jest.fn().mockResolvedValue(null));

    const res = await sdk.resumeBondRegistration(4);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no lock record/i);
    expect(sdk.createBond).not.toHaveBeenCalled();
  });

  it("refuses on an unreadable store rather than treating it as no record", async () => {
    const sdk = makeSdk(jest.fn().mockRejectedValue(new Error("store down")));

    const res = await sdk.resumeBondRegistration(4);

    expect(res.success).toBe(false);
    // Same fail-closed rule the other record readers follow: a throwing store is UNKNOWN,
    // and "no record" would send the caller to createBond, which re-funds Bitcoin.
    expect(res.error).toMatch(/unknown/i);
    expect(sdk.createBond).not.toHaveBeenCalled();
  });

  it("refuses when the record shows no committed Bitcoin", async () => {
    const sdk = makeSdk(
      jest.fn().mockResolvedValue(fullRecord({ btcTxid: undefined })),
    );

    const res = await sdk.resumeBondRegistration(4);

    expect(res.success).toBe(false);
    // Nothing was committed, so there is nothing to resume — and silently delegating
    // would start a funding transfer from a method named "resume".
    expect(res.error).toMatch(/createBond/);
    expect(sdk.createBond).not.toHaveBeenCalled();
  });

  it("refuses for an sBTC-backed bond, which has no BTC-committed timeout", async () => {
    const sdk = makeSdk(
      jest.fn().mockResolvedValue(fullRecord({ isL1Lock: false })),
    );

    const res = await sdk.resumeBondRegistration(4);

    expect(res.success).toBe(false);
    expect(sdk.createBond).not.toHaveBeenCalled();
  });

  it("refuses when the record never captured a signer manager", async () => {
    const sdk = makeSdk(
      jest.fn().mockResolvedValue(fullRecord({ signerManager: undefined })),
    );

    const res = await sdk.resumeBondRegistration(4);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/signer manager/i);
    expect(sdk.createBond).not.toHaveBeenCalled();
  });

  it("forwards the caller's own resume options", async () => {
    const sdk = makeSdk(jest.fn().mockResolvedValue(fullRecord()));

    await sdk.resumeBondRegistration(4, { confirmations: 1, note: "retry" });

    expect(sdk.createBond).toHaveBeenCalledWith(
      4,
      BigInt(120_000),
      MANAGER,
      expect.objectContaining({ confirmations: 1, note: "retry" }),
    );
  });
});

describe("unsettledTransactionError — resume hint", () => {
  it("names the resume entry point when one applies", () => {
    const msg = unsettledTransactionError(
      "register-for-bond",
      BTC_TXID,
      undefined,
      "resumeBondRegistration(4)",
    );

    // The advice "do not send a replacement" is only actionable if the caller is told
    // what the non-replacement action is.
    expect(msg).toMatch(/resumeBondRegistration\(4\)/);
  });

  it("omits the hint where no resume path applies", () => {
    const msg = unsettledTransactionError("calculate-rewards", BTC_TXID);

    expect(msg).not.toMatch(/resume/i);
  });
});
