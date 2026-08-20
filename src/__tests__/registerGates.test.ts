/**
 * Unit tests for the fund-moving gate logic added for the remediation review:
 *  - custodyRefundPostConditions: the pox-5→staker sBTC refund cover on zero-custody
 *    paths (stake / native createBond / renewBond);
 *  - revalidateRegisterForBond: the post-signing discard paths (eligibility change,
 *    custody drift, custody-appeared-on-first-registration).
 *
 * These exercise the REAL StacksSDK methods on a directly constructed instance, with
 * the Fireblocks service and the chain fetchers mocked — possible now that the jest
 * ESM transform lets StacksSDK import under the CJS test runtime.
 */

jest.mock("../services/fireblocks.service", () => ({
  FireblocksService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchPoxInfo: jest.fn(),
    fetchEligibleRegisterForBond: jest.fn(),
    fetchStakerCustodiedSbtc: jest.fn(),
  };
});

import { StacksSDK } from "../StacksSDK";
import {
  fetchPoxInfo,
  fetchEligibleRegisterForBond,
  fetchStakerCustodiedSbtc,
} from "@stacks/bitcoin-staking";

const mockPoxInfo = fetchPoxInfo as jest.Mock;
const mockEligible = fetchEligibleRegisterForBond as jest.Mock;
const mockCustodied = fetchStakerCustodiedSbtc as jest.Mock;

// The well-known all-zeros testnet boot address — valid c32, obviously non-secret.
const BOOT_ADDR = "ST000000000000000000002AMW42H";

const SBTC_ASSET = {
  contractAddress: BOOT_ADDR,
  contractName: "sbtc-token",
  assetName: "sbtc-token",
};

// Satisfies the "looks like an inline PEM" credential check (substring match only)
// without embedding a PEM-shaped literal — this is NOT key material.
const FAKE_INLINE_PEM = ["-----BEGIN", "PRIVATE KEY-----", "not-a-key", "-----END", "PRIVATE KEY-----"].join(" ");

function makeSdk(): any {
  // Private constructor; fake-but-shape-valid credentials (inline PEM skips fs).
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = "02".repeat(33 / 1).slice(0, 66);
  sdk.resolveSbtcAsset = jest.fn().mockResolvedValue(SBTC_ASSET);
  return sdk;
}

beforeEach(() => {
  mockPoxInfo.mockReset().mockResolvedValue({ rewardCycleId: 10 });
  mockEligible.mockReset().mockResolvedValue({ ok: true });
  mockCustodied.mockReset().mockResolvedValue(BigInt(0));
});

describe("custodyRefundPostConditions", () => {
  it("returns no conditions when the staker custodies no sBTC", async () => {
    const sdk = makeSdk();
    mockCustodied.mockResolvedValue(BigInt(0));
    const r = await sdk.custodyRefundPostConditions();
    expect(r.conditions).toHaveLength(0);
    expect(r.custodiedSats).toBe(BigInt(0));
    // The asset is not needed (and must not be required) when nothing is refunded.
    expect(sdk.resolveSbtcAsset).not.toHaveBeenCalled();
  });

  it("covers a non-zero custody with a pox-5-as-sender SentEq FT condition", async () => {
    const sdk = makeSdk();
    mockCustodied.mockResolvedValue(BigInt(250_000));
    const r = await sdk.custodyRefundPostConditions();
    expect(r.custodiedSats).toBe(BigInt(250_000));
    expect(r.conditions).toHaveLength(1);
    const pc: any = r.conditions[0];
    // Principal is the pox-5 boot contract (sender of the refund), amount is exact.
    expect(JSON.stringify(pc)).toContain("pox-5");
    expect(JSON.stringify(pc)).toContain("250000");
    expect(JSON.stringify(pc)).toContain(SBTC_ASSET.contractName);
  });

  it("refuses to build when custody is non-zero but the sBTC asset cannot resolve", async () => {
    const sdk = makeSdk();
    mockCustodied.mockResolvedValue(BigInt(1));
    sdk.resolveSbtcAsset = jest.fn().mockResolvedValue(null);
    await expect(sdk.custodyRefundPostConditions()).rejects.toThrow(/refusing to build/);
  });
});

