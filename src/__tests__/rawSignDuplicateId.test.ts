import {
  Fireblocks,
  TransactionOperation,
  TransactionStateEnum,
} from "@fireblocks/ts-sdk";
import { FireblocksSigner, StaleRawSignError } from "../utils/FireblocksSigner";

/**
 * Re-polling an outstanding raw-signing request instead of creating a second one
 * (issue 208 / review F4).
 *
 * A deterministic external id only helps if a duplicate rejection resolves to the
 * ORIGINAL request. The signature it holds is over the sighash submitted at the time,
 * so it is reusable only when that sighash still matches the one the caller now needs —
 * the nonce can drift between attempts if another vault operation consumed it.
 */

const SIGHASH = "ab".repeat(32);
const OTHER_SIGHASH = "cd".repeat(32);
const SIGNATURE = { fullSig: "ff".repeat(64), v: 1 };
const EXTERNAL_ID = "bond-register-deadbeef";

const duplicateError = Object.assign(
  new Error("code 1438: duplicate externalTxId"),
  {
    code: 1438,
  },
);

/**
 * A Fireblocks double that rejects createTransaction as a duplicate and serves the
 * pre-existing RAW request through the by-external-id lookup.
 */
const fireblocksWithExisting = (existing: Record<string, unknown> | null) => {
  const getTransactionByExternalId = jest.fn(async () => {
    if (!existing) {
      throw Object.assign(new Error("not found"), {
        response: { status: 404 },
      });
    }
    return { data: existing };
  });
  const getTransaction = jest.fn(async () => ({ data: existing }));
  return {
    createTransaction: jest.fn(async () => {
      throw duplicateError;
    }),
    getTransactionByExternalId,
    getTransaction,
  };
};

const signerFor = (transactions: Record<string, unknown>) =>
  new FireblocksSigner({ transactions } as unknown as Fireblocks, {
    initialMs: 1,
    ceilingMs: 1,
  });

const rawTx = (over: Record<string, unknown> = {}) => ({
  id: "fb-raw-original",
  status: TransactionStateEnum.Completed,
  operation: TransactionOperation.Raw,
  signedMessages: [{ content: SIGHASH, signature: SIGNATURE }],
  ...over,
});

describe("FireblocksSigner.rawSign — duplicate external id", () => {
  it("returns the original request's signature instead of creating a second one", async () => {
    const transactions = fireblocksWithExisting(rawTx());
    const signer = signerFor(transactions);

    const sig = await signer.rawSign(
      SIGHASH,
      "7",
      "register",
      true,
      EXTERNAL_ID,
    );

    expect(sig).toEqual(SIGNATURE);
    expect(transactions.getTransactionByExternalId).toHaveBeenCalledWith({
      externalTxId: EXTERNAL_ID,
    });
  });

  it("matches on the request echo, which is readable before the request completes", async () => {
    // signedMessages is only populated once signing finishes, so a request still awaiting
    // approval can only be matched through extraParameters.
    const transactions = fireblocksWithExisting(
      rawTx({
        signedMessages: [{ signature: SIGNATURE }],
        extraParameters: {
          rawMessageData: { messages: [{ content: SIGHASH }] },
        },
      }),
    );
    const signer = signerFor(transactions);

    await expect(
      signer.rawSign(SIGHASH, "7", "register", true, EXTERNAL_ID),
    ).resolves.toEqual(SIGNATURE);
  });

  it("refuses when the existing request signed a DIFFERENT sighash", async () => {
    // Nonce drift between attempts: reusing this signature would broadcast a transaction
    // whose signature covers different bytes.
    const signer = signerFor(
      fireblocksWithExisting(
        rawTx({
          signedMessages: [{ content: OTHER_SIGHASH, signature: SIGNATURE }],
        }),
      ),
    );

    await expect(
      signer.rawSign(SIGHASH, "7", "register", true, EXTERNAL_ID),
    ).rejects.toThrow(StaleRawSignError);
  });

  it("refuses when the existing request does not echo the signed content", async () => {
    // Absence is not a match: without the content there is nothing to compare the
    // sighash against, so the signature is not provably over the right bytes.
    const signer = signerFor(
      fireblocksWithExisting(
        rawTx({ signedMessages: [{ signature: SIGNATURE }] }),
      ),
    );

    await expect(
      signer.rawSign(SIGHASH, "7", "register", true, EXTERNAL_ID),
    ).rejects.toThrow(StaleRawSignError);
  });

  it("rethrows the duplicate error when no request is found under the id", async () => {
    const signer = signerFor(fireblocksWithExisting(null));

    await expect(
      signer.rawSign(SIGHASH, "7", "register", true, EXTERNAL_ID),
    ).rejects.toThrow(/1438/);
  });
});
