/**
 * A failed reward read must not read as zero (FBS-15).
 *
 * `getEarnedRewards` swallowed three reads and returned `success: true` with
 * `earned_sats: "0"`. A caller polling during a Hiro outage could not tell that from a
 * genuine zero, so a user sees "no rewards" and a consumer records a zero where it
 * should retry. The claim paths already refuse on the same reads with a `-1` sentinel
 * and the wording "(unknown, not zero)"; the pure-read path did not.
 *
 * The `startCycle` read matters for the same reason and is easier to miss: when
 * `fetchStakerInfo` fails, the scan silently anchors to the CURRENT cycle instead of the
 * staker's first, so the total is under-scanned rather than merely unread.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchPoxInfo: jest.fn(),
    fetchStakerInfo: jest.fn(),
    fetchEarned: jest.fn(),
    fetchEarnedStakerRewards: jest.fn(),
    bondPeriodToRewardCycle: jest.fn(),
  };
});

import { StacksSDK } from "../StacksSDK";
import {
  fetchPoxInfo as fetchPox5Info,
  fetchStakerInfo,
  fetchEarned,
  fetchEarnedStakerRewards,
  bondPeriodToRewardCycle,
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

const makeSdk = (): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  return sdk;
};

beforeEach(() => {
  (fetchPox5Info as jest.Mock)
    .mockReset()
    .mockResolvedValue({ rewardCycleId: 12 });
  (bondPeriodToRewardCycle as jest.Mock).mockReset().mockReturnValue(10);
  (fetchStakerInfo as jest.Mock).mockReset().mockResolvedValue({
    staked: true,
    details: { firstRewardCycle: 10 },
  });
  (fetchEarned as jest.Mock).mockReset().mockResolvedValue(BigInt(1_000));
  (fetchEarnedStakerRewards as jest.Mock)
    .mockReset()
    .mockResolvedValue(BigInt(900));
});

describe("getEarnedRewards — a failed read is not zero", () => {
  it("reports a genuine zero as success", async () => {
    const sdk = makeSdk();
    (fetchEarned as jest.Mock).mockResolvedValue(BigInt(0));
    (fetchEarnedStakerRewards as jest.Mock).mockResolvedValue(BigInt(0));

    const res = await sdk.getEarnedRewards(MANAGER, 4);

    expect(res.success).toBe(true);
    expect(res.data.earned_sats).toBe("0");
    expect(res.readFailed).toBeUndefined();
  });

  it("refuses rather than reporting zero when the signer earned read fails", async () => {
    const sdk = makeSdk();
    (fetchEarned as jest.Mock).mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.getEarnedRewards(MANAGER, 4);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/unknown, not zero/i);
    expect(res.data).toBeUndefined();
  });

  it("refuses when only SOME cycles fail, rather than under-reporting the total", async () => {
    // Cycles 10–12. The -1 sentinel is summed with real values, so a single failed cycle
    // is worth -1 sat against the total instead of making it unknown.
    const sdk = makeSdk();
    (fetchEarned as jest.Mock).mockImplementation(
      async ({ rewardCycle }: any) =>
        rewardCycle === 11
          ? Promise.reject(new Error("hiro 503"))
          : BigInt(5_000),
    );

    const res = await sdk.getEarnedRewards(MANAGER, 4);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/unknown, not zero/i);
  });

  it("refuses when failed cycles cancel the real ones to exactly zero", async () => {
    // Two failures (-2) against two 1-sat cycles sums to 0 — indistinguishable from a
    // genuine zero, and reported as "no rewards" in the middle of an outage.
    const sdk = makeSdk();
    (fetchEarned as jest.Mock).mockImplementation(
      async ({ rewardCycle }: any) =>
        rewardCycle === 10 ? BigInt(2) : Promise.reject(new Error("hiro 503")),
    );

    const res = await sdk.getEarnedRewards(MANAGER, 4);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/unknown, not zero/i);
  });

  it("refuses when the staker earned read fails", async () => {
    const sdk = makeSdk();
    (fetchEarnedStakerRewards as jest.Mock).mockRejectedValue(
      new Error("hiro 503"),
    );

    const res = await sdk.getEarnedRewards(MANAGER, 4);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/unknown, not zero/i);
  });

  it("carries a discriminant so a read failure is distinguishable from other failures", async () => {
    const sdk = makeSdk();
    (fetchEarned as jest.Mock).mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.getEarnedRewards(MANAGER, 4);

    // Mirrors the `unsettled` precedent: a caller should not have to parse the message
    // to decide whether retrying is the right response.
    expect(res.readFailed).toBe(true);
  });

  it("refuses when the staker-info read that anchors the scan fails", async () => {
    const sdk = makeSdk();
    // No bondIndex, so startCycle comes from fetchStakerInfo. A swallowed failure here
    // anchors the scan to the current cycle and silently under-scans the range.
    (fetchStakerInfo as jest.Mock).mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.getEarnedRewards(MANAGER);

    expect(res.success).toBe(false);
    expect(res.readFailed).toBe(true);
  });
});