describe("revalidateRegisterForBond (post-signing discard paths)", () => {
  const args = {
    bondIndex: 3,
    amountUstx: BigInt(1_000_000),
    satsTotal: BigInt(500_000),
    signerManager: `${BOOT_ADDR}.signer-manager`,
  };

  it("passes when eligibility holds and no custody guard is requested", async () => {
    const sdk = makeSdk();
    mockEligible.mockResolvedValue({ ok: true });
    await expect(sdk.revalidateRegisterForBond(args)).resolves.toBeUndefined();
    // Fresh poxInfo is fetched at revalidation time, never reused from a snapshot.
    expect(mockPoxInfo).toHaveBeenCalled();
    expect(mockEligible).toHaveBeenCalledWith(expect.objectContaining({ bondIndex: 3 }));
  });

  it("discards when eligibility changed during approval", async () => {
    const sdk = makeSdk();
    mockEligible.mockResolvedValue({ ok: false, reasons: [43] });
    const reason = await sdk.revalidateRegisterForBond(args);
    expect(reason).toMatch(/bond eligibility changed during approval/);
  });

  it("discards when custody drifted from the baked expectedCustodySats", async () => {
    const sdk = makeSdk();
    mockCustodied.mockResolvedValue(BigInt(777));
    const reason = await sdk.revalidateRegisterForBond({ ...args, expectedCustodySats: BigInt(0) });
    expect(reason).toMatch(/custodied sBTC changed during approval/);
  });

  it("passes when custody matches the baked expectedCustodySats", async () => {
    const sdk = makeSdk();
    mockCustodied.mockResolvedValue(BigInt(777));
    await expect(
      sdk.revalidateRegisterForBond({ ...args, expectedCustodySats: BigInt(777) }),
    ).resolves.toBeUndefined();
  });

  it("routes to rollSbtcBond when custody appears under requireZeroCustody", async () => {
    const sdk = makeSdk();
    mockCustodied.mockResolvedValue(BigInt(10));
    const reason = await sdk.revalidateRegisterForBond({ ...args, requireZeroCustody: true });
    expect(reason).toMatch(/use rollSbtcBond/);
  });

  it("threads the SPV outputs through the eligibility re-check", async () => {
    const sdk = makeSdk();
    const outputs = [{ height: 1, outputIndex: 0 } as any];
    await sdk.revalidateRegisterForBond({ ...args, outputs });
    expect(mockEligible).toHaveBeenCalledWith(expect.objectContaining({ outputs }));
  });
});

