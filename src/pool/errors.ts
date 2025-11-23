export class PoolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PoolError";
  }
}

export class PoolCapacityError extends PoolError {
  constructor(message: string) {
    super(message);
    this.name = "PoolCapacityError";
  }
}

export class SdkInitializationError extends PoolError {
  constructor(vaultAccountId: string, cause: string) {
    super(`Failed to initialize SDK for vault ${vaultAccountId}: ${cause}`);
    this.name = "SdkInitializationError";
  }
}
