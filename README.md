# Stacks Fireblocks SDK

A stateless TypeScript SDK for interacting with Fireblocks and the Stacks Network, enabling secure operations on Stacks using Fireblocks services.

The SDK Typedocs can be found here:
https://fireblocks.github.io/stacks-fireblocks-sdk/

---

## ⚡ Project Overview

**Stacks Fireblocks SDK** lets you securely execute Stacks transactions using Fireblocks vaults and raw signing.
It's designed to simplify integration with Fireblocks for secure Stacks transactions.

### **Usage**

| Mode | Use Case | How |
|------|----------|-----|
| **TypeScript SDK** | Import into your Node.js / Electron application | `import { StacksSDK } from "stacks-fireblocks-sdk"` |

### **Prerequisites**

- Fireblocks workspace with raw signing enabled.
- Fireblocks API key and secret key file.
- Node.js v18+

---

## 🚀 Features

- **Secure Stacks Transactions**: All transactions are Fireblocks-signed and submitted to Stacks.
- **Fireblocks raw signing support**
- **Native STX transfers**: Send STX with optional gross transactions (fee deduction from recipient)
- **Fungible token transfers**: Support for SIP-010 token transfers (sBTC, USDC, etc.)
- **Nonce management**: Optional nonce override on every transaction method; query confirmed on-chain nonce via `getAccountNonce()`
- **Replace-by-fee**: Replace a stuck pending STX transaction with a higher-fee one using the same nonce
- **Stacking functionality (PoX-4)**:
  - Solo stacking 
  - Pool delegation and stacking
  - Delegation management (delegate, revoke, allow contract caller)
  - Account status and eligibility checking
- **PoX-5 / BTC Bonding**:
  - STX staking and unstaking via signer-manager
  - BTC bond lifecycle: create, renew, unlock matured bonds
  - Early-exit announcement and spend (cosigner-assisted)
  - Reward calculation, claiming (BTC + STX-only paths), and earned rewards query
  - Signer key grant and verification
- **Transaction monitoring**: Real-time transaction status polling with error code mapping
- **Vault pooling**: Efficient per-vault instance management.

---

## 📦 Installation

Install the package in your project:

```bash
npm install stacks-fireblocks-sdk
```

Import and use in your code:

```typescript
import { StacksSDK, FireblocksConfig } from "stacks-fireblocks-sdk";

const config: FireblocksConfig = {
  apiKey: process.env.FIREBLOCKS_API_KEY!,
  apiSecret: fs.readFileSync(process.env.FIREBLOCKS_SECRET_KEY_PATH!, "utf8"),
  testnet: true,
};

const sdk = await StacksSDK.create("YOUR_VAULT_ID", config);
```

> **Note:** Importing the SDK does NOT start a server. The SDK is a pure library.

### **Local Development**

```bash
git clone https://github.com/fireblocks/stacks-fireblocks-sdk
cd stacks-fireblocks-sdk
npm install
cp .env.example .env
```

Edit `.env` to include your API key, private key path, and Stacks network config.

```bash
npm run build  # Build for production
npm test       # Run the unit test suite
```

---

## ⚙️ Configuration

Environment variables (via `.env`) control SDK behavior:

| Variable                   | Required | Default                               | Description                             |
| -------------------------- | -------- | ------------------------------------- | --------------------------------------- |
| FIREBLOCKS_API_KEY         | Yes      | —                                     | Your Fireblocks API key                 |
| FIREBLOCKS_SECRET_KEY_PATH | Yes      | —                                     | Path to your Fireblocks secret key file |
| FIREBLOCKS_BASE_PATH       | No       | BasePath.US from "@fireblocks/ts-sdk" | Base URL of the Fireblocks API          |
| NETWORK                    | No       | MAINNET                               | Stacks mainnet or testnet               |
| EARLY_EXIT_SIGNER_URL      | No       | Built-in testnet URL (none on mainnet) | Base URL of the external KMS cosigner service for bond early-exit spends |

### Sample `.env`:

See `.env.example` for a placeholder-only template.

```dotenv
FIREBLOCKS_BASE_PATH=https://api.fireblocks.io/v1
FIREBLOCKS_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
FIREBLOCKS_SECRET_KEY_PATH=./secrets/fireblocks_secret.key
NETWORK=TESTNET
```

Note: Setting NETWORK to anything other than TESTNET (or testnet) will set the network as mainnet.

> 🔒 Never commit your `.env` file or secret key to source control.

