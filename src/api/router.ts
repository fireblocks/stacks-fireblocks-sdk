import { Router, Request, Response, NextFunction } from "express";
import * as controller from "./controller";
import { enforceVaultAllowlist, loadAuthConfig } from "./auth";

// Rejects operations on vaults outside the configured allowlist. Chained into
// validateVaultId below so it only applies to genuinely vault-scoped routes
// (not read-only endpoints like /transactions/:txId, /poxInfo, /metrics).
const vaultAllowlist = enforceVaultAllowlist(loadAuthConfig());

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
  vaultAllowlist(req, res, next);
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
 *     tags: [Account]
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
 *     tags: [Account]
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
 *     tags: [Account]
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
 *     tags: [Transactions]
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

// Protocol info. Reports whichever PoX contract the configured node exposes, so this
// returns pox-5 on networks where pox-5 is active. See /stacking/pox5/info for the
// PoX-5 specific shape.
/**
 * @openapi
 * /poxInfo:
 *   get:
 *     tags: [Protocol Info]
 *     summary: Get PoX info from the configured node
 *     description: >
 *       Retrieves Proof of Transfer information from the node's own PoX endpoint.
 *       The contract reported depends on the network — pox-4 on mainnet, pox-5 where
 *       pox-5 is active.
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
 *     tags: [Account]
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
 *     tags: [Balances]
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
 *     tags: [Balances]
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
 *     tags: [Transactions]
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
 *     tags: [Transactions]
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
 *     tags: [Transactions]
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
 *               - newFee
 *             description: >
 *               Either originalTxId or nonceOverride must be provided (originalTxId is
 *               omitted only on the nonceOverride path, which additionally requires
 *               newRecipient and newAmount).
 *             properties:
 *               originalTxId:
 *                 type: string
 *                 description: Transaction ID of the pending transaction to replace. Required unless nonceOverride is provided.
 *               newFee:
 *                 type: number
 *                 description: >
 *                   New fee in STX. On the lookup path it must be at least
 *                   RBF_MIN_FEE_MULTIPLIER (1.25) times the original fee.
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

// ─────────────────────────────────────────────────────────────────────────────
// PoX-4 stacking — solo stacking and pool delegation.
// Live on Stacks mainnet. Pool delegation routes reject on testnet.
// Handlers: controller.stackSolo / increaseStackedAmount / extendStackingPeriod /
// delegateToPool / allowContractCaller / revokeDelegation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /{vaultId}/stacking/solo:
 *   post:
 *     tags: [PoX-4 Stacking]
 *     summary: Solo stack STX (PoX-4)
 *     description: >
 *       Locks STX directly via pox-4::stack-stx. Requires a signer key and a matching
 *       signer signature generated with the same authId. Rejected if the account has an
 *       active delegation or the amount is below the cycle minimum.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [signerKey, signerSig65Hex, amount, maxAmount, authId]
 *             properties:
 *               signerKey:
 *                 type: string
 *                 description: Signer public key (compressed 33-byte hex).
 *               signerSig65Hex:
 *                 type: string
 *                 description: 65-byte signer signature (hex) over the stacking parameters.
 *               amount:
 *                 type: number
 *                 description: STX amount to stack. Converted to microSTX internally.
 *               maxAmount:
 *                 type: string
 *                 description: Maximum authorised amount in microSTX (integer string) used in the signer signature.
 *               lockPeriod:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 default: 1
 *                 description: Number of reward cycles to lock for (1–12).
 *               authId:
 *                 type: string
 *                 description: Integer string for signer-sig replay protection. Must match the value used to generate the signature.
 *               note:
 *                 type: string
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Solo stacking transaction submitted.
 *       400:
 *         description: Invalid input, active delegation present, or amount below the cycle minimum.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/solo", validateVaultId, controller.stackSolo);

/**
 * @openapi
 * /{vaultId}/stacking/solo/increase:
 *   post:
 *     tags: [PoX-4 Stacking]
 *     summary: Increase solo stacked amount (PoX-4)
 *     description: Adds STX to an existing solo stacking position via pox-4::stack-increase.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [signerKey, signerSig65Hex, increaseBy, maxAmount, authId]
 *             properties:
 *               signerKey:
 *                 type: string
 *                 description: Signer public key (compressed 33-byte hex).
 *               signerSig65Hex:
 *                 type: string
 *                 description: 65-byte signer signature (hex).
 *               increaseBy:
 *                 type: number
 *                 description: Additional STX to add to the existing position.
 *               maxAmount:
 *                 type: string
 *                 description: Maximum authorised amount in microSTX (integer string) used in the signer signature.
 *               authId:
 *                 type: string
 *                 description: Integer string for signer-sig replay protection.
 *               note:
 *                 type: string
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Stack-increase transaction submitted.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/solo/increase", validateVaultId, controller.increaseStackedAmount);

/**
 * @openapi
 * /{vaultId}/stacking/solo/extend:
 *   post:
 *     tags: [PoX-4 Stacking]
 *     summary: Extend solo stacking period (PoX-4)
 *     description: Extends the lock period of an existing solo stacking position via pox-4::stack-extend.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [signerKey, signerSig65Hex, extendCycles, maxAmount, authId]
 *             properties:
 *               signerKey:
 *                 type: string
 *                 description: Signer public key (compressed 33-byte hex).
 *               signerSig65Hex:
 *                 type: string
 *                 description: 65-byte signer signature (hex).
 *               extendCycles:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 description: Additional reward cycles to extend by (1–12).
 *               maxAmount:
 *                 type: string
 *                 description: Maximum authorised amount in microSTX (integer string) used in the signer signature.
 *               authId:
 *                 type: string
 *                 description: Integer string for signer-sig replay protection.
 *               note:
 *                 type: string
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Stack-extend transaction submitted.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/solo/extend", validateVaultId, controller.extendStackingPeriod);

/**
 * @openapi
 * /{vaultId}/stacking/pool/delegate:
 *   post:
 *     tags: [PoX-4 Stacking]
 *     summary: Delegate STX to a stacking pool (PoX-4)
 *     description: >
 *       Delegates STX to a pool via pox-4::delegate-stx. The pool performs the actual lock,
 *       so `/stacking/pool/allow-contract-caller` must also be called for the same pool.
 *       Not supported on testnet.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 description: STX amount to delegate. Converted to microSTX internally.
 *               pool:
 *                 type: string
 *                 enum: [FAST_POOL]
 *                 default: FAST_POOL
 *                 description: Pool to delegate to.
 *               lockPeriod:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 default: 1
 *                 description: Number of reward cycles to delegate for (1–12).
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Delegation transaction submitted.
 *       400:
 *         description: Invalid input or an active delegation already exists.
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
 *     tags: [PoX-4 Stacking]
 *     summary: Allow a pool contract to lock delegated STX (PoX-4)
 *     description: >
 *       Authorises the pool contract as a PoX contract caller via
 *       pox-4::allow-contract-caller, permitting it to lock delegated STX.
 *       Not supported on testnet.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pool:
 *                 type: string
 *                 enum: [FAST_POOL]
 *                 default: FAST_POOL
 *                 description: Pool to authorise as contract caller.
 *               nonce:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Pool authorised as contract caller.
 *       400:
 *         description: Unsupported pool.
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
 *     tags: [PoX-4 Stacking]
 *     summary: Revoke an active STX delegation (PoX-4)
 *     description: >
 *       Revokes any active delegation via pox-4::revoke-delegate-stx. Required before
 *       switching pools or moving to solo stacking. Not supported on testnet.
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
 *     responses:
 *       200:
 *         description: Delegation revoked.
 *       400:
 *         description: vaultId missing.
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:vaultId/revoke-delegation",
  validateVaultId,
  controller.revokeDelegation,
);

// ─────────────────────────────────────────────────────────────────────────────
// PoX-5 STX-only staking — stake, update and unstake via a signer-manager.
// Rewards are paid in sBTC. Targets the private-1 network; see pox5Network in
// StacksSDK. Requires a signer-key grant (grant-signer-key) before staking.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /{vaultId}/stacking/pox5/stake:
 *   post:
 *     tags: [PoX-5 Staking]
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
 *     tags: [PoX-5 Staking]
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
 *     tags: [PoX-5 Staking]
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
 *     tags: [Protocol Info]
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
 *     tags: [PoX-5 Staking]
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
 * /{vaultId}/stacking/pox5/grant-signer-key:
 *   post:
 *     tags: [PoX-5 Staking]
 *     summary: Grant signer key (PoX-5)
 *     description: Grants a signer key via the signer-manager contract, authorising it to act on behalf of this vault for PoX-5 staking.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [signerManager, authId]
 *             properties:
 *               signerManager:
 *                 type: string
 *                 description: Stacks address of the signer-manager contract.
 *               authId:
 *                 type: string
 *                 description: Positive integer (as a string) for replay protection. Must never be reused.
 *               nonce:
 *                 type: integer
 *               externalId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signer key granted successfully.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/grant-signer-key", validateVaultId, controller.grantSignerKey);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/verify-signer-grant:
 *   get:
 *     tags: [PoX-5 Staking]
 *     summary: Verify signer grant (PoX-5)
 *     description: Checks on-chain whether the signer grant for this vault is currently active.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *       - in: query
 *         name: signerManager
 *         required: true
 *         schema:
 *           type: string
 *         description: Signer-manager contract address to verify the grant against.
 *     responses:
 *       200:
 *         description: Grant verification result returned.
 *       400:
 *         description: signerManager is required.
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/stacking/pox5/verify-signer-grant", validateVaultId, controller.verifySignerGrant);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/revoke-signer-grant:
 *   post:
 *     tags: [PoX-5 Staking]
 *     summary: Revoke signer grant (PoX-5)
 *     description: Revokes an existing signer key grant from a signer-manager contract on PoX-5.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [signerManager, signerKey]
 *             properties:
 *               signerManager:
 *                 type: string
 *                 description: Stacks principal of the signer-manager contract.
 *               signerKey:
 *                 type: string
 *                 description: 33-byte compressed public key (hex) to revoke.
 *               nonce:
 *                 type: integer
 *               externalId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signer grant revoked successfully.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/revoke-signer-grant", validateVaultId, controller.revokeSignerGrant);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/requirements:
 *   get:
 *     tags: [PoX-5 Staking]
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

// ─────────────────────────────────────────────────────────────────────────────
// PoX-5 BTC bonds — pairs a native BTC P2WSH lock with an STX position.
// Lifecycle: lock-address → fund-lock → create → renew → unlock.
// Early exit spends the OP_ELSE branch and needs the external KMS cosigner.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/create:
 *   post:
 *     tags: [PoX-5 BTC Bonds]
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
 *               btcTxid:
 *                 type: string
 *                 description: >
 *                   Pre-funded BTC txid (testnet only). If provided, skips the Fireblocks BTC
 *                   send and uses this txid directly. Get it from bond/fund-lock.
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
 * /{vaultId}/stacking/pox5/bond/sbtc/create:
 *   post:
 *     summary: Register an sBTC-backed bond (locks paired STX and transfers sBTC)
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: sBTC bond registered
 */
