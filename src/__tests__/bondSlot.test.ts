/**
 * One bond slot, one operation at a time.
 *
 * `createBond`, `renewBond`, `createSbtcBond` and `rollSbtcBond` each read the bond's lock
 * record, wait on a Fireblocks approval, and then write the record and commit funds. Two of
 * them for the same vault and bond inside one approval window both lock to the same address.
 * The SDK holds one instance per vault, so a slot per bond index on the instance refuses the
 * second call instead of letting it run.
 */

import { StacksSDK } from "../StacksSDK";

const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const IMPLS = [
  "createBondInSlot",
  "renewBondInSlot",
  "createSbtcBondInSlot",
  "rollSbtcBondInSlot",
] as const;

const deferred = () => {
  let resolve!: (v: unknown) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const makeSdk = (): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  for (const impl of IMPLS)
    sdk[impl] = jest.fn().mockResolvedValue({ success: true });
  return sdk;
};

const call = (sdk: any, method: string, bondIndex: number) => {
  switch (method) {
    case "createBond":
      return sdk.createBond(
        bondIndex,
        BigInt(100_000),
        "ST000000000000000000002AMW42H.signer-manager",
      );
    case "renewBond":
      return sdk.renewBond(
        bondIndex,
        "ST000000000000000000002AMW42H.signer-manager",
      );
    case "createSbtcBond":
      return sdk.createSbtcBond(
        bondIndex,
        BigInt(100_000),
        "ST000000000000000000002AMW42H.signer-manager",
      );
    default:
      return sdk.rollSbtcBond(
        bondIndex,
        BigInt(100_000),
        "ST000000000000000000002AMW42H.signer-manager",
      );
  }
};

const METHODS = ["createBond", "renewBond", "createSbtcBond", "rollSbtcBond"];

describe("bond slot", () => {
  it.each(
    METHODS.flatMap((first) =>
      METHODS.map((second) => [first, second] as const),
    ),
  )("%s holding bond 5 refuses %s on bond 5", async (first, second) => {
    const sdk = makeSdk();
    const hold = deferred();
    sdk[`${first}InSlot`].mockReturnValueOnce(hold.promise);

    const running = call(sdk, first, 5);
    const refused = await call(sdk, second, 5);

    expect(refused.success).toBe(false);
    expect(refused.error).toMatch(/bond 5/);
    expect(refused.error).toMatch(/already running/i);
    expect(sdk[`${second}InSlot`]).toHaveBeenCalledTimes(
      first === second ? 1 : 0,
    );

    hold.resolve({ success: true });
    await running;
  });

  it("lets a different bond index run", async () => {
    const sdk = makeSdk();
    const hold = deferred();
    sdk.renewBondInSlot.mockReturnValueOnce(hold.promise);

    const running = call(sdk, "renewBond", 5);
    const other = await call(sdk, "createBond", 6);

    expect(other.success).toBe(true);
    hold.resolve({ success: true });
    await running;
  });

  it("frees the slot when the operation finishes", async () => {
    const sdk = makeSdk();

    await call(sdk, "renewBond", 5);
    const next = await call(sdk, "createBond", 5);

    expect(next.success).toBe(true);
  });

  it("frees the slot when the operation throws", async () => {
    const sdk = makeSdk();
    sdk.renewBondInSlot.mockRejectedValueOnce(new Error("boom"));

    await expect(call(sdk, "renewBond", 5)).rejects.toThrow("boom");
    const next = await call(sdk, "createBond", 5);

    expect(next.success).toBe(true);
  });

  it("refuses resumeBondRegistration while createBond holds the bond", async () => {
    const sdk = makeSdk();
    const hold = deferred();
    sdk.createBondInSlot.mockReturnValueOnce(hold.promise);
    sdk.lockRecordStore.loadRecord = jest.fn().mockResolvedValue({
      bondIndex: 5,
      isL1Lock: true,
      btcTxid: "ab".repeat(32),
      amountSats: BigInt(100_000),
      signerManager: "ST000000000000000000002AMW42H.signer-manager",
    });
    sdk.address = "ST000000000000000000002AMW42H";

    const running = call(sdk, "createBond", 5);
    const resumed = await sdk.resumeBondRegistration(5);

    expect(resumed.success).toBe(false);
    expect(resumed.error).toMatch(/already running/i);
    hold.resolve({ success: true });
    await running;
  });
});
