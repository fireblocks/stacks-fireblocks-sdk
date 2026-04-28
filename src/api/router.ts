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
 *     summary: Get current account nonce
 *     description: >
 *       Returns the next expected nonce for this vault's Stacks address,
 *       derived from the confirmed on-chain state.
 *
 *       **Note**: pending mempool transactions are not reflected. If you have
 *       unconfirmed transactions in flight, the next safe nonce is this value
 *       plus the number of pending transactions.
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
 *                 nonce:
 *                   type: integer
 *                   description: Next nonce to use for a new transaction.
 *                   example: 5
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
 * /{vaultId}/stacking/pool/delegate:
 *   post:
 *     summary: Delegate STX to a pool
 *     description: >
 *       Initiates a delegation of STX to a specified pool.
 *       Please don't delegate less than the chosen pool's minimum;
 *       check the pool's website for the minimum STX required.
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
 *               - pool
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Human amount (e.g., 40 STX)
 *               pool:
 *                 type: string
 *                 enum: [FAST_POOL]
 *                 description: Pool to delegate to.
 *               lockPeriod:
 *                 type: number
 *                 default: 1
 *                 minimum: 1
 *                 maximum: 12
 *                 description: Number of cycles to stack (1-12). Default is 1.
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: >
 *                   Optional transaction nonce override. If omitted, the SDK auto-fetches
 *                   the current account nonce from the network (default behavior).
 *     responses:
 *       200:
 *         description: Delegated to pool successfully.
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:vaultId/stacking/pool/delegate",
  validateVaultId,
  controller.delegateToPool,
);

/**
 * @openapi
 * /{vaultId}/stacking/pool/allow-contract-caller:
 *   post:
 *     summary: Allow stacking pool as contract caller
 *     description: >
 *       Allows the specified stacking pool to call PoX contract to
 *       lock delegated STX on behalf of the account associated with the given vault ID.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pool
 *             properties:
 *               pool:
 *                 type: string
 *                 enum: [FAST_POOL]
 *                 description: Pool to allow as contract caller.
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: >
 *                   Optional transaction nonce override. If omitted, the SDK auto-fetches
 *                   the current account nonce from the network (default behavior).
 *     responses:
 *       200:
 *         description: Pool allowed as contract caller successfully.
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:vaultId/stacking/pool/allow-contract-caller",
  validateVaultId,
  controller.allowContractCaller,
);

/**
 * @openapi
 * /{vaultId}/revoke-delegation:
 *   post:
 *     summary: Revoke existing delegations
 *     description: >
 *       Revokes any existing STX delegations for the account associated with the given vault ID.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: >
 *                   Optional transaction nonce override. If omitted, the SDK auto-fetches
 *                   the current account nonce from the network (default behavior).
 *     responses:
 *       200:
 *         description: Delegation revoked successfully.
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:vaultId/revoke-delegation",
  validateVaultId,
  controller.revokeDelegation,
);

/**
 * @openapi
 * /{vaultId}/stacking/solo:
 *   post:
 *     summary: Solo stack STX (PoX-4)
 *     description: >
 *       Initiates a solo stacking request using pox-4::stack-stx.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signerKey
 *               - signerSig65Hex
 *               - amount
 *               - maxAmount
 *               - lockPeriod
 *               - authId
 *             properties:
 *               signerKey:
 *                 type: string
 *                 description: The key of the running signer
 *               signerSig65Hex:
 *                 type: string
 *                 description: The signature of the running signer key
 *               amount:
 *                 type: number
 *                 description: Human STX amount to solo stack (e.g. 1000).
 *               maxAmount:
 *                 type: string
 *                 description: Maximum amount in microSTX (integer string) used in the signer signature.
 *               lockPeriod:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 12
 *                 description: Number of cycles to lock (1-12).
 *               authId:
 *                 type: string
 *                 description: Integer string (bigint) used for signer-sig replay protection (must be the same authId used to generate the signature).
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: >
 *                   Optional transaction nonce override. If omitted, the SDK auto-fetches
 *                   the current account nonce from the network (default behavior).
 *     responses:
 *       200:
 *         description: Solo stacking transaction submitted
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/solo", validateVaultId, controller.stackSolo);

/**
 * @openapi
 * /{vaultId}/stacking/solo/increase:
 *   post:
 *     summary: Increase solo stacked amount (PoX-4)
 *     description: >
 *       Increases the amount of STX in an existing solo stacking position using pox-4::stack-increase.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signerKey
 *               - signerSig65Hex
 *               - increaseBy
 *               - maxAmount
 *               - authId
 *             properties:
 *               signerKey:
 *                 type: string
 *                 description: The key of the running signer
 *               signerSig65Hex:
 *                 type: string
 *                 description: The signature of the running signer key
 *               increaseBy:
 *                 type: number
 *                 description: Human STX amount to add to the existing stack (e.g. 500).
 *               maxAmount:
 *                 type: string
 *                 description: Maximum amount in microSTX (integer string) used in the signer signature.
 *               authId:
 *                 type: string
 *                 description: Integer string (bigint) used for signer-sig replay protection (must be the same authId used to generate the signature).
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: >
 *                   Optional transaction nonce override. If omitted, the SDK auto-fetches
 *                   the current account nonce from the network (default behavior).
 *     responses:
 *       200:
 *         description: Increase stacked amount transaction submitted
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/solo/increase", validateVaultId, controller.increaseStackedAmount);

/**
 * @openapi
 * /{vaultId}/stacking/solo/extend:
 *   post:
 *     summary: Extend solo stacking period (PoX-4)
 *     description: >
 *       Extends the stacking period of an existing solo stacking position using pox-4::stack-extend.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signerKey
 *               - signerSig65Hex
 *               - extendCycles
 *               - maxAmount
 *               - authId
 *             properties:
 *               signerKey:
 *                 type: string
 *                 description: The key of the running signer
 *               signerSig65Hex:
 *                 type: string
 *                 description: The signature of the running signer key
 *               extendCycles:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 12
 *                 description: Number of cycles to extend the stacking period by (1-12).
 *               maxAmount:
 *                 type: string
 *                 description: Maximum amount in microSTX (integer string) used in the signer signature.
 *               authId:
 *                 type: string
 *                 description: Integer string (bigint) used for signer-sig replay protection (must be the same authId used to generate the signature).
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *                 description: >
 *                   Optional transaction nonce override. If omitted, the SDK auto-fetches
 *                   the current account nonce from the network (default behavior).
 *     responses:
 *       200:
 *         description: Extend stacking period transaction submitted
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/solo/extend", validateVaultId, controller.extendStackingPeriod);

/**
 * @openapi
 * /{vaultId}/replace-transaction:
 *   post:
 *     summary: Replace a stuck pending STX transaction (bump fee)
 *     description: >
 *       Replaces a pending native STX token_transfer transaction that is stuck in the mempool
 *       by submitting a new transaction with the **same nonce** but a higher fee.
 *       The Stacks node will evict the original transaction in favour of this one.
 *
 *       **Limitations**:
 *         - Only native STX token_transfer transactions are supported (not FT or contract calls).
 *         - The new fee must be higher than the original fee or the node may reject the replacement.
 *         - The original transaction must still be in "pending" status.
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