router.post("/:vaultId/stacking/pox5/bond/sbtc/create", validateVaultId, controller.createSbtcBond);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/sbtc/unstake:
 *   post:
 *     summary: Withdraw sBTC from an sBTC-backed membership
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: sBTC withdrawal submitted
 */
router.post("/:vaultId/stacking/pox5/bond/sbtc/unstake", validateVaultId, controller.unstakeSbtc);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/position:
 *   get:
 *     tags: [PoX-5 BTC Bonds]
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
 *     tags: [PoX-5 BTC Bonds]
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

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/early-exit:
 *   post:
 *     tags: [PoX-5 BTC Bonds]
 *     summary: Spend early-exit BTC bond via cosigner (PoX-5)
 *     description: >
 *       Spends the bond's P2WSH UTXO through the OP_ELSE (early-exit) branch. The
 *       staker leg is raw-signed via Fireblocks and the cosigner leg is fetched from
 *       the external KMS signing service, which is verified against the locally
 *       computed sighash and the bond's early-unlock-bytes before use.
 *       Requires announce-early-exit to have settled on L2 first (pre-checked on-chain).
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [destinationBtcAddress]
 *             properties:
 *               destinationBtcAddress:
 *                 type: string
 *                 description: BTC address to receive the unlocked funds.
 *               feeSats:
 *                 type: string
 *                 description: Optional BTC fee in sats (default 500).
 *               bondIndex:
 *                 type: integer
 *                 minimum: 0
 *                 description: Optional bond index override when membership is no longer active.
 *     responses:
 *       200:
 *         description: Early-exit spend broadcast successfully (returns btcTxid).
 *       400:
 *         description: Missing/invalid parameters, announce not settled, or no L1-locked bond.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/bond/early-exit", validateVaultId, controller.spendEarlyExit);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/early-exit/public-key:
 *   get:
 *     tags: [PoX-5 BTC Bonds]
 *     summary: Get early-exit cosigner public key metadata (PoX-5)
 *     description: >
 *       Proxies the external KMS cosigner service's public-key endpoint. Returns the
 *       service's account xpub, derivation path, fingerprint, and network — useful for
 *       verifying the configured cosigner matches a bond's early-unlock-bytes.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Cosigner public key metadata returned successfully.
 *       500:
 *         description: Cosigner service unreachable or not configured.
 */
