import { Router, Request, Response, NextFunction } from "express";
import * as controller from "./controller";

// Middleware to validate vaultAccountId parameter
const validateVaultId = (
  req: Request,
  res: Response,
  next: NextFunction
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
 *         name: after
 *         required: false
 *         schema:
 *           type: number
 *         description: Pagination token returned with every transaction (use to fetch transactions after that token).
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
  controller.getTransactionHistory
);

// Create transactions
/**
 * @openapi
 * /{vaultId}/transfer:
 *   post:
 *     summary: Create native coin (STX) transfer
 *     description: Initiates transfer of native STX coin from vault to recipient.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientAddress, amount]
 *             properties:
 *               recipientAddress:
 *                 type: string
 *                 example: '0xabc123'
 *               amount:
 *                 type: number
 *                 example: 1.5
 *               inMicro:
 *                 type: boolean
 *                 example: false
 *                 description: Whether the amount is in Micro (smallest unit) or in STX
 *               grossTransaction:
 *                 type: boolean
 *                 example: false
 *                 description: Whether the amount includes the fee
 *               note:
 *                 type: string
 *                 example: 'Payment for services'
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
  controller.createTransaction
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
