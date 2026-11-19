/**
 * The lockup proof and the recovery record identify the output the caller selected.
 *
 * `buildLockProof` in @stacks/bitcoin-staking picks the first output whose script matches and
 * takes the amount from it; it has no vout parameter. A transaction that pays the lock script
 * more than once would be proven, and recorded, against the first payment whichever one the
 * caller meant. The SDK parses the transaction itself, checks the selected output, and
 * overrides the dependency's index and amount; an ambiguous transaction with no selection is
 * refused.
 */

jest.mock("../services/fireblocks.service", () => {
  const actual = jest.requireActual("../services/fireblocks.service");
  return {
    FireblocksService: Object.assign(
      jest.fn().mockImplementation(() => ({})),
      {
        isTerminalTransferFailure:
          actual.FireblocksService.isTerminalTransferFailure,
        isDuplicateExternalIdError: () => false,
      },
    ),
  };
});

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchBondAllowance: jest.fn(),
    fetchPoxInfo: jest.fn(),
    fetchBond: jest.fn(),
    minUstxForSatsAmount: jest.fn(),
    fetchAccountStatus: jest.fn(),
    fetchEligibleRegisterForBond: jest.fn(),
    firstPox5RewardCycle: jest.fn(),
    buildRegisterMetadata: jest.fn(),
    bondPeriodToRewardCycle: jest.fn(),
    fetchConstructLockupOutputScript: jest.fn(),
    fetchBondMembership: jest.fn(),
  };
});

jest.mock("@stacks/transactions", () => {
  const actual = jest.requireActual("@stacks/transactions");
  return { ...actual, fetchCallReadOnlyFunction: jest.fn() };
});

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as btc from "@scure/btc-signer";
import { bytesToHex } from "@stacks/common";
import { StacksSDK } from "../StacksSDK";
import { InMemoryLockRecordStore } from "../staking/bonds/unlock-bytes-store";
import { FileLockRecordStore } from "../staking/bonds/file-lock-record-store";
import {
  fetchBondAllowance,
  fetchPoxInfo,
  fetchBond,
  minUstxForSatsAmount,
  fetchAccountStatus,
  fetchEligibleRegisterForBond,
  firstPox5RewardCycle,
  buildRegisterMetadata,
  bondPeriodToRewardCycle,
  fetchConstructLockupOutputScript,
  fetchBondMembership,
} from "@stacks/bitcoin-staking";
import { fetchCallReadOnlyFunction } from "@stacks/transactions";

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const MANAGER = `${BOOT_ADDR}.signer-manager`;
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");
const BOND_INDEX = 4;
const LOCK_ADDRESS = "lock-address-under-test";
const LOCK_SCRIPT = new Uint8Array([0x00, 0x20, ...new Array(32).fill(0xab)]);
const OTHER_SCRIPT = new Uint8Array([0x00, 0x20, ...new Array(32).fill(0xcd)]);
const LOCK_SCRIPT_HEX = Buffer.from(LOCK_SCRIPT).toString("hex");
const FUNDING_TXID = "ab".repeat(32);
const SMALL = BigInt(1_000);
const LARGE = BigInt(10_000);

/** A transaction paying the given outputs, serialized the way Esplora returns it. */
const txPaying = (
  outputs: Array<{ amount: bigint; script?: Uint8Array }>,
): string => {
  const tx = new btc.Transaction({
    allowUnknownOutputs: true,
    disableScriptCheck: true,
  });
  tx.addInput({ txid: "11".repeat(32), index: 0, sequence: 0xfffffffd });
  for (const o of outputs)
    tx.addOutput({ script: o.script ?? LOCK_SCRIPT, amount: o.amount });
  return bytesToHex(tx.toBytes(true, false));
};

/** Esplora answers for the funding transaction `txHex`. */
const serveEsplora = (txHex: string) => {
  (global as any).fetch = jest.fn(async (url: string) => {
    if (url.endsWith("/hex")) return { text: async () => txHex };
    if (url.endsWith("/header")) return { text: async () => "00".repeat(80) };
    if (url.endsWith("/merkle-proof"))
      return { json: async () => ({ block_height: 100, merkle: [], pos: 0 }) };
    return { json: async () => ({ tx_count: 1 }) };
  });
};

const realFetch = global.fetch;

