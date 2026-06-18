import { Router, Request, Response, NextFunction } from "express";
import * as controller from "./controller";

// Middleware to validate vaultAccountId parameter
const validateVaultId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { vaultId } = req.params;
  if (!vaultId) {
    res
      .status(400)
      .json({ error: "vaultAccountId (vaultId) parameter is required" });
    return;
  }
  next();
};

const router = Router();

// Use JSON body parser in your app setup (e.g., app.use(express.json()))

// Account endpoints
/**
 * @openapi
 * /{vaultId}/address:
 *   get:
 *     summary: Get on-chain account address
 *     description: Retrieves the blockchain address for the given vault ID.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Address fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                   example: '0x1a2b3c4d'
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/address", validateVaultId, controller.getAddress);

/**
 * @openapi
 * /{vaultId}/btc-rewards-address:
 *   get:
 *     summary: Get BTC rewards address
 *     description: Retrieves the BTC rewards address for the given vault ID (corresponding to the same public key as the Stacks address).
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: BTC rewards address fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                   example: '0x1a2b3c4d'
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:vaultId/btc-rewards-address",
  validateVaultId,
  controller.getBtcRewardsAddress,
);

/**
 * @openapi
 * /{vaultId}/publicKey:
 *   get:
 *     summary: Get account public key
 *     description: Retrieves the public key for the given vault ID.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Public key fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publicKey:
 *                   type: string
 *                   example: '0xabcdef12345'
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/publicKey", validateVaultId, controller.getPublicKey);

/**
 * @openapi
 * /{vaultId}/check-status:
 *   get:
 *     summary: Get account status (balance total, locked STX and delegation status)
 *     description: >
 *       fetches the account status for STX balance total,
 *       locked (Stacked) STX, and delegation status (if there's an active delegation, to which address and delegated amount in STX).
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Account status fetched successfully
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/check-status", validateVaultId, controller.checkStatus);

/**
 * @openapi
 *  /transactions/{txId}:
 *   get:
 *     summary: Get transaction status by txid
 *     description: Retrieves status and details for a specific transaction ID.
 *     parameters:
 *       - in: path
 *         name: txId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID (txid) to fetch.
 *     responses:
 *       200:
 *         description: Transaction status fetched successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.get(
  "/transactions/:txId",
  controller.getTxStatusById,
);

// Pox Info
/**
 * @openapi
 * /poxInfo:
 *   get:
 *     summary: Get PoX info
 *     description: >
 *       Retrieves information related to the Proof of Transfer (PoX) from blockchain
 *     responses:
 *       200:
 *         description: PoX info fetched successfully
 *       500:
 *         description: Internal server error
 * */
 router.get("/poxInfo", controller.getPoxInfo);


// Nonce
/**
 * @openapi
 * /{vaultId}/nonce:
 *   get:
 *     summary: Get account nonce
 *     description: >
 *       Returns nonce information for this vault's Stacks address, accounting
 *       for pending mempool transactions.
 *
 *       - **confirmedNonce**: next nonce per confirmed on-chain state.
 *       - **pendingTxCount**: number of this address's transactions currently in the mempool.
 *       - **nextAvailable**: first nonce not already taken by a pending tx (gap-aware).
 *         Use this when submitting a new transaction.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Nonce fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 confirmedNonce:
 *                   type: integer
 *                   description: Next nonce per confirmed on-chain state.
 *                   example: 5
 *                 pendingTxCount:
 *                   type: integer
 *                   description: Number of pending mempool transactions from this address.
 *                   example: 2
 *                 nextAvailable:
 *                   type: integer
 *                   description: First gap-free nonce to use for a new transaction.
 *                   example: 7
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/nonce", validateVaultId, controller.getAccountNonce);

// Balance endpoints
/**
 * @openapi
 * /{vaultId}/balance:
 *   get:
 *     summary: Get base asset balance
 *     description: Retrieves the balance of the native coin for the address of the vault ID.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Balance fetched successfully
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/balance", validateVaultId, controller.getBalance);

/**
 * @openapi
 * /{vaultId}/ft-balances:
 *   get:
 *     summary: Get fungible token balances
 *     description: Retrieves balances for supported SIP-010 tokens for the address of the vault ID.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Balances fetched successfully
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/ft-balances", validateVaultId, controller.getFtBalances);

// Transaction history
/**
 * @openapi
 * /{vaultId}/transactions:
 *   get:
 *     summary: Get transaction history
 *     description: Retrieves transaction history for the vault’s associated blockchain account with optional pagination.
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: integer
 *         description: Fireblocks vault account ID.
 *       - in: query
 *         name: getCachedTransactions
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to return cached transactions (true) or fetch new ones (false).
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: number
 *         description: Limit the number of transactions returned.
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: number
 *         description: Offset for pagination.
 *       - in: query
 *         name: fetchAll
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, fetches all confirmed transactions ignoring limit.
 *       - in: query
 *         name: fetchPending
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, also fetches pending (mempool) transactions and prepends them to the result.
 *       - in: query
 *         name: order
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Order of transactions by date, either ascending (ASC) or descending (DESC).
 *     responses:
 *       '200':
 *         description: Transaction history fetched successfully.
 *       '400':
 *         description: Invalid or missing parameters.
 *       '500':
 *         description: Internal server error.
 */

