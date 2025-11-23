import { c32addressDecode } from "c32check";
import { formatErrorMessage } from "./errorHandling";
import { stacks_info } from "./constants";

export function validateAmount(amount: string | number): boolean {
  try {
    const num = typeof amount === "number" ? amount : Number(amount);
    if (isNaN(num) || num <= 0) {
      console.log("Amount must be a positive number");
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

export function stxToMicro(stx: number): number {
  return Math.floor(stx * 10 ** stacks_info.stxDecimals);
}

export function microToStx(micro: number): number {
  return micro / 10 ** stacks_info.stxDecimals;
}

export function concatSignature(fullSig: string, v: number): string {
  const vHex = v == 0 ? "00" : "01";
  return vHex + fullSig;
}
