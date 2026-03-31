"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDecimalsFromFtInfo = void 0;
exports.getTokenInfo = getTokenInfo;
exports.validateAmount = validateAmount;
exports.validateAddress = validateAddress;
exports.isCompressedSecp256k1PubKeyHex = isCompressedSecp256k1PubKeyHex;
exports.stxToMicro = stxToMicro;
exports.microToStx = microToStx;
exports.tokenToMicro = tokenToMicro;
exports.microToToken = microToToken;
exports.concatSignature = concatSignature;
exports.parseAssetId = parseAssetId;
exports.untilBurnHeightForCycles = untilBurnHeightForCycles;
exports.assertResultSuccess = assertResultSuccess;
exports.safeStringify = safeStringify;
exports.isSafeToSubmit = isSafeToSubmit;
exports.btcAddressToPoxTuple = btcAddressToPoxTuple;
exports.getPox4SignerSigDigest = getPox4SignerSigDigest;
exports.parseClarityErrCode = parseClarityErrCode;
const c32check_1 = require("c32check");
const errorHandling_1 = require("./errorHandling");
const constants_1 = require("./constants");
const types_1 = require("../services/types");
const stacking_1 = require("@stacks/stacking");
const transactions_1 = require("@stacks/transactions");
const sha256_1 = require("@noble/hashes/sha256");
const common_1 = require("@stacks/common");
// Returns the token info from ftInfo for a given token type and network, or undefined if not found.
function getTokenInfo(token, network) {
    var _a;
    return (_a = constants_1.ftInfo[token]) === null || _a === void 0 ? void 0 : _a[network];
}
// Validate that the provided amount is a positive number.
function validateAmount(amount) {
    try {
        const num = typeof amount === "number" ? amount : Number(amount);
        if (isNaN(num) || num <= 0) {
            console.log("Invalid Amount: amount must be a positive number");
            return false;
        }
        return true;
    }
    catch (err) {
        console.error("Could not validate amount:", (0, errorHandling_1.formatErrorMessage)(err));
        throw new Error("validateAmount Failed : Error validating amounts");
    }
}
/** Validate a Stacks account address with a network flag. */
function validateAddress(addr, testnet) {
    if (testnet) {
        if (!/^S[TN][A-Z0-9]+$/.test(addr))
            return false;
    }
    else {
        if (!/^S[PM][A-Z0-9]+$/.test(addr))
            return false;
    }
    try {
        const [version, data] = (0, c32check_1.c32addressDecode)(addr);
        // Expected versions by network:
        // Testnet: ST → 26, SN → 21
        // Mainnet: SP → 22, SM → 20
        const validVersions = testnet ? [26, 21] : [22, 20];
        if (!validVersions.includes(version))
            return false;
        // Payload must be 20 bytes (HASH160)
        return /^[0-9a-fA-F]{40}$/.test(data);
    }
    catch (error) {
        console.error("validateAddress : Error validating address:", (0, errorHandling_1.formatErrorMessage)(error));
        return false;
    }
}
/** Compressed secp256k1 pubkey: 33 bytes hex, prefix 02/03 */
function isCompressedSecp256k1PubKeyHex(hex) {
    return /^(02|03)[0-9a-fA-F]{64}$/.test(hex);
}
// Convert STX amount to micro units
function stxToMicro(amountStx) {
    if (!validateAmount(amountStx)) {
        throw new Error("Invalid amount for stxToMicro conversion");
    }
    const s = String(amountStx);
    const [w = "0", fRaw = ""] = s.split(".");
    const f = (fRaw + "000000").slice(0, constants_1.stacks_info.stxDecimals);
    return BigInt(w) * BigInt(10 ** constants_1.stacks_info.stxDecimals) + BigInt(f);
}
// Convert micro units to STX amount
function microToStx(micro) {
    const microBigInt = typeof micro === "bigint" ? micro : BigInt(micro);
    return Number(microBigInt) / 10 ** constants_1.stacks_info.stxDecimals;
}
// Convert token amount to micro units based on decimals
async function tokenToMicro(amount, token, stacksService, customTokenContractAddress, customTokenContractName) {
    if (token === types_1.TokenType.CUSTOM) {
        if (!customTokenContractAddress || !customTokenContractName) {
            throw new Error(`Custom token contract address and name must be provided for CUSTOM token type`);
        }
    }
    let decimals;
    // get token info from constants, if not available => custom token => fetch decimals from chain.
    // use mainnet by default (decimals are the same across networks)
    const info = getTokenInfo(token, "mainnet");
    if (!info) {
        decimals = await stacksService.fetchFtDecimals(customTokenContractAddress, customTokenContractName);
    }
    else {
        decimals = info.decimals;
    }
    const [w = "0", fRaw = ""] = String(amount).split(".");
    const frac = (fRaw + "0".repeat(decimals)).slice(0, decimals);
    return BigInt(w) * BigInt(10) ** BigInt(decimals) + BigInt(frac || "0");
}
// Convert micro units to token amount based on decimals
function microToToken(micro, decimals) {
    const microBigInt = typeof micro === "bigint" ? micro : BigInt(micro);
    const after = Number(microBigInt) / 10 ** decimals;
    return after;
}
// Concatenate a full signature (r + s) with recovery id v to form a single hex string.
function concatSignature(fullSig, v) {
    const vHex = v == 0 ? "00" : "01";
    return vHex + fullSig;
}
// Get decimals for a fungible token from its contract ID
const getDecimalsFromFtInfo = (contractId) => {
    const [addr, contractAndToken] = contractId.split(".");
    const [contractName] = contractAndToken.split("::");
    const allNetworkInfos = Object.values(constants_1.ftInfo)
        .filter((t) => t !== undefined && t !== null)
        .flatMap((t) => [t.mainnet, t.testnet]);
    const hit = allNetworkInfos.find((t) => t.contractName === contractName &&
        t.contractAddress.toLowerCase() === addr.toLowerCase());
    if (hit) {
        return hit.decimals;
    }
    return 0;
};
exports.getDecimalsFromFtInfo = getDecimalsFromFtInfo;
// Parse asset ID into contract address, contract name, and token name
function parseAssetId(assetId) {
    // "<contractAddress>.<contractName>::<tokenName>"
    const [contractPrincipal, tokenName] = assetId.split("::");
    const dot = contractPrincipal.lastIndexOf(".");
    const contractAddress = contractPrincipal.slice(0, dot);
    const contractName = contractPrincipal.slice(dot + 1);
    return { contractAddress, contractName, tokenName };
}
/** Convert N cycles → until_burn_ht (inclusive) */
function untilBurnHeightForCycles(cycles, poxInput) {
    var _a;
    if (!Number.isInteger(cycles) || cycles < 1 || cycles > 12) {
        throw new Error("cycles must be an integer between 1 and 12");
    }
    const pox = (_a = poxInput.data) !== null && _a !== void 0 ? _a : poxInput;
    const P = Number(pox.next_cycle.prepare_phase_start_block_height);
    const Q = Number(pox.prepare_phase_block_length);
    const R = Number(pox.reward_phase_block_length);
    const cycleLen = Q + R;
    return P + cycles * cycleLen - 1;
}
// Assert that a transaction result indicates success, else log and return error details.
function assertResultSuccess(result) {
    if (!result || result.error || !result.txid || result.reason) {
        const errorAndReason = result.error && result.reason
            ? `${result.error} - ${result.reason}`
            : result.error || result.reason || "unknown error";
        console.error(`Transaction broadcast failed: ${(0, errorHandling_1.formatErrorMessage)(errorAndReason)}`);
        return {
            success: false,
            error: (0, errorHandling_1.formatErrorMessage)(errorAndReason),
        };
    }
    return { success: true };
}
// Safely stringify an object, handling BigInt and circular references.
function safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (_k, v) => {
        if (typeof v === "bigint")
            return v.toString(); // BigInt -> string
        if (v && typeof v === "object") {
            if (seen.has(v))
                return "[Circular]";
            seen.add(v);
        }
        return v;
    }, 2);
}
/**
 * Returns true if we're in a "safe" window to submit a stacking request now.
 */
