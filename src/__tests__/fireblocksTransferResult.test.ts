import {
  Fireblocks,
  TransactionOperation,
  TransactionStateEnum,
} from "@fireblocks/ts-sdk";
import { FireblocksService } from "../services/fireblocks.service";
import {
  FireblocksSigner,
  FireblocksTransferError,
} from "../utils/FireblocksSigner";

/**
 * Terminal-failure classification gates whether a bond's funding external id may be
 * renewed, so it decides whether a second Bitcoin transfer can be authorised. It reads
 * the vendor's `status`, never the prose of the error carrying it.
 */
describe("FireblocksService.isTerminalTransferFailure — typed classification", () => {
  const failure = (status: TransactionStateEnum, message: string) =>
    new FireblocksTransferError(message, {
      operation: "TRANSFER",
      status,
      vendorId: "abc",
    });

  it("classifies every terminal status regardless of the message text", () => {
    const terminal = [
      TransactionStateEnum.Blocked,
      TransactionStateEnum.Cancelled,
      TransactionStateEnum.Failed,
      TransactionStateEnum.Rejected,
    ];
    for (const status of terminal) {
      expect(
        FireblocksService.isTerminalTransferFailure(
          failure(status, "the transfer did not complete"),
        ),
      ).toBe(true);
    }
  });

  it("does not classify a non-terminal status as terminal", () => {
    expect(
      FireblocksService.isTerminalTransferFailure(
        failure(
          TransactionStateEnum.Submitted,
          "Transaction abc status is FAILED",
        ),
      ),
    ).toBe(false);
  });

  it("carries the operation, subStatus and vendor id the transfer reported", () => {
    const err = new FireblocksTransferError("rejected by policy", {
      operation: "TRANSFER",
      status: TransactionStateEnum.Rejected,
      subStatus: "REJECTED_BY_POLICY",
      errorDescription: "policy rule 4 denied the transfer",
      vendorId: "fb-tx-1",
    });
    expect(err.details.operation).toBe("TRANSFER");
    expect(err.details.subStatus).toBe("REJECTED_BY_POLICY");
    expect(err.details.errorDescription).toBe(
      "policy rule 4 denied the transfer",
    );
    expect(err.details.vendorId).toBe("fb-tx-1");
  });
});

describe("FireblocksSigner.getTxStatus — terminal outcomes", () => {
  const signerFor = (tx: Record<string, unknown>) =>
    new FireblocksSigner({
      transactions: { getTransaction: async () => ({ data: tx }) },
    } as unknown as Fireblocks);

  it("labels a failed BTC transfer a transfer, not a signing request", async () => {
    const signer = signerFor({
      id: "fb-tx-9",
      status: TransactionStateEnum.Failed,
      subStatus: "INSUFFICIENT_FUNDS",
      operation: TransactionOperation.Transfer,
    });

    await expect(signer.getTxStatus("fb-tx-9")).rejects.toThrow(/^Transfer /);
  });

  it("still labels a failed raw signing request a signing request", async () => {
    const signer = signerFor({
      id: "fb-tx-10",
      status: TransactionStateEnum.Rejected,
      operation: TransactionOperation.Raw,
    });

    await expect(signer.getTxStatus("fb-tx-10")).rejects.toThrow(/^Signing request /);
  });

  it("throws an error the classifier can type, carrying the vendor subStatus", async () => {
    const signer = signerFor({
      id: "fb-tx-11",
      status: TransactionStateEnum.Blocked,
      subStatus: "BLOCKED_BY_POLICY",
      operation: TransactionOperation.Transfer,
    });

    const err = await signer.getTxStatus("fb-tx-11").catch((e) => e);
    expect(err).toBeInstanceOf(FireblocksTransferError);
    expect(err.details.subStatus).toBe("BLOCKED_BY_POLICY");
    expect(FireblocksService.isTerminalTransferFailure(err)).toBe(true);
  });
});
