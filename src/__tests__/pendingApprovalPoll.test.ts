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
 * Human-approval waits are not machine-paced (issue 208).
 *
 * A single flat deadline was applied to every non-terminal status, so a transaction
 * parked in PENDING_AUTHORIZATION — waiting on a person under the customer's 1-of-5
 * approval rule — was reported as a failure once the clock ran out. The wait is not a
 * fault, and the resulting error was an untyped Error, so a caller could not tell
 * "nobody has approved yet" from "this genuinely stalled".
 */
describe("FireblocksSigner.getTxStatus — approval-pending deadlines", () => {
  /** Returns the given statuses in order, repeating the last one forever. */
  const signerFor = (statuses: string[], poll = {}) => {
    let call = 0;
    const fireblocks = {
      transactions: {
        getTransaction: async () => {
          const status = statuses[Math.min(call++, statuses.length - 1)];
          return {
            data: {
              id: "fb-tx-approval",
              status,
              operation: TransactionOperation.Transfer,
            },
          };
        },
      },
    } as unknown as Fireblocks;
    // Tiny delays keep the test deterministic; a zero budget expires on the first check.
    return new FireblocksSigner(fireblocks, {
      initialMs: 1,
      ceilingMs: 1,
      ...poll,
    });
  };

  it("keeps waiting on a human approval past the machine-paced deadline", async () => {
    const signer = signerFor(
      [
        TransactionStateEnum.PendingAuthorization,
        TransactionStateEnum.PendingAuthorization,
        TransactionStateEnum.Completed,
      ],
      { timeoutMs: 0, approvalTimeoutMs: 60_000 },
    );

    const tx = await signer.getTxStatus("fb-tx-approval");

    expect(tx.status).toBe(TransactionStateEnum.Completed);
  });

  it("applies the same extended budget to third-party manual approval", async () => {
    const signer = signerFor(
      [
        TransactionStateEnum.Pending3RdPartyManualApproval,
        TransactionStateEnum.Completed,
      ],
      { timeoutMs: 0, approvalTimeoutMs: 60_000 },
    );

    const tx = await signer.getTxStatus("fb-tx-approval");

    expect(tx.status).toBe(TransactionStateEnum.Completed);
  });

  it("still applies the machine-paced deadline to a machine-paced status", async () => {
    // PENDING_SIGNATURE is MPC signing, not a person — it must not get the long budget.
    const signer = signerFor([TransactionStateEnum.PendingSignature], {
      timeoutMs: 0,
      approvalTimeoutMs: 60_000,
    });

    await expect(signer.getTxStatus("fb-tx-approval")).rejects.toThrow(
      /timed out/i,
    );
  });

  it("bounds the approval wait rather than polling forever", async () => {
    const signer = signerFor([TransactionStateEnum.PendingAuthorization], {
      timeoutMs: 60_000,
      approvalTimeoutMs: 0,
    });

    await expect(signer.getTxStatus("fb-tx-approval")).rejects.toThrow(
      /timed out/i,
    );
  });

  it("throws a typed timeout carrying the status, and does not classify it terminal", async () => {
    const signer = signerFor([TransactionStateEnum.PendingAuthorization], {
      timeoutMs: 60_000,
      approvalTimeoutMs: 0,
    });

    const err = await signer.getTxStatus("fb-tx-approval").catch((e) => e);

    // 215 renders an approver signal from this; an untyped Error carries nothing.
    expect(err).toBeInstanceOf(FireblocksTransferError);
    expect(err.details.status).toBe(TransactionStateEnum.PendingAuthorization);
    expect(err.details.vendorId).toBe("fb-tx-approval");
    // A pending approval is not a terminal failure — the funding generation must not
    // advance on it, or a second BTC transfer becomes possible.
    expect(FireblocksService.isTerminalTransferFailure(err)).toBe(false);
  });
});
