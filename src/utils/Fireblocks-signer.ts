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
    try {
      let response: FireblocksResponse<TransactionResponse> =
        await this.fireblocks.transactions.getTransaction({ txId });
      let tx: TransactionResponse = response.data;
      let messageToConsole: string = `Transaction ${tx.id} is currently at status - ${tx.status}`;

      // console.log(messageToConsole);
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
              `Signing request failed/blocked/cancelled: Transaction: ${tx.id} status is ${tx.status}`
            );
          default:
            // console.log(messageToConsole);
            break;
        }
      }
      while (tx.status !== TransactionStateEnum.Completed);
      return tx;
    } catch (error) {
      throw error;
    }
  };

  rawSign = async (
    content: any,
    vaultAccountId: string,
    txNote?: string,
    testnet?: boolean
  ): Promise<any> => {
    //@ts-ignore

    const hexContent = Buffer.from(content).toString("hex");

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
            vaultAccountId,
            derivationPath.change,
            derivationPath.addressIndex,
          ],
        },
      ],
      algorithm: SignedMessageAlgorithmEnum.EcdsaSecp256K1,
    };

    try {
      const transactionResponse =
        await this.fireblocks.transactions.createTransaction({
          transactionRequest: transactionPayload,
        });
      //@ts-ignore

      const txId = transactionResponse.data.id;
      if (!txId) {
        throw new Error("Transaction ID is undefined.");
      }
      let txInfo = (await this.getTxStatus(txId)) as any;

      const signature = txInfo.signedMessages[0].signature;

      return signature;
    } catch (error) {
      console.error(error);
    }
  };
}