router.get("/:vaultId/stacking/pox5/bond/early-exit/public-key", validateVaultId, controller.getEarlyExitPublicKey);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/lock-address:
 *   get:
 *     tags: [PoX-5 BTC Bonds]
 *     summary: Get BTC bond lock address (PoX-5)
 *     description: >
 *       Returns the P2WSH lock address (bcrt1… on testnet, bc1… on mainnet) for the given
 *       bond index. Send BTC to this address before calling bond/create with a pre-funded btcTxid.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *       - in: query
 *         name: bondIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bond index to derive the lock address for.
 *     responses:
 *       200:
 *         description: Lock address returned successfully.
 *       400:
 *         description: bondIndex is required.
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/stacking/pox5/bond/lock-address", validateVaultId, controller.getBondLockAddress);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/fund-lock:
 *   post:
 *     tags: [PoX-5 BTC Bonds]
 *     summary: Fund BTC bond lock address via faucet (testnet only)
 *     description: >
 *       Calls the private-1 BTC faucet to fund the bond lock address for the given bond index.
 *       Returns the faucet txid — pass it as btcTxid in bond/create to skip the Fireblocks send.
 *       Only available on testnet.
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
 *             properties:
 *               bondIndex:
 *                 type: integer
 *                 description: Bond index to fund the lock address for.
 *     responses:
 *       200:
 *         description: Faucet funded successfully, returns txid and lockAddress.
 *       400:
 *         description: bondIndex is required or not on testnet.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/bond/fund-lock", validateVaultId, controller.fundBondLockAddress);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/unlock:
 *   post:
 *     tags: [PoX-5 BTC Bonds]
 *     summary: Unlock matured BTC bond (PoX-5)
 *     description: >
 *       Spends the P2WSH lock UTXO via the OP_IF (CLTV) branch and sends the BTC to a
 *       destination address. Only callable after the unlock height has passed on the Bitcoin chain.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - destinationBtcAddress
 *             properties:
 *               destinationBtcAddress:
 *                 type: string
 *                 description: BTC address to send the unlocked funds to.
 *               feeSats:
 *                 type: integer
 *                 description: Optional fee in sats (default 500).
 *               bondIndex:
 *                 type: integer
 *                 description: Bond index to unlock. Required when the bond membership has already expired on-chain (bond cycle closed but BTC still at locking address).
 *     responses:
 *       200:
 *         description: BTC unlocked successfully, returns btcTxid.
 *       400:
 *         description: Bond not matured or no active bond found.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/bond/unlock", validateVaultId, controller.unlockMaturedBond);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/renew:
 *   post:
 *     tags: [PoX-5 BTC Bonds]
 *     summary: Renew BTC bond into next bond period (PoX-5)
 *     description: >
 *       Spends the current lock UTXO via the OP_ELSE branch and re-locks the BTC into the
 *       next bond's P2WSH address, then broadcasts the L2 register-for-bond transaction.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nextBondIndex
 *               - signerManager
 *             properties:
 *               nextBondIndex:
 *                 type: integer
 *                 description: Bond index to renew into.
 *               signerManager:
 *                 type: string
 *                 description: Signer manager contract address for the next bond.
 *               feeSats:
 *                 type: integer
 *                 description: Optional BTC fee in sats (default 500).
 *               note:
 *                 type: string
 *               nonce:
 *                 type: integer
 *               externalId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bond renewed successfully.
 *       400:
 *         description: No active bond or eligibility check failed.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/bond/renew", validateVaultId, controller.renewBond);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/bond/update-registration:
 *   post:
 *     summary: Rotate a paired bond's signer manager before the bond period starts
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Signer manager rotated
 */
