/**
 * Two SDK instances sharing one lock-record store cannot fund the same target bond twice.
 *
 * The per-bond slot covers one instance. Instances in different processes meet only in the
 * store, so createBond and renewBond each reserve the target bond with a compare-and-set
 * before any Bitcoin is committed, and the call that finds the record changed refuses.
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
import { getPublicKey } from "@noble/secp256k1";
import * as btc from "@scure/btc-signer";
import { StacksSDK } from "../StacksSDK";
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
const TARGET_BOND = 5;
const AMOUNT_SATS = BigInt(100_000);
const FEE_SATS = BigInt(1_000);
const OUTPUT_SCRIPT = new Uint8Array([0x00, 0x20, ...new Array(32).fill(0xab)]);
const OUTPUT_SCRIPT_HEX = Buffer.from(OUTPUT_SCRIPT).toString("hex");
const PRIOR_OUTPOINT_TXID = "ab".repeat(32);
const CREATE_FUNDING_TXID = "cd".repeat(32);
const OUTPUT_INDEX = 1;
const REWARD = {
  rewardBtcAddress: "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
  rewardMaxFeeSats: BigInt(5_000),
};

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const until = async (cond: () => boolean) => {
  for (let i = 0; i < 400 && !cond(); i++)
    await new Promise((r) => setTimeout(r, 5));
  if (!cond()) throw new Error("condition not reached");
};

let dir: string;
let storeFile: string;
let lockAddress: string;
/** Every Bitcoin transaction a call committed to the target bond, by the operation that made it. */
let fundings: Array<{ by: string; txid: string }>;
const fundingTxids = () => [...new Set(fundings.map((f) => f.txid))];

const makeInstance = (): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  // A second FileLockRecordStore over the same file stands in for a second process.
  sdk.setLockRecordStore(new FileLockRecordStore(storeFile));
  sdk.assertDurableLockStore = jest.fn().mockResolvedValue(undefined);
  sdk.signerManagerAllowedError = jest.fn().mockReturnValue(undefined);
  sdk.nativeRecordOverwriteGuard = jest.fn().mockResolvedValue(undefined);
  sdk.resolveBondStxAmount = jest
    .fn()
    .mockReturnValue({ amountUstx: BigInt(1_000) });
  sdk.runNonceExclusive = jest.fn(async (fn: any) => fn());

  // createBond funds through Fireblocks.
  sdk.fireblocksService = {
    createBitcoinTransaction: jest.fn(async () => {
      fundings.push({ by: "createBond", txid: CREATE_FUNDING_TXID });
      return { fireblocksId: "fb-1", btcTxid: CREATE_FUNDING_TXID };
    }),
    awaitBitcoinTransaction: jest.fn(),
    findBitcoinTransactionByExternalId: jest.fn(),
    getTransferState: jest.fn(),
  };
  // renewBond re-locks by spending the previous lock's coin.
  sdk.deriveLock = jest.fn().mockResolvedValue({
    bondIndex: 4,
    unlockHeight: 100,
    lockScript: new Uint8Array([0x51]),
    lockingAddress: lockAddress,
  });
  sdk.readBtcTipHeight = jest.fn().mockResolvedValue(200);
  sdk.findLockUtxo = jest
    .fn()
    .mockResolvedValue({ txid: PRIOR_OUTPOINT_TXID, vout: 0, value: 100_000 });
  sdk.signBtcSighash = jest.fn().mockResolvedValue(new Uint8Array(72).fill(1));
  sdk.broadcastBtc = jest.fn(async (hex: string) => {
    const txid = btc.Transaction.fromRaw(Buffer.from(hex, "hex")).id;
    fundings.push({ by: "renewBond", txid });
    return txid;
  });
  sdk.getBtcTxStatus = jest
    .fn()
    .mockResolvedValue({ success: true, data: { found: true } });
  sdk.waitForBtcConfirmations = jest
    .fn()
    .mockResolvedValue({ blockHash: "bh" });
  sdk.assembleLockupProof = jest
    .fn()
    .mockResolvedValue({ outputIndex: OUTPUT_INDEX });
  return sdk;
};

const reopened = () => new FileLockRecordStore(storeFile);

