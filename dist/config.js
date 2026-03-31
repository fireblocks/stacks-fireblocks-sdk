"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.config = void 0;
const clientConfiguration_1 = require("@fireblocks/ts-sdk/dist/client/clientConfiguration");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: Number(process.env.PORT) || 3000,
    fireblocks: {
        BASE_PATH: process.env.FIREBLOCKS_BASE_PATH || "",
        API_KEY: process.env.FIREBLOCKS_API_KEY || "",
    },
    network: process.env.NETWORK === "testnet" ? "testnet" : "mainnet",
};
exports.env = {
    FIREBLOCKS_API_KEY: (_a = process.env.FIREBLOCKS_API_KEY) !== null && _a !== void 0 ? _a : "",
    FIREBLOCKS_SECRET_KEY_PATH: (_b = process.env.FIREBLOCKS_SECRET_KEY_PATH) !== null && _b !== void 0 ? _b : "",
    FIREBLOCKS_BASE_PATH: (_c = process.env.FIREBLOCKS_BASE_PATH) !== null && _c !== void 0 ? _c : clientConfiguration_1.BasePath.US,
    POOL_MAX_SIZE: parseInt((_d = process.env.POOL_MAX_SIZE) !== null && _d !== void 0 ? _d : "100", 10),
    POOL_IDLE_TIMEOUT_MS: parseInt((_e = process.env.POOL_IDLE_TIMEOUT_MS) !== null && _e !== void 0 ? _e : "1800000", 10),
    POOL_CLEANUP_INTERVAL_MS: parseInt((_f = process.env.POOL_CLEANUP_INTERVAL_MS) !== null && _f !== void 0 ? _f : "300000", 10),
    NETWORK: ((_g = process.env.NETWORK) !== null && _g !== void 0 ? _g : "").toLowerCase(),
    TESTNET: ((_h = process.env.NETWORK) !== null && _h !== void 0 ? _h : "").toLowerCase() === "testnet",
};