router.post("/:vaultId/stacking/pox5/bond/update-registration", validateVaultId, controller.updateBondRegistration);

// ─────────────────────────────────────────────────────────────────────────────
// PoX-5 rewards — sBTC payouts for both bonded and STX-only positions.
// calculate must settle before a claim; claim-stx covers positions without a bond.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /{vaultId}/stacking/pox5/rewards/calculate:
 *   post:
 *     tags: [PoX-5 Rewards]
 *     summary: Trigger reward calculation (PoX-5)
 *     description: >
 *       Broadcasts a calculate-rewards transaction for all active bonds. Bond indices are
 *       sorted automatically (descending stxValueRatio, ascending bondIndex as tiebreaker).
 *       Must be called before claim.
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
 *               nonce:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Reward calculation transaction confirmed, returns txHash.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/rewards/calculate", validateVaultId, controller.calculateRewards);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/rewards/claim:
 *   post:
 *     tags: [PoX-5 Rewards]
 *     summary: Claim sBTC rewards (PoX-5)
 *     description: >
 *       Claims ALL accumulated sBTC rewards for the given bond indices.
 *       Automatically scans every settled cycle and submits one claim transaction per cycle.
 *       Returns all transaction hashes. No need to know or pass a reward cycle.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bondIndices
 *             properties:
 *               bondIndices:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: "Bond indices to claim rewards for (e.g. [4])."
 *               note:
 *                 type: string
 *               nonce:
 *                 type: integer
 *           example:
 *             bondIndices: [4]
 *     responses:
 *       200:
 *         description: Rewards claimed successfully, returns txHash.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/rewards/claim", validateVaultId, controller.claimRewards);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/rewards/claim-stx:
 *   post:
 *     tags: [PoX-5 Rewards]
 *     summary: Claim sBTC rewards for STX-only staking (PoX-5)
 *     description: >
 *       Claims all accumulated sBTC rewards for a vault that is staked STX-only (no BTC bond).
 *       Automatically scans every settled cycle and submits one claim transaction per cycle.
 *       The signer-manager is derived from the vault's active STX stake — no parameters needed.
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
 *               nonce:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Rewards claimed successfully, returns txHashes array.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/stacking/pox5/rewards/claim-stx", validateVaultId, controller.claimStxOnlyRewards);

