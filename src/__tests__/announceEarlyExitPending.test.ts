/**
 * Early exit refuses to sign while the vault has a pending transaction.
 *
 * `announce-l1-early-exit` takes no bond index: the contract forfeits whichever membership
 * exists when it executes. A pending `register-for-bond`, `update-bond-registration`,
 * `stake` or earlier announce at nonce n runs before an announce auto-picked at n+1, so
 * both the confirmed-state eligibility reads before and after approval can pass while the
 * announce lands on a different bond. The announce signs only at the confirmed nonce, and
 * only when nothing is pending, both before signing and again after approval.
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
const SETTLED = {
  hex: "0x070c0000000414616d6f756e742d736174732d72656c656173656401000000000000000000000000000027100a626f6e642d696e64657801000000000000000000000000000001e4067369676e6572061a280ae1f7806e4e56baba3d4cf49786426b659a6c0e7369676e65722d6d616e61676572067374616b6572051ae2bb4c1b2fcc04d02514c043ebc8e1895d610d89",
  repr: "(ok (tuple (bond-index u484)))",
};

const nonceInfo = (confirmed: number, pendingTxCount = 0) => ({
  confirmedNonce: BigInt(confirmed),
  pendingTxCount,
  nextAvailable: BigInt(confirmed + pendingTxCount),
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
  sdk.chainService = { getAccountNonce: jest.fn().mockResolvedValue(nonceInfo(5)) };
  sdk.buildPox5Call = jest.fn().mockResolvedValue({});
  sdk.pox5SignAndBroadcast = jest.fn(async (_tx: unknown, _note: unknown, _ext: unknown, revalidate?: () => Promise<string | undefined>) => {
    const changed = revalidate ? await revalidate() : undefined;
    if (changed) return { error: `Transaction discarded after signing — ${changed}.` };
    return { txid: TXID };
  });
  sdk.waitForTxSettlement = jest
    .fn()
    .mockResolvedValue({ success: true, data: { tx_status: "success", tx_result: SETTLED } });
  return sdk;
};

beforeEach(() => {
  (fetchEligibleAnnounceL1EarlyExit as jest.Mock).mockReset().mockResolvedValue({ ok: true });
  (fetchBond as jest.Mock).mockReset().mockResolvedValue({ earlyUnlockBytes: "aabb" });
  (fetchBondMembership as jest.Mock)
    .mockReset()
    .mockResolvedValue({ bondIndex: 484, signer: MANAGER, isL1Lock: true });
});

describe("announceEarlyExit — pending transactions", () => {
  it("refuses before signing when the vault has a pending transaction", async () => {
    const sdk = makeSdk();
    sdk.chainService.getAccountNonce.mockResolvedValue(nonceInfo(5, 1));

    const res = await sdk.announceEarlyExit();

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/pending/i);
    expect(sdk.pox5SignAndBroadcast).not.toHaveBeenCalled();
  });

  it("signs at the confirmed nonce when nothing is pending", async () => {
    const sdk = makeSdk();

    const res = await sdk.announceEarlyExit();

    expect(res.success).toBe(true);
    expect(sdk.buildPox5Call).toHaveBeenCalledWith(
      "announce-l1-early-exit",
      expect.anything(),
      expect.objectContaining({ nonce: BigInt(5) }),
    );
  });

  it("rejects an explicit nonce that differs from the confirmed nonce", async () => {
    const sdk = makeSdk();

    const res = await sdk.announceEarlyExit({ nonce: BigInt(6) });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/confirmed nonce \(5\)/);
    expect(sdk.pox5SignAndBroadcast).not.toHaveBeenCalled();
  });

  it("accepts an explicit nonce equal to the confirmed nonce", async () => {
    const sdk = makeSdk();

    const res = await sdk.announceEarlyExit({ nonce: BigInt(5) });

    expect(res.success).toBe(true);
  });

  it("discards the signed transaction when a transaction became pending during approval", async () => {
    const sdk = makeSdk();
    sdk.chainService.getAccountNonce
      .mockResolvedValueOnce(nonceInfo(5))
      .mockResolvedValue(nonceInfo(5, 1));

    const res = await sdk.announceEarlyExit();

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/discarded/i);
    expect(res.error).toMatch(/pending/i);
    expect(sdk.waitForTxSettlement).not.toHaveBeenCalled();
  });

  it("discards the signed transaction when the confirmed nonce moved during approval", async () => {
    const sdk = makeSdk();
    sdk.chainService.getAccountNonce
      .mockResolvedValueOnce(nonceInfo(5))
      .mockResolvedValue(nonceInfo(6));

    const res = await sdk.announceEarlyExit();

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/discarded/i);
    expect(sdk.waitForTxSettlement).not.toHaveBeenCalled();
  });
});
