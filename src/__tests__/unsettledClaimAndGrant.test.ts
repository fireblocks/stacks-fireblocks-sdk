/**
 * A timed-out settlement poll is not a confirmed failure (FBS-29, two remaining asks).
 *
 * `223be22` carried the timeout reason into the error message at the eight call sites.
 * Two paths still report an UNKNOWN outcome as a definite negative in their structured
 * fields, which is what a caller actually branches on:
 *
 * - `ClaimResultItem.status` is `'failed'` on a timed-out claim leg. The response-level
 *   `unsettled` flag is set, but a caller reading `results` — the whole point of the
 *   structured shape — sees a per-leg verdict of "failed" for a leg that may still be
 *   mined. Re-claiming is safe (both legs are contract-idempotent); recording a
 *   definite failure against a cycle is not.
 * - `verifySignerGrant` returns `success: true` with `ready_to_stake: false` and
 *   `signer_registered: false` when the supplied txid never settled. It never reached
 *   the grant reads, so those falses are placeholders, not readings.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchEarned: jest.fn(),
    fetchEarnedStakerRewards: jest.fn(),
    fetchSignerInfo: jest.fn(),
    fetchVerifySignerKeyGrant: jest.fn(),
  };
});

import { StacksSDK } from "../StacksSDK";
import {
  fetchEarned,
  fetchEarnedStakerRewards,
  fetchSignerInfo,
  fetchVerifySignerKeyGrant,
} from "@stacks/bitcoin-staking";

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const MANAGER_NAME = "signer-manager";
const MANAGER = `${BOOT_ADDR}.${MANAGER_NAME}`;
const SIGNER_KEY = `02${"b".repeat(64)}`;
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const SETTLED_OK = {
  success: true,
  data: {
    tx_id: "0xok",
    tx_status: "success",
    tx_result: { repr: "(ok true)" },
  },
};
/** What waitForTxSettlement returns on a deadline timeout: no data at all. */
const TIMED_OUT = { success: false, error: "settlement poll timed out" };

const makeSdk = (): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  sdk.resolveSbtcAsset = jest.fn().mockResolvedValue({
    contractAddress: BOOT_ADDR,
    contractName: "sbtc-token",
    assetName: "sbtc-token",
  });
  sdk.resolveNonce = jest.fn().mockResolvedValue(BigInt(1));
  sdk.runNonceExclusive = jest.fn((fn: () => unknown) => fn());
  sdk.pox5SignAndBroadcast = jest
    .fn()
    .mockResolvedValue({ txid: "0xbroadcast" });
  sdk.signerManagerRegistry = new Map([
    [
      MANAGER,
      {
        payoutPolicy: {
          asset: {
            contractAddress: BOOT_ADDR,
            contractName: "sbtc-token",
            assetName: "sbtc-token",
          },
        },
      },
    ],
  ]);
  return sdk;
};

const runClaimCycle = async (sdk: any) => {
  const results: any[] = [];
  const outcome = await sdk.executeClaimCycle(
    BOOT_ADDR,
    MANAGER_NAME,
    7,
    [3],
    [3],
    { value: undefined },
    undefined,
    [],
    results,
  );
  return { outcome, results };
};

beforeEach(() => {
  (fetchEarned as jest.Mock).mockReset().mockResolvedValue(BigInt(5_000));
  (fetchEarnedStakerRewards as jest.Mock)
    .mockReset()
    .mockResolvedValue(BigInt(4_000));
  (fetchSignerInfo as jest.Mock)
    .mockReset()
    .mockResolvedValue({ signerKey: SIGNER_KEY });
  (fetchVerifySignerKeyGrant as jest.Mock).mockReset().mockResolvedValue(true);
});

describe("ClaimResultItem — a timed-out leg is not a failed leg", () => {
  it("marks a leg claimed when it settles successfully", async () => {
    const sdk = makeSdk();
    sdk.waitForTxSettlement = jest.fn().mockResolvedValue(SETTLED_OK);

    const { outcome, results } = await runClaimCycle(sdk);

    expect(outcome.error).toBeUndefined();
    expect(results[0].status).toBe("claimed");
    expect(results[0].unsettled).toBeUndefined();
  });

  it("flags the shared claim-rewards leg as unsettled, not failed, on a timeout", async () => {
    const sdk = makeSdk();
    sdk.waitForTxSettlement = jest.fn().mockResolvedValue(TIMED_OUT);

    const { outcome, results } = await runClaimCycle(sdk);

    expect(outcome.unsettled).toBe(true);
    // The cycle-level record is what a caller reconciles against; a definite 'failed'
    // here invites recording a cycle as failed while its leg is still in the mempool.
    expect(results[0].unsettled).toBe(true);
  });

  it("flags the per-bond staker payout leg as unsettled on a timeout", async () => {
    const sdk = makeSdk();
    sdk.waitForTxSettlement = jest
      .fn()
      .mockResolvedValueOnce(SETTLED_OK) // leg 1 settles
      .mockResolvedValue(TIMED_OUT); // leg 2 times out

    const { outcome, results } = await runClaimCycle(sdk);

    expect(outcome.unsettled).toBe(true);
    expect(results[0].unsettled).toBe(true);
  });

  it("does not flag unsettled on a leg that definitively aborted on-chain", async () => {
    const sdk = makeSdk();
    sdk.waitForTxSettlement = jest.fn().mockResolvedValue({
      success: true,
      data: {
        tx_id: "0xko",
        tx_status: "abort_by_response",
        tx_result: { repr: "(err u42)" },
      },
    });

    const { results } = await runClaimCycle(sdk);

    // A read that completed and reported an abort IS a confirmed failure — the
    // discriminant must separate the two, not mark everything unsettled.
    expect(results[0].status).toBe("failed");
    expect(results[0].unsettled).toBeUndefined();
  });
});

describe("verifySignerGrant — an unsettled txid is not a refusal", () => {
  it("reports readiness from chain when no txid is supplied", async () => {
    const sdk = makeSdk();

    const res = await sdk.verifySignerGrant(MANAGER);

    expect(res.success).toBe(true);
    expect(res.ready_to_stake).toBe(true);
    expect(res.unsettled).toBeUndefined();
  });

  it("refuses rather than reporting not-registered when the txid never settled", async () => {
    const sdk = makeSdk();
    sdk.waitForTxSettlement = jest.fn().mockResolvedValue(TIMED_OUT);

    const res = await sdk.verifySignerGrant(MANAGER, `0x${"c".repeat(64)}`);

    expect(res.unsettled).toBe(true);
    // The old shape said success:true with signer_registered:false — a definite "this
    // manager is not accepting enrollments" derived from a read that never happened.
    expect(res.success).toBe(false);
    expect(res.signer_registered).toBeUndefined();
    expect(res.ready_to_stake).toBeUndefined();
  });

  it("still reports a definite abort as a definite abort", async () => {
    const sdk = makeSdk();
    sdk.waitForTxSettlement = jest.fn().mockResolvedValue({
      success: true,
      data: {
        tx_id: "0xko",
        tx_status: "abort_by_response",
        tx_result: { repr: "(err u1)" },
      },
    });

    const res = await sdk.verifySignerGrant(MANAGER, `0x${"c".repeat(64)}`);

    expect(res.success).toBe(true);
    expect(res.unsettled).toBeUndefined();
    expect(res.ready_to_stake).toBe(false);
    expect(res.tx_status).toBe("abort_by_response");
  });
});