/**
 * Pauses `sdk` right after its first lock-record update returns, which for createBond is its
 * reservation of the target bond. Everything the instance does next waits for the gate.
 */
const pauseAfterReservation = (sdk: any) => {
  const gate = deferred();
  let reached = false;
  let updates = 0;
  const store = sdk.lockRecordStore;
  const original = store.updateRecord.bind(store);
  store.updateRecord = async (...args: unknown[]) => {
    const result = await original(...args);
    updates += 1;
    if (updates === 1) {
      reached = true;
      await gate.promise;
    }
    return result;
  };
  return { gate, reached: () => reached };
};

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "bond-reservation-"));
  storeFile = path.join(dir, "locks.json");
  fundings = [];
  const sk = Uint8Array.from({ length: 32 }, (_, i) => (i === 31 ? 1 : 0));
  const probe: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  lockAddress = btc.p2wpkh(getPublicKey(sk, true), probe.btcNetwork).address!;

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
  // Stops each flow right after its outpoint is recorded: only the proof preflight carries outputs.
  (fetchEligibleRegisterForBond as jest.Mock)
    .mockReset()
    .mockImplementation(async (args: any) =>
      args.outputs ? { ok: false, reasons: [] } : { ok: true },
    );
  (firstPox5RewardCycle as jest.Mock).mockReset().mockReturnValue(1);
  (bondPeriodToRewardCycle as jest.Mock).mockReset().mockReturnValue(12);
  (buildRegisterMetadata as jest.Mock).mockReset().mockReturnValue({
    unlockBytes: new Uint8Array([1, 2, 3]),
    lockAddress,
    unlockHeight: 900,
    outputScript: OUTPUT_SCRIPT,
  });
  (fetchCallReadOnlyFunction as jest.Mock)
    .mockReset()
    .mockResolvedValue({
      type: "ok",
      value: { type: "buffer", value: OUTPUT_SCRIPT_HEX },
    });
  (fetchConstructLockupOutputScript as jest.Mock)
    .mockReset()
    .mockResolvedValue(OUTPUT_SCRIPT);
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue(null);
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("two instances on one lock-record store", () => {
  it("renewBond holds the bond first: the overlapping createBond refuses, funds nothing, and the renewal's outpoint survives a restart", async () => {
    const creator = makeInstance();
    const renewer = makeInstance();
    // createBond has read the (empty) record and is paused just before it reserves the bond.
    const gate = deferred();
    let paused = false;
    (fetchAccountStatus as jest.Mock).mockImplementation(async () => {
      paused = true;
      await gate.promise;
      return { balance: BigInt(1_000_000_000), locked: BigInt(0) };
    });
    const create = creator.createBond(TARGET_BOND, AMOUNT_SATS, MANAGER);
    await until(() => paused);

    const renewed = await renewer.renewBond(TARGET_BOND, MANAGER, {
      ...REWARD,
      feeSats: FEE_SATS,
    });
    gate.resolve();
    const created = await create;

    expect(renewed.btcTxid).toBeDefined();
    expect(created.success).toBe(false);
    expect(created.error).toMatch(/changed/i);
    expect(created.error).toMatch(/no bitcoin was sent/i);
    expect(
      creator.fireblocksService.createBitcoinTransaction,
    ).not.toHaveBeenCalled();
    expect(fundings.map((f) => f.by)).toEqual(["renewBond"]);

    const afterRestart = await reopened().loadRecord(BOOT_ADDR, TARGET_BOND);
    expect(afterRestart?.btcTxid).toBe(renewed.btcTxid);
    expect(afterRestart?.vout).toBe(OUTPUT_INDEX);
  });

  it("createBond holds the bond first: the overlapping renewBond refuses, broadcasts nothing, and the funding's outpoint survives a restart", async () => {
    const creator = makeInstance();
    const renewer = makeInstance();
    // renewBond has read the (empty) record and is paused while its re-lock is being signed.
    const gate = deferred();
    let paused = false;
    renewer.signBtcSighash = jest.fn(async () => {
      paused = true;
      await gate.promise;
      return new Uint8Array(72).fill(1);
    });
    const renew = renewer.renewBond(TARGET_BOND, MANAGER, {
      ...REWARD,
      feeSats: FEE_SATS,
    });
    await until(() => paused);

    const created = await creator.createBond(TARGET_BOND, AMOUNT_SATS, MANAGER);
    gate.resolve();
    const renewed = await renew;

    expect(created.btcTxid).toBe(CREATE_FUNDING_TXID);
    expect(renewed.success).toBe(false);
    expect(renewed.error).toMatch(/changed/i);
    expect(renewer.broadcastBtc).not.toHaveBeenCalled();
    expect(fundings.map((f) => f.by)).toEqual(["createBond"]);

    const afterRestart = await reopened().loadRecord(BOOT_ADDR, TARGET_BOND);
    expect(afterRestart?.btcTxid).toBe(CREATE_FUNDING_TXID);
    expect(afterRestart?.vout).toBe(OUTPUT_INDEX);
  });

  describe("the reservation holds until a funding is recorded", () => {
    // createBond writes its record at lock-fixed, then awaits other calls before it requests
    // funding. renewBond is allowed over a lock-fixed record, because a crash or an abandoned
    // funding leaves one behind, so create's later writes are what keep the bond reserved.

    it("renewBond runs to completion after createBond reserved: createBond then refuses and requests no funding", async () => {
      const creator = makeInstance();
      const renewer = makeInstance();
      const pause = pauseAfterReservation(creator);
      const create = creator.createBond(TARGET_BOND, AMOUNT_SATS, MANAGER);
      await until(pause.reached);

      const renewed = await renewer.renewBond(TARGET_BOND, MANAGER, {
        ...REWARD,
        feeSats: FEE_SATS,
      });
      pause.gate.resolve();
      const created = await create;

      expect(renewed.btcTxid).toBeDefined();
      expect(created.success).toBe(false);
      expect(created.fundingBlocked).toBe(true);
      expect(created.error).toMatch(/no bitcoin was sent/i);
      expect(
        creator.fireblocksService.createBitcoinTransaction,
      ).not.toHaveBeenCalled();
      expect(fundings.map((f) => f.by)).toEqual(["renewBond"]);

      const afterRestart = await reopened().loadRecord(BOOT_ADDR, TARGET_BOND);
      expect(afterRestart?.btcTxid).toBe(renewed.btcTxid);
      expect(afterRestart?.vout).toBe(OUTPUT_INDEX);
    });

    it("the same holds for a caller-supplied funding txid", async () => {
      const CALLER_TXID = "ee".repeat(32);
      const creator = makeInstance();
      const renewer = makeInstance();
      const pause = pauseAfterReservation(creator);
      const create = creator.createBond(TARGET_BOND, AMOUNT_SATS, MANAGER, {
        btcTxid: CALLER_TXID,
        btcVout: 1,
      });
      await until(pause.reached);

      const renewed = await renewer.renewBond(TARGET_BOND, MANAGER, {
        ...REWARD,
        feeSats: FEE_SATS,
      });
      pause.gate.resolve();
      const created = await create;

      expect(created.success).toBe(false);
      expect(created.fundingBlocked).toBe(true);
      expect(created.error).toMatch(/no bitcoin was sent/i);
      expect(fundings.map((f) => f.by)).toEqual(["renewBond"]);

      const afterRestart = await reopened().loadRecord(BOOT_ADDR, TARGET_BOND);
      expect(afterRestart?.btcTxid).toBe(renewed.btcTxid);
      expect(afterRestart?.btcTxid).not.toBe(CALLER_TXID);
    });

    it("createBond does not overwrite a record that changed after Fireblocks accepted its transfer", async () => {
      const creator = makeInstance();
      const changedTo = "ee".repeat(32);
      creator.fireblocksService.createBitcoinTransaction = jest.fn(
        async (...args: any[]) => {
          fundings.push({ by: "createBond", txid: CREATE_FUNDING_TXID });
          // Another writer changes the record between the request and the transfer id being saved.
          const other = reopened();
          const current = await other.loadRecord(BOOT_ADDR, TARGET_BOND);
          await other.saveRecord(BOOT_ADDR, TARGET_BOND, {
            ...current!,
            btcTxid: changedTo,
            stage: "btc-broadcast",
          });
          await args[5]?.("fb-accepted");
          return { fireblocksId: "fb-accepted", btcTxid: CREATE_FUNDING_TXID };
        },
      );

      const res = await creator.createBond(TARGET_BOND, AMOUNT_SATS, MANAGER);

      expect(res.success).toBe(false);
      expect(res.fundingBlocked).toBe(true);
      expect(res.error).toContain("fb-accepted");
      expect(res.error).toMatch(/do not fund/i);
      const record = await reopened().loadRecord(BOOT_ADDR, TARGET_BOND);
      expect(record?.btcTxid).toBe(changedTo);
      expect(record?.fireblocksId).toBeUndefined();
    });
  });

  it("two createBond calls for one bond fund it once", async () => {
    const first = makeInstance();
    const second = makeInstance();
    const gate = deferred();
    let waiting = 0;
    (fetchAccountStatus as jest.Mock).mockImplementation(async () => {
      waiting += 1;
      await gate.promise;
      return { balance: BigInt(1_000_000_000), locked: BigInt(0) };
    });
    const a = first.createBond(TARGET_BOND, AMOUNT_SATS, MANAGER);
    const b = second.createBond(TARGET_BOND, AMOUNT_SATS, MANAGER);
    await until(() => waiting === 2);

    gate.resolve();
    const results = await Promise.all([a, b]);

    expect(fundings.map((f) => f.by)).toEqual(["createBond"]);
    expect(
      results.filter((r: any) => r.btcTxid === CREATE_FUNDING_TXID),
    ).toHaveLength(1);
    const loser = results.find((r: any) => r.btcTxid !== CREATE_FUNDING_TXID);
    expect(loser.success).toBe(false);
    expect(loser.fundingBlocked).toBe(true);
  });

  it("two renewBond calls for one bond put one transaction on-chain", async () => {
    // Both spend the same coin to the same output, so they build the same transaction: a
    // segwit txid ignores the signature. Broadcasting it twice is idempotent.
    const first = makeInstance();
    const second = makeInstance();
    const gate = deferred();
    let waiting = 0;
    for (const sdk of [first, second]) {
      sdk.signBtcSighash = jest.fn(async () => {
        waiting += 1;
        await gate.promise;
        return new Uint8Array(72).fill(1);
      });
    }
    const a = first.renewBond(TARGET_BOND, MANAGER, {
      ...REWARD,
      feeSats: FEE_SATS,
    });
    const b = second.renewBond(TARGET_BOND, MANAGER, {
      ...REWARD,
      feeSats: FEE_SATS,
    });
    await until(() => waiting === 2);

    gate.resolve();
    await Promise.all([a, b]);

    expect(fundingTxids()).toHaveLength(1);
  });

  it("two renewBond calls with different fees do not both spend the prior lock", async () => {
    const first = makeInstance();
    const second = makeInstance();
    const gate = deferred();
    let waiting = 0;
    for (const sdk of [first, second]) {
      sdk.signBtcSighash = jest.fn(async () => {
        waiting += 1;
        await gate.promise;
        return new Uint8Array(72).fill(1);
      });
    }
    const a = first.renewBond(TARGET_BOND, MANAGER, {
      ...REWARD,
      feeSats: FEE_SATS,
    });
    const b = second.renewBond(TARGET_BOND, MANAGER, {
      ...REWARD,
      feeSats: FEE_SATS + BigInt(500),
    });
    await until(() => waiting === 2);

    gate.resolve();
    const results = await Promise.all([a, b]);

    expect(fundingTxids()).toHaveLength(1);
    expect(
      results.filter(
        (r: any) => r.success === false && /changed/i.test(r.error ?? ""),
      ),
    ).toHaveLength(1);
  });

  it("a lone createBond still reserves the bond and funds it", async () => {
    const sdk = makeInstance();

    const res = await sdk.createBond(TARGET_BOND, AMOUNT_SATS, MANAGER);

    expect(res.btcTxid).toBe(CREATE_FUNDING_TXID);
    expect(fundings.map((f) => f.by)).toEqual(["createBond"]);
    const record = await reopened().loadRecord(BOOT_ADDR, TARGET_BOND);
    expect(record?.btcTxid).toBe(CREATE_FUNDING_TXID);
    expect(record?.vout).toBe(OUTPUT_INDEX);
  });
});
