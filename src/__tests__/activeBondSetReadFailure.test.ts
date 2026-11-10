/**
 * An unreadable bond must not be silently dropped from the calculate-rewards set
 * (FBS-15, last residual site).
 *
 * `getActiveBondsSorted` builds the bond-index list that calculate-rewards submits, and
 * `calculateRewards`' own contract states the requirement: "Must include ALL active
 * bonds, sorted descending by stxValueRatio". A `.catch(() => null)` on the per-bond
 * read dropped a candidate on a transient Hiro failure, so the call was submitted
 * against a silently short set — and the sort key for a dropped bond is unknown, so the
 * ordering of what remains is not asserted either.
 *
 * Whether the contract rejects a short set or misdistributes against it is a PoX-5
 * question not settled here, so this refuses before spending a nonce, a fee, and a
 * Fireblocks signature — safe under either answer.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchPoxInfo: jest.fn(),
    fetchBond: jest.fn(),
    isBondActiveAtHeight: jest.fn(),
    bondPeriodToRewardCycle: jest.fn(),
    burnHeightToRewardCycle: jest.fn(),
    currentDistributionCycle: jest.fn(),
    distributionCycleToBurnHeight: jest.fn(),
    fetchEligibleCalculateRewards: jest.fn(),
  };
});

import { StacksSDK } from "../StacksSDK";
import {
  fetchPoxInfo as fetchPox5Info,
  fetchBond,
  isBondActiveAtHeight,
  bondPeriodToRewardCycle,
  burnHeightToRewardCycle,
  currentDistributionCycle,
  distributionCycleToBurnHeight,
  fetchEligibleCalculateRewards,
} from "@stacks/bitcoin-staking";

const BOOT_ADDR = "ST000000000000000000002AMW42H";
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
  (fetchPox5Info as jest.Mock).mockReset().mockResolvedValue({
    rewardCycleId: 20,
    currentBurnchainBlockHeight: 2_000,
    firstBurnchainBlockHeight: 0,
    prepareCycleLength: 10,
    rewardCycleLength: 100,
    contractId: "SP000.pox-5",
  });
  (currentDistributionCycle as jest.Mock).mockReset().mockReturnValue(5);
  (distributionCycleToBurnHeight as jest.Mock)
    .mockReset()
    .mockReturnValue(2_001);
  (burnHeightToRewardCycle as jest.Mock).mockReset().mockReturnValue(20);
  // bondIndex 0 -> 10, 1 -> 12: a 2-cycle gap, giving a multi-bond active window.
  (bondPeriodToRewardCycle as jest.Mock)
    .mockReset()
    .mockImplementation(
      ({ bondIndex }: { bondIndex: number }) => 10 + bondIndex * 2,
    );
  (isBondActiveAtHeight as jest.Mock).mockReset().mockReturnValue(true);
  (fetchBond as jest.Mock)
    .mockReset()
    .mockResolvedValue({ stxValueRatio: BigInt(3) });
  (fetchEligibleCalculateRewards as jest.Mock)
    .mockReset()
    .mockResolvedValue({ ok: false, reasons: [] });
});

describe("getActiveBondsSorted — an unreadable bond is not a missing bond", () => {
  it("returns the active set when every read succeeds", async () => {
    const sdk = makeSdk();

    const indices = await sdk.getActiveBondsSorted();

    expect(indices.length).toBeGreaterThan(0);
  });

  it("refuses rather than submitting a set with an unreadable bond dropped", async () => {
    const sdk = makeSdk();
    (fetchBond as jest.Mock).mockImplementation(({ bondIndex }: any) =>
      bondIndex === 4
        ? Promise.reject(new Error("hiro 503"))
        : Promise.resolve({ stxValueRatio: BigInt(3) }),
    );

    await expect(sdk.getActiveBondsSorted()).rejects.toThrow(
      /unreadable|unknown/i,
    );
  });

  it("does not reach the preflight when a bond read fails", async () => {
    const sdk = makeSdk();
    (fetchBond as jest.Mock).mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.calculateRewards();

    expect(res.success).toBe(false);
    // Reaching the preflight would mean the short set was already treated as
    // authoritative; refusing earlier also saves a nonce and a signature.
    expect(fetchEligibleCalculateRewards).not.toHaveBeenCalled();
  });
});