const makeSdk = (): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  sdk.setLockRecordStore(new InMemoryLockRecordStore());
  sdk.assertDurableLockStore = jest.fn().mockResolvedValue(undefined);
  sdk.signerManagerAllowedError = jest.fn().mockReturnValue(undefined);
  sdk.nativeRecordOverwriteGuard = jest.fn().mockResolvedValue(undefined);
  sdk.resolveBondStxAmount = jest
    .fn()
    .mockReturnValue({ amountUstx: BigInt(1_000) });
  sdk.fireblocksService = {
    createBitcoinTransaction: jest.fn(),
    awaitBitcoinTransaction: jest.fn(),
    findBitcoinTransactionByExternalId: jest.fn(),
    getTransferState: jest.fn(),
  };
  sdk.getBtcTxStatus = jest
    .fn()
    .mockResolvedValue({ success: true, data: { found: true } });
  sdk.waitForBtcConfirmations = jest
    .fn()
    .mockResolvedValue({ blockHash: "bh" });
  return sdk;
};

const seedFunded = (sdk: any, over: Record<string, unknown> = {}) =>
  sdk.lockRecordStore.saveRecord(sdk.address, BOND_INDEX, {
    bondIndex: BOND_INDEX,
    unlockBytes: new Uint8Array([1, 2, 3]),
    lockAddress: LOCK_ADDRESS,
    unlockHeight: 900,
    amountSats: LARGE,
    isL1Lock: true,
    signerManager: MANAGER,
    btcTxid: FUNDING_TXID,
    stage: "btc-confirmed",
    ...over,
  });

const readRecord = (sdk: any) =>
  sdk.lockRecordStore.loadRecord(sdk.address, BOND_INDEX);

/** The proof handed to the contract-gate preflight, which stops the flow after the record is written. */
let proofs: any[];

beforeEach(() => {
  proofs = [];
  (fetchBondAllowance as jest.Mock)
    .mockReset()
    .mockResolvedValue(BigInt(10_000_000));
  (fetchPoxInfo as jest.Mock)
    .mockReset()
    .mockResolvedValue({ rewardCycleId: 10 });
  (fetchBond as jest.Mock)
    .mockReset()
    .mockResolvedValue({
      stxValueRatio: BigInt(1),
      minUstxRatioBps: BigInt(1),
      earlyUnlockBytes: "aabb",
    });
  (minUstxForSatsAmount as jest.Mock)
    .mockReset()
    .mockReturnValue(BigInt(1_000));
  (fetchAccountStatus as jest.Mock)
    .mockReset()
    .mockResolvedValue({ balance: BigInt(1_000_000_000), locked: BigInt(0) });
  (fetchEligibleRegisterForBond as jest.Mock)
    .mockReset()
    .mockImplementation(async (args: any) => {
      if (args.outputs) {
        proofs.push(...args.outputs);
        return { ok: false, reasons: [] };
      }
      return { ok: true };
    });
  (firstPox5RewardCycle as jest.Mock).mockReset().mockReturnValue(1);
  (bondPeriodToRewardCycle as jest.Mock).mockReset().mockReturnValue(12);
  (buildRegisterMetadata as jest.Mock).mockReset().mockReturnValue({
    unlockBytes: new Uint8Array([1, 2, 3]),
    lockAddress: LOCK_ADDRESS,
    unlockHeight: 900,
    outputScript: LOCK_SCRIPT,
  });
  (fetchCallReadOnlyFunction as jest.Mock)
    .mockReset()
    .mockResolvedValue({
      type: "ok",
      value: { type: "buffer", value: LOCK_SCRIPT_HEX },
    });
  (fetchConstructLockupOutputScript as jest.Mock)
    .mockReset()
    .mockResolvedValue(LOCK_SCRIPT);
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue(null);
});

afterEach(() => {
  global.fetch = realFetch;
});

