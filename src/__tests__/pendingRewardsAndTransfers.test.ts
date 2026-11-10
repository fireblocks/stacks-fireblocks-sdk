/**
 * Transfers, calculateRewards and the reward claims report a Fireblocks request still waiting
 * as pending, like every other signing call (review item 7).
 *
 * Transfers threw, so the REST transfer routes answered 500 while the request was open.
 * calculateRewards and the claims flattened the typed error into failure text, and the claims
 * dropped the txids of legs already broadcast.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchPoxInfo: jest.fn(),
    bondPeriodToRewardCycle: jest.fn(),
    fetchLastRewardComputeHeight: jest.fn(),
    fetchSignerCycleMembership: jest.fn(),
    fetchEarned: jest.fn(),
    fetchEarnedStakerRewards: jest.fn(),
    fetchStakerSharesStakedForCycle: jest.fn(),
    fetchEligibleCalculateRewards: jest.fn(),
  };
});

import { TransactionStateEnum } from "@fireblocks/ts-sdk";
import {
  fetchPoxInfo,
  bondPeriodToRewardCycle,
  fetchLastRewardComputeHeight,
  fetchSignerCycleMembership,
  fetchEarned,
  fetchEarnedStakerRewards,
  fetchStakerSharesStakedForCycle,
  fetchEligibleCalculateRewards,
} from "@stacks/bitcoin-staking";
import { StacksSDK } from "../StacksSDK";
import { FireblocksTransferError } from "../utils/FireblocksSigner";

const ADDR = "ST000000000000000000002AMW42H";
const MANAGER = `${ADDR}.signer-manager`;
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const stillWaiting = () =>
  new FireblocksTransferError(
    "Signing request fb-raw-7 timed out after 30m: still PENDING_AUTHORIZATION",
    {
      operation: "RAW",
      status: TransactionStateEnum.PendingAuthorization,
      vendorId: "fb-raw-7",
    },
  );

const makeSdk = (): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  return sdk;
};

const expectPending = (res: any) => {
  expect(res.success).toBe(false);
  expect(res.pendingFireblocksId).toBe("fb-raw-7");
  expect(res.pendingApproval).toBe(true);
  expect(res.error).not.toMatch(/^Failed to/);
};

beforeEach(() => {
  (fetchPoxInfo as jest.Mock).mockReset().mockResolvedValue({
    firstBurnchainBlockHeight: 0,
    rewardCycleLength: 10,
    rewardCycleId: 5,
  });
  (bondPeriodToRewardCycle as jest.Mock).mockReset().mockReturnValue(3);
  (fetchLastRewardComputeHeight as jest.Mock).mockReset().mockResolvedValue(40);
  (fetchSignerCycleMembership as jest.Mock)
    .mockReset()
    .mockResolvedValue({ amountUstx: BigInt(1), signer: MANAGER });
  (fetchEarned as jest.Mock).mockReset().mockResolvedValue(BigInt(1));
  (fetchEarnedStakerRewards as jest.Mock)
    .mockReset()
    .mockResolvedValue(BigInt(1));
  (fetchStakerSharesStakedForCycle as jest.Mock)
    .mockReset()
    .mockResolvedValue(BigInt(1));
  (fetchEligibleCalculateRewards as jest.Mock)
    .mockReset()
    .mockResolvedValue({ ok: true });
});

describe("transfers", () => {
  const stubTransfer = (sdk: any) => {
    sdk.checkParamsAndAdjustAmount = jest
      .fn()
      .mockResolvedValue({ validParams: true, finalAmount: BigInt(1_000_000) });
    sdk.runNonceExclusive = jest.fn().mockRejectedValue(stillWaiting());
  };

  it("createNativeTransaction returns a pending result instead of throwing", async () => {
    const sdk = makeSdk();
    stubTransfer(sdk);

    const res = await sdk.createNativeTransaction(ADDR, 1);

    expectPending(res);
  });

  it("createFTTransaction returns a pending result instead of throwing", async () => {
    const sdk = makeSdk();
    stubTransfer(sdk);

    const res = await sdk.createFTTransaction(ADDR, 1, "sBTC");

    expectPending(res);
  });

  it("names the externalId to reuse only when the caller supplied one", async () => {
    const sdk = makeSdk();
    stubTransfer(sdk);

    const without = await sdk.createNativeTransaction(ADDR, 1);
    const withId = await sdk.createNativeTransaction(
      ADDR,
      1,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      "mine",
    );

    expect(without.error).not.toMatch(/same externalId/);
    expect(withId.error).toMatch(/externalId mine/);
  });
});

describe("calculateRewards", () => {
  it("returns a pending result", async () => {
    const sdk = makeSdk();
    sdk.getActiveBondsSorted = jest.fn().mockResolvedValue([1]);
    sdk.runNonceExclusive = jest.fn().mockRejectedValue(stillWaiting());

    const res = await sdk.calculateRewards();

    expectPending(res);
  });
});

describe("reward claims", () => {
  it("claimRewards returns a pending result and keeps the txids of legs already broadcast", async () => {
    const sdk = makeSdk();
    sdk.executeClaimCycle = jest
      .fn()
      .mockImplementationOnce(async (...args: any[]) => {
        args[7].push("leg-1-txid");
        return {};
      })
      .mockRejectedValueOnce(stillWaiting());

    const res = await sdk.claimRewards([1]);

    expectPending(res);
    expect(res.txHashes).toEqual(["leg-1-txid"]);
    expect(res.error).not.toMatch(/nothing was broadcast/i);
  });

  it("claimStxOnlyRewards returns a pending result and keeps the txids of legs already broadcast", async () => {
    const sdk = makeSdk();
    sdk.executeClaimCycle = jest
      .fn()
      .mockImplementationOnce(async (...args: any[]) => {
        args[7].push("leg-1-txid");
        return {};
      })
      .mockRejectedValueOnce(stillWaiting());

    const res = await sdk.claimStxOnlyRewards({ fromCycle: 3, toCycle: 4 });

    expectPending(res);
    expect(res.txHashes).toEqual(["leg-1-txid"]);
  });

  it("keeps the txids already broadcast on any other failure too", async () => {
    const sdk = makeSdk();
    sdk.executeClaimCycle = jest
      .fn()
      .mockImplementationOnce(async (...args: any[]) => {
        args[7].push("leg-1-txid");
        return {};
      })
      .mockRejectedValueOnce(new Error("node 503"));

    const res = await sdk.claimRewards([1]);

    expect(res.success).toBe(false);
    expect(res.txHashes).toEqual(["leg-1-txid"]);
  });
});
