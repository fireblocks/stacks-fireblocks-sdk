/**
 * Unit tests for two fixes from the 2026-08-25 review round:
 *
 *  - verifySignerGrant: a staker never grants anything. The grant is between the signer
 *    manager and its OWN registered key, so the check must resolve `get-signer-info` first
 *    and verify the grant for THAT key. Verifying it against the calling vault's public key
 *    refused every ordinary staker ("No unconsumed grant found").
 *  - isValidRewardBtcAddress: a reward address is only ever COMMITTED as a pox-addr tuple
 *    ({version, hashbytes}), which is identical across the bcrt1/tb1/bc1 spellings of one
 *    witness program. private-devnet must therefore accept the tb1 address the Fireblocks
 *    BTC_TEST wallet issues, while mainnet stays strict and the SPEND-path validator stays
 *    strict everywhere.
 */

jest.mock("../services/fireblocks.service", () => ({
  FireblocksService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchSignerInfo: jest.fn(),
    fetchVerifySignerKeyGrant: jest.fn(),
  };
});

import { StacksSDK } from "../StacksSDK";
import { fetchSignerInfo, fetchVerifySignerKeyGrant } from "@stacks/bitcoin-staking";

const mockSignerInfo = fetchSignerInfo as jest.Mock;
const mockGrant = fetchVerifySignerKeyGrant as jest.Mock;

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const MANAGER = `${BOOT_ADDR}.signer-manager`;

// Satisfies the "looks like an inline PEM" credential check (substring match only)
// without embedding a PEM-shaped literal — this is NOT key material.
const FAKE_INLINE_PEM = ["-----BEGIN", "PRIVATE KEY-----", "not-a-key", "-----END", "PRIVATE KEY-----"].join(" ");

// The vault's own key, and the manager's registered signer key. Deliberately DIFFERENT —
// that is the normal case for a staker, and the case the old code refused.
const VAULT_KEY = `02${"a".repeat(64)}`;
const REGISTERED_KEY = `02${"b".repeat(64)}`;

function makeSdk(opts: { testnet: boolean }): any {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: opts.testnet,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = VAULT_KEY;
  return sdk;
}

beforeEach(() => {
  mockSignerInfo.mockReset();
  mockGrant.mockReset();
});

describe("verifySignerGrant (signer-manager readiness, not the staker's own key)", () => {
  it("reports ready_to_stake for a registered, granted manager even though the registered key is NOT the vault's key", async () => {
    mockSignerInfo.mockResolvedValue({ signerKey: REGISTERED_KEY });
    mockGrant.mockResolvedValue(true);

    const sdk = makeSdk({ testnet: true });
    const r = await sdk.verifySignerGrant(MANAGER);

    expect(r.success).toBe(true);
    expect(r.signer_registered).toBe(true);
    expect(r.grant_exists).toBe(true);
    expect(r.ready_to_stake).toBe(true);
    expect(r.registered_key).toBe(REGISTERED_KEY);
    // The old implementation required registeredKey === this.publicKey and so returned false.
    expect(r.notes).toBeUndefined();
  });

  it("verifies the grant against the REGISTERED key, never the vault's own key", async () => {
    mockSignerInfo.mockResolvedValue({ signerKey: REGISTERED_KEY });
    mockGrant.mockResolvedValue(true);

    await makeSdk({ testnet: true }).verifySignerGrant(MANAGER);

    expect(mockGrant).toHaveBeenCalledTimes(1);
    expect(mockGrant).toHaveBeenCalledWith(expect.objectContaining({ signerKey: REGISTERED_KEY }));
    expect(mockGrant).not.toHaveBeenCalledWith(expect.objectContaining({ signerKey: VAULT_KEY }));
  });

  it("reports 'not registered' — not 'no grant' — when the manager has no registered key, and skips the grant read", async () => {
    mockSignerInfo.mockResolvedValue(null);

    const r = await makeSdk({ testnet: true }).verifySignerGrant(MANAGER);

    expect(r.signer_registered).toBe(false);
    expect(r.ready_to_stake).toBe(false);
    expect(r.registered_key).toBeNull();
    expect(mockGrant).not.toHaveBeenCalled();
    expect(r.notes.join(" ")).toMatch(/no registered signer key/i);
    expect(r.notes.join(" ")).not.toMatch(/no active grant/i);
  });

  it("attributes a revoked grant to the manager's operator, not to the staker", async () => {
    mockSignerInfo.mockResolvedValue({ signerKey: REGISTERED_KEY });
    mockGrant.mockResolvedValue(false);

    const r = await makeSdk({ testnet: true }).verifySignerGrant(MANAGER);

    expect(r.signer_registered).toBe(true);
    expect(r.grant_exists).toBe(false);
    expect(r.ready_to_stake).toBe(false);
    expect(r.notes.join(" ")).toMatch(/no active grant/i);
    expect(r.notes.join(" ")).toMatch(/operator must re-grant/i);
  });
});

describe("reward-address validation vs spend-address validation", () => {
  // Published BIP-173 / BIP-350 example addresses — the same witness program in three
  // spellings, plus a mainnet one. Not secrets.
  const P2WPKH_REGTEST = "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080";
  const P2WPKH_TESTNET = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";
  const P2WPKH_MAINNET = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";

  it("accepts both the regtest and testnet spellings as a REWARD address on private-devnet", () => {
    const sdk = makeSdk({ testnet: true });
    expect(sdk.networkProfile.name).toBe("private-devnet");
    // bcrt1 is the chain's own spelling; tb1 is what the Fireblocks BTC_TEST wallet issues.
    expect(sdk.isValidRewardBtcAddress(P2WPKH_REGTEST)).toBe(true);
    expect(sdk.isValidRewardBtcAddress(P2WPKH_TESTNET)).toBe(true);
  });

  it("still rejects a mainnet address and outright garbage on private-devnet", () => {
    const sdk = makeSdk({ testnet: true });
    expect(sdk.isValidRewardBtcAddress(P2WPKH_MAINNET)).toBe(false);
    expect(sdk.isValidRewardBtcAddress("not-an-address")).toBe(false);
  });

  it("keeps mainnet strict: a test-network spelling must never be committed there", () => {
    const sdk = makeSdk({ testnet: false });
    expect(sdk.networkProfile.name).toBe("mainnet");
    expect(sdk.isValidRewardBtcAddress(P2WPKH_MAINNET)).toBe(true);
    // Same witness program, but committing it here would route real rewards under mainnet
    // interpretation — to a program the customer may not control on this chain.
    expect(sdk.isValidRewardBtcAddress(P2WPKH_TESTNET)).toBe(false);
    expect(sdk.isValidRewardBtcAddress(P2WPKH_REGTEST)).toBe(false);
  });

  it("does NOT relax the SPEND-path validator: recovery destinations stay chain-exact", () => {
    // The relaxation is safe only because a reward address is committed as a tuple. A
    // recovery destination is passed to addOutputAddress on the active network, so a tb1
    // address on private-devnet must still be refused rather than fail at tx-build time.
    const sdk = makeSdk({ testnet: true });
    expect(sdk.isValidBtcAddressForNetwork(P2WPKH_REGTEST)).toBe(true);
    expect(sdk.isValidBtcAddressForNetwork(P2WPKH_TESTNET)).toBe(false);
  });
});
