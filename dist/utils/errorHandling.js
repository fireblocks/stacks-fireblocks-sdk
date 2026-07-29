"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorMessage = formatErrorMessage;
/**
 * Extracts a human-readable message from an unknown thrown value.
 *
 * Fireblocks and axios reject with structured objects whose detail sits in `response.data`.
 * Only message/code fields are read; request config is skipped so credentials are not surfaced.
 */
// Never serialized into an error message, even as a fallback — request config
// carries the Fireblocks/HTTP auth headers.
const REDACTED_KEYS = new Set(["config", "headers", "auth", "authorization", "token", "apiKey", "secret"]);
function formatErrorMessage(error) {
    var _a, _b;
    if (error instanceof Error) {
        const nested = extractResponseDetail(error);
        return nested ? `${error.message} (${nested})` : error.message;
    }
    if (typeof error === "string")
        return error;
    if (error === null || error === undefined)
        return "Unknown error";
    if (typeof error === "object") {
        const detail = extractResponseDetail(error);
        if (detail)
            return detail;
        const record = error;
        for (const key of ["message", "error", "reason", "detail"]) {
            if (typeof record[key] === "string" && record[key]) {
                return record[key];
            }
        }
        try {
            const serialized = JSON.stringify(error, (key, v) => {
                if (REDACTED_KEYS.has(key))
                    return undefined;
                return typeof v === "bigint" ? v.toString() : v;
            });
            if (serialized && serialized !== "{}")
                return serialized;
        }
        catch (_c) {
            // Circular or non-serializable.
        }
        return (_b = (_a = error.constructor) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "Unknown error object";
    }
    return String(error);
}
/** Pulls the message/code out of an axios-style `response.data` payload. */
function extractResponseDetail(error) {
    var _a, _b, _c, _d;
    const data = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data;
    if (!data)
        return null;
    if (typeof data === "string")
        return data;
    if (typeof data === "object") {
        const record = data;
        const message = (_c = (_b = record.message) !== null && _b !== void 0 ? _b : record.error) !== null && _c !== void 0 ? _c : record.detail;
        const code = (_d = record.code) !== null && _d !== void 0 ? _d : record.statusCode;
        if (typeof message === "string" && message) {
            return code !== undefined ? `${message} [${String(code)}]` : message;
        }
        try {
            const serialized = JSON.stringify(data);
            if (serialized && serialized !== "{}")
                return serialized;
        }
        catch (_e) {
            // ignore
        }
    }
    return null;
}