router.get(
  "/:vaultId/transactions",
  validateVaultId,
  controller.getTransactionHistory,
);

/**
 * @openapi
 * /{vaultId}/transfer:
 *   post:
 *     summary: Create transfer (STX or FT)
 *     description: Initiates a transfer of native STX or a supported SIP-010 token.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientAddress
 *               - amount
 *               - assetType
 *             properties:
 *               recipientAddress:
 *                 type: string
 *                 description: Recipient Stacks address
 *               amount:
 *                 type: number
 *                 description: Human amount (e.g., 1.5 STX, or 0.1 sBTC)
 *               assetType:
 *                 type: string
 *                 enum: [STX, sBTC, USDCx, Custom]
 *                 description: Asset to transfer. Select "Custom" to specify a custom SIP-010 token.
 *               tokenContractAddress:
 *                 type: string
 *                 description: Required when assetType is "Custom". The contract address of the SIP-010 token.
 *               tokenContractName:
 *                 type: string
 *                 description: Required when assetType is "Custom". The contract name of the SIP-010 token.
 *               tokenAssetName:
 *                 type: string
 *                 description: Required when assetType is "Custom". The asset name from define-fungible-token (may differ from contract name).
 *               grossTransaction:
 *                 type: boolean
 *                 default: false
 *                 description: STX only — if true, fee is deducted from the entered amount.
 *               note:
 *                 type: string
 *                 description: Optional note attached to Fireblocks signing request
 *               memo:
 *                 type: string
 *                 description: STX only — optional on-chain memo included in the transaction.
 *               externalId:
 *                 type: string
 *                 description: Optional idempotency key passed to Fireblocks as externalTxId for deduplication.
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: >
 *                   Optional transaction nonce override. If omitted, the SDK auto-fetches
 *                   the current account nonce from the network (default behavior).
 *                   Only set this for advanced use cases such as nonce management or
 *                   transaction replacement.
 *               fee:
 *                 type: number
 *                 description: >
 *                   STX only — optional fee override in STX (e.g. 0.0001). If omitted,
 *                   the SDK estimates the fee automatically. Set a deliberately low value
 *                   to test replace-by-fee flows.
 *     responses:
 *       200:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid input (includes missing tokenContractAddress/tokenContractName/tokenAssetName when assetType is Custom)
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:vaultId/transfer",
  validateVaultId,
  controller.createTransaction,
);


/**
 * @openapi
 * /{vaultId}/replace-transaction:
 *   post:
 *     summary: Replace a stuck pending transaction (bump fee)
 *     description: >
 *       Replaces a pending transaction that is stuck in the mempool by submitting a new one
 *       with the **same nonce** but a higher fee. The Stacks node will evict the original.
 *
 *       Supported transaction types: `token_transfer` and `contract_call`.
 *       The original transaction is looked up automatically — args are reconstructed from
 *       the Hiro indexer response, so only the fee (and optionally recipient/amount for
 *       token_transfer) need to be provided.
 *
 *       **Limitations**:
 *         - The new fee must be strictly greater than the original fee (by at least 1 microSTX).
 *         - The original transaction must be in "pending" status (visible to the Hiro indexer).
 *         - `nonceOverride` path only supports STX token_transfer (contract args cannot be inferred).
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalTxId
 *               - newFee
 *             properties:
 *               originalTxId:
 *                 type: string
 *                 description: Transaction ID of the pending transaction to replace.
 *               newFee:
 *                 type: number
 *                 description: New fee in STX. Must be higher than the original fee.
 *               newRecipient:
 *                 type: string
 *                 description: >
 *                   Optional new recipient Stacks address. Defaults to the original recipient.
 *               newAmount:
 *                 type: number
 *                 description: >
 *                   Optional new transfer amount in STX.
 *                   Defaults to the original amount. Required when nonceOverride is set.
 *               nonceOverride:
 *                 type: integer
 *                 minimum: 0
 *                 description: >
 *                   Provide the nonce directly to skip the transaction lookup.
 *                   Use this when the original transaction is not visible to the Hiro
 *                   indexer — for example, a future-nonce transaction that was accepted
 *                   by the node but does not appear in the explorer or getTxStatusById.
 *                   When set, newRecipient and newAmount are required.
 *     responses:
 *       200:
 *         description: Replacement transaction submitted successfully.
 *       400:
 *         description: Invalid input or transaction cannot be replaced.
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:vaultId/replace-transaction",
  validateVaultId,
  controller.replaceTransaction,
);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/stake:
 *   post:
 *     summary: Stake STX (PoX-5)
 *     description: >
 *       Initiates a PoX-5 solo STX staking position. Rewards are paid in sBTC
 *       to the staker's Stacks address by the signer-manager.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - numCycles
 *               - signerManager
 *             properties:
 *               amount:
 *                 type: number
 *                 description: STX amount to stake (e.g. 1000). Converted to microSTX internally.
 *               numCycles:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 96
 *                 description: Number of reward cycles to lock STX for (1–96).
 *               signerManager:
 *                 type: string
 *                 description: Stacks address of the signer-manager delegated to manage this stake.
 *               note:
 *                 type: string
 *                 description: Optional note attached to the Fireblocks transaction.
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: >
 *                   Optional transaction nonce override. If omitted, the SDK auto-fetches
 *                   the current account nonce from the network (default behavior).
 *               externalId:
 *                 type: string
 *                 description: Optional external ID for the Fireblocks transaction.
 *     responses:
 *       200:
 *         description: Stake transaction submitted successfully.
 *       400:
 *         description: Invalid input (amount, numCycles, or signerManager missing/invalid).
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/stake", validateVaultId, controller.stake);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/update:
 *   post:
 *     summary: Update stake (PoX-5)
 *     description: >
 *       Updates an existing PoX-5 staking position — change the signer-manager,
 *       extend the lock period, or increase the staked amount. At least one of
 *       cyclesToExtend or increaseBy must be provided alongside the required fields.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signerManager
 *               - oldSignerManager
 *             properties:
 *               signerManager:
 *                 type: string
 *                 description: Stacks address of the new signer-manager.
 *               oldSignerManager:
 *                 type: string
 *                 description: Stacks address of the currently recorded signer-manager (must match on-chain state).
 *               cyclesToExtend:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of additional cycles to extend the lock by.
 *               increaseBy:
 *                 type: number
 *                 description: Additional STX amount to add to the staking position.
 *               note:
 *                 type: string
 *                 description: Optional note attached to the Fireblocks transaction.
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: >
 *                   Optional transaction nonce override. If omitted, the SDK auto-fetches
 *                   the current account nonce from the network (default behavior).
 *               externalId:
 *                 type: string
 *                 description: Optional external ID for the Fireblocks transaction.
 *     responses:
 *       200:
 *         description: Update stake transaction submitted successfully.
 *       400:
 *         description: Invalid input (signerManager or oldSignerManager missing).
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/update", validateVaultId, controller.updateStake);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/unstake:
 *   post:
 *     summary: Unstake STX (PoX-5)
 *     description: >
 *       Exits a PoX-5 staking position. Cannot be called during the prepare phase
 *       of a reward cycle — the SDK will reject the request if the current burn block
 *       is within the prepare phase window.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldSignerManager
 *             properties:
 *               oldSignerManager:
 *                 type: string
 *                 description: Stacks address of the currently recorded signer-manager (must match on-chain state).
 *               note:
 *                 type: string
 *                 description: Optional note attached to the Fireblocks transaction.
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: >
 *                   Optional transaction nonce override. If omitted, the SDK auto-fetches
 *                   the current account nonce from the network (default behavior).
 *               externalId:
 *                 type: string
 *                 description: Optional external ID for the Fireblocks transaction.
 *     responses:
 *       200:
 *         description: Unstake transaction submitted successfully.
 *       400:
 *         description: Invalid input (oldSignerManager missing) or called during prepare phase.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/unstake", validateVaultId, controller.unstake);

/**
 * @openapi
 * /stacking/pox5/info:
 *   get:
 *     summary: Get PoX-5 network info
 *     description: >
 *       Returns current PoX-5 protocol state from the private testnet node,
 *       including the current reward cycle, burn block height, prepare phase window,
 *       and stacking minimums.
 *     responses:
 *       200:
 *         description: PoX-5 info fetched successfully.
 *       500:
 *         description: Internal server error
 */
