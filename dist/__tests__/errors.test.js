"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../pool/errors");
describe("PoolError", () => {
    it("creates error with correct name and message", () => {
        const error = new errors_1.PoolError("Pool error occurred");
        expect(error.name).toBe("PoolError");
        expect(error.message).toBe("Pool error occurred");
        expect(error instanceof Error).toBe(true);
        expect(error instanceof errors_1.PoolError).toBe(true);
    });
    it("can be caught as Error", () => {
        expect(() => {
            throw new errors_1.PoolError("Test error");
        }).toThrow(Error);
    });
});
describe("PoolCapacityError", () => {
    it("creates error with correct name and message", () => {
        const error = new errors_1.PoolCapacityError("Pool is at capacity");
        expect(error.name).toBe("PoolCapacityError");
        expect(error.message).toBe("Pool is at capacity");
        expect(error instanceof Error).toBe(true);
        expect(error instanceof errors_1.PoolError).toBe(true);
        expect(error instanceof errors_1.PoolCapacityError).toBe(true);
    });
    it("inherits from PoolError", () => {
        const error = new errors_1.PoolCapacityError("Capacity reached");
        expect(error instanceof errors_1.PoolError).toBe(true);
    });
});
describe("SdkInitializationError", () => {
    it("creates error with formatted message including vault ID and cause", () => {
        const error = new errors_1.SdkInitializationError("123", "Invalid API key");
        expect(error.name).toBe("SdkInitializationError");
        expect(error.message).toBe("Failed to initialize SDK for vault 123: Invalid API key");
    });
    it("inherits from PoolError", () => {
        const error = new errors_1.SdkInitializationError("456", "Network error");
        expect(error instanceof errors_1.PoolError).toBe(true);
        expect(error instanceof Error).toBe(true);
    });
    it("handles various vault IDs", () => {
        const error1 = new errors_1.SdkInitializationError("0", "Test");
        expect(error1.message).toContain("vault 0");
        const error2 = new errors_1.SdkInitializationError("999999", "Test");
        expect(error2.message).toContain("vault 999999");
    });
});