/**
 * @openapi
 * /{vaultId}/stacking/pox5/rewards/earned:
 *   get:
 *     tags: [PoX-5 Rewards]
 *     summary: Get earned sBTC rewards (PoX-5)
 *     description: >
 *       Returns accumulated earned sBTC rewards (in sats) for a signer manager and optional
 *       bond index. Includes staker-specific rewards when the vault address is in the signer set.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *       - in: query
 *         name: signerManager
 *         required: true
 *         schema:
 *           type: string
 *         description: Signer manager contract address (e.g. ST3N….signer-manager).
 *       - in: query
 *         name: bondIndex
 *         required: false
 *         schema:
 *           type: integer
 *         description: Optional bond index to scope the query.
 *     responses:
 *       200:
 *         description: Earned rewards returned successfully.
 *       400:
 *         description: signerManager is required.
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/stacking/pox5/rewards/earned", validateVaultId, controller.getEarnedRewards);

/**
 * @openapi
 * /{vaultId}/faucet:
 *   post:
 *     tags: [Utility]
 *     summary: Fund vault address via STX faucet (testnet only)
 *     description: >
 *       Calls the private-1 STX faucet to fund the vault's Stacks address.
 *       Pass stacking=true to request the stacking-sized amount.
 *       Only available on testnet.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *       - in: query
 *         name: stacking
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, requests the larger stacking-sized faucet amount.
 *     responses:
 *       200:
 *         description: Faucet funded successfully, returns txid and address.
 *       400:
 *         description: Not on testnet.
 *       500:
 *         description: Internal server error
 */
router.post("/:vaultId/faucet", validateVaultId, controller.fundVault);

// Pool metrics
/**
 * @openapi
 * /metrics:
 *   get:
 *     tags: [Utility]
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
