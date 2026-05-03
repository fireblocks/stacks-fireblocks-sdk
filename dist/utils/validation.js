"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
exports.parseOptionalNonce = parseOptionalNonce;
exports.parseOptionalFee = parseOptionalFee;
const constants_1 = require("./constants");
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
function parseOptionalNonce(value) {
    if (value === undefined || value === "")
        return undefined;
    const num = Number(value);
    if (!Number.isInteger(num) || num < 0) {
        throw new ValidationError("nonce must be a non-negative integer");
    }
    return BigInt(num);
}
function parseOptionalFee(value) {
    if (value === undefined || value === "")
        return undefined;
    const fee = Number(value);
    if (!Number.isFinite(fee) || fee <= 0) {
        throw new ValidationError("fee must be a positive number (STX)");
    }
    if (fee > constants_1.MAX_FEE_STX) {
        throw new ValidationError(`fee ${fee} STX exceeds the safety limit of ${constants_1.MAX_FEE_STX} STX`);
    }
    return fee;
}
