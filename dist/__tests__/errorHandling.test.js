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
    it("converts objects to string", () => {
        const obj = { code: 500, message: "Server error" };
        expect((0, errorHandling_1.formatErrorMessage)(obj)).toBe("[object Object]");
    });
    it("converts null and undefined to string", () => {
        expect((0, errorHandling_1.formatErrorMessage)(null)).toBe("null");
        expect((0, errorHandling_1.formatErrorMessage)(undefined)).toBe("undefined");
    });
    it("converts boolean to string", () => {
        expect((0, errorHandling_1.formatErrorMessage)(true)).toBe("true");
        expect((0, errorHandling_1.formatErrorMessage)(false)).toBe("false");
    });
});
