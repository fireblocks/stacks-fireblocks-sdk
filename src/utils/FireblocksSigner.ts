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

export class FireblocksSigner {
  constructor(public fireblocks: Fireblocks) {}

  createTransactionPayload = (): TransactionRequest => {
    return {
      note: "raw signing for stacks-fireblocks-sdk",
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
    const messageToConsole: string = `Transaction ${tx.id} is currently at status - ${tx.status}`;

      console.log(messageToConsole);
      while (tx.status !== TransactionStateEnum.Completed) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        response = await this.fireblocks.transactions.getTransaction({ txId });
        tx = response.data;

        switch (tx.status) {
          case TransactionStateEnum.Blocked:
          case TransactionStateEnum.Cancelled:
          case TransactionStateEnum.Failed:
          case TransactionStateEnum.Rejected:
            throw new Error(
              `Signing request failed/blocked/cancelled: Transaction: ${tx.id} status is ${tx.status}`,
            );
          default:
            console.log(messageToConsole);
            break;
        }
    }
    return tx;
  };

  rawSign = async (
    content: string,
    vaultAccountId: string,
    txNote?: string,
    testnet: boolean = false,
  ): Promise<any> => {
    try {
      if (typeof content !== "string") {
        throw new Error("Content for raw signing must be a hex string");
      }

      const hexContent = content.startsWith("0x") ? content.slice(2) : content;

      const transactionPayload = this.createTransactionPayload();

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
