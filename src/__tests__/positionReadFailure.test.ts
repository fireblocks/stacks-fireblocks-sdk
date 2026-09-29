/**
 * Display-state reads that substituted zero (FBS-15, remaining sites).
 *
 * - `getBondPosition` summed earned rewards with `.catch(() => BigInt(0))`, ten lines
 *   below that same function's "No substituting catch here" comment, so an outage
 *   understated the total. `BondPositionData` already documents null as unknown
 *   (`still_locked: boolean | null` — "null when the Bitcoin lookup failed"), so earned
 *   follows that convention rather than reporting a confident wrong number.
 * - `getRequirements`' bond details substituted a zero allowance, which feeds
 *   `open_and_allowlisted` — making a pool the caller IS allowlisted for look closed.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchPoxInfo: jest.fn(),
    fetchBondMembership: jest.fn(),
    fetchStakerInfo: jest.fn(),
    fetchEarned: jest.fn(),
    fetchAccountStatus: jest.fn(),
    bondPeriodToRewardCycle: jest.fn(),
    bondPhaseRanges: jest.fn(),
    isInPreparePhase: jest.fn(),
    fetchBond: jest.fn(),
    fetchBondStatus: jest.fn(),
    fetchBondAllowance: jest.fn(),
  };
});

import { StacksSDK } from "../StacksSDK";
import {
  fetchPoxInfo as fetchPox5Info,
  fetchBondMembership,
  fetchStakerInfo,
  fetchEarned,
  fetchAccountStatus,
  bondPeriodToRewardCycle,
  bondPhaseRanges,
  isInPreparePhase,
  fetchBond,
  fetchBondStatus,
  fetchBondAllowance,
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
  (fetchPox5Info as jest.Mock).mockReset().mockResolvedValue({
    rewardCycleId: 12,
    currentBurnchainBlockHeight: 900,
    firstBurnchainBlockHeight: 0,
    prepareCycleLength: 10,
    rewardCycleLength: 100,
    contractId: "SP000.pox-5",
  });
  (isInPreparePhase as jest.Mock).mockReset().mockReturnValue(false);
  // bondIndex 0 -> 10, 1 -> 12: a 2-cycle bond gap, so getRequirements' boundary math
  // resolves without the real phase schedule.
  (bondPeriodToRewardCycle as jest.Mock)
    .mockReset()
    .mockImplementation(
      ({ bondIndex }: { bondIndex: number }) => 10 + bondIndex * 2,
    );
  (bondPhaseRanges as jest.Mock).mockReset().mockReturnValue([]);
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue({
    // First earning cycle 10 against a current cycle of 12: two cycles actually get
    // read, so a substituted zero is distinguishable from an empty range.
    bondIndex: 0,
    signer: MANAGER,
    // L1 lock state is irrelevant here and pulls in the lock-record store and the
    // real register-metadata builder; the earned sum runs identically either way.
    isL1Lock: false,
    amountUstx: BigInt(1_000),
    amountSats: BigInt(100_000),
  });
  (fetchStakerInfo as jest.Mock)
    .mockReset()
    .mockResolvedValue({ staked: false });
  (fetchEarned as jest.Mock).mockReset().mockResolvedValue(BigInt(500));
  (fetchAccountStatus as jest.Mock)
    .mockReset()
    .mockResolvedValue({ unlockHeight: 0 });
  (fetchBond as jest.Mock).mockReset().mockResolvedValue({
    stxValueRatio: BigInt(1),
    targetRateBps: 100,
    minUstxRatioBps: BigInt(1),
  });
  (fetchBondStatus as jest.Mock).mockReset().mockResolvedValue("open");
  (fetchBondAllowance as jest.Mock)
    .mockReset()
    .mockResolvedValue(BigInt(50_000));
});

describe("getBondPosition — earned is unknown, not zero, when the read fails", () => {
  it("reports the summed total when the reads succeed", async () => {
    const sdk = makeSdk();

    const res = await sdk.getBondPosition();

    expect(res.success).toBe(true);
    expect(res.data.bond.earned_sats).toBe("1000");
  });

  it("reports null rather than an understated total when an earned read fails", async () => {
    const sdk = makeSdk();
    (fetchEarned as jest.Mock).mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.getBondPosition();

    // A substituted 0 here is a confident wrong number; null is the type's documented
    // "unknown", same as still_locked.
    expect(res.success).toBe(true);
    expect(res.data.bond.earned_sats).toBeNull();
    expect(res.data.bond.earned_btc).toBeNull();
  });
});

describe("getRequirements — allowance is unknown, not zero, when the read fails", () => {
  it("reports the allowance when the read succeeds", async () => {
    const sdk = makeSdk();

    const res = await sdk.getRequirements({ bondIndex: 4 });

    expect(res.success).toBe(true);
    expect(res.data.btc_bond.requested_bond.your_allowance_sats).toBe("50000");
    expect(res.data.btc_bond.requested_bond.allowance_lookup_failed).toBe(
      false,
    );
  });

  it("does not report a pool as closed when the allowance read fails", async () => {
    const sdk = makeSdk();
    (fetchBondAllowance as jest.Mock).mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.getRequirements({ bondIndex: 4 });

    const requested = res.data.btc_bond.requested_bond;
    // open_and_allowlisted false here would say "you are not allowlisted" on a read
    // that never resolved — the flag is what distinguishes that from a real refusal.
    expect(requested.allowance_lookup_failed).toBe(true);
    expect(requested.your_allowance_sats).toBeNull();
  });
});
