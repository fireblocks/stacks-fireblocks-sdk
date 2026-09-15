/**
 * `listBondLockRecords` — the SDK surface app issue 213 needs.
 *
 * Discovery must be possible from the staker address alone. A store that cannot
 * enumerate is refused outright rather than reported as "no records": returning an
 * empty list there would tell the operator no Bitcoin is committed when the truth is
 * that the store cannot answer the question.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return { ...actual };
});

import { StacksSDK } from "../StacksSDK";
import {
  BondLockRecord,
  InMemoryLockRecordStore,
} from "../staking/bonds/unlock-bytes-store";

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const makeRecord = (bondIndex: number): BondLockRecord => ({
  bondIndex,
  unlockBytes: new Uint8Array([1, 2, 3]),
  lockAddress: `bcrt1qlock${bondIndex}`,
  unlockHeight: 900 + bondIndex,
  amountSats: BigInt(100_000),
  isL1Lock: true,
  stage: "btc-confirmed",
});

const makeSdk = (): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  return sdk;
};

describe("StacksSDK.listBondLockRecords", () => {
  it("returns the caller's own lock records", async () => {
    const sdk = makeSdk();
    const store = new InMemoryLockRecordStore();
    await store.saveRecord(BOOT_ADDR, 4, makeRecord(4));
    await store.saveRecord(BOOT_ADDR, 5, makeRecord(5));
    sdk.setLockRecordStore(store);

    const res = await sdk.listBondLockRecords();

    expect(res.success).toBe(true);
    expect(res.data.map((r: BondLockRecord) => r.bondIndex).sort()).toEqual([
      4, 5,
    ]);
  });

  it("succeeds with an empty list when the staker genuinely has none", async () => {
    const sdk = makeSdk();
    sdk.setLockRecordStore(new InMemoryLockRecordStore());

    const res = await sdk.listBondLockRecords();

    expect(res.success).toBe(true);
    expect(res.data).toEqual([]);
  });

  it("refuses when the configured store cannot enumerate", async () => {
    const sdk = makeSdk();
    // A third-party store predating listRecords: absent, not empty.
    sdk.setLockRecordStore({
      saveRecord: async () => {},
      loadRecord: async () => null,
    });

    const res = await sdk.listBondLockRecords();

    expect(res.success).toBe(false);
    // "No records" would be a lie — the store cannot answer.
    expect(res.error).toMatch(/cannot enumerate|does not support/i);
  });

  it("reports a store read failure rather than an empty list", async () => {
    const sdk = makeSdk();
    sdk.setLockRecordStore({
      saveRecord: async () => {},
      loadRecord: async () => null,
      listRecords: async () => {
        throw new Error("store unreadable");
      },
    });

    const res = await sdk.listBondLockRecords();

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/store unreadable/);
  });
});
