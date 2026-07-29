"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandling_1 = require("../utils/errorHandling");
describe("formatErrorMessage", () => {
    it("extracts message from Error objects", () => {
        const error = new Error("Something went wrong");
        expect((0, errorHandling_1.formatErrorMessage)(error)).toBe("Something went wrong");
    });
    it("extracts message from custom error types", () => {
        class CustomError extends Error {
            constructor(message) {
                super(message);
                this.name = "CustomError";
            }
        }
        const error = new CustomError("Custom error occurred");
        expect((0, errorHandling_1.formatErrorMessage)(error)).toBe("Custom error occurred");
    });
    it("converts strings to string", () => {
        expect((0, errorHandling_1.formatErrorMessage)("Plain string error")).toBe("Plain string error");
    });
    it("converts numbers to string", () => {
        expect((0, errorHandling_1.formatErrorMessage)(404)).toBe("404");
        expect((0, errorHandling_1.formatErrorMessage)(0)).toBe("0");
    });
    it("reads the message field from plain objects", () => {
        const obj = { code: 500, message: "Server error" };
        expect((0, errorHandling_1.formatErrorMessage)(obj)).toBe("Server error");
    });
    it("serializes objects that carry no message field", () => {
        expect((0, errorHandling_1.formatErrorMessage)({ code: 500 })).toBe('{"code":500}');
    });
    it("returns a placeholder for null and undefined", () => {
        expect((0, errorHandling_1.formatErrorMessage)(null)).toBe("Unknown error");
        expect((0, errorHandling_1.formatErrorMessage)(undefined)).toBe("Unknown error");
    });
    it("converts boolean to string", () => {
        expect((0, errorHandling_1.formatErrorMessage)(true)).toBe("true");
        expect((0, errorHandling_1.formatErrorMessage)(false)).toBe("false");
    });
    it("extracts detail from an axios-style response body", () => {
        const error = {
            response: { data: { message: "Vault account not found", code: 1004 } },
        };
        expect((0, errorHandling_1.formatErrorMessage)(error)).toBe("Vault account not found [1004]");
    });
    it("appends response detail to an Error message", () => {
        const error = Object.assign(new Error("Request failed"), {
            response: { data: { message: "Unauthorized" } },
        });
        expect((0, errorHandling_1.formatErrorMessage)(error)).toBe("Request failed (Unauthorized)");
    });
    it("does not surface request config or headers", () => {
        const error = {
            message: "Request failed",
            config: { headers: { Authorization: "Bearer super-secret-token" } },
            response: { data: { message: "Forbidden" } },
        };
        expect((0, errorHandling_1.formatErrorMessage)(error)).not.toContain("super-secret-token");
    });
    it("does not surface request config when falling back to JSON serialization (no message field, empty response.data)", () => {
        const error = {
            status: 401,
            response: { data: {}, config: { headers: { Authorization: "Bearer super-secret-token" } } },
        };
        expect((0, errorHandling_1.formatErrorMessage)(error)).not.toContain("super-secret-token");
    });
    it("does not surface request config when falling back to JSON serialization (no response field at all)", () => {
        const error = {
            status: 401,
            config: { headers: { Authorization: "Bearer super-secret-token" } },
        };
        expect((0, errorHandling_1.formatErrorMessage)(error)).not.toContain("super-secret-token");
    });
    it("survives circular references", () => {
        const circular = { code: 500 };
        circular.self = circular;
        expect(() => (0, errorHandling_1.formatErrorMessage)(circular)).not.toThrow();
    });
});
