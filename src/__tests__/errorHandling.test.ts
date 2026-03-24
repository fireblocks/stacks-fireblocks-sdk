import { formatErrorMessage } from "../utils/errorHandling";

describe("formatErrorMessage", () => {
  it("extracts message from Error objects", () => {
    const error = new Error("Something went wrong");
    expect(formatErrorMessage(error)).toBe("Something went wrong");
  });

  it("extracts message from custom error types", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }
    const error = new CustomError("Custom error occurred");
    expect(formatErrorMessage(error)).toBe("Custom error occurred");
  });

  it("converts strings to string", () => {
    expect(formatErrorMessage("Plain string error")).toBe("Plain string error");
  });

  it("converts numbers to string", () => {
    expect(formatErrorMessage(404)).toBe("404");
    expect(formatErrorMessage(0)).toBe("0");
  });

  it("converts objects to string", () => {
    const obj = { code: 500, message: "Server error" };
    expect(formatErrorMessage(obj)).toBe("[object Object]");
  });

  it("converts null and undefined to string", () => {
    expect(formatErrorMessage(null)).toBe("null");
    expect(formatErrorMessage(undefined)).toBe("undefined");
  });

  it("converts boolean to string", () => {
    expect(formatErrorMessage(true)).toBe("true");
    expect(formatErrorMessage(false)).toBe("false");
  });
});
