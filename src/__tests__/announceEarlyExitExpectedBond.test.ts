/**
 * announceEarlyExit forfeits whichever bond the membership names when the transaction
 * executes, so the operator's reviewed bond is passed as `expectedBondIndex` and checked
 * against the live membership: before the signing request is created, and again before
 * the signed transaction is broadcast. A membership that cannot be read is unknown, never
 * a match.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchBondMembership: jest.fn(),
    fetchEligibleAnnounceL1EarlyExit: jest.fn(),
    fetchBond: jest.fn(),
  };
});

import { StacksSDK } from "../StacksSDK";
import {
  fetchBondMembership,
  fetchEligibleAnnounceL1EarlyExit,
  fetchBond,
} from "@stacks/bitcoin-staking";

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const MANAGER = `${BOOT_ADDR}.signer-manager`;
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");
const TXID = "cc".repeat(32);

/** Settled result of an announce that acted on bond 484. */
const SETTLED_BOND_484 = {
  hex: "0x070c0000000414616d6f756e742d736174732d72656c656173656401000000000000000000000000000027100a626f6e642d696e64657801000000000000000000000000000001e4067369676e6572061a280ae1f7806e4e56baba3d4cf49786426b659a6c0e7369676e65722d6d616e61676572067374616b6572051ae2bb4c1b2fcc04d02514c043ebc8e1895d610d89",
  repr: "(ok (tuple (amount-sats-released u10000) (bond-index u484)))",
};

const membership = (bondIndex: number) => ({
  bondIndex,
  signer: MANAGER,
  isL1Lock: true,
});

const makeSdk = (): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  sdk.verifyCommittedCosignerKey = jest.fn().mockResolvedValue(undefined);
  sdk.chainService = {
    getAccountNonce: jest
      .fn()
      .mockResolvedValue({
        confirmedNonce: BigInt(5),
        pendingTxCount: 0,
        nextAvailable: BigInt(5),
      }),
  };
  sdk.buildPox5Call = jest.fn().mockResolvedValue({});
  sdk.signingRequests = 0;
  sdk.broadcasts = 0;
  // Opening the request is the first step; a returned reason from the re-check discards it.
  sdk.pox5SignAndBroadcast = jest.fn(
    async (
      _tx: unknown,
      _note: unknown,
      _ext: unknown,
      revalidate?: () => Promise<string | undefined>,
    ) => {
      sdk.signingRequests += 1;
      const changed = revalidate ? await revalidate() : undefined;
      if (changed)
        return { error: `Transaction discarded after signing — ${changed}.` };
      sdk.broadcasts += 1;
      return { txid: TXID };
    },
  );
  sdk.waitForTxSettlement = jest
    .fn()
    .mockResolvedValue({
      success: true,
      data: { tx_status: "success", tx_result: SETTLED_BOND_484 },
    });
  return sdk;
};

beforeEach(() => {
  (fetchEligibleAnnounceL1EarlyExit as jest.Mock)
    .mockReset()
    .mockResolvedValue({ ok: true });
  (fetchBond as jest.Mock)
    .mockReset()
    .mockResolvedValue({ earlyUnlockBytes: "aabb" });
  (fetchBondMembership as jest.Mock)
    .mockReset()
    .mockResolvedValue(membership(484));
});

