/**
 * A lock-record store must apply read-modify-write as one step.
 *
 * Without `updateRecord`, the SDK falls back to a load followed by a save, which is the race
 * the atomic update exists to close: two writers read the same record and the later save
 * silently discards the earlier one. A store that cannot do it is refused when it is set.
 */

import { StacksSDK } from "../StacksSDK";

const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const makeSdk = (): any =>
  new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });

describe("setLockRecordStore", () => {
  it("refuses a store without updateRecord", () => {
    const sdk = makeSdk();

    expect(() =>
      sdk.setLockRecordStore({
        saveRecord: async () => {},
        loadRecord: async () => null,
        listRecords: async () => [],
      }),
    ).toThrow(/updateRecord/);
  });

  it("leaves the previous store in place when it refuses", () => {
    const sdk = makeSdk();
    const before = sdk.lockRecordStore;

    expect(() =>
      sdk.setLockRecordStore({ saveRecord: async () => {}, loadRecord: async () => null }),
    ).toThrow();

    expect(sdk.lockRecordStore).toBe(before);
  });

  it("accepts a store that implements updateRecord", () => {
    const sdk = makeSdk();
    const store = {
      saveRecord: async () => {},
      loadRecord: async () => null,
      updateRecord: async () => null,
    };

    sdk.setLockRecordStore(store);

    expect(sdk.lockRecordStore).toBe(store);
  });
});