---

## 📖 SDK Usage Examples

### **Initialize the SDK**

```typescript
import { StacksSDK, FireblocksConfig } from "stacks-fireblocks-sdk";
import fs from "fs";

const fireblocksConfig: FireblocksConfig = {
  apiKey: process.env.FIREBLOCKS_API_KEY!,
  apiSecret: fs.readFileSync(process.env.FIREBLOCKS_SECRET_KEY_PATH!, "utf8"),
  testnet: true, // or false for mainnet
};

const sdk = await StacksSDK.create("YOUR_VAULT_ID", fireblocksConfig);
```

### **Get Account Information**

```typescript
// Get Stacks address
const address = sdk.getAddress();
console.log("Stacks Address:", address);

// Get public key
const publicKey = sdk.getPublicKey();
console.log("Public Key:", publicKey);

// Get BTC rewards address (for stacking)
const btcAddress = sdk.getBtcRewardsAddress();
console.log("BTC Rewards Address:", btcAddress);
```

### **Check Balance**

```typescript
// Get native STX balance
const balanceResponse = await sdk.getBalance();
if (balanceResponse.success) {
  console.log("STX Balance:", balanceResponse.balance);
}

// Get fungible token balances
const ftBalances = await sdk.getFtBalances();
if (ftBalances.success) {
  ftBalances.data?.forEach((token) => {
    console.log(`${token.token}: ${token.balance}`);
  });
}
```

### **Transfer STX**

```typescript
// Basic STX transfer
const transferResponse = await sdk.createNativeTransaction(
  "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG", // recipient
  10.5, // amount in STX
  false, // grossTransaction (if true, fee is deducted from amount)
  "Payment for services", // optional note
);

if (transferResponse.success) {
  console.log("Transaction Hash:", transferResponse.txHash);
}

// Gross transaction (fee deducted from recipient)
const grossTransfer = await sdk.createNativeTransaction(
  "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  10.5,
  true, // fee will be deducted from the 10.5 STX
);

// With explicit nonce and fee override
const transfer = await sdk.createNativeTransaction(
  "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  10.5,
  false,
  undefined, // note
  7,    // nonce override (integer)
  0.01, // fee in STX (overrides auto-estimation)
);
```

### **Transfer Fungible Tokens**

```typescript
import { TokenType } from "stacks-fireblocks-sdk";

// Transfer sBTC (built-in token)
const ftTransfer = await sdk.createFTTransaction(
  "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  0.1, // amount in token units
  TokenType.sBTC,
);

if (ftTransfer.success) {
  console.log("Transaction Hash:", ftTransfer.txHash);
}

// Transfer custom SIP-010 token
// Note: tokenAssetName is the name from define-fungible-token (may differ from contract name)
const customTransfer = await sdk.createFTTransaction(
  "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  100, // amount in token units
  TokenType.CUSTOM,
  "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9", // contract address
  "my-token", // contract name
  "my-token-asset", // asset name (from define-fungible-token)
);
```

> **Finding the asset name:** For custom tokens, the `tokenAssetName` is found in the contract's source code in the `define-fungible-token` declaration. View the contract on a block explorer (e.g., explorer.hiro.so) and look for `(define-fungible-token <asset-name>)`. This may differ from the contract name - for example, USDCx contract (`usdcx`) defines its token as `usdcx-token`.

### **Check Account Status**

```typescript
const status = await sdk.checkStatus();

if (status.success) {
  console.log("Balance Information:");
  console.log("  Total STX:", status.data?.balance.stx_total);
  console.log("  Locked STX:", status.data?.balance.stx_locked);
  console.log("  Unlock Height:", status.data?.balance.burnchain_unlock_height);

  console.log("\nDelegation Status:");
  console.log("  Is Delegated:", status.data?.delegation.is_delegated);
  console.log("  Delegated To:", status.data?.delegation.delegated_to);
  console.log("  Amount:", status.data?.delegation.amount_delegated);
}
```

### **Solo Stacking**

Solo stacking requires you to provide a signer key and signature. You can use any valid `secp256k1` key pair for your signer.

