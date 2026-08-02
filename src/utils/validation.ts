import { MAX_FEE_STX } from "./constants";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function parseOptionalNonce(value: unknown): bigint | undefined {
  if (value === undefined || value === "") return undefined;
  if (typeof value === "bigint") {
    if (value < BigInt(0)) throw new ValidationError("nonce must be a non-negative integer");
    return value;
  }
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return BigInt(value);
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value);
  }
  throw new ValidationError("nonce must be a non-negative integer");
}

export function parseOptionalAmount(value: unknown): number | undefined {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "number" && typeof value !== "string") {
    throw new ValidationError("amount must be a positive number (STX)");
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError("amount must be a positive number (STX)");
  }
  return amount;
}

export function parseOptionalFee(value: unknown): number | undefined {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "number" && typeof value !== "string") {
    throw new ValidationError("fee must be a positive number (STX)");
  }
  const fee = Number(value);
  if (!Number.isFinite(fee) || fee <= 0) {
    throw new ValidationError("fee must be a positive number (STX)");
  }
  if (fee > MAX_FEE_STX) {
    throw new ValidationError(`fee ${fee} STX exceeds the safety limit of ${MAX_FEE_STX} STX`);
  }
  return fee;
}
