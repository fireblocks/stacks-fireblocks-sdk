/**
 * The remaining FBS-15 read sites: a failed read must not read as absence (or zero).
 *
 * `getEarnedRewards` was fixed separately. These are the other pure-read paths the
 * review names, where `.catch(() => <substitute>)` turns a Hiro outage into confident
 * wrong state:
 *
 * - `checkStatus` — a failed staker-info read becomes `is_staked: false`, telling a
 *   staker who has a stake that they do not. The same function already carries
 *   `lookup_failed` for delegation and `pox_lookup_failed` for the PoX read, so the
 *   discriminant pattern is established; these two reads simply lack one.
 * - `claimStxOnlyRewards` — a failed staker-info read becomes "No active STX-only stake
 *   found", which both misreports state and blocks a legitimate historical claim.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchPoxInfo: jest.fn(),
    fetchStakerInfo: jest.fn(),
    fetchBondMembership: jest.fn(),
    fetchLastRewardComputeHeight: jest.fn(),
  };
});

import { StacksSDK } from "../StacksSDK";
import {
  fetchPoxInfo as fetchPox5Info,
  fetchStakerInfo,
  fetchBondMembership,
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
  sdk.chainService = {
    checkDelegationStatus: jest.fn().mockResolvedValue(null),
    makeBalanceCalls: jest.fn().mockResolvedValue({
      data: { balance: "0", locked: "0" },
    }),
  };
  return sdk;
};

beforeEach(() => {
  (fetchPox5Info as jest.Mock).mockReset().mockResolvedValue({
    rewardCycleId: 12,
    contractId: "SP000.pox-5",
    currentBurnchainBlockHeight: 900,
  });
  (fetchStakerInfo as jest.Mock)
    .mockReset()
    .mockResolvedValue({ staked: false });
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue(null);
});

describe("checkStatus — a failed read is not an absent stake", () => {
  it("does not flag a lookup failure when the reads succeed", async () => {
    const sdk = makeSdk();

    const res = await sdk.checkStatus();

    expect(res.success).toBe(true);
    expect(res.data.stx_only.staker_lookup_failed).toBe(false);
    expect(res.data.bond_lookup_failed).toBe(false);
  });

  it("flags a failed staker-info read instead of reporting is_staked false", async () => {
    const sdk = makeSdk();
    (fetchStakerInfo as jest.Mock).mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.checkStatus();

    // is_staked stays false because nothing is known — the flag is what tells the caller
    // that false means "unreadable", not "confirmed not staking".
    expect(res.data.stx_only.staker_lookup_failed).toBe(true);
  });

  it("flags a failed bond-membership read instead of reporting no bond", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock).mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.checkStatus();

    expect(res.data.bond).toBeNull();
    expect(res.data.bond_lookup_failed).toBe(true);
  });
});

describe("claimStxOnlyRewards — a failed anchor read is not an absent stake", () => {
  it("reports the read failure rather than 'no active stake found'", async () => {
    const sdk = makeSdk();
    (fetchStakerInfo as jest.Mock).mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.claimStxOnlyRewards(`${BOOT_ADDR}.signer-manager`);

    expect(res.success).toBe(false);
    // The old message told a staker they had no stake, and blocked a legitimate
    // historical claim, on a transient failure.
    expect(res.error).not.toMatch(/No active STX-only stake found/);
    expect(res.error).toMatch(/unknown|could not read/i);
  });
});
