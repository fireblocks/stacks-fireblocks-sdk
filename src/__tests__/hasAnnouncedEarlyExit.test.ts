/**
 * Chain-authoritative early-exit state for the app (FBS-54).
 *
 * The Electron app tracks whether a bond's early exit was announced in a LOCAL store
 * (`announcedEarlyExitStore`), which is a display hint, not truth: it is per-install,
 * lost on reset, and cannot know about an announce made elsewhere. The contract's
 * announcement map is the authority — and it is written irreversibly, with no delete.
 *
 * That asymmetry sets the failure rule. Reporting `announced: false` on a read that did
 * not resolve would invite a SECOND irreversible announce, so an unreadable state must
 * surface as a failure and never as "not announced".
 *
 * Added on this branch only: `main` has no consumer for it, and shipping an unused
 * public method there was rejected.
 */

jest.mock("@stacks/bitcoin-staking", () => {
  const actual = jest.requireActual("@stacks/bitcoin-staking");
  return {
    ...actual,
    fetchHasAnnouncedL1EarlyExit: jest.fn(),
    fetchBondMembership: jest.fn(),
  };
});

import { StacksSDK } from "../StacksSDK";
import {
  fetchHasAnnouncedL1EarlyExit,
  fetchBondMembership,
} from "@stacks/bitcoin-staking";

const BOOT_ADDR = "ST000000000000000000002AMW42H";
const FAKE_INLINE_PEM = [
  "-----BEGIN",
  "PRIVATE KEY-----",
  "not-a-key",
  "-----END",
  "PRIVATE KEY-----",
].join(" ");

const makeSdk = (): any => {
  const sdk: any = new (StacksSDK as any)("7", {
    apiKey: "12345678-1234-4123-8123-123456789012",
    apiSecret: FAKE_INLINE_PEM,
    testnet: true,
  });
  sdk.address = BOOT_ADDR;
  sdk.publicKey = `02${"a".repeat(64)}`;
  sdk.vaultAccountId = "7";
  return sdk;
};

beforeEach(() => {
  (fetchHasAnnouncedL1EarlyExit as jest.Mock)
    .mockReset()
    .mockResolvedValue(false);
  (fetchBondMembership as jest.Mock).mockReset().mockResolvedValue({
    bondIndex: 4,
    signer: `${BOOT_ADDR}.sm`,
    isL1Lock: true,
    amountUstx: BigInt(1),
    amountSats: BigInt(1),
  });
});

describe("hasAnnouncedEarlyExit", () => {
  it("reports an announced bond from chain", async () => {
    const sdk = makeSdk();
    (fetchHasAnnouncedL1EarlyExit as jest.Mock).mockResolvedValue(true);

    const res = await sdk.hasAnnouncedEarlyExit();

    expect(res.success).toBe(true);
    expect(res.data.announced).toBe(true);
    expect(res.data.bond_index).toBe(4);
  });

  it("reports a genuinely un-announced bond as false", async () => {
    const sdk = makeSdk();

    const res = await sdk.hasAnnouncedEarlyExit();

    expect(res.success).toBe(true);
    expect(res.data.announced).toBe(false);
  });

  it("refuses rather than reporting 'not announced' when the read fails", async () => {
    const sdk = makeSdk();
    (fetchHasAnnouncedL1EarlyExit as jest.Mock).mockRejectedValue(
      new Error("hiro 503"),
    );

    const res = await sdk.hasAnnouncedEarlyExit();

    // announced:false here would invite a second irreversible announce.
    expect(res.success).toBe(false);
    expect(res.data).toBeUndefined();
    expect(res.error).toMatch(/unknown/i);
  });

  it("refuses when the bond index cannot be resolved", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock).mockRejectedValue(new Error("hiro 503"));

    const res = await sdk.hasAnnouncedEarlyExit();

    expect(res.success).toBe(false);
    expect(fetchHasAnnouncedL1EarlyExit).not.toHaveBeenCalled();
  });

  it("accepts an explicit bond index without reading membership", async () => {
    const sdk = makeSdk();
    (fetchHasAnnouncedL1EarlyExit as jest.Mock).mockResolvedValue(true);

    const res = await sdk.hasAnnouncedEarlyExit(9);

    expect(res.data.bond_index).toBe(9);
    expect(fetchBondMembership).not.toHaveBeenCalled();
  });

  it("reports no bond rather than an error when membership is genuinely absent", async () => {
    const sdk = makeSdk();
    (fetchBondMembership as jest.Mock).mockResolvedValue(undefined);

    const res = await sdk.hasAnnouncedEarlyExit();

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no active bond/i);
  });
});
