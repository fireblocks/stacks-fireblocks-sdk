import { Network, TokenInfo, TokenType } from "../services/types";
import { type PoxInfo as Pox5PoxInfo } from "@stacks/bitcoin-staking";
import { StacksService } from "../services/stacks.service";
export declare function getTokenInfo(token: TokenType, network: Network): TokenInfo | undefined;
export declare function validateAmount(amount: string | number): boolean;
/** Validate a Stacks account address with a network flag. */
export declare function validateAddress(addr: string, testnet: boolean): boolean;
/** Compressed secp256k1 pubkey: 33 bytes hex, prefix 02/03 */
export declare function isCompressedSecp256k1PubKeyHex(hex: string): boolean;
export declare function stxToMicro(amountStx: number | string): bigint;
export declare function microToStx(micro: bigint | number | string): number;
export declare function tokenToMicro(amount: number | string, token: TokenType, stacksService?: StacksService, customTokenContractAddress?: string, customTokenContractName?: string): Promise<bigint>;
export declare function microToToken(micro: bigint | number | string, decimals: number): number;
export declare function concatSignature(fullSig: string, v: number): string;
export declare const getDecimalsFromFtInfo: (contractId: string) => number;
export declare function parseAssetId(assetId: string): {
    contractAddress: string;
    contractName: string;
    tokenName: string;
};
export type PoxInfo = {
    prepare_phase_block_length: number | string;
    reward_phase_block_length: number | string;
    next_cycle: {
        prepare_phase_start_block_height: number | string;
        reward_phase_start_block_height: number | string;
    };
    current_burnchain_block_height: number | string;
    first_burnchain_block_height: number | string;
};
/** Convert N cycles → until_burn_ht (inclusive) */
export declare function untilBurnHeightForCycles(cycles: number, poxInput: PoxInfo | {
    data: PoxInfo;
}): number;
export declare function assertResultSuccess(result: any): {
    success: true;
} | {
    success: false;
    error: string;
};
export declare function safeStringify(obj: any): string;
/**
 * Returns true if we're in a "safe" window to submit a stacking request now.
 * Accepts both PoX-4 (snake_case) and PoX-5 (camelCase) PoxInfo shapes.
 */
export declare function isSafeToSubmit(poxInput: PoxInfo | Pox5PoxInfo | {
    data: PoxInfo;
}, safetyBuffer?: number): {
    safe: boolean;
    blocksUntilBoundary: number;
    rewardIndex: number;
};
export declare function btcAddressToPoxTuple(btcAddr: string): {
    version: number;
    hashbytes: Uint8Array;
};
export declare function getPox4SignerSigDigest(params: {
    network: "mainnet" | "testnet";
    btcRewardAddress: string;
    rewardCycle: number;
    lockPeriods: number;
    maxAmountUstx: bigint;
    authId: bigint;
}): string;
/**
 * Extracts the Clarity error code from a tx_result like:
 * { hex: "0x...", repr: "(err 3)" }
 *
 * Returns the number (e.g. 3) or null if it's not an (err N).
 */
export declare function parseClarityErrCode(txResult?: {
    repr?: string | null;
}): number | null;
