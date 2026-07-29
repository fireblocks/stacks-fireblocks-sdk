export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare function parseOptionalNonce(value: unknown): bigint | undefined;
export declare function parseOptionalAmount(value: unknown): number | undefined;
export declare function parseOptionalFee(value: unknown): number | undefined;