function isSafeToSubmit(poxInput, safetyBuffer = constants_1.stacks_info.stacking.solo.safetyBlocks) {
    var _a;
    const pox = (_a = poxInput.data) !== null && _a !== void 0 ? _a : poxInput;
    const current = Number(pox.current_burnchain_block_height);
    const first = Number(pox.first_burnchain_block_height);
    const rewardLen = Number(pox.reward_phase_block_length);
    const prepLen = Number(pox.prepare_phase_block_length);
    const cycleLen = rewardLen + prepLen;
    const rewardIndex = (current - first) % cycleLen; // position inside cycle
    const safeEnd = cycleLen - prepLen; // boundary where prepare starts
    const blocksUntilBoundary = safeEnd - rewardIndex;
    const safe = blocksUntilBoundary > safetyBuffer; // must be > buffer
    return { safe, blocksUntilBoundary, rewardIndex };
}
// Convert a BTC address to a PoX tuple (version and hashbytes).
function btcAddressToPoxTuple(btcAddr) {
    const addr = btcAddr.trim();
    // decodeBtcAddressBytes throws InvalidAddressError for bad formats/prefixes
    const { version, data } = (0, stacking_1.decodeBtcAddressBytes)(addr);
    return {
        version: Number(version),
        hashbytes: data,
    };
}
// Generate the PoX v4 signer signature digest for stacking operations.
function getPox4SignerSigDigest(params) {
    const stacksNetworkName = params.network === "mainnet" ? "mainnet" : "testnet";
    const { message, domain } = (0, stacking_1.pox4SignatureMessage)({
        topic: stacking_1.Pox4SignatureTopic.StackStx, // "stack-stx"
        poxAddress: params.btcRewardAddress,
        rewardCycle: params.rewardCycle,
        period: params.lockPeriods,
        network: stacksNetworkName,
        maxAmount: params.maxAmountUstx,
        authId: params.authId,
    });
    const digest = (0, sha256_1.sha256)((0, transactions_1.encodeStructuredDataBytes)({ message, domain }));
    return "0x" + (0, common_1.bytesToHex)(digest);
}
/**
 * Extracts the Clarity error code from a tx_result like:
 * { hex: "0x...", repr: "(err 3)" }
 *
 * Returns the number (e.g. 3) or null if it's not an (err N).
 */
function parseClarityErrCode(txResult) {
    const repr = txResult === null || txResult === void 0 ? void 0 : txResult.repr;
    if (typeof repr !== "string")
        return null;
    const m = repr.match(/^\(err\s+u?(\d+)\)$/);
    if (!m)
        return null;
    return Number(m[1]);
}
