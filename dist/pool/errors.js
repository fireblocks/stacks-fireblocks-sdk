"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SdkInitializationError = exports.PoolCapacityError = exports.PoolError = void 0;
class PoolError extends Error {
    constructor(message) {
        super(message);
        this.name = "PoolError";
    }
}
exports.PoolError = PoolError;
class PoolCapacityError extends PoolError {
    constructor(message) {
        super(message);
        this.name = "PoolCapacityError";
    }
}
exports.PoolCapacityError = PoolCapacityError;
class SdkInitializationError extends PoolError {
    constructor(vaultAccountId, cause) {
        super(`Failed to initialize SDK for vault ${vaultAccountId}: ${cause}`);
        this.name = "SdkInitializationError";
    }
}
exports.SdkInitializationError = SdkInitializationError;
