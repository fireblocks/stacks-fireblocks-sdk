/**
 * Early exit acts on the bond the operator reviewed, and reports the one it acted on.
 *
 * `announce-l1-early-exit` takes no bond index: the contract reads the staker's membership
 * when the transaction executes and forfeits THAT bond. Two consequences (review item 3):
 *
 * - A registration landing during Fireblocks approval changes which bond is forfeited. The
 *   post-signing revalidate re-checked eligibility, which is keyed on staker and signer
 *   manager only, so a membership rolled into a new bond index under the same manager
 *   passed it — and the cosigner key was only ever verified for the preflight bond. The
 *   revalidate now re-reads membership and discards the signed transaction when the bond
 *   index moved.
 * - The index returned afterwards came from a later membership read, which can already
 *   name a different bond. The contract returns the index it acted on in its result —
 *   `(ok { staker, signer, bond-index, amount-sats-released })`, verified against the
 *   deployed mainnet pox-5 source and a settled private-1 transaction — so that is the
 *   source now.
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

/**
 * The result of a real settled announce on private-1
 * (0xa42880c2520f68ee423c5fd2866ecb9a2f0c84c8c149818b8015fa4f5bdd965d):
 * (ok (tuple (amount-sats-released u10000) (bond-index u484) (signer …) (staker …)))
 */
const REAL_RESULT_BOND_484 = {
  hex: "0x070c0000000414616d6f756e742d736174732d72656c656173656401000000000000000000000000000027100a626f6e642d696e64657801000000000000000000000000000001e4067369676e6572061a280ae1f7806e4e56baba3d4cf49786426b659a6c0e7369676e65722d6d616e61676572067374616b6572051ae2bb4c1b2fcc04d02514c043ebc8e1895d610d89",
  repr: "(ok (tuple (amount-sats-released u10000) (bond-index u484) (signer 'STM0NRFQG1Q4WNNTQ8YMSX4QGS16PSCTDHFTDMTA.signer-manager) (staker 'ST3HBPK0V5Z609M152K047TY8W64NTR8DH4MRXVC8)))",
};

const membership = (bondIndex: number) => ({ bondIndex, signer: MANAGER, isL1Lock: true });

const makeSdk = (txResult: unknown = REAL_RESULT_BOND_484): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  sdk.verifyCommittedCosignerKey = jest.fn().mockResolvedValue(undefined);
  sdk.runNonceExclusive = jest.fn(async (fn: any) => fn());
  sdk.resolveNonce = jest.fn().mockResolvedValue(BigInt(1));
  sdk.buildPox5Call = jest.fn().mockResolvedValue({});
  // Mirrors the production contract: the post-signing revalidate runs before broadcast,
  // and a returned reason discards the signed transaction.
  sdk.pox5SignAndBroadcast = jest.fn(async (_tx: unknown, _note: unknown, _ext: unknown, revalidate?: () => Promise<string | undefined>) => {
    const changed = revalidate ? await revalidate() : undefined;
    if (changed) return { error: `Transaction discarded after signing — ${changed}.` };
    return { txid: TXID };
  });
  sdk.waitForTxSettlement = jest
    .fn()
    .mockResolvedValue({ success: true, data: { tx_status: "success", tx_result: txResult } });
  return sdk;
};

beforeEach(() => {
  (fetchEligibleAnnounceL1EarlyExit as jest.Mock).mockReset().mockResolvedValue({ ok: true });
  (fetchBond as jest.Mock).mockReset().mockResolvedValue({ earlyUnlockBytes: "aabb" });
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue(membership(484));
});

describe("announceEarlyExit — the bond must not change during approval", () => {
  it("discards the signed transaction when the bond index moved during approval", async () => {
    const sdk = makeSdk();
    // Preflight reviews bond 4; a registration lands during approval and the staker's
    // membership is now bond 5 under the SAME manager — eligibility still passes.
    (fetchBondMembership as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce(membership(4))
      .mockResolvedValue(membership(5));

    const res = await sdk.announceEarlyExit();

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/discarded/i);
    expect(res.error).toMatch(/4/);
    expect(res.error).toMatch(/5/);
    expect(sdk.waitForTxSettlement).not.toHaveBeenCalled();
  });

  it("discards when the membership is gone by the time approval completes", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce(membership(4))
      .mockResolvedValue(null);

    const res = await sdk.announceEarlyExit();

    expect(res.success).toBe(false);
    expect(sdk.waitForTxSettlement).not.toHaveBeenCalled();
  });

  it("broadcasts when the bond is unchanged", async () => {
    const sdk = makeSdk();

    const res = await sdk.announceEarlyExit();

    expect(res.success).toBe(true);
    expect(res.txHash).toBe(TXID);
  });
});

describe("announceEarlyExit — the bond index it acted on comes from the transaction result", () => {
  it("returns the index from the settled result, not from a membership read", async () => {
    const sdk = makeSdk(REAL_RESULT_BOND_484);
    // Membership reads say 7 throughout; the result says the contract acted on 484. Only
    // the result is authoritative for what was announced.
    (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue(membership(7));

    const res = await sdk.announceEarlyExit();

    expect(res.bondIndex).toBe(484);
    expect(res.bondIndexLookupFailed).toBeUndefined();
  });

  it("does not read membership after settlement, which can already name another bond", async () => {
    const sdk = makeSdk(REAL_RESULT_BOND_484);

    await sdk.announceEarlyExit();

    const settledAt = sdk.waitForTxSettlement.mock.invocationCallOrder[0];
    const readsAfter = (fetchBondMembership as jest.Mock).mock.invocationCallOrder.filter(
      (order: number) => order > settledAt,
    );
    expect(readsAfter).toHaveLength(0);
  });

  it("reports the index as unknown, not absent, when the result cannot be decoded", async () => {
    const sdk = makeSdk({ repr: "(ok true)" });

    const res = await sdk.announceEarlyExit();

    // The announce landed; only the index is unknown.
    expect(res.success).toBe(true);
    expect(res.txHash).toBe(TXID);
    expect(res.bondIndex).toBeUndefined();
    expect(res.bondIndexLookupFailed).toBe(true);
  });
});
