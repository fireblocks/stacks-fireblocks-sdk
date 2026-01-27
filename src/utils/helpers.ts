import { c32addressDecode } from "c32check";
import { formatErrorMessage } from "./errorHandling";
import { ftInfo, stacks_info } from "./constants";
import { TokenType } from "../services/types";
import {
  decodeBtcAddressBytes,
  pox4SignatureMessage,
  Pox4SignatureTopic,
} from "@stacks/stacking";
import { StacksNetwork, StacksNetworkName } from "@stacks/network";
import { encodeStructuredDataBytes } from "@stacks/transactions";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@stacks/common";

// Validate that the provided amount is a positive number.
export function validateAmount(amount: string | number): boolean {
  try {
    const num = typeof amount === "number" ? amount : Number(amount);
    if (isNaN(num) || num <= 0) {
      console.log("Invalid Amount: amount must be a positive number");
      return false;
    }
    return true;
  } catch (err) {
    console.error("Could not validate amount:", formatErrorMessage(err));
    throw new Error("validateAmount Failed : Error validating amounts");
  }
}

/** Validate a Stacks account address with a network flag. */
export function validateAddress(addr: string, testnet: boolean): boolean {
  if (testnet) {
    if (!/^ST[A-Z0-9]+$/.test(addr)) return false;
  } else {
    if (!/^SP[A-Z0-9]+$/.test(addr)) return false;
  }

  try {
    const [version, data] = c32addressDecode(addr) as [number, string];

    // Expected version by network (single-sig accounts)
    // ST → 26 (testnet), SP → 22 (mainnet)
    const expectedVersion = testnet ? 26 : 22;
    if (version !== expectedVersion) return false;

    // Payload must be 20 bytes (HASH160)
    return /^[0-9a-fA-F]{40}$/.test(data);
  } catch (error) {
    console.error(
      "validateAddress : Error validating address:",
      formatErrorMessage(error),
    );
    return false;
  }
}

/** Compressed secp256k1 pubkey: 33 bytes hex, prefix 02/03 */
export function isCompressedSecp256k1PubKeyHex(hex: string): boolean {
  return /^(02|03)[0-9a-fA-F]{64}$/.test(hex);
}

// Convert STX amount to micro units
export function stxToMicro(amountStx: number | string): bigint {
  if (!validateAmount(amountStx)) {
    throw new Error("Invalid amount for stxToMicro conversion");
  }
  const s = String(amountStx);
  const [w = "0", fRaw = ""] = s.split(".");
  const f = (fRaw + "000000").slice(0, stacks_info.stxDecimals);
  return BigInt(w) * BigInt(10 ** stacks_info.stxDecimals) + BigInt(f);
}

// Convert micro units to STX amount
export function microToStx(micro: bigint | number | string): number {
  const microBigInt = typeof micro === "bigint" ? micro : BigInt(micro);
  return Number(microBigInt) / 10 ** stacks_info.stxDecimals;
}

