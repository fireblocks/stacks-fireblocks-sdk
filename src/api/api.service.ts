import { BasePath, TransactionResponse } from "@fireblocks/ts-sdk";
import { SdkManager } from "../pool/SdkManager";
import { ActionType, ApiServiceConfig } from "../pool/types";
import { PoolError } from "../pool/errors";
import { StacksSDK } from "../StacksSDK";
import { formatErrorMessage } from "../utils/errorHandling";
import { SDKResponse } from "../services/types";

export class ApiService {
  private sdkManager: SdkManager;

  constructor(config: ApiServiceConfig) {
    const baseConfig = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      basePath: (config.basePath as BasePath) || BasePath.US,
      vaultAccountId: "", // Will be overridden per request
      testnet: !!config.testnet,
    };

    this.sdkManager = new SdkManager(baseConfig, config.chainApiKey, config.poolConfig);
  }

  /**
   * Execute an action using the appropriate SDK method
   */
  public executeAction = async (
    vaultAccountId: string,
    actionType: ActionType,
    params: any,
  ): Promise<SDKResponse | TransactionResponse> => {
    let sdk: StacksSDK | null = null;
    try {
      // Get SDK instance from the pool
      sdk = await this.sdkManager.getSdk(vaultAccountId);

      // Execute the appropriate action based on type
      let result;
      switch (actionType) {
        case ActionType.GET_BTC_REWARDS_ADDRESS:
          result = await sdk.getBtcRewardsAddress();
          break;
        case ActionType.REVOKE_DELEGATION:
          result = await sdk.revokeDelegation(params.nonce);
          break;
        case ActionType.CHECK_STATUS:
          result = await sdk.checkStatus();
          break;
        case ActionType.STACK_SOLO:
          result = await sdk.stackSolo(
            params.signerKey,
            params.signerSig65Hex,
            params.amount,
            params.maxAmount,
            params.lockPeriod,
            params.authId,
            params.note,
            params.nonce,
          );
          break;
        case ActionType.GET_TX_STATUS_BY_ID:
          result = await sdk.getTxStatusById(params.txId);
          break;
        case ActionType.GET_BTC_TX_STATUS:
          result = await sdk.getBtcTxStatus(params.btcTxid);
          break;
        case ActionType.VALIDATE_BOND_SCHEDULE:
          result = await sdk.validateBondSchedule({ bondIndices: params.bondIndices });
          break;

        case ActionType.DELEGATE_TO_POOL:
          result = await sdk.delegateToPool(
            params.poolAddress,
            params.poolContractName,
            params.amount,
            params.lockPeriod,
            params.nonce,
          );
          break;
        case ActionType.ALLOW_CONTRACT_CALLER:
          result = await sdk.allowContractCaller(
            params.poolAddress,
            params.poolContractName,
            params.nonce,
          );
          break;
        case ActionType.CREATE_NATIVE_TRANSACTION:
          result = await sdk.createNativeTransaction(
            params.recipientAddress,
            params.amount,
            params.grossTransaction,
            params.note,
            params.nonce,
            params.fee,
            params.memo,
            params.externalId,
          );
          break;
        case ActionType.CREATE_FT_TRANSACTION:
          result = await sdk.createFTTransaction(
            params.recipientAddress,
            params.amount,
            params.tokenType,
            params.tokenContractAddress,
            params.tokenContractName,
            params.tokenAssetName,
            params.note,
            params.nonce,
            params.externalId,
          );
          break;
        case ActionType.GET_BALANCE:
          result = await sdk.getBalance();
          break;
        case ActionType.GET_FT_BALANCES:
          result = await sdk.getFtBalances();
          break;
        case ActionType.GET_TRANSACTIONS_HISTORY:
          result = await sdk.getTransactionHistory(
            params.getCachedTransactions,
            params.limit,
            params.offset,
            params.fetchAll,
            params.fetchPending,
          );
          break;
        case ActionType.GET_ACCOUNT_ADDRESS:
          result = await sdk.getAddress();
          break;
        case ActionType.GET_ACCOUNT_PUBLIC_KEY:
          result = await sdk.getPublicKey();
          break;
        case ActionType.GET_POX_INFO:
          result = await sdk.getPoxInfo();
          break;
        case ActionType.INCREASE_STACKED_AMOUNT:
          result = await sdk.increaseStackedAmount(
            params.signerKey,
            params.signerSig65Hex,
            params.increaseBy,
            params.maxAmount,
            params.authId,
            params.note,
            params.nonce,
          );
          break;
        case ActionType.EXTEND_STACKING_PERIOD:
          result = await sdk.extendStackingPeriod(
            params.signerKey,
            params.signerSig65Hex,
            params.extendCycles,
            params.maxAmount,
            params.authId,
            params.note,
            params.nonce,
          );
          break;
        case ActionType.REPLACE_TRANSACTION:
          result = await sdk.replaceTransaction(
            params.newFee,
            params.originalTxId,
            params.newRecipient,
            params.newAmount,
            params.nonceOverride,
            params.note,
            params.externalId,
          );
          break;
        case ActionType.GET_ACCOUNT_NONCE:
          result = await sdk.getAccountNonce();
          break;
        case ActionType.STAKE:
          result = await sdk.stake(
            params.amount,
            params.numCycles,
            params.signerManager,
            params.note,
            params.nonce,
            params.externalId,
          );
          break;
        case ActionType.UPDATE_STAKE:
          result = await sdk.updateStake(
            params.signerManager,
            params.oldSignerManager,
            params.cyclesToExtend,
            params.increaseBy,
            params.note,
            params.nonce,
            params.externalId,
          );
          break;
        case ActionType.UNSTAKE:
          result = await sdk.unstake(
            params.oldSignerManager,
            params.note,
            params.nonce,
            params.externalId,
          );
          break;
        case ActionType.GRANT_SIGNER_KEY:
          result = await sdk.grantSignerKey(
            params.signerManager,
            params.authId,
            params.note,
            params.nonce,
            params.externalId,
          );
          break;
        case ActionType.REVOKE_SIGNER_GRANT:
          result = await sdk.revokeSignerGrant(
            params.signerManager,
            params.signerKey,
            params.note,
            params.nonce,
            params.externalId,
          );
          break;
        case ActionType.GET_STAKER_INFO:
          result = await sdk.getStakerInfo();
          break;
        case ActionType.GET_POX5_INFO:
          result = await sdk.getPox5Info();
          break;
        case ActionType.VERIFY_SIGNER_GRANT:
          result = await sdk.verifySignerGrant(
            params.signerManager,
            params.txid,
          );
          break;
        case ActionType.CREATE_BOND:
          result = await sdk.createBond(
            params.bondIndex,
            params.btcAmountSats,
            params.signerManager,
            { note: params.note, nonce: params.nonce, externalId: params.externalId, confirmations: params.confirmations, btcTxid: params.btcTxid },
          );
          break;
        case ActionType.CREATE_SBTC_BOND:
          result = await sdk.createSbtcBond(
            params.bondIndex,
            params.sbtcSats,
            params.signerManager,
            { sbtcAsset: params.sbtcAsset, note: params.note, nonce: params.nonce, externalId: params.externalId },
          );
          break;
        case ActionType.ROLL_SBTC_BOND:
          result = await sdk.rollSbtcBond(
            params.nextBondIndex,
            params.newSbtcSats,
            params.signerManager,
            { sbtcAsset: params.sbtcAsset, note: params.note, nonce: params.nonce, externalId: params.externalId },
          );
          break;
        case ActionType.UNSTAKE_SBTC:
          result = await sdk.unstakeSbtc(
            params.signerManager,
            params.amountToWithdrawSats,
            params.sbtcAsset,
            { note: params.note, nonce: params.nonce, externalId: params.externalId },
          );
          break;
        case ActionType.GET_BOND_POSITION:
          result = await sdk.getBondPosition();
          break;
        case ActionType.GET_HISTORICAL_BOND_POSITION:
          result = await sdk.getHistoricalBondPosition(params.bondIndex);
          break;
        case ActionType.ANNOUNCE_EARLY_EXIT:
          result = await sdk.announceEarlyExit({ note: params.note, nonce: params.nonce, externalId: params.externalId });
          break;
        case ActionType.SPEND_EARLY_EXIT:
          result = await sdk.spendEarlyExitUtxo(params.destinationBtcAddress, { feeSats: params.feeSats, bondIndex: params.bondIndex });
          break;
        case ActionType.GET_EARLY_EXIT_PUBLIC_KEY:
          result = await sdk.getEarlyExitPublicKey();
          break;
        case ActionType.GET_REQUIREMENTS:
          result = await sdk.getRequirements({ bondIndex: params.bondIndex, btcAmountSats: params.btcAmountSats, signerManager: params.signerManager });
          break;
        case ActionType.UNLOCK_BTC:
          result = await sdk.unlockMaturedBond(params.destinationBtcAddress, { feeSats: params.feeSats, bondIndex: params.bondIndex });
          break;
        case ActionType.REPLACE_BTC_RECOVERY_FEE:
          result = await sdk.replaceBtcRecoveryFee(params.originalTxid, params.newFeeSats, { bondIndex: params.bondIndex, kind: params.kind });
          break;
        case ActionType.RENEW_BOND:
          result = await sdk.renewBond(params.nextBondIndex, params.signerManager, { feeSats: params.feeSats, note: params.note, nonce: params.nonce, externalId: params.externalId, confirmations: params.confirmations });
          break;
        case ActionType.UPDATE_BOND_REGISTRATION:
          result = await sdk.updateBondRegistration(params.signerManager, params.oldSignerManager, { note: params.note, nonce: params.nonce, externalId: params.externalId });
          break;
        case ActionType.CALCULATE_REWARDS:
          result = await sdk.calculateRewards({ note: params.note, nonce: params.nonce });
          break;
        case ActionType.CLAIM_REWARDS:
          result = await sdk.claimRewards(params.bondIndices, { note: params.note, nonce: params.nonce });
          break;
        case ActionType.CLAIM_STX_ONLY_REWARDS:
          result = await sdk.claimStxOnlyRewards({ note: params.note, nonce: params.nonce, fromCycle: params.fromCycle, toCycle: params.toCycle });
          break;
        case ActionType.GET_EARNED_REWARDS:
          result = await sdk.getEarnedRewards(params.signerManager, params.bondIndex);
          break;
        case ActionType.GET_BOND_LOCK_ADDRESS:
          result = await sdk.getBondLockAddress(params.bondIndex);
          break;
        case ActionType.FUND_BOND_LOCK_ADDRESS:
          result = await sdk.fundBondLockAddress(params.bondIndex);
          break;
        case ActionType.FUND_VAULT:
          result = await sdk.fundVault(params.staking);
          break;
        // ── App-surface actions (Electron consumption; not present on the server branch) ──
        case ActionType.ESTIMATE_FEE:
          result = await sdk.estimateFee(
            params.recipientAddress,
            params.amount,
            params.type,
            params.token,
            params.customTokenContractAddress,
            params.customTokenContractName,
          );
          break;
        case ActionType.GET_CONTRACT_CALL_HISTORY:
          result = await sdk.getContractCallHistory(params.limit, params.offset);
          break;
        case ActionType.MAKE_CONTRACT_CALL:
          result = await sdk.makeContractCall(
            params.contractAddress,
            params.contractName,
            params.functionName,
            params.functionArgs,
            params.postConditions,
            params.postConditionMode,
          );
          break;
        case ActionType.SIGN_TRANSACTION:
          result = await sdk.signExternalTransaction(params.txHex);
          break;
        case ActionType.SIGN_MESSAGE:
          result = await sdk.signMessage(params.message);
          break;
        case ActionType.SIGN_STRUCTURED_MESSAGE:
          result = await sdk.signStructuredMessage(params.message, params.domain);
          break;
        default:
          throw new Error(
            `InvalidType :
            Unknown action type: ${actionType}`,
          );
      }

      return result;
    } catch (error) {
      console.error(
        `Error executing ${actionType} for vault ${vaultAccountId}:`,
        error,
      );
      // PoolError messages already identify the vault and cause.
      if (error instanceof PoolError) throw error;
      throw new Error(`Failed to execute ${actionType}: ${formatErrorMessage(error)}`);
    } finally {
      // Always release the SDK back to the pool
      if (sdk) {
        this.sdkManager.releaseSdk(vaultAccountId);
      }
    }
  };
  /**
   * Get metrics about the SDK pool
   */
  public getPoolMetrics = () => {
    return this.sdkManager.getMetrics();
  };

  /**
   * Shut down the API service and all SDK instances
   */
  public shutdown = async (): Promise<void> => {
    return this.sdkManager.shutdown();
  };
}

