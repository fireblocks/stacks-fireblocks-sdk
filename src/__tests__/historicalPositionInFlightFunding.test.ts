/**
 * A funding transfer that has not landed yet is not "recovered" (review item 6).
 *
 * With no recorded txid, `getHistoricalBondPosition` judged recovery by "is anything at the
 * lock address". A funding transfer still waiting on approval in Fireblocks has put
 * nothing there yet, so it read as `recovered: true` — and `getBondPosition`, which drops
 * recovered bonds, returned no trace of a bond whose Bitcoin is about to be locked.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchPoxInfo: jest.fn(),
    fetchBondMembership: jest.fn(),
    fetchBond: jest.fn(),
    buildLockScript: jest.fn(() => new Uint8Array([0x51])),
    buildLockAddress: jest.fn(() => "derived-lock-address"),
    computeBondUnlockHeight: jest.fn(() => 900),
  };
});

import { StacksSDK } from "../StacksSDK";
import {
  fetchPoxInfo,
  fetchBondMembership,
  fetchBond,
} from "@stacks/bitcoin-staking";

const { InMemoryLockRecordStore } = jest.requireActual(
  "../staking/bonds/unlock-bytes-store",
);

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const LOCK_ADDRESS = "bcrt1qlockaddress";
const BOND_INDEX = 4;
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const baseRecord = (over: Record<string, unknown> = {}) => ({
  bondIndex: BOND_INDEX,
  unlockBytes: new Uint8Array([1, 2, 3]),
  lockAddress: LOCK_ADDRESS,
  unlockHeight: 900,
  amountSats: BigInt(120_000),
  isL1Lock: true,
  ...over,
});

const realFetch = global.fetch;
const esploraReturns = (utxos: Array<{ txid: string; vout: number }>) => {
  global.fetch = (async () =>
    new Response(JSON.stringify(utxos), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
};

const makeSdk = async (record: Record<string, unknown>): Promise<any> => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.readBtcTipHeight = jest.fn().mockResolvedValue(800);
  sdk.setLockRecordStore(new InMemoryLockRecordStore());
  await sdk.lockRecordStore.saveRecord(BOOT_ADDR, BOND_INDEX, record);
  return sdk;
};

beforeEach(() => {
  (fetchPoxInfo as jest.Mock)
    .mockReset()
    .mockResolvedValue({ rewardCycleId: 10 });
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue(null);
  (fetchBond as jest.Mock)
    .mockReset()
    .mockResolvedValue({ earlyUnlockBytes: new Uint8Array([9]) });
});

afterEach(() => {
  global.fetch = realFetch;
});

describe("getHistoricalBondPosition — a funding transfer still in flight", () => {
  it("is not recovered while the transfer is pending and nothing has landed", async () => {
    const sdk = await makeSdk(
      baseRecord({ fireblocksId: "fb-pending", stage: "funding-requested" }),
    );
    esploraReturns([]);

    const res = await sdk.getHistoricalBondPosition(BOND_INDEX);

    expect(res.success).toBe(true);
    expect(res.data.recovered).toBeNull();
  });

  it("stays visible from getBondPosition's historical fallback rather than being dropped", async () => {
    const sdk = await makeSdk(
      baseRecord({ fireblocksId: "fb-pending", stage: "funding-requested" }),
    );
    esploraReturns([]);

    const out = await sdk.unrecoveredHistoricalBonds();

    expect(out.historical_bonds?.map((b: any) => b.bond_index)).toEqual([
      BOND_INDEX,
    ]);
  });

  it("still reports a funded lock that was spent as recovered", async () => {
    // The ordinary recovered case must be unaffected: recorded outpoint, no longer unspent.
    const sdk = await makeSdk(
      baseRecord({ btcTxid: "ab".repeat(32), vout: 0 }),
    );
    esploraReturns([]);

    const res = await sdk.getHistoricalBondPosition(BOND_INDEX);

    expect(res.data.recovered).toBe(true);
  });

  it("reports a transfer that already landed (txid not yet recorded) as still locked", async () => {
    const sdk = await makeSdk(
      baseRecord({ fireblocksId: "fb-landed", stage: "funding-requested" }),
    );
    esploraReturns([{ txid: "cd".repeat(32), vout: 0 }]);

    const res = await sdk.getHistoricalBondPosition(BOND_INDEX);

    expect(res.data.still_locked).toBe(true);
    expect(res.data.recovered).toBe(false);
  });
});
