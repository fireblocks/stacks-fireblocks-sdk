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
 *           enum: [STX, sBTC, USDC, USDH]
 *         description: Asset to transfer.
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
 *         description: Invalid input
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
 * /{vaultId}/pool-stack:
 *   post:
 *     summary: Stack STX with a pool
 *     description: >
 *       Initiates a delegation of STX to a specified pool and allows the pool
 *       to stack on behalf of the user. Please don't stack less than the chosen
 *       pool's minimum; check the pool's website for the minimum STX required.
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
 *         description: Pool to stack with.
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
router.post("/:vaultId/pool-stack", validateVaultId, controller.poolStack);

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
