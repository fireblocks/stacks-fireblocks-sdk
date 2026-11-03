import {
  Fireblocks,
  TransactionOperation,
  TransferPeerPathType,
} from "@fireblocks/ts-sdk";
import { FireblocksSigner } from "../utils/FireblocksSigner";

/**
 * Raw signing requests must name the vault account (issue #204, P0).
 *
 * The payload set `source: { type: VaultAccount }` with no `id` — the vault appeared
 * only inside the derivation path. A Raw policy rule scoped to a vault account therefore
 * never matched, and Fireblocks blocked the request with "There are no rules in the Raw
 * policy that allow this kind of transaction". Vault-scoping a Raw rule is the secure way
 * to write one, so any partner doing it correctly hit this. It cost the launch call an
 * hour. The BTC transfer path already set the id.
 */
const VAULT = "7";
const CONTENT = "ab".repeat(32);

describe("FireblocksSigner raw signing — vault account id", () => {
  const capturingFireblocks = () => {
    const created: any[] = [];
    const fireblocks = {
      transactions: {
        createTransaction: async ({ transactionRequest }: any) => {
          created.push(transactionRequest);
          return { data: { id: "fb-raw-1", status: "COMPLETED" } };
        },
        getTransaction: async () => ({
          data: {
            id: "fb-raw-1",
            status: "COMPLETED",
            operation: TransactionOperation.Raw,
            signedMessages: [{ signature: { fullSig: "00".repeat(64), v: 0 } }],
          },
        }),
      },
    } as unknown as Fireblocks;
    return { created, signer: new FireblocksSigner(fireblocks) };
  };

  it("names the vault account in the raw payload's source", async () => {
    const { created, signer } = capturingFireblocks();

    await signer.rawSign(CONTENT, VAULT, undefined, true).catch(() => {});

    expect(created).toHaveLength(1);
    expect(created[0].source).toEqual({
      type: TransferPeerPathType.VaultAccount,
      id: VAULT,
    });
  });

  it("carries the id as a string, matching the transfer path", async () => {
    const { created, signer } = capturingFireblocks();

    // A numeric vault id must still serialize as a string, as the BTC transfer path does.
    await signer
      .rawSign(CONTENT, 7 as unknown as string, undefined, true)
      .catch(() => {});

    expect(created[0].source.id).toBe("7");
    expect(typeof created[0].source.id).toBe("string");
  });

  it("still builds a Raw operation with the deterministic external id", async () => {
    const { created, signer } = capturingFireblocks();

    await signer
      .rawSign(CONTENT, VAULT, undefined, true, "ext-id-204")
      .catch(() => {});

    expect(created[0].operation).toBe(TransactionOperation.Raw);
    expect(created[0].externalTxId).toBe("ext-id-204");
  });
});