describe("assembleLockupProof — output selection", () => {
  const assemble = (
    sdk: any,
    selection?: { vout?: number; expectedAmountSats?: bigint },
  ) => sdk.assembleLockupProof(FUNDING_TXID, "bh", LOCK_SCRIPT, 900, selection);

  it("proves the selected output when one transaction pays the lock script twice", async () => {
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));

    const proof = await assemble(makeSdk(), {
      vout: 1,
      expectedAmountSats: LARGE,
    });

    expect(proof.outputIndex).toBe(1);
    expect(proof.amount).toBe(LARGE);
  });

  it("proves the first of two equal payments when that one is selected", async () => {
    serveEsplora(txPaying([{ amount: LARGE }, { amount: LARGE }]));

    const proof = await assemble(makeSdk(), {
      vout: 0,
      expectedAmountSats: LARGE,
    });

    expect(proof.outputIndex).toBe(0);
  });

  it("refuses an ambiguous transaction when no output is selected", async () => {
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));

    await expect(
      assemble(makeSdk(), { expectedAmountSats: LARGE }),
    ).rejects.toThrow(/more than one output.*btcVout/i);
    await expect(assemble(makeSdk())).rejects.toThrow(/more than one output/i);
  });

  it("keeps today's behaviour for a transaction with exactly one matching output", async () => {
    serveEsplora(
      txPaying([{ amount: SMALL, script: OTHER_SCRIPT }, { amount: LARGE }]),
    );

    const proof = await assemble(makeSdk(), { expectedAmountSats: LARGE });

    expect(proof.outputIndex).toBe(1);
    expect(proof.amount).toBe(LARGE);
  });

  it("refuses the single matching output when it pays another amount than expected", async () => {
    serveEsplora(txPaying([{ amount: SMALL }]));

    await expect(
      assemble(makeSdk(), { expectedAmountSats: LARGE }),
    ).rejects.toThrow(/pays 1000 sats but expected 10000 sats/i);
  });

  it("accepts the single matching output when it pays exactly the expected amount", async () => {
    serveEsplora(txPaying([{ amount: LARGE }]));

    const proof = await assemble(makeSdk(), { expectedAmountSats: LARGE });

    expect(proof.outputIndex).toBe(0);
    expect(proof.amount).toBe(LARGE);
  });

  it("does not check the amount when none is expected", async () => {
    serveEsplora(txPaying([{ amount: SMALL }]));

    const proof = await assemble(makeSdk());

    expect(proof.amount).toBe(SMALL);
  });

  it("refuses a selected output that pays another script", async () => {
    serveEsplora(
      txPaying([{ amount: LARGE, script: OTHER_SCRIPT }, { amount: LARGE }]),
    );

    await expect(
      assemble(makeSdk(), { vout: 0, expectedAmountSats: LARGE }),
    ).rejects.toThrow(/does not pay/i);
  });

  it("refuses a selected output that does not exist", async () => {
    serveEsplora(txPaying([{ amount: LARGE }]));

    await expect(
      assemble(makeSdk(), { vout: 3, expectedAmountSats: LARGE }),
    ).rejects.toThrow(/has no output 3/i);
  });

  it("refuses a selected output whose value is not the expected amount", async () => {
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));

    await expect(
      assemble(makeSdk(), { vout: 0, expectedAmountSats: LARGE }),
    ).rejects.toThrow(/expected 10000/i);
  });
});

