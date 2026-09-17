/**
 * Chain-derived bond index on the early-exit announcement (FBS-54).
 *
 * `announceEarlyExit` took no bond index and returned none. On chain the contract picks
 * the membership live and records the announcement against the index IT derives, then
 * writes an irreversible map entry. The caller meanwhile keys its own state by whatever
 * index it happened to hold from the preflight read. When those differ, the app shows
 * early exit as announced for the wrong bond — or not announced for the bond that was —
 * and the write cannot be undone.
 *
 * The post-signing revalidate does not close this: it is keyed by staker and signer
 * manager only, so a membership that rolls into a new bond index under the same manager
 * still passes it.
 *
 * The fix returns the index re-read AFTER settlement, so the caller keys state by what
 * the chain actually holds rather than by a stale preflight capture.
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
  sdk.runNonceExclusive = jest.fn(async (fn: any) => fn());
  sdk.resolveNonce = jest.fn().mockResolvedValue(BigInt(1));
  sdk.buildPox5Call = jest.fn().mockResolvedValue({});
  sdk.pox5SignAndBroadcast = jest.fn().mockResolvedValue({ txid: TXID });
  sdk.waitForTxSettlement = jest
    .fn()
    .mockResolvedValue({ success: true, data: { tx_status: "success" } });
  return sdk;
};

beforeEach(() => {
  (fetchEligibleAnnounceL1EarlyExit as jest.Mock)
    .mockReset()
    .mockResolvedValue({ ok: true });
  (fetchBond as jest.Mock)
    .mockReset()
    .mockResolvedValue({ earlyUnlockBytes: "aabb" });
});

describe("announceEarlyExit — chain-derived bond index", () => {
  it("returns the bond index the chain holds after settlement", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock)
      .mockReset()
      .mockResolvedValue({ bondIndex: 4, signer: MANAGER, isL1Lock: true });

    const res = await sdk.announceEarlyExit();

    expect(res.success).toBe(true);
    expect(res.bondIndex).toBe(4);
  });

  it("reports the post-settlement index, not the preflight one, when membership rolled over", async () => {
    const sdk = makeSdk();
    // Preflight sees bond 4; by the time the announce settles the staker's membership
    // has rolled into bond 5 under the SAME manager — which the revalidate cannot catch,
    // because it keys on staker + signer manager only.
    (fetchBondMembership as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce({ bondIndex: 4, signer: MANAGER, isL1Lock: true })
      .mockResolvedValue({ bondIndex: 5, signer: MANAGER, isL1Lock: true });

    const res = await sdk.announceEarlyExit();

    // Keying state by 4 here is the defect: the contract recorded against what it read live.
    expect(res.bondIndex).toBe(5);
  });

  it("still succeeds when the post-settlement re-read fails, without inventing an index", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce({ bondIndex: 4, signer: MANAGER, isL1Lock: true })
      .mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.announceEarlyExit();

    // The announce landed — an unreadable follow-up must not turn that into a failure,
    // and must not report a stale index as though the chain confirmed it.
    expect(res.success).toBe(true);
    expect(res.txHash).toBe(TXID);
    expect(res.bondIndex).toBeUndefined();
  });
});
