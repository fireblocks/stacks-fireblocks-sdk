/**
 * Extracts a human-readable message from an unknown thrown value.
 *
 * Fireblocks and axios reject with structured objects whose detail sits in `response.data`.
 * Only message/code fields are read; request config is skipped so credentials are not surfaced.
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const nested = extractResponseDetail(error);
    return nested ? `${error.message} (${nested})` : error.message;
  }

  if (typeof error === "string") return error;
  if (error === null || error === undefined) return "Unknown error";

  if (typeof error === "object") {
    const detail = extractResponseDetail(error);
    if (detail) return detail;

    const record = error as Record<string, unknown>;
    for (const key of ["message", "error", "reason", "detail"]) {
      if (typeof record[key] === "string" && record[key]) {
        return record[key] as string;
      }
    }

    try {
      const serialized = JSON.stringify(error, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      );
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // Circular or non-serializable.
    }
    return error.constructor?.name ?? "Unknown error object";
  }

  return String(error);
}

/** Pulls the message/code out of an axios-style `response.data` payload. */
function extractResponseDetail(error: unknown): string | null {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data) return null;

  if (typeof data === "string") return data;

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const message = record.message ?? record.error ?? record.detail;
    const code = record.code ?? record.statusCode;
    if (typeof message === "string" && message) {
      return code !== undefined ? `${message} [${String(code)}]` : message;
    }
    try {
      const serialized = JSON.stringify(data);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // ignore
    }
  }
  return null;
}