describe("resumeBondRegistration — the selected output reaches the proof and the record", () => {
  it("proves and records output 1 at 10,000 sats when it is selected", async () => {
    // One transaction pays the lock script 1,000 sats at vout 0 and 10,000 sats at vout 1.
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    await seedFunded(sdk);

    await sdk.resumeBondRegistration(BOND_INDEX, { btcVout: 1 });

    expect(proofs).toHaveLength(1);
    expect(proofs[0].outputIndex).toBe(1);
    expect(proofs[0].amount).toBe(LARGE);
    const record = await readRecord(sdk);
    expect(record.vout).toBe(1);
    expect(record.amountSats).toBe(LARGE);
    expect(record.stage).toBe("proof-built");
  });

  it("refuses an ambiguous funding with no selection, before any registration", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    await seedFunded(sdk);

    const res = await sdk.resumeBondRegistration(BOND_INDEX);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/btcVout/);
    expect(res.btcTxid).toBe(FUNDING_TXID);
    expect(proofs).toHaveLength(0);
    expect((await readRecord(sdk)).vout).toBeUndefined();
  });

  it("refuses a selection of the smaller payment when the record's amount is the larger", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    await seedFunded(sdk);

    const res = await sdk.resumeBondRegistration(BOND_INDEX, { btcVout: 0 });

    expect(res.success).toBe(false);
    expect(res.fundingBlocked).toBe(true);
    expect(proofs).toHaveLength(0);
    expect((await readRecord(sdk)).stage).toBe("btc-confirmed");
  });

  it("does not trust a recorded vout that was only a selection: it is checked like an explicit one", async () => {
    // The selection of output 0 was recorded at confirmation, then refused when the proof was
    // built. A later resume with no btcVout must not treat it as verified.
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    await seedFunded(sdk, { selectedVout: 0, stage: "btc-confirmed" });

    const res = await sdk.resumeBondRegistration(BOND_INDEX);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/pays 1000 sats but expected 10000 sats/);
    expect(proofs).toHaveLength(0);
  });

  it("uses the vout already on the record when none is supplied", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    await seedFunded(sdk, { selectedVout: 1 });

    await sdk.resumeBondRegistration(BOND_INDEX);

    expect(proofs[0].outputIndex).toBe(1);
    expect((await readRecord(sdk)).vout).toBe(1);
  });

  it("does not re-check the amount of an output whose proof was already built", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    await seedFunded(sdk, { vout: 0, stage: "proof-built" });

    await sdk.resumeBondRegistration(BOND_INDEX);

    expect(proofs[0].outputIndex).toBe(0);
    expect(proofs[0].amount).toBe(SMALL);
  });

  it("lets an explicit vout replace the recorded one before any registration was submitted", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: LARGE }, { amount: LARGE }]));
    await seedFunded(sdk, { selectedVout: 0 });

    await sdk.resumeBondRegistration(BOND_INDEX, { btcVout: 1 });

    expect(proofs[0].outputIndex).toBe(1);
    expect((await readRecord(sdk)).vout).toBe(1);
  });

  it("refuses an explicit vout that contradicts the record once a registration was submitted", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: LARGE }, { amount: LARGE }]));
    await seedFunded(sdk, { vout: 1, stage: "registration-submitted" });

    const res = await sdk.resumeBondRegistration(BOND_INDEX, { btcVout: 0 });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/registration/i);
    expect(proofs).toHaveLength(0);
    expect((await readRecord(sdk)).vout).toBe(1);
  });

  it("leaves a proven outpoint as it was when an explicit btcVout is refused for its amount", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    await seedFunded(sdk, { vout: 1, stage: "proof-built" });

    const refused = await sdk.resumeBondRegistration(BOND_INDEX, { btcVout: 0 });

    expect(refused.success).toBe(false);
    const record = await readRecord(sdk);
    expect(record.vout).toBe(1);
    expect(record.selectedVout).toBeUndefined();

    await sdk.resumeBondRegistration(BOND_INDEX);

    expect(proofs).toHaveLength(1);
    expect(proofs[0].outputIndex).toBe(1);
    expect(proofs[0].amount).toBe(LARGE);
  });

  it("leaves a proven outpoint as it was when an explicit btcVout names an output paying another script", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: LARGE }, { amount: SMALL, script: OTHER_SCRIPT }]));
    await seedFunded(sdk, { vout: 0, stage: "proof-built" });

    const refused = await sdk.resumeBondRegistration(BOND_INDEX, { btcVout: 1 });

    expect(refused.success).toBe(false);
    const record = await readRecord(sdk);
    expect(record.vout).toBe(0);
    expect(record.selectedVout).toBeUndefined();
  });

  it("keeps an unproven selection out of vout, which only ever names a proven outpoint", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    await seedFunded(sdk);

    const refused = await sdk.resumeBondRegistration(BOND_INDEX, { btcVout: 0 });

    expect(refused.success).toBe(false);
    const record = await readRecord(sdk);
    expect(record.vout).toBeUndefined();
    expect(record.selectedVout).toBe(0);
    expect(record.stage).toBe("btc-confirmed");
  });

  it("refuses a single matching output that pays another amount than the record, before any registration", async () => {
    // The only output paying the lock carries 1,000 sats against a record of 10,000: registering
    // would credit 1,000.
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }]));
    await seedFunded(sdk);

    const res = await sdk.resumeBondRegistration(BOND_INDEX);

    expect(res.success).toBe(false);
    expect(res.fundingBlocked).toBe(true);
    expect(res.btcTxid).toBe(FUNDING_TXID);
    expect(res.error).toMatch(/1000/);
    expect(res.error).toMatch(/10000/);
    expect(res.error).toMatch(/no registration was attempted/i);
    expect(res.error).toMatch(/unlockMaturedBond/);
    expect(proofs).toHaveLength(0);
    expect((await readRecord(sdk)).vout).toBeUndefined();
  });

  it("registers a single matching output that pays exactly the record's amount", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: LARGE }]));
    await seedFunded(sdk);

    await sdk.resumeBondRegistration(BOND_INDEX);

    expect(proofs).toHaveLength(1);
    expect(proofs[0].amount).toBe(LARGE);
  });

  it("flags an ambiguous funding as committed Bitcoin, not as a plain failure", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    await seedFunded(sdk);

    const res = await sdk.resumeBondRegistration(BOND_INDEX);

    expect(res.fundingBlocked).toBe(true);
    expect(res.error).toMatch(/no registration was attempted/i);
  });

  it("does not change what a single-payment funding records", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: LARGE }]));
    await seedFunded(sdk);

    await sdk.resumeBondRegistration(BOND_INDEX);

    expect(proofs[0].outputIndex).toBe(0);
    expect((await readRecord(sdk)).vout).toBe(0);
  });

  it.each([
    [-1],
    [1.5],
    [Number.NaN],
    [0x100000000],
    [Number.MAX_SAFE_INTEGER + 2],
  ])(
    "rejects an invalid btcVout (%p) before reading the chain",
    async (btcVout) => {
      const sdk = makeSdk();
      serveEsplora(txPaying([{ amount: LARGE }]));
      await seedFunded(sdk);

      const res = await sdk.resumeBondRegistration(BOND_INDEX, { btcVout });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/btcVout/);
      expect((global as any).fetch).not.toHaveBeenCalled();
    },
  );

  it("createBond takes the same selection for a caller-supplied funding", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));

    await sdk.createBond(BOND_INDEX, LARGE, MANAGER, {
      btcTxid: FUNDING_TXID,
      btcVout: 1,
    });

    expect(proofs[0].outputIndex).toBe(1);
    expect(proofs[0].amount).toBe(LARGE);
    expect((await readRecord(sdk)).vout).toBe(1);
  });

  it("refuses btcVout before any Bitcoin moves when there is no funding transaction to select from", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));

    const res = await sdk.createBond(BOND_INDEX, LARGE, MANAGER, { btcVout: 1 });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/btcVout/);
    expect(res.error).toMatch(/No Bitcoin was sent/);
    expect(sdk.fireblocksService.createBitcoinTransaction).not.toHaveBeenCalled();
    expect(await readRecord(sdk)).toBeNull();
  });

  it("accepts btcVout when the record already names the funding transaction", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    await seedFunded(sdk);

    await sdk.createBond(BOND_INDEX, LARGE, MANAGER, { btcVout: 1 });

    expect(proofs[0].outputIndex).toBe(1);
  });

  it("persists a caller-supplied selection with the funding txid before the proof is built", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    sdk.waitForBtcConfirmations = jest
      .fn()
      .mockRejectedValue(new Error("stop-before-proof"));

    await sdk.createBond(BOND_INDEX, LARGE, MANAGER, {
      btcTxid: FUNDING_TXID,
      btcVout: 1,
    });

    const record = await readRecord(sdk);
    expect(record.btcTxid).toBe(FUNDING_TXID);
    expect(record.selectedVout).toBe(1);
    expect(record.vout).toBeUndefined();
  });
});