router.get("/stacking/pox5/info", controller.getPox5Info);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/staker-info:
 *   get:
 *     summary: Get staker info (PoX-5)
 *     description: >
 *       Returns the current PoX-5 staking state for the vault's Stacks address,
 *       including the active signer-manager, locked amount, and unlock height.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Staker info retrieved successfully.
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/stacking/pox5/staker-info", validateVaultId, controller.getStakerInfo);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/requirements:
 *   get:
 *     summary: Get PoX-5 staking requirements and minimums
 *     description: >
 *       Returns cycle timing and safety info. When `bondIndex` is provided, also returns
 *       the bond's STX/BTC ratio, its current phase status, and the caller's personal BTC
 *       allowance cap. When `btcAmountSats` is also provided, computes the minimum STX
 *       required to pair with that BTC amount.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *       - in: query
 *         name: bondIndex
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Bond index to fetch requirements for.
 *       - in: query
 *         name: btcAmountSats
 *         required: false
 *         schema:
 *           type: string
 *         description: >
 *           BTC amount in satoshis as an integer string. Requires bondIndex.
 *           When provided, the response includes min_stx_for_sats and min_ustx_for_sats.
 *     responses:
 *       200:
 *         description: Requirements fetched successfully.
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/stacking/pox5/requirements", validateVaultId, controller.getRequirements);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/create:
 *   post:
 *     summary: Create a PoX-5 BTC bond (L1 + L2 registration)
 *     description: >
 *       Funds a BTC P2WSH lock address and registers the resulting UTXO on-chain via
 *       an SPV proof. The paired STX amount is computed automatically from the bond's
 *       STX/BTC ratio. The BTC transaction is submitted via Fireblocks and confirmation
 *       is polled before the L2 registration transaction is broadcast.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bondIndex
 *               - btcAmountSats
 *               - signerManager
 *             properties:
 *               bondIndex:
 *                 type: integer
 *                 minimum: 0
 *                 description: Index of the PoX-5 bond to join.
 *               btcAmountSats:
 *                 type: string
 *                 description: BTC amount in satoshis as an integer string (e.g. "100000").
 *               signerManager:
 *                 type: string
 *                 description: Stacks address of the signer-manager for this bond.
 *               confirmations:
 *                 type: integer
 *                 minimum: 1
 *                 description: BTC confirmations to wait for before L2 registration (default 1).
 *               note:
 *                 type: string
 *                 description: Optional note attached to the Fireblocks transactions.
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: Optional Stacks nonce override for the L2 registration transaction.
 *               externalId:
 *                 type: string
 *                 description: Optional idempotency key for the Fireblocks BTC transaction.
 *     responses:
 *       200:
 *         description: Bond created successfully.
 *       400:
 *         description: Invalid input or eligibility check failed.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/bond/create", validateVaultId, controller.createBond);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/position:
 *   get:
 *     summary: Get current BTC bond position (PoX-5)
 *     description: >
 *       Returns the current bond membership for the vault's address, including
 *       the bond index, locked STX and BTC amounts, unlock height, locking address,
 *       and accumulated earned sats.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Bond position retrieved successfully.
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/stacking/pox5/bond/position", validateVaultId, controller.getBondPosition);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/announce-early-exit:
 *   post:
 *     summary: Announce early BTC bond exit (PoX-5)
 *     description: >
 *       Broadcasts the L2 early-exit announcement for a native BTC bond. This signals
 *       the signer-manager that the BTC lock will be broken before the scheduled
 *       unlock height. Only valid for L1-locked bonds outside the prepare phase.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: Optional note attached to the Fireblocks transaction.
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: Optional Stacks nonce override.
 *               externalId:
 *                 type: string
 *                 description: Optional idempotency key for the Fireblocks transaction.
 *     responses:
 *       200:
 *         description: Early exit announced successfully.
 *       400:
 *         description: No active L1 bond or called during prepare phase.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/bond/announce-early-exit", validateVaultId, controller.announceEarlyExit);

// Pool metrics
/**
 * @openapi
 * /metrics:
 *   get:
 *     summary: Get SDK pool metrics
 *     description: Retrieves metrics for the Fireblocks SDK connection pool.
 *     responses:
 *       200:
 *         description: Metrics fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get("/metrics", controller.getPoolMetrics);

export default router;
