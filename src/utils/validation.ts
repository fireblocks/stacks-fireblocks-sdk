export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function parseOptionalNonce(value: unknown): bigint | undefined {
  if (value === undefined || value === "") return undefined;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) {
    throw new ValidationError("nonce must be a non-negative integer");
  }
  return BigInt(num);
}

export function parseOptionalFee(value: unknown): number | undefined {
  if (value === undefined || value === "") return undefined;
  const fee = Number(value);
  if (!Number.isFinite(fee) || fee <= 0) {
    throw new ValidationError("fee must be a positive number (STX)");
  }
  return fee;
}
