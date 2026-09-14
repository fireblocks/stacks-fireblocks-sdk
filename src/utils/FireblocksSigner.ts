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

const describeOperation = (operation?: string): string =>
  operation === TransactionOperation.Raw ? "Signing request" : "Transfer";

export class FireblocksSigner {
  constructor(public fireblocks: Fireblocks) {}

  createTransactionPayload = (externalTxId: string): TransactionRequest => {
    return {
      note: "raw signing for stacks-fireblocks-sdk",
      externalTxId,
      source: {
        type: TransferPeerPathType.VaultAccount,
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
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    let delay = POLL_INITIAL_MS;

    while (tx.status !== TransactionStateEnum.Completed) {
      const label = describeOperation(tx.operation);

      if (TERMINAL_TRANSACTION_STATES.has(tx.status)) {
        throw new FireblocksTransferError(
          `${label} ${tx.id} reached terminal status ${tx.status}${tx.subStatus ? ` (${tx.subStatus})` : ""}`,
          {
            operation: tx.operation ?? "",
            status: tx.status as TransactionStateEnum,
            subStatus: tx.subStatus,
            errorDescription: (tx as { errorDescription?: string }).errorDescription,
            vendorId: tx.id ?? txId,
          },
        );
      }

      if (Date.now() + delay > deadline) {
        throw new Error(
          `${label} ${tx.id} timed out after 30 minutes: still ${tx.status}${tx.subStatus ? ` (${tx.subStatus})` : ""}`,
        );
      }

      console.log(`Transaction ${tx.id} is currently at status - ${tx.status}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, POLL_CEILING_MS);

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

      const transactionPayload = this.createTransactionPayload(externalId ?? randomUUID());

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
