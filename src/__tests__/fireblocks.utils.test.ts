import { validateApiCredentials } from "../utils/fireblocks.utils";

describe("validateApiCredentials", () => {
  // Valid UUID v4 for testing
  const validApiKey = "12345678-1234-4123-8123-123456789abc";
  // Valid inline PEM string
  const validInlinePem = "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----";

  describe("API key validation", () => {
    it("accepts valid UUID v4 API keys", () => {
      expect(() => {
        validateApiCredentials(validApiKey, validInlinePem);
      }).not.toThrow();
    });

    it("rejects invalid UUID format", () => {
      expect(() => {
        validateApiCredentials("not-a-uuid", validInlinePem);
      }).toThrow("API key is not a valid UUID v4");
    });

    it("rejects empty API key", () => {
      expect(() => {
        validateApiCredentials("", validInlinePem);
      }).toThrow("API key is not a valid UUID v4");
    });

    it("rejects UUID v1 format (wrong version digit)", () => {
      // UUID v1 has version 1 in position 13
      const uuidV1 = "12345678-1234-1123-8123-123456789abc";
      expect(() => {
        validateApiCredentials(uuidV1, validInlinePem);
      }).toThrow("API key is not a valid UUID v4");
    });

    it("rejects malformed UUIDs", () => {
      const malformed = [
        "12345678-1234-4123-8123-123456789", // too short
        "12345678-1234-4123-8123-123456789abcdef", // too long
        "12345678123441238123123456789abc", // no dashes
        "ZZZZZZZZ-ZZZZ-4ZZZ-8ZZZ-ZZZZZZZZZZZZ", // invalid hex chars
      ];
      malformed.forEach((key) => {
        expect(() => {
          validateApiCredentials(key, validInlinePem);
        }).toThrow("API key is not a valid UUID v4");
      });
    });

    it("is case insensitive for UUID", () => {
      const upperCase = "12345678-1234-4123-8123-123456789ABC";
      const lowerCase = "12345678-1234-4123-8123-123456789abc";
      expect(() => validateApiCredentials(upperCase, validInlinePem)).not.toThrow();
      expect(() => validateApiCredentials(lowerCase, validInlinePem)).not.toThrow();
    });
  });

  describe("inline PEM detection", () => {
    it("accepts inline PEM strings without file check", () => {
      const pemVariants = [
        "-----BEGIN RSA PRIVATE KEY-----\ncontent\n-----END RSA PRIVATE KEY-----",
        "-----BEGIN PRIVATE KEY-----\ncontent\n-----END PRIVATE KEY-----",
        "-----BEGIN EC PRIVATE KEY-----\ncontent\n-----END EC PRIVATE KEY-----",
      ];
      pemVariants.forEach((pem) => {
        expect(() => {
          validateApiCredentials(validApiKey, pem);
        }).not.toThrow();
      });
    });

    it("rejects non-existent file paths", () => {
      expect(() => {
        validateApiCredentials(validApiKey, "/non/existent/path/to/key.pem");
      }).toThrow("Secret key file does not exist");
    });
  });

  describe("vaultAccountId validation", () => {
    it("accepts numeric vault IDs", () => {
      expect(() => {
        validateApiCredentials(validApiKey, validInlinePem, 0);
      }).not.toThrow();
      expect(() => {
        validateApiCredentials(validApiKey, validInlinePem, 123);
      }).not.toThrow();
    });

    it("accepts string numeric vault IDs", () => {
      expect(() => {
        validateApiCredentials(validApiKey, validInlinePem, "0");
      }).not.toThrow();
      expect(() => {
        validateApiCredentials(validApiKey, validInlinePem, "456");
      }).not.toThrow();
    });

    it("accepts undefined vault ID (optional parameter)", () => {
      expect(() => {
        validateApiCredentials(validApiKey, validInlinePem, undefined);
      }).not.toThrow();
    });

    it("rejects non-numeric string vault IDs", () => {
      expect(() => {
        validateApiCredentials(validApiKey, validInlinePem, "abc");
      }).toThrow("vaultAccountId must be a number or a string representing a number");
    });

    it("rejects empty string vault IDs", () => {
      expect(() => {
        validateApiCredentials(validApiKey, validInlinePem, "");
      }).toThrow("vaultAccountId must be a number or a string representing a number");
    });

    it("rejects whitespace-only vault IDs", () => {
      expect(() => {
        validateApiCredentials(validApiKey, validInlinePem, "   ");
      }).toThrow("vaultAccountId must be a number or a string representing a number");
    });
  });
});
