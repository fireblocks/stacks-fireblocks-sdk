import { randomUUID } from "crypto";
import {
  Fireblocks,
  TransactionOperation,
  TransferPeerPathType,
  TransactionRequest,
  TransactionResponse,
  FireblocksResponse,
  TransactionStateEnum,
  SignedMessageAlgorithmEnum,
} from "@fireblocks/ts-sdk";
import { derivationPath } from "./constants";
import { formatErrorMessage } from "./errorHandling";

const POLL_INITIAL_MS = 3_000;
const POLL_CEILING_MS = 30_000;
const POLL_TIMEOUT_MS = 30 * 60 * 1_000;
const APPROVAL_POLL_TIMEOUT_MS = 24 * 60 * 60 * 1_000;

/**
 * Vendor-reported outcome of a Fireblocks transaction. `status` is the authoritative
 * classification input — terminal-vs-retryable decides whether a bond's funding
 * external id may be renewed, so it is never inferred from message text.
 */
export interface FireblocksTransferFailure {
  /** The Fireblocks `TransactionOperation` — RAW for signing, TRANSFER for a BTC send. */
  operation: string;
  status: TransactionStateEnum;
  subStatus?: string;
  errorDescription?: string;
  /** The Fireblocks transaction id. */
  vendorId: string;
}

export class FireblocksTransferError extends Error {
  constructor(
    message: string,
    readonly details: FireblocksTransferFailure,
  ) {
    super(message);
    this.name = "FireblocksTransferError";
  }
}

/**
 * States from which a transaction can never reach Completed. Typed as strings because
 * the vendor SDK declares `TransactionResponse.status` as `string`.
 */
export const TERMINAL_TRANSACTION_STATES: ReadonlySet<string> = new Set([
  TransactionStateEnum.Blocked,
  TransactionStateEnum.Cancelled,
  TransactionStateEnum.Failed,
  TransactionStateEnum.Rejected,
]);

/**
 * Non-terminal states that wait on a person rather than on the platform. A deadline
 * sized for machine-paced work reports these as failures while the approval is still
 * legitimately outstanding.
 *
 * `PENDING_SIGNATURE` is deliberately excluded — that is MPC signing, not a human.
 * `PENDING_AML_SCREENING` and `PENDING_3RD_PARTY` are also excluded: whether either
 * blocks on a person is a Fireblocks semantic this codebase has not confirmed.
 */
export const APPROVAL_PENDING_STATES: ReadonlySet<string> = new Set([
  TransactionStateEnum.PendingAuthorization,
  TransactionStateEnum.Pending3RdPartyManualApproval,
]);

const describeOperation = (operation?: string): string =>
  operation === TransactionOperation.Raw ? "Signing request" : "Transfer";

const describeBudget = (ms: number): string =>
  ms >= 60 * 60 * 1_000
    ? `${Math.round(ms / (60 * 60 * 1_000))}h`
    : `${Math.round(ms / 60_000)}m`;

export interface PollConfig {
  initialMs?: number;
  ceilingMs?: number;
  /** Budget for machine-paced states. */
  timeoutMs?: number;
  /** Budget for states awaiting a person — see `APPROVAL_PENDING_STATES`. */
  approvalTimeoutMs?: number;
}

export class FireblocksSigner {
  private readonly poll: Required<PollConfig>;

  constructor(
    public fireblocks: Fireblocks,
    poll: PollConfig = {},
  ) {
    this.poll = {
      initialMs: poll.initialMs ?? POLL_INITIAL_MS,
      ceilingMs: poll.ceilingMs ?? POLL_CEILING_MS,
      timeoutMs: poll.timeoutMs ?? POLL_TIMEOUT_MS,
      approvalTimeoutMs: poll.approvalTimeoutMs ?? APPROVAL_POLL_TIMEOUT_MS,
    };
  }

