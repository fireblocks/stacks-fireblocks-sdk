import { c32addressDecode } from "c32check";
import { formatErrorMessage } from "./errorHandling";
import { ftInfo, stacks_info } from "./constants";
import { TokenType } from "../services/types";

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
      formatErrorMessage(error)
    );
    return false;
  }
}

/** Compressed secp256k1 pubkey: 33 bytes hex, prefix 02/03 */
export function isCompressedSecp256k1PubKeyHex(hex: string): boolean {
  return /^(02|03)[0-9a-fA-F]{64}$/.test(hex);
}

export function stxToMicro(amountStx: number | string): bigint {
  const s = String(amountStx);
  const [w = "0", fRaw = ""] = s.split(".");
  const f = (fRaw + "000000").slice(0, stacks_info.stxDecimals);
  return BigInt(w) * BigInt(10 ** stacks_info.stxDecimals) + BigInt(f);
}

export function microToStx(micro: bigint | number | string): number {
  const microBigInt = typeof micro === "bigint" ? micro : BigInt(micro);
  return Number(microBigInt) / 10 ** stacks_info.stxDecimals;
}

export function tokenToMicro(
  amount: number | string,
  token: TokenType
): bigint {
  const decimals = ftInfo[token].decimals;
  const [w = "0", fRaw = ""] = String(amount).split(".");
  const frac = (fRaw + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(w) * BigInt(10) ** BigInt(decimals) + BigInt(frac || "0");
}

export function microToToken(
  micro: bigint | number | string,
  decimals: number
): number {
  const microBigInt = typeof micro === "bigint" ? micro : BigInt(micro);
  const after = Number(microBigInt) / 10 ** decimals;
  return after;
}

export function concatSignature(fullSig: string, v: number): string {
  const vHex = v == 0 ? "00" : "01";
  return vHex + fullSig;
}

export const getDecimalsFromFtInfo = (contractId: string): number => {
  const [addr, contractAndToken] = contractId.split(".");
  const [contractName, tokenName] = contractAndToken.split("::");
  const hit = Object.values(ftInfo).find(
    (t) =>
      t &&
      t.contractName === contractName &&
      t.contractAddress.toLowerCase() === addr.toLowerCase()
  );
  return (
    hit?.decimals ??
    Object.values(ftInfo).find((t) => t?.contractName === contractName)
      ?.decimals ??
    0
  );
};

export function parseAssetId(assetId: string) {
  // "<contractAddress>.<contractName>::<tokenName>"
  const [contractPrincipal, tokenName] = assetId.split("::");
  const dot = contractPrincipal.lastIndexOf(".");
  const contractAddress = contractPrincipal.slice(0, dot);
  const contractName = contractPrincipal.slice(dot + 1);
  return { contractAddress, contractName, tokenName };
}

export function selectSpeceficFTBalance(
  token: TokenType,
  balances: { token: string; balance: number }[]
) {
  let balanceObject = Object.values(balances).find(
    (b) => b && b.token == token
  );
  return balanceObject.balance;
}

/** Convert “N cycles” → until_burn_ht */
export async function untilBurnHeightForCycles(
  cycles: number,
  poxInfo: any
): Promise<number> {
  if (!Number.isInteger(cycles) || cycles < 1 || cycles > 12) {
    throw new Error("cycles must be an integer between 1 and 12");
  }

  const pox = await poxInfo.json();

  const P = Number(pox.next_cycle.prepare_phase_start_block_height);
  const Q = Number(pox.prepare_phase_block_length);
  const R = Number(pox.reward_phase_block_length);
  const cycleLen = Q + R;

  return P + cycles * cycleLen - 1;
}

export function assertResultSuccess(
  result: any
): { success: true } | { success: false; error: string } {
  if (!result || result.error || !result.txid || result.reason) {
    const errorAndReason =
      result.error && result.reason
        ? `${result.error} - ${result.reason}`
        : result.error || result.reason || "unknown error";
    console.error(
      `Transaction broadcast failed: ${formatErrorMessage(errorAndReason)}`
    );
    return {
      success: false,
      error: formatErrorMessage(errorAndReason),
    };
  }
  return { success: true };
}
