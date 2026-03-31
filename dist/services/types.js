"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackingPools = exports.TokenType = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["STX"] = "STX";
    TransactionType["FungibleToken"] = "Fungible Token";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TokenType;
(function (TokenType) {
    TokenType["STX"] = "STX";
    TokenType["sBTC"] = "sbtc-token";
    TokenType["USDCx"] = "usdcx-token";
    TokenType["CUSTOM"] = "custom-token";
})(TokenType || (exports.TokenType = TokenType = {}));
var StackingPools;
(function (StackingPools) {
    StackingPools["FAST_POOL"] = "fast-pool";
})(StackingPools || (exports.StackingPools = StackingPools = {}));