describe("announceEarlyExit — expectedBondIndex", () => {
  it("refuses, creating no signing request, when the live membership is another bond", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock).mockResolvedValue(membership(485));

    const res = await sdk.announceEarlyExit({ expectedBondIndex: 484 });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/484/);
    expect(res.error).toMatch(/485/);
    expect(sdk.signingRequests).toBe(0);
    expect(sdk.buildPox5Call).not.toHaveBeenCalled();
  });

  it("refuses, creating no signing request, when the membership switches after the first read and before signing", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce(membership(484))
      .mockResolvedValue(membership(485));

    const res = await sdk.announceEarlyExit({ expectedBondIndex: 484 });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/484/);
    expect(res.error).toMatch(/485/);
    expect(sdk.signingRequests).toBe(0);
  });

  it("broadcasts nothing when the membership switches during approval", async () => {
    const sdk = makeSdk();
    // Reads: preflight, immediately before the request, then the re-check after approval.
    (fetchBondMembership as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce(membership(484))
      .mockResolvedValueOnce(membership(484))
      .mockResolvedValue(membership(485));

    const res = await sdk.announceEarlyExit({ expectedBondIndex: 484 });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/discarded/i);
    expect(sdk.signingRequests).toBe(1);
    expect(sdk.broadcasts).toBe(0);
    expect(sdk.waitForTxSettlement).not.toHaveBeenCalled();
  });

  it("refuses when the membership is gone", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock).mockResolvedValue(undefined);

    const res = await sdk.announceEarlyExit({ expectedBondIndex: 484 });

    expect(res.success).toBe(false);
    expect(sdk.signingRequests).toBe(0);
  });

  describe("an unreadable membership is unknown, not a match", () => {
    it("at the first read", async () => {
      const sdk = makeSdk();
      (fetchBondMembership as jest.Mock).mockRejectedValue(
        new Error("hiro 503"),
      );

      const res = await sdk.announceEarlyExit({ expectedBondIndex: 484 });

      expect(res.success).toBe(false);
      expect(sdk.signingRequests).toBe(0);
    });

    it("immediately before the signing request", async () => {
      const sdk = makeSdk();
      (fetchBondMembership as jest.Mock)
        .mockReset()
        .mockResolvedValueOnce(membership(484))
        .mockRejectedValue(new Error("hiro 503"));

      const res = await sdk.announceEarlyExit({ expectedBondIndex: 484 });

      expect(res.success).toBe(false);
      expect(sdk.signingRequests).toBe(0);
    });

    it("after approval, so nothing is broadcast", async () => {
      const sdk = makeSdk();
      (fetchBondMembership as jest.Mock)
        .mockReset()
        .mockResolvedValueOnce(membership(484))
        .mockResolvedValueOnce(membership(484))
        .mockRejectedValue(new Error("hiro 503"));

      const res = await sdk.announceEarlyExit({ expectedBondIndex: 484 });

      expect(res.success).toBe(false);
      expect(sdk.broadcasts).toBe(0);
    });
  });

  it("announces end to end when the live bond is the expected one, and reports the bond acted on", async () => {
    const sdk = makeSdk();

    const res = await sdk.announceEarlyExit({ expectedBondIndex: 484 });

    expect(res.success).toBe(true);
    expect(res.txHash).toBe(TXID);
    expect(res.bondIndex).toBe(484);
    expect(res.expectedBondIndexMismatch).toBeUndefined();
    expect(sdk.broadcasts).toBe(1);
  });

  it("flags when the contract's own result names another bond than expected", async () => {
    const sdk = makeSdk();
    sdk.waitForTxSettlement = jest.fn().mockResolvedValue({
      success: true,
      data: {
        tx_status: "success",
        tx_result: {
          ...SETTLED_BOND_484,
          hex: SETTLED_BOND_484.hex.replace("1e4", "1e5"),
        },
      },
    });

    const res = await sdk.announceEarlyExit({ expectedBondIndex: 484 });

    expect(res.success).toBe(true);
    expect(res.bondIndex).toBe(485);
    expect(res.expectedBondIndexMismatch).toBe(true);
  });

  it.each([[-1], [1.5], [Number.NaN], [Number.MAX_SAFE_INTEGER + 2]])(
    "rejects an invalid expectedBondIndex (%p) before reading anything",
    async (value) => {
      const sdk = makeSdk();

      const res = await sdk.announceEarlyExit({ expectedBondIndex: value });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/expectedBondIndex/);
      expect(fetchBondMembership).not.toHaveBeenCalled();
      expect(sdk.signingRequests).toBe(0);
    },
  );

  it("accepts expectedBondIndex 0", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock).mockResolvedValue(membership(0));

    const res = await sdk.announceEarlyExit({ expectedBondIndex: 0 });

    expect(res.success).toBe(true);
  });
});
