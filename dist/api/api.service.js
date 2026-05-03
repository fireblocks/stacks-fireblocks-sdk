"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
const ts_sdk_1 = require("@fireblocks/ts-sdk");
const SdkManager_1 = require("../pool/SdkManager");
const types_1 = require("../pool/types");
const errorHandling_1 = require("../utils/errorHandling");
class ApiService {
    constructor(config) {
        /**
         * Execute an action using the appropriate SDK method
         */
        this.executeAction = async (vaultAccountId, actionType, params) => {
            let sdk = null;
            try {
                // Get SDK instance from the pool
                sdk = await this.sdkManager.getSdk(vaultAccountId);
                // Execute the appropriate action based on type
                let result;
                switch (actionType) {
                    case types_1.ActionType.GET_BTC_REWARDS_ADDRESS:
                        result = await sdk.getBtcRewardsAddress();
                        break;
                    case types_1.ActionType.REVOKE_DELEGATION:
                        result = await sdk.revokeDelegation(params.nonce);
                        break;
                    case types_1.ActionType.CHECK_STATUS:
                        result = await sdk.checkStatus();
                        break;
                    case types_1.ActionType.STACK_SOLO:
                        result = await sdk.stackSolo(params.signerKey, params.signerSig65Hex, params.amount, params.maxAmount, params.lockPeriod, params.authId, params.nonce);
                        break;
                    case types_1.ActionType.GET_TX_STATUS_BY_ID:
                        result = await sdk.getTxStatusById(params.txId);
                        break;
                    case types_1.ActionType.DELEGATE_TO_POOL:
                        result = await sdk.delegateToPool(params.poolAddress, params.poolContractName, params.amount, params.lockPeriod, params.nonce);
                        break;
                    case types_1.ActionType.ALLOW_CONTRACT_CALLER:
                        result = await sdk.allowContractCaller(params.poolAddress, params.poolContractName, params.nonce);
                        break;
                    case types_1.ActionType.CREATE_NATIVE_TRANSACTION:
                        result = await sdk.createNativeTransaction(params.recipientAddress, params.amount, params.grossTransaction, params.note, params.nonce, params.fee);
                        break;
                    case types_1.ActionType.CREATE_FT_TRANSACTION:
                        result = await sdk.createFTTransaction(params.recipientAddress, params.amount, params.tokenType, params.tokenContractAddress, params.tokenContractName, params.tokenAssetName, params.note, params.nonce);
                        break;
                    case types_1.ActionType.GET_BALANCE:
                        result = await sdk.getBalance();
                        break;
                    case types_1.ActionType.GET_FT_BALANCES:
                        result = await sdk.getFtBalances();
                        break;
                    case types_1.ActionType.GET_TRANSACTIONS_HISTORY:
                        result = await sdk.getTransactionHistory(params.getCachedTransactions, params.limit, params.offset);
                        break;
                    case types_1.ActionType.GET_ACCOUNT_ADDRESS:
                        result = await sdk.getAddress();
                        break;
                    case types_1.ActionType.GET_ACCOUNT_PUBLIC_KEY:
                        result = await sdk.getPublicKey();
                        break;
                    case types_1.ActionType.GET_POX_INFO:
                        result = await sdk.getPoxInfo();
                        break;
                    case types_1.ActionType.INCREASE_STACKED_AMOUNT:
                        result = await sdk.increaseStackedAmount(params.signerKey, params.signerSig65Hex, params.increaseBy, params.maxAmount, params.authId, params.nonce);
                        break;
                    case types_1.ActionType.EXTEND_STACKING_PERIOD:
                        result = await sdk.extendStackingPeriod(params.signerKey, params.signerSig65Hex, params.extendCycles, params.maxAmount, params.authId, params.nonce);
                        break;
                    case types_1.ActionType.REPLACE_TRANSACTION:
                        result = await sdk.replaceTransaction(params.originalTxId, params.newFee, params.newRecipient, params.newAmount, params.nonceOverride);
                        break;
                    case types_1.ActionType.GET_CONTRACT_CALL_HISTORY:
                        result = await sdk.getContractCallHistory(params.limit, params.offset);
                        break;
                    case types_1.ActionType.MAKE_CONTRACT_CALL:
                        result = await sdk.makeContractCall(params.contractAddress, params.contractName, params.functionName, params.functionArgs, params.postConditions, params.postConditionMode);
                        break;
                    case types_1.ActionType.SIGN_TRANSACTION:
                        result = await sdk.signExternalTransaction(params.txHex);
                        break;
                    case types_1.ActionType.SIGN_MESSAGE:
                        result = await sdk.signMessage(params.message);
                        break;
                    case types_1.ActionType.SIGN_STRUCTURED_MESSAGE:
                        result = await sdk.signStructuredMessage(params.message, params.domain);
                        break;
                    case types_1.ActionType.GET_ACCOUNT_NONCE:
                        result = await sdk.getAccountNonce();
                        break;
                    default:
                        throw new Error(`InvalidType :
            Unknown action type: ${actionType}`);
                }
                return result;
            }
            catch (error) {
                console.error(`Error executing ${actionType} for vault ${vaultAccountId}:`, error);
                throw new Error(`Failed to execute action: ${(0, errorHandling_1.formatErrorMessage)(error)}`);
            }
            finally {
                // Always release the SDK back to the pool
                if (sdk) {
                    this.sdkManager.releaseSdk(vaultAccountId);
                }
            }
        };
        /**
         * Get metrics about the SDK pool
         */
        this.getPoolMetrics = () => {
            return this.sdkManager.getMetrics();
        };
        /**
         * Shut down the API service and all SDK instances
         */
        this.shutdown = async () => {
            return this.sdkManager.shutdown();
        };
        const baseConfig = {
            apiKey: config.apiKey,
            apiSecret: config.apiSecret,
            basePath: config.basePath || ts_sdk_1.BasePath.US,
            vaultAccountId: "", // Will be overridden per request
            testnet: !!config.testnet,
        };
        this.sdkManager = new SdkManager_1.SdkManager(baseConfig, config.chainApiKey, config.poolConfig);
    }
}
exports.ApiService = ApiService;
