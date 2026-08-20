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

  it("reads the message field from plain objects", () => {
    const obj = { code: 500, message: "Server error" };
    expect(formatErrorMessage(obj)).toBe("Server error");
  });

  it("serializes objects that carry no message field", () => {
    expect(formatErrorMessage({ code: 500 })).toBe('{"code":500}');
  });

  it("returns a placeholder for null and undefined", () => {
    expect(formatErrorMessage(null)).toBe("Unknown error");
    expect(formatErrorMessage(undefined)).toBe("Unknown error");
  });

  it("converts boolean to string", () => {
    expect(formatErrorMessage(true)).toBe("true");
    expect(formatErrorMessage(false)).toBe("false");
  });

  it("extracts detail from an axios-style response body", () => {
    const error = {
      response: { data: { message: "Vault account not found", code: 1004 } },
    };
    expect(formatErrorMessage(error)).toBe("Vault account not found [1004]");
  });

  it("appends response detail to an Error message", () => {
    const error = Object.assign(new Error("Request failed"), {
      response: { data: { message: "Unauthorized" } },
    });
    expect(formatErrorMessage(error)).toBe("Request failed (Unauthorized)");
  });

  it("does not surface request config or headers", () => {
    const error = {
      message: "Request failed",
      config: { headers: { Authorization: "Bearer super-secret-token" } },
      response: { data: { message: "Forbidden" } },
    };
    expect(formatErrorMessage(error)).not.toContain("super-secret-token");
  });

  it("survives circular references", () => {
    const circular: Record<string, unknown> = { code: 500 };
    circular.self = circular;
    expect(() => formatErrorMessage(circular)).not.toThrow();
  });
});