describe("createBond — what a refused lockup output tells the caller to do", () => {
  // Before registration there is no bond membership, so no early exit can have been announced
  // and spendEarlyExitUtxo cannot apply to this Bitcoin.
  const refusal = async (
    outputs: Array<{ amount: bigint; script?: Uint8Array }>,
    resumeOpts?: { btcVout: number },
  ) => {
    const sdk = makeSdk();
    serveEsplora(txPaying(outputs));
    await seedFunded(sdk);
    return sdk.resumeBondRegistration(BOND_INDEX, resumeOpts);
  };

  it("an ambiguous transaction: resume with the output to use, naming the outputs that pay the lock script", async () => {
    const res = await refusal([{ amount: SMALL }, { amount: LARGE }]);

    expect(res.error).toContain(
      `resumeBondRegistration(${BOND_INDEX}, { btcVout: <correct output> })`,
    );
    expect(res.error).toContain("outputs 0, 1 pay the lock script");
    expect(res.error).not.toMatch(/spendEarlyExitUtxo|unlockMaturedBond/);
  });

  it("a btcVout that pays another script: resume with an output that pays this one", async () => {
    const res = await refusal(
      [{ amount: LARGE, script: OTHER_SCRIPT }, { amount: LARGE }],
      { btcVout: 0 },
    );

    expect(res.error).toContain("output 1 pays the lock script");
    expect(res.error).toContain("resumeBondRegistration");
    expect(res.error).not.toMatch(/spendEarlyExitUtxo|unlockMaturedBond/);
  });

  it("a btcVout that does not exist: resume with an output that pays the lock script", async () => {
    const res = await refusal([{ amount: LARGE }], { btcVout: 3 });

    expect(res.error).toMatch(/has no output 3/);
    expect(res.error).toContain("output 0 pays the lock script");
    expect(res.error).not.toMatch(/spendEarlyExitUtxo|unlockMaturedBond/);
  });

  it("an amount mismatch with no output of the right amount: the Bitcoin stays locked until the unlock", async () => {
    const res = await refusal([{ amount: SMALL }]);

    expect(res.error).toContain(
      "stays locked until unlockMaturedBond after its unlock height",
    );
    expect(res.error).not.toMatch(/spendEarlyExitUtxo|resumeBondRegistration/);
  });

  it("an amount mismatch on the chosen output while another carries the right amount: resume with that one", async () => {
    const res = await refusal([{ amount: SMALL }, { amount: LARGE }], {
      btcVout: 0,
    });

    expect(res.error).toContain(
      "output 1 pays the expected amount to the lock script",
    );
    expect(res.error).toContain("resumeBondRegistration");
    expect(res.error).not.toMatch(/spendEarlyExitUtxo|unlockMaturedBond/);
  });

  it("an amount mismatch on the chosen output with no output of the right amount: the Bitcoin stays locked", async () => {
    const res = await refusal([{ amount: SMALL }, { amount: SMALL }], {
      btcVout: 0,
    });

    expect(res.error).toContain(
      "stays locked until unlockMaturedBond after its unlock height",
    );
    expect(res.error).not.toMatch(/spendEarlyExitUtxo|resumeBondRegistration/);
  });
});