describe("nativeRecordOverwriteGuard (record-slot protection)", () => {
  const { InMemoryLockRecordStore } = jest.requireActual("../staking/bonds/unlock-bytes-store");
  const LOCK_ADDR = "tb1qlockaddr";
  const TXID = "cc".repeat(32);

  const baseRecord = (extra: Record<string, unknown> = {}) => ({
    bondIndex: 7,
    unlockBytes: new Uint8Array([1]),
    lockAddress: LOCK_ADDR,
    unlockHeight: 1000,
    amountSats: BigInt(100_000),
    isL1Lock: true,
    ...extra,
  });

  const withStore = async (record: Record<string, unknown> | null) => {
    const sdk = makeSdk();
    const store = new InMemoryLockRecordStore();
    if (record) await store.saveRecord(sdk.address, 7, record);
    sdk.setLockRecordStore(store);
    return sdk;
  };

  const mockUtxos = (utxos: Array<{ txid: string; vout: number }> | "http-fail") => {
    (global as any).fetch = jest.fn(async (url: string) => {
      if (String(url).includes("/utxo")) {
        if (utxos === "http-fail") return { ok: false, status: 502 } as any;
        return { ok: true, json: async () => utxos } as any;
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
  };

  it("passes with no record and with a non-L1 (sBTC) record", async () => {
    expect(await (await withStore(null)).nativeRecordOverwriteGuard(7)).toBeUndefined();
    expect(
      await (await withStore(baseRecord({ isL1Lock: false, btcTxid: TXID }))).nativeRecordOverwriteGuard(7),
    ).toBeUndefined();
  });

  it("refuses a funding-in-flight record (no txid yet, dedup key at risk)", async () => {
    const sdk = await withStore(baseRecord({ stage: "funding-requested", fundingExternalId: "ext-1" }));
    expect(await sdk.nativeRecordOverwriteGuard(7)).toMatch(/funding request in flight/);
  });

  it("passes a txid-less record at a pre-funding stage", async () => {
    const sdk = await withStore(baseRecord({ stage: "lock-fixed" }));
    expect(await sdk.nativeRecordOverwriteGuard(7)).toBeUndefined();
  });

  it("exempts the SAME lock address (those flows own their resume logic)", async () => {
    const sdk = await withStore(baseRecord({ btcTxid: TXID, vout: 0 }));
    expect(await sdk.nativeRecordOverwriteGuard(7, LOCK_ADDR)).toBeUndefined();
  });

  it("refuses while the recorded outpoint is unspent", async () => {
    const sdk = await withStore(baseRecord({ btcTxid: TXID, vout: 0 }));
    mockUtxos([{ txid: TXID, vout: 0 }]);
    expect(await sdk.nativeRecordOverwriteGuard(7)).toMatch(/STILL-LOCKED/);
  });

  it("refuses when a stale txid hides real BTC at the address (any-UTXO fallback)", async () => {
    const sdk = await withStore(baseRecord({ btcTxid: TXID, vout: 0 }));
    mockUtxos([{ txid: "dd".repeat(32), vout: 1 }]);
    expect(await sdk.nativeRecordOverwriteGuard(7)).toMatch(/STILL-LOCKED/);
  });

  it("passes once the lock address is fully spent (recovered)", async () => {
    const sdk = await withStore(baseRecord({ btcTxid: TXID, vout: 0 }));
    mockUtxos([]);
    expect(await sdk.nativeRecordOverwriteGuard(7)).toBeUndefined();
  });

  it("refuses on an unreadable Bitcoin state (UNKNOWN, never safe)", async () => {
    const sdk = await withStore(baseRecord({ btcTxid: TXID, vout: 0 }));
    mockUtxos("http-fail");
    expect(await sdk.nativeRecordOverwriteGuard(7)).toMatch(/UNKNOWN/);
  });

  it("refuses on an unreadable store (fail closed)", async () => {
    const sdk = makeSdk();
    sdk.setLockRecordStore({
      saveRecord: async () => {},
      loadRecord: async () => { throw new Error("EIO"); },
    });
    expect(await sdk.nativeRecordOverwriteGuard(7)).toMatch(/store unreadable/);
  });
});

describe("calculationHeight (FBS-41 distribution snapshot)", () => {
  // private-1-like parameters: F=0, L=20 → distribution half-cycle H=10.
  const F = 0;
  const L = 20;
  const H = Math.floor(L / 2);
  const makePox = (currentBurnchainBlockHeight: number): any => ({
    firstBurnchainBlockHeight: F,
    rewardCycleLength: L,
    currentBurnchainBlockHeight,
    rewardCycleId: Math.floor((currentBurnchainBlockHeight - F) / L),
  });

  it("lands one block before the current distribution boundary, in BOTH cycle halves", () => {
    const sdk = makeSdk();
    // First half (h=203, dist cycle 20 starts at 200) and second half (h=215, dist
    // cycle 21 starts at 210) of reward cycle 10 — the earlier reward-cycle-start
    // formula could only ever express the even (first-half) boundary.
    for (const h of [203, 215, 229, 200, 210]) {
      const calc = sdk.calculationHeight(makePox(h));
      // Exactly one block before a distribution boundary…
      expect((calc + 1 - F) % H).toBe(0);
      // …the CURRENT one (the boundary at or below h).
      expect(calc).toBe(F + Math.floor((h - F) / H) * H - 1);
    }
  });

  it("never emits the old reward-cycle-start value (which matched no valid height)", () => {
    const sdk = makeSdk();
    for (const h of [203, 215]) {
      const pox = makePox(h);
      const old = F + pox.rewardCycleId * L;
      expect(sdk.calculationHeight(pox)).not.toBe(old);
    }
  });
});
