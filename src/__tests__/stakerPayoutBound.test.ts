/**
 * The staker payout leg is bounded by the chain's own entitlement (FBS-161 / D1).
 *
 * Client answer, 2026-09-22: "There should be no constant because POX5 should compute
 * the staker's entitlement itself. `settle-staker-rewards` computes
 * `get-earned-staker-rewards(manager, cycle, bond, staker)`, and the manager can only
 * pay that or less. After the first leg confirms, read that value and set leg 2 to
 * `willSendLte(read)`. It needs to cover user-entered managers, but it does so
 * automatically."
 *
 * Before this, leg 2 was bounded by `payoutPolicy.maxPayoutSats` from a registered
 * adapter, and a manager with no registered policy had its claim REFUSED outright. Since
 * `toFireblocksConfig` never forwarded `signerManagerAdapters`, no deployment could
 * register one — so reward claiming was refused for every manager. That is FBS-161's
 * headline symptom, and the bound is what it was blocked on.
 *
 * The read is promoted from a best-effort reporting call to a fund-safety-critical one:
 * without it there is no bound, so a failure must refuse rather than substitute.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchEarned: jest.fn(),
    fetchEarnedStakerRewards: jest.fn(),
  };
});

jest.mock("@stacks/transactions", () => {
  const actual = jest.requireActual("@stacks/transactions");
  return { ...actual, makeUnsignedContractCall: jest.fn() };
});

import { StacksSDK } from "../StacksSDK";
import { fetchEarned, fetchEarnedStakerRewards } from "@stacks/bitcoin-staking";
import { makeUnsignedContractCall } from "@stacks/transactions";

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const MANAGER_NAME = "signer-manager";
const MANAGER = `${BOOT_ADDR}.${MANAGER_NAME}`;
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

/** The post-conditions handed to the claim-staker-rewards call (leg 2). */
const legTwoPostConditions = (): any[] => {
  const calls = (makeUnsignedContractCall as jest.Mock).mock.calls;
  const leg2 = calls.find((c) => c[0].functionName === "claim-staker-rewards");
  return leg2 ? leg2[0].postConditions : [];
};

const makeSdk = (adapters: any[] = []): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
    signerManagerAdapters: adapters,
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
  sdk.waitForTxSettlement = jest.fn().mockResolvedValue(SETTLED_OK);
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
  (makeUnsignedContractCall as jest.Mock)
    .mockReset()
    .mockResolvedValue({ stub: "tx" });
  (fetchEarned as jest.Mock).mockReset().mockResolvedValue(BigInt(5_000));
  (fetchEarnedStakerRewards as jest.Mock)
    .mockReset()
    .mockResolvedValue(BigInt(4_321));
});

describe("claim-staker-rewards bound — from chain, not from a constant", () => {
  it("bounds the payout by the staker entitlement read from chain", async () => {
    const sdk = makeSdk();

    await runClaimCycle(sdk);

    const pcs = legTwoPostConditions();
    expect(pcs).toHaveLength(1);
    expect(pcs[0].condition).toBe("lte");
    expect(pcs[0].amount).toBe("4321");
    expect(pcs[0].address).toBe(MANAGER);
  });

  it("claims through a manager with no registered adapter at all", async () => {
    const sdk = makeSdk([]);

    const { outcome, results } = await runClaimCycle(sdk);

    // FBS-161's headline: every manager was refused here, because no deployment could
    // register a payout policy in the first place.
    expect(outcome.error).toBeUndefined();
    expect(results[0].status).toBe("claimed");
  });

  it("tracks the entitlement rather than a fixed ceiling", async () => {
    const sdk = makeSdk();
    (fetchEarnedStakerRewards as jest.Mock).mockResolvedValue(BigInt(99));

    await runClaimCycle(sdk);

    expect(legTwoPostConditions()[0].amount).toBe("99");
  });

  it("refuses without broadcasting leg 2 when the entitlement read fails", async () => {
    const sdk = makeSdk();
    (fetchEarnedStakerRewards as jest.Mock).mockRejectedValue(
      new Error("hiro 503"),
    );

    const { outcome, results } = await runClaimCycle(sdk);

    // No read means no bound. Broadcasting anyway is an unbounded sBTC payout under RAW
    // signing, where Fireblocks cannot see the payload.
    expect(outcome.error).toMatch(/unknown|could not read|entitlement/i);
    expect(legTwoPostConditions()).toHaveLength(0);
    expect(results[0].status).toBe("failed");
  });

  it("defaults the payout asset to the chain-resolved sBTC asset", async () => {
    const sdk = makeSdk();

    await runClaimCycle(sdk);

    expect(legTwoPostConditions()[0].asset).toBe(
      `${BOOT_ADDR}.sbtc-token::sbtc-token`,
    );
  });

  it("honours a registered adapter's asset override", async () => {
    const sdk = makeSdk([
      {
        contractPrincipal: MANAGER,
        payoutPolicy: {
          asset: {
            contractAddress: BOOT_ADDR,
            contractName: "other-token",
            assetName: "other-asset",
          },
        },
      },
    ]);

    await runClaimCycle(sdk);

    // The amount still comes from chain; only which token the manager pays in is
    // configurable, and getting it wrong aborts under Deny mode rather than overpaying.
    expect(legTwoPostConditions()[0].asset).toBe(
      `${BOOT_ADDR}.other-token::other-asset`,
    );
    expect(legTwoPostConditions()[0].amount).toBe("4321");
  });
});