describe("the SPV proof preflight refusal names only what applies before registration", () => {
  // The proof preflight is the first contract gate that carries the output; before a
  // registration there is no bond membership, so early exit cannot apply.
  it("createBond: only unlockMaturedBond, after the unlock height", async () => {
    const sdk = makeSdk();
    serveEsplora(txPaying([{ amount: LARGE }]));
    await seedFunded(sdk);

    const res = await sdk.resumeBondRegistration(BOND_INDEX);

    expect(res.error).toContain("SPV proof preflight failed for bond");
    expect(res.error).toContain(
      "BTC is locked; recover via unlockMaturedBond after the unlock height",
    );
    expect(res.error).not.toMatch(/spendEarlyExitUtxo/);
  });

  it("renewBond: only unlockMaturedBond, after the unlock height", async () => {
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest.fn(async (fn: any) => fn());
    sdk.assembleLockupProof = jest
      .fn()
      .mockResolvedValue({ outputIndex: 0, amount: LARGE });
    await seedFunded(sdk, { lockAddress: LOCK_ADDRESS });

    const res = await sdk.renewBond(BOND_INDEX, MANAGER, {
      rewardBtcAddress: "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
      rewardMaxFeeSats: BigInt(5_000),
    });

    expect(res.error).toContain("SPV proof preflight failed for bond");
    expect(res.error).toContain(
      "BTC re-locked; recover via unlockMaturedBond after the unlock height",
    );
    expect(res.error).not.toMatch(/spendEarlyExitUtxo/);
  });
});