  createTransactionPayload = (
    externalTxId: string,
    vaultAccountId: string,
  ): TransactionRequest => {
    return {
      note: "raw signing for stacks-fireblocks-sdk",
      externalTxId,
      source: {
        type: TransferPeerPathType.VaultAccount,
        // A Raw policy rule scoped to a vault account matches on this id. Without it the
        // vault is present only inside the derivation path, no vault-scoped rule can
        // match, and Fireblocks refuses the request outright.
        id: vaultAccountId,
      },
      operation: TransactionOperation.Raw,
      extraParameters: {
        rawMessageData: {
          messages: [{}],
          algorithm: SignedMessageAlgorithmEnum.EcdsaSecp256K1,
        },
      },
    };
  };

  getTxStatus = async (txId: string): Promise<TransactionResponse> => {
    let response: FireblocksResponse<TransactionResponse> =
      await this.fireblocks.transactions.getTransaction({ txId });
    let tx: TransactionResponse = response.data;
    const startedAt = Date.now();
    let delay = this.poll.initialMs;

    while (tx.status !== TransactionStateEnum.Completed) {
      const label = describeOperation(tx.operation);
      const details = (): FireblocksTransferFailure => ({
        operation: tx.operation ?? "",
        status: tx.status as TransactionStateEnum,
        subStatus: tx.subStatus,
        errorDescription: (tx as { errorDescription?: string }).errorDescription,
        vendorId: tx.id ?? txId,
      });

      if (TERMINAL_TRANSACTION_STATES.has(tx.status)) {
        throw new FireblocksTransferError(
          `${label} ${tx.id} reached terminal status ${tx.status}${tx.subStatus ? ` (${tx.subStatus})` : ""}`,
          details(),
        );
      }

      // The budget is re-read each pass: a transaction can move in and out of an
      // approval wait, and the two waits are paced by different things.
      const budget = APPROVAL_PENDING_STATES.has(tx.status)
        ? this.poll.approvalTimeoutMs
        : this.poll.timeoutMs;

      if (Date.now() + delay > startedAt + budget) {
        // Typed, so a caller can tell an outstanding approval from a genuine stall.
        // Not a terminal status, so this never advances a funding generation.
        throw new FireblocksTransferError(
          `${label} ${tx.id} timed out after ${describeBudget(budget)}: still ${tx.status}${tx.subStatus ? ` (${tx.subStatus})` : ""}`,
          details(),
        );
      }

      console.log(`Transaction ${tx.id} is currently at status - ${tx.status}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, this.poll.ceilingMs);

      try {
        response = await this.fireblocks.transactions.getTransaction({ txId });
        tx = response.data;
      } catch (pollError) {
        console.warn(`Transient error polling transaction ${txId}, will retry:`, pollError);
      }
    }

    return tx;
  };

  rawSign = async (
    content: string,
    vaultAccountId: string,
    txNote?: string,
    testnet: boolean = false,
    externalId?: string,
  ): Promise<any> => {
    try {
      if (typeof content !== "string") {
        throw new Error("Content for raw signing must be a hex string");
      }

      const hexContent = content.startsWith("0x") ? content.slice(2) : content;

      const transactionPayload = this.createTransactionPayload(
        externalId ?? randomUUID(),
        String(vaultAccountId),
      );

      if (txNote) {
        transactionPayload.note = txNote;
      }

      (transactionPayload.extraParameters as any).rawMessageData = {
        messages: [
          {
            content: hexContent,
            derivationPath: [
              derivationPath.purpose,
              testnet
                ? derivationPath.coinTypeTestnet
                : derivationPath.coinTypeMainnet,
              Number(vaultAccountId),
              derivationPath.change,
              derivationPath.addressIndex,
            ],
          },
        ],
        algorithm: SignedMessageAlgorithmEnum.EcdsaSecp256K1,
      };

      const transactionResponse =
        await this.fireblocks.transactions.createTransaction({
          transactionRequest: transactionPayload,
        });

      const txId = transactionResponse.data.id;
      if (!txId) {
        throw new Error("Transaction ID is undefined.");
      }
      const txInfo = (await this.getTxStatus(txId)) as any;

      const signature = txInfo.signedMessages[0].signature;

      return signature;
    } catch (error) {
      console.log(`Caught error in rawSign: ${error}`);
      throw new Error(`Error in rawSign: ${formatErrorMessage(error)}`);
    }
  };
}
