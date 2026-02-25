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
 * /{vaultId}/transactions/{txId}:
 *   get:
 *     summary: Get transaction status by txid
 *     description: Retrieves status and details for a specific transaction ID.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
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
  "/:vaultId/transactions/:txId",
  validateVaultId,
  controller.getTxStatusById,
);

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
 *       - in: query
 *         name: recipientAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipient Stacks address
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Human amount (e.g., 1.5 STX, or 0.1 sBTC)
 *       - in: query
 *         name: assetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [STX, sBTC,Custom]
 *         description: Asset to transfer. Select "Custom" to specify a custom SIP-010 token.
 *       - in: query
 *         name: tokenContractAddress
 *         required: false
 *         schema:
 *           type: string
 *         description: Required when assetType is "Custom". The contract address of the SIP-010 token.
 *       - in: query
 *         name: tokenContractName
 *         required: false
 *         schema:
 *           type: string
 *         description: Required when assetType is "Custom". The contract name of the SIP-010 token.
 *       - in: query
 *         name: grossTransaction
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: STX only — if true, fee is deducted from the entered amount.
 *       - in: query
 *         name: note
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional note attached to Fireblocks signing request
 *     responses:
 *       200:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid input (includes missing tokenContractAddress/tokenContractName when assetType is Custom)
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
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Human amount (e.g., 40 STX)
 *       - in: query
 *         name: pool
 *         required: true
 *         schema:
 *           type: string
 *           enum: [FAST_POOL]
 *         description: Pool to delegate to.
 *       - in: query
 *         name: lockPeriod
 *         required: false
 *         schema:
 *           type: number
 *           default: 1
 *           minimum: 1
 *           maximum: 12
 *         description: Number of cycles to stack (1-12). Default is 1.
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
 *       - in: query
 *         name: pool
 *         required: true
 *         schema:
 *           type: string
 *           enum: [FAST_POOL]
 *         description: Pool to allow as contract caller.
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
 *       - in: query
 *         name: signerKey
 *         required: true
 *         schema:
 *           type: string
 *         description: The key of the running signer
 *       - in: query
 *         name: signerSig65Hex
 *         required: true
 *         schema:
 *           type: string
 *         description: The signature of the running signer key
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Human STX amount to solo stack (e.g. 1000).
 *       - in: query
 *         name: lockPeriod
 *         required: true
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 12
 *         description: Number of cycles to lock (1-12).
 *       - in: query
 *         name: authId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional integer string (bigint) used for signer-sig replay protection.
 *     responses:
 *       200:
 *         description: Solo stacking transaction submitted
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/solo", validateVaultId, controller.stackSolo);

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