describe("a caller-supplied funding keeps its selected output across a crash", () => {
  let dir: string;
  let file: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "lockup-vout-"));
    file = path.join(dir, "locks.json");
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("records the selection at confirmation, so a resume after a crash proves the same output", async () => {
    serveEsplora(txPaying([{ amount: SMALL }, { amount: LARGE }]));
    const first = makeSdk();
    first.setLockRecordStore(new FileLockRecordStore(file));
    first.assembleLockupProof = jest
      .fn()
      .mockRejectedValue(new Error("crash while assembling the proof"));

    await first.createBond(BOND_INDEX, LARGE, MANAGER, {
      btcTxid: FUNDING_TXID,
      btcVout: 1,
    });

    const stored = await new FileLockRecordStore(file).loadRecord(
      BOOT_ADDR,
      BOND_INDEX,
    );
    expect(stored?.stage).toBe("btc-confirmed");
    expect(stored?.selectedVout).toBe(1);
    expect(stored?.vout).toBeUndefined();

    const second = makeSdk();
    second.setLockRecordStore(new FileLockRecordStore(file));
    await second.resumeBondRegistration(BOND_INDEX);

    expect(proofs).toHaveLength(1);
    expect(proofs[0].outputIndex).toBe(1);
    expect(proofs[0].amount).toBe(LARGE);
  });
});

describe("renewBond — the selection follows the recorded re-lock", () => {
  it("proves the recorded output without re-checking its amount once its proof was built", async () => {
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest.fn(async (fn: any) => fn());
    sdk.assembleLockupProof = jest.fn().mockResolvedValue({ outputIndex: 1 });
    await seedFunded(sdk, {
      bondIndex: BOND_INDEX,
      vout: 1,
      lockAddress: LOCK_ADDRESS,
      stage: "proof-built",
    });

    await sdk.renewBond(BOND_INDEX, MANAGER, {
      rewardBtcAddress: "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
      rewardMaxFeeSats: BigInt(5_000),
    });

    expect(sdk.assembleLockupProof).toHaveBeenCalledWith(
      FUNDING_TXID,
      "bh",
      LOCK_SCRIPT,
      900,
      { vout: 1, expectedAmountSats: undefined },
    );
  });

  it("checks the amount of a recorded output whose proof was not yet built", async () => {
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest.fn(async (fn: any) => fn());
    sdk.assembleLockupProof = jest.fn().mockResolvedValue({ outputIndex: 1 });
    await seedFunded(sdk, {
      bondIndex: BOND_INDEX,
      selectedVout: 1,
      lockAddress: LOCK_ADDRESS,
    });

    await sdk.renewBond(BOND_INDEX, MANAGER, {
      rewardBtcAddress: "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
      rewardMaxFeeSats: BigInt(5_000),
    });

    expect(sdk.assembleLockupProof.mock.calls[0][4]).toEqual({
      vout: 1,
      expectedAmountSats: LARGE,
    });
  });

  it("a refused output says the Bitcoin is re-locked and names the resume call", async () => {
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest.fn(async (fn: () => Promise<unknown>) => fn());
    serveEsplora(txPaying([{ amount: LARGE }, { amount: SMALL, script: OTHER_SCRIPT }]));
    await seedFunded(sdk, {
      bondIndex: BOND_INDEX,
      lockAddress: LOCK_ADDRESS,
    });

    const res = await sdk.renewBond(BOND_INDEX, MANAGER, {
      btcVout: 1,
      rewardBtcAddress: "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
      rewardMaxFeeSats: BigInt(5_000),
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Output 1 of .* does not pay this bond's lock script; outputs 0 do/);
    expect(res.error).toMatch(/No registration was attempted; the Bitcoin is re-locked into bond 4's lock/);
    expect(res.error).toMatch(/resumeBondRegistration\(4, \{ btcVout: <correct output> \}\); output 0 pays the lock script/);
    expect(res.error).not.toMatch(/^Failed to renew bond/);
    expect(res.btcTxid).toBe(FUNDING_TXID);
    expect(proofs).toHaveLength(0);
  });

  it("forwards an explicit btcVout", async () => {
    const sdk = makeSdk();
    sdk.runNonceExclusive = jest.fn(async (fn: any) => fn());
    sdk.assembleLockupProof = jest.fn().mockResolvedValue({ outputIndex: 0 });
    await seedFunded(sdk, { lockAddress: LOCK_ADDRESS });

    await sdk.renewBond(BOND_INDEX, MANAGER, {
      btcVout: 0,
      rewardBtcAddress: "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
      rewardMaxFeeSats: BigInt(5_000),
    });

    expect(sdk.assembleLockupProof.mock.calls[0][4]).toEqual({
      vout: 0,
      expectedAmountSats: LARGE,
    });
  });
});
