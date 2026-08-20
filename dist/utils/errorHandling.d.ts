/**
 * Extracts a human-readable message from an unknown thrown value.
 *
 * Fireblocks and axios reject with structured objects whose detail sits in `response.data`.
 * Only message/code fields are read; request config is skipped so credentials are not surfaced.
 */
export declare function formatErrorMessage(error: unknown): string;