**Generate signer signature:**
Use the [Stacks Signature Generation Tool](https://signature.stacking.tools/) to generate your signer signature with the following parameters:
- **Function**: "stack-stx"
- **Max Amount**: Maximum STX amount to authorize, equal or more to what you'll stack
- **Lock period**: Number of cycles (1-12)
- **Auth ID**: Random integer for replay protection, must be the same one used to generate the signature
- **Reward cycle**: Current reward cycle
- **PoX address**: Your BTC rewards address
- If you plan to run your own signer to earn full rewards, use your signer's public key here
- If using a hosted signer service, use their public key and signature

```typescript
// Stack 150,000 STX for 6 cycles
const stackResponse = await sdk.stackSolo(
  "02778d476704afa...", // Signer public key
  "1997445c32fc172f...", // Signer signature
  150000, // amount in STX
  6, // lock period in cycles (1-12)
  "1772114443795", // authId (same as used to generate signature)
);

if (stackResponse.success) {
  console.log("Stacking Transaction Hash:", stackResponse.txHash);
  console.log("BTC rewards will be sent to:", sdk.getBtcRewardsAddress());
} else {
  console.error("Stacking failed:", stackResponse.error);
}
```

### **Pool Stacking**

```typescript
// Delegate to a stacking pool
const delegateResponse = await sdk.delegateToPool(
  "SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP", // pool address
  "stacking-pool-v1", // pool contract name
  50000, // amount to delegate
  12, // lock period in cycles
);

// Allow a pool to lock your STX
const allowCallerResponse = await sdk.allowContractCaller(
  "SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP",
  "stacking-pool-v1",
);

// Revoke delegation
const revokeResponse = await sdk.revokeDelegation();
```

### **Nonce Management**

```typescript
// Returns confirmed nonce, pending tx count, and the next safe nonce to use.
// nextAvailable is gap-aware: if pending nonces are [5, 6, 9], it returns 7
// (the first gap) rather than 10, so your tx confirms as soon as possible.
const nonceResponse = await sdk.getAccountNonce();
if (nonceResponse.success) {
  console.log("Confirmed nonce:", nonceResponse.confirmedNonce);
  console.log("Pending txs:    ", nonceResponse.pendingTxCount);
  console.log("Use this nonce: ", nonceResponse.nextAvailable);
}
```

All transaction methods (`createNativeTransaction`, `createFTTransaction`, `delegateToPool`, `allowContractCaller`, `revokeDelegation`, `stackSolo`, `increaseStackedAmount`, `extendStackingPeriod`) accept an optional `nonce?: number` parameter as their last argument. When omitted, the SDK automatically uses `nextAvailable` from `getAccountNonce()` — the same gap-aware value the nonce endpoint returns — so auto-nonce and manual nonce are always consistent.

### **Replace a Stuck Transaction**

If a transaction is stuck in the mempool due to a low fee, you can replace it by submitting a new transaction with the same nonce and a higher fee. Both native STX transfers and contract calls (PoX operations, etc.) are supported.

```typescript
// Replace any pending transaction visible to the Hiro indexer.
// The original tx is looked up automatically — same nonce, same args, higher fee.
const replacement = await sdk.replaceTransaction(
  "0xabc123...", // original tx ID
  0.01,          // new fee in STX (must exceed the original fee by ≥ RBF_MIN_FEE_BUMP_USTX)
);

// For token_transfer only: optionally change recipient or amount
const replacement = await sdk.replaceTransaction(
  "0xabc123...",
  0.01,
  "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG", // newRecipient
  10.5,  // newAmount in STX
);

// Replace a future-nonce STX transfer not visible to the Hiro indexer.
// nonceOverride bypasses the indexer lookup. Only STX transfers are supported
// on this path since contract call args cannot be inferred.
const replacement = await sdk.replaceTransaction(
  "0xabc123...",
  0.01,
  "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG", // newRecipient (required)
  10.5,  // newAmount in STX (required)
  7,     // nonceOverride
);

if (replacement.success) {
  console.log("Replacement tx hash:", replacement.txHash);
}
```

> The minimum fee bump is controlled by `RBF_MIN_FEE_BUMP_USTX` in `constants.ts` (default: 1 microSTX above the original fee). The fee check only applies on the lookup path where the original fee is known.

### **Transaction Status Monitoring**

```typescript
// Get transaction status with error code mapping
const txStatus = await sdk.getTxStatusById("0xabcd1234...");

if (txStatus.success) {
  console.log("Status:", txStatus.data?.tx_status);

  if (txStatus.data?.tx_status !== "success") {
    console.log("Error:", txStatus.data?.tx_error);
    console.log("Error Code:", txStatus.data?.tx_result?.repr);
  }
}
```

### **Transaction History**

```typescript
// Get transaction history (cached)
const history = await sdk.getTransactionHistory(true);

// Get fresh transaction history with pagination
const freshHistory = await sdk.getTransactionHistory(
  false, // don't use cache
  50, // limit
  0, // offset
);

history.forEach((tx) => {
  console.log(`${tx.transaction_hash}: ${tx.tx_type} - ${tx.tx_status}`);
});
```

---

### `replaceTransaction` Parameters

| Parameter       | Type    | Required | Description                                                                  |
| --------------- | ------- | -------- | ---------------------------------------------------------------------------- |
| `originalTxId`  | string  | Yes      | Transaction ID of the pending transaction to replace                         |
| `newFee`        | number  | Yes      | New fee in STX — must exceed the original fee by at least `RBF_MIN_FEE_BUMP_USTX` |
| `newRecipient`  | string  | No       | New recipient address. Defaults to the original recipient                    |
| `newAmount`     | number  | No       | New transfer amount in STX. Defaults to the original amount                  |
| `nonceOverride` | integer | No       | Nonce to use directly, bypassing the Hiro indexer lookup. Required when the original tx is a future-nonce tx not visible in the explorer. When set, `newRecipient` and `newAmount` are also required. |

---

- **\* IMPORTANT NOTE \*\***: Transactions could sometimes pass at blockchain level but fail at smart contract level,
  in this case `{success: true, txHash: <VALID-TX-ID>}` will be returned, please double check the success of the
  transaction by polling the tx hash's status with `sdk.getTxStatusById(txHash)`.

## 🎯 Stacking Guide

### **Solo Stacking Requirements**

1. **Minimum Amount**: Must meet the dynamic minimum threshold (request will fail otherwise)
2. **Lock Period**: 1-12 reward cycles (each cycle ≈ 2 weeks)
3. **No Active Delegation**: Account must not be delegated to an address
4. **Timing**: Submit during reward phase (with more than 10 blocks away from prepare phase)

### **Reward Cycle Timeline**

- Each cycle is approximately 2,100 Bitcoin blocks (~2 weeks)
- **Reward Phase**: ~2,000 blocks - safe to submit stacking requests
- **Prepare Phase**: ~100 blocks - risky window before next cycle
- SDK automatically checks timing safety before stacking

### **Bitcoin Rewards**

- Rewards are paid directly to your BTC address each cycle
- Amount: `Expected ≈(Your STX / Total Stacked) × Total BTC from Miners`

### **Pool Stacking vs Solo Stacking**

**Pool Stacking:**

- ✅ Lower minimum (pool operators set their own minimum)
- ✅ No signer infrastructure required
- ✅ Pool handles all technical operations
- ❌ Pool takes a commission
- ❌ Less control over reward address

- Note: For pool stacking, delegate the amount you want to stack to the pool and allow the pool contract as contract-caller to lock your STX,
  the pool will handle the rest and lock STX when ready and distirbute rewards at the end of locking period.

**Solo Stacking:**

- ✅ Keep all rewards (no commission)
- ✅ Full control over reward address
- ✅ Higher rewards for large holders
- ❌ Must meet higher minimum threshold (typically 90,000+ STX)

---

## 📄 Development

### Run tests

```bash
npm test
```

### Build

```bash
npm run build
```

The SDK's Typedocs (generated from `src/`) are published at https://fireblocks.github.io/stacks-fireblocks-sdk/

---

## 🚪 Security

- Never commit your `.env` or secrets.
- Use secrets management in production.
- Fireblocks raw signing provides secure transaction signing without exposing private keys.
- All transactions are signed within Fireblocks secure infrastructure.

---

## 🌐 Network Information

### Mainnet

- **Network**: Stacks Mainnet
- **API**: `https://api.hiro.so`
- **PoX-4 Contract**: `SP000000000000000000002Q6VF78.pox-4`

### Testnet (PoX-4)

- **Network**: Stacks Testnet
- **API**: `https://api.testnet.hiro.so`
- **PoX-4 Contract**: `ST000000000000000000002AMW42H.pox-4`

### PoX-5 / BTC Bonding Testnet

PoX-5 operates on a private testnet. Set `NETWORK=testnet` — the SDK automatically routes PoX-5 calls to the private-1 node.

- **API**: `https://api.private-1.hiro.so`
- **Chain ID**: `256`

---

## 📚 Additional Resources

- [Stacks Documentation](https://docs.stacks.co)
- [Fireblocks Documentation](https://developers.fireblocks.com)
