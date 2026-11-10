/**
 * A Fireblocks request still waiting when the poll budget runs out is reported as
 * pending by every signing call, not as a "Failed to …" string.
 *
 * Only createBond did this. Every other call returned the typed timeout as failure text,
 * so a caller had to parse it to tell an outstanding approval from a failure.
 */

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

const stillWaiting = (status: TransactionStateEnum) =>
  new FireblocksTransferError(
    `Signing request fb-raw-7 timed out after 30m: still ${status}`,
    {
      operation: "RAW",
      status,
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

describe("signing calls report a request still waiting in Fireblocks as pending", () => {
  it("returns the request id, its status and pendingApproval instead of a failure string", async () => {
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest
      .fn()
      .mockRejectedValue(
        stillWaiting(TransactionStateEnum.PendingAuthorization),
      );

    const res = await sdk.revokeSignerGrant(
      `${sdk.address}.manager`,
      "02".repeat(33),
    );

    expect(res.success).toBe(false);
    expect(res.pendingFireblocksId).toBe("fb-raw-7");
    expect(res.pendingFireblocksStatus).toBe(
      TransactionStateEnum.PendingAuthorization,
    );
    expect(res.pendingApproval).toBe(true);
    expect(res.error).not.toMatch(/^Failed to/);
  });

  it("says a retry opens a new signing request unless the same externalId is reused", async () => {
    // Only createBond and renewBond derive a stable id; elsewhere the id is random unless the
    // caller supplies one, so a plain retry cannot resume the outstanding request.
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest
      .fn()
      .mockRejectedValue(
        stillWaiting(TransactionStateEnum.PendingAuthorization),
      );

    const res = await sdk.revokeSignerGrant(
      `${sdk.address}.manager`,
      "02".repeat(33),
    );

    expect(res.error).toMatch(/new signing request/i);
    expect(res.error).toMatch(/externalId/);
    expect(res.error).toMatch(/nothing was broadcast/i);
  });

  it("treats PENDING_SIGNATURE as waiting, possibly on a person", async () => {
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest
      .fn()
      .mockRejectedValue(stillWaiting(TransactionStateEnum.PendingSignature));

    const res = await sdk.revokeSignerGrant(
      `${sdk.address}.manager`,
      "02".repeat(33),
    );

    expect(res.pendingFireblocksStatus).toBe(
      TransactionStateEnum.PendingSignature,
    );
    expect(res.pendingApproval).toBe(true);
  });

  it("reports a machine-paced stall as pending without pendingApproval", async () => {
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest
      .fn()
      .mockRejectedValue(stillWaiting(TransactionStateEnum.Queued));

    const res = await sdk.revokeSignerGrant(
      `${sdk.address}.manager`,
      "02".repeat(33),
    );

    expect(res.pendingFireblocksId).toBe("fb-raw-7");
    expect(res.pendingApproval).toBeUndefined();
  });

  it("still reports a terminal failure as a failure", async () => {
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest
      .fn()
      .mockRejectedValue(stillWaiting(TransactionStateEnum.Rejected));

    const res = await sdk.revokeSignerGrant(
      `${sdk.address}.manager`,
      "02".repeat(33),
    );

    expect(res.success).toBe(false);
    expect(res.pendingFireblocksId).toBeUndefined();
  });

  it("keeps the typed error through the contract-call wrapper", async () => {
    // The wrapper flattened every error into a plain Error, so no caller above it could
    // classify a pending request.
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest
      .fn()
      .mockRejectedValue(
        stillWaiting(TransactionStateEnum.PendingAuthorization),
      );

    const err = await sdk
      .buildSignSendContractCall({
        functionName: "delegate-stx",
        amount: BigInt(1_000_000),
        lockPeriod: 1,
        poolAddress: sdk.address,
      })
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(FireblocksTransferError);
  });
});
