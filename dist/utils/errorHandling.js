"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorMessage = formatErrorMessage;
function formatErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
