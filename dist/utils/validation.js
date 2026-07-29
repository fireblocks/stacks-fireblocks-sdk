"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
exports.parseOptionalNonce = parseOptionalNonce;
exports.parseOptionalAmount = parseOptionalAmount;
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
    if (typeof value === "bigint") {
        if (value < BigInt(0))
            throw new ValidationError("nonce must be a non-negative integer");
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
function parseOptionalAmount(value) {
    if (value === undefined || value === "")
        return undefined;
    if (typeof value !== "number" && typeof value !== "string") {
        throw new ValidationError("amount must be a positive number (STX)");
    }
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new ValidationError("amount must be a positive number (STX)");
    }
    return amount;
}
function parseOptionalFee(value) {
    if (value === undefined || value === "")
        return undefined;
    if (typeof value !== "number" && typeof value !== "string") {
        throw new ValidationError("fee must be a positive number (STX)");
    }
    const fee = Number(value);
    if (!Number.isFinite(fee) || fee <= 0) {
        throw new ValidationError("fee must be a positive number (STX)");
    }
    if (fee > constants_1.MAX_FEE_STX) {
        throw new ValidationError(`fee ${fee} STX exceeds the safety limit of ${constants_1.MAX_FEE_STX} STX`);
    }
    return fee;
}
