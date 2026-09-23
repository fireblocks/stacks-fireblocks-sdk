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
/**
 * Equal to the machine budget by default — extending is opt-in per call site.
 *
 * This deadline also bounds how stale a preflight can be when the transaction finally
 * broadcasts. FBS-19: three lifecycle calls (`unstakeSbtc`, `updateBondRegistration`,
 * `renewBond`) re-validate nothing before broadcast, and the re-checks that do exist
 * carry no safety margin. A longer wait therefore lets an approval straddle the
 * prepare-phase boundary — ~17 hours of every two-week mainnet cycle — and the contract
 * rejects the transaction after the fee and nonce are spent.
 *
 * Raise this only for a caller that re-validates with a margin immediately before
 * broadcast. The typed timeout error already lets a caller distinguish an outstanding
 * approval from a stall without waiting longer.
 */
const APPROVAL_POLL_TIMEOUT_MS = POLL_TIMEOUT_MS;

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
 * A raw-signing request already exists under the external id, but its signature is not
 * provably over the sighash now being signed. A signature covers exact bytes, so reusing
 * one whose content differs — or cannot be read back — would broadcast a transaction the
 * signature does not authorize.
 */
export class StaleRawSignError extends Error {
  constructor(
    message: string,
    readonly vendorId: string,
  ) {
    super(message);
    this.name = "StaleRawSignError";
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

/**
 * True when an error is Fireblocks' duplicate-external-id rejection (code 1438). The
 * message match requires 1438 as a standalone token AND a duplicate/external cue, so an
 * unrelated error that merely contains "1438" in an amount/id/timestamp is not misread.
 */
export const isDuplicateExternalId = (error: unknown): boolean => {
  const anyErr = error as { response?: { data?: { code?: number } }; code?: number; message?: string };
  if (anyErr?.response?.data?.code === 1438 || anyErr?.code === 1438) return true;
  const msg = typeof anyErr?.message === "string" ? anyErr.message : "";
  return /\b1438\b/.test(msg) && /duplicat|external/i.test(msg);
};

const normalizeHex = (h: unknown): string | undefined =>
  typeof h === "string" ? h.replace(/^0x/, "").toLowerCase() : undefined;

/**
 * The message content an existing RAW request was opened over, read from the request
 * echo when present and from the signed result otherwise. Returns undefined when neither
 * is readable — which is treated as a mismatch, never as a match.
 */
const rawRequestContent = (tx: unknown): string | undefined => {
  const t = tx as {
    extraParameters?: { rawMessageData?: { messages?: Array<{ content?: unknown }> } };
    signedMessages?: Array<{ content?: unknown }>;
  };
  return (
    normalizeHex(t?.extraParameters?.rawMessageData?.messages?.[0]?.content)
    ?? normalizeHex(t?.signedMessages?.[0]?.content)
  );
};

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

  /**
   * Resolves the raw-signing request already holding `externalId` to a transaction id
   * that may be polled for `hexContent`'s signature.
   *
   * A signature authorizes exact bytes. The existing request was opened over the sighash
   * of an earlier attempt, and the two differ whenever the nonce moved between them (a
   * concurrent vault operation consuming it), so the content is compared before the
   * request is adopted. An unreadable content is a mismatch: without it the signature is
   * not provably over the right bytes.
   *
   * A genuine 404 means the id is free and the duplicate rejection came from elsewhere —
   * the original error is rethrown rather than masked.
   */
  private resolveDuplicateRawSign = async (
    externalId: string,
    hexContent: string,
    createError: unknown,
  ): Promise<string> => {
    let existing;
    try {
      existing = await this.fireblocks.transactions.getTransactionByExternalId({
        externalTxId: externalId,
      });
    } catch (e) {
      const status = (e as { response?: { status?: number }; status?: number })?.response?.status
        ?? (e as { status?: number })?.status;
      if (status === 404) throw createError;
      throw e;
    }
    const tx = existing?.data as { id?: string; operation?: string } | undefined;
    const vendorId = tx?.id;
    if (!vendorId) throw createError;

    if (tx.operation !== undefined && tx.operation !== TransactionOperation.Raw) {
      throw new StaleRawSignError(
        `External id ${externalId} belongs to a ${tx.operation} transaction (${vendorId}), not a signing request; refusing to read a signature from it.`,
        vendorId,
      );
    }

    const existingContent = rawRequestContent(tx);
    if (existingContent === undefined) {
      throw new StaleRawSignError(
        `Signing request ${vendorId} already holds external id ${externalId}, but the message it was opened over could not be read back, so its signature cannot be shown to cover the current transaction. Resolve that request in Fireblocks before retrying.`,
        vendorId,
      );
    }
    if (existingContent !== normalizeHex(hexContent)) {
      throw new StaleRawSignError(
        `Signing request ${vendorId} already holds external id ${externalId}, but it was opened over a different message — the transaction changed between attempts (typically a nonce consumed by another operation). Its signature would not authorize this transaction. Resolve that request in Fireblocks before retrying.`,
        vendorId,
      );
    }
    return vendorId;
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

      let txId: string | undefined;
      try {
        const transactionResponse =
          await this.fireblocks.transactions.createTransaction({
            transactionRequest: transactionPayload,
          });
        txId = transactionResponse.data.id;
      } catch (createError) {
        // A deterministic external id makes a retry collide with its own outstanding
        // request. Resolving it re-polls that request rather than opening a second one
        // for the same signature — under a 1-of-N approval rule the duplicate is another
        // item for a human to act on, and only one of them can ever be used.
        if (!isDuplicateExternalId(createError)) throw createError;
        txId = await this.resolveDuplicateRawSign(
          transactionPayload.externalTxId!,
          hexContent,
          createError,
        );
      }
      if (!txId) {
        throw new Error("Transaction ID is undefined.");
      }
      const txInfo = (await this.getTxStatus(txId)) as any;

      return txInfo.signedMessages[0].signature;
    } catch (error) {
      console.log(`Caught error in rawSign: ${error}`);
      // Typed failures carry the classification callers switch on — an outstanding
      // approval, a terminal status, a stale signing request. Wrapping them in a plain
      // Error would reduce all three to message text.
      if (error instanceof FireblocksTransferError || error instanceof StaleRawSignError) {
        throw error;
      }
      throw new Error(`Error in rawSign: ${formatErrorMessage(error)}`);
    }
  };
}
