export declare class PoolError extends Error {
    constructor(message: string);
}
export declare class PoolCapacityError extends PoolError {
    constructor(message: string);
}
export declare class SdkInitializationError extends PoolError {
    constructor(vaultAccountId: string, cause: string);
}