// Convert token amount to micro units based on decimals
export function tokenToMicro(
  amount: number | string,
  token: TokenType,
): bigint {
  const decimals = ftInfo[token].decimals;
  const [w = "0", fRaw = ""] = String(amount).split(".");
  const frac = (fRaw + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(w) * BigInt(10) ** BigInt(decimals) + BigInt(frac || "0");
}

// Convert micro units to token amount based on decimals
export function microToToken(
  micro: bigint | number | string,
  decimals: number,
): number {
  const microBigInt = typeof micro === "bigint" ? micro : BigInt(micro);
  const after = Number(microBigInt) / 10 ** decimals;
  return after;
}

// Concatenate a full signature (r + s) with recovery id v to form a single hex string.
export function concatSignature(fullSig: string, v: number): string {
  const vHex = v == 0 ? "00" : "01";
  return vHex + fullSig;
}

// Concatnate full signature for stacking signature digest
export const concatSignerSignature = (fullSig: string, v: number): string => {
  const vv = v >= 27 ? v - 27 : v;
  const vHex = vv === 0 ? "00" : "01";
  return fullSig + vHex; // r||s FIRST, then v LAST (opposite of transaction sigs)
};

// Get decimals for a fungible token from its contract ID
export const getDecimalsFromFtInfo = (contractId: string): number => {
  const [addr, contractAndToken] = contractId.split(".");
  const [contractName, tokenName] = contractAndToken.split("::");
  const hit = Object.values(ftInfo).find(
    (t) =>
      t &&
      t.contractName === contractName &&
      t.contractAddress.toLowerCase() === addr.toLowerCase(),
  );
  return (
    hit?.decimals ??
    Object.values(ftInfo).find((t) => t?.contractName === contractName)
      ?.decimals ??
    0
  );
};

// Parse asset ID into contract address, contract name, and token name
export function parseAssetId(assetId: string) {
  // "<contractAddress>.<contractName>::<tokenName>"
  const [contractPrincipal, tokenName] = assetId.split("::");
  const dot = contractPrincipal.lastIndexOf(".");
  const contractAddress = contractPrincipal.slice(0, dot);
  const contractName = contractPrincipal.slice(dot + 1);
  return { contractAddress, contractName, tokenName };
}

// Select specific fungible token balance from list
export function selectSpeceficFTBalance(
  token: TokenType,
  balances: { token: string; balance: number }[],
) {
  let balanceObject = Object.values(balances).find(
    (b) => b && b.token == token,
  );
  return balanceObject.balance;
}

// PoX info structure for until_burn_ht calculation
type PoxInfo = {
  prepare_phase_block_length: number | string;
  reward_phase_block_length: number | string;
  next_cycle: {
    prepare_phase_start_block_height: number | string;
    reward_phase_start_block_height: number | string;
  };
  current_burnchain_block_height: number | string;
  first_burnchain_block_height: number | string;
};

/** Convert N cycles → until_burn_ht (inclusive) */
export function untilBurnHeightForCycles(
  cycles: number,
  poxInput: PoxInfo | { data: PoxInfo },
): number {
  if (!Number.isInteger(cycles) || cycles < 1 || cycles > 12) {
    throw new Error("cycles must be an integer between 1 and 12");
  }
  const pox: PoxInfo = (poxInput as any).data ?? (poxInput as PoxInfo);

  const P = Number(pox.next_cycle.prepare_phase_start_block_height);
  const Q = Number(pox.prepare_phase_block_length);
  const R = Number(pox.reward_phase_block_length);
  const cycleLen = Q + R;

  return P + cycles * cycleLen - 1;
}

// Assert that a transaction result indicates success, else log and return error details.
export function assertResultSuccess(
  result: any,
): { success: true } | { success: false; error: string } {
  if (!result || result.error || !result.txid || result.reason) {
    const errorAndReason =
      result.error && result.reason
        ? `${result.error} - ${result.reason}`
        : result.error || result.reason || "unknown error";
    console.error(
      `Transaction broadcast failed: ${formatErrorMessage(errorAndReason)}`,
    );
    return {
      success: false,
      error: formatErrorMessage(errorAndReason),
    };
  }
  return { success: true };
}

// Safely stringify an object, handling BigInt and circular references.
export function safeStringify(obj: any) {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (_k, v) => {
      if (typeof v === "bigint") return v.toString(); // BigInt -> string
      if (v && typeof v === "object") {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    },
    2,
  );
}

/**
 * Returns true if we're in a "safe" window to submit a stacking request now.
 */
export function isSafeToSubmit(
  poxInput: PoxInfo | { data: PoxInfo },
  safetyBuffer = stacks_info.stacking.solo.safetyBlocks,
): { safe: boolean; blocksUntilBoundary: number; rewardIndex: number } {
  const pox: PoxInfo = (poxInput as any).data ?? (poxInput as PoxInfo);
  const current = Number(pox.current_burnchain_block_height);
  const first = Number(pox.first_burnchain_block_height);

  const rewardLen = Number(pox.reward_phase_block_length);
  const prepLen = Number(pox.prepare_phase_block_length);
  const cycleLen = rewardLen + prepLen;

  const rewardIndex = (current - first) % cycleLen; // position inside cycle
  const safeEnd = cycleLen - prepLen; // boundary where prepare starts
  const blocksUntilBoundary = safeEnd - rewardIndex;

  const safe = blocksUntilBoundary > safetyBuffer; // must be > buffer
  return { safe, blocksUntilBoundary, rewardIndex };
}

// Convert a BTC address to a PoX tuple (version and hashbytes).
export function btcAddressToPoxTuple(btcAddr: string): {
  version: number;
  hashbytes: Uint8Array;
} {
  const addr = btcAddr.trim();

  // decodeBtcAddressBytes throws InvalidAddressError for bad formats/prefixes
  const { version, data } = decodeBtcAddressBytes(addr);

  return {
    version: Number(version),
    hashbytes: data,
  };
}

// Generate the PoX v4 signer signature digest for stacking operations.
export function getPox4SignerSigDigest(params: {
  network: "mainnet" | "testnet";
  btcRewardAddress: string;
  rewardCycle: number;
  lockPeriods: number; // 1..12
  maxAmountUstx: bigint;
  authId: bigint;
}): string {
  const stacksNetworkName: StacksNetworkName =
    params.network === "mainnet" ? "mainnet" : "testnet";

  const { message, domain } = pox4SignatureMessage({
    topic: Pox4SignatureTopic.StackStx, // "stack-stx"
    poxAddress: params.btcRewardAddress,
    rewardCycle: params.rewardCycle,
    period: params.lockPeriods,
    network: stacksNetworkName,
    maxAmount: params.maxAmountUstx,
    authId: params.authId,
  });

  const digest = sha256(encodeStructuredDataBytes({ message, domain }));
  return "0x" + bytesToHex(digest);
}
