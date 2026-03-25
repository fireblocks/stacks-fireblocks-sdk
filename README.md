# Stacks Fireblocks SDK

A stateless SDK and REST API server for interacting with Fireblocks and the Stacks Network, enabling secure operations on Stacks using Fireblocks services.

The SDK Typedocs can be found here:
https://fireblocks.github.io/stacks-fireblocks-sdk/

---

## ⚡ Project Overview

**Stacks Fireblocks SDK** lets you securely execute Stacks transactions using Fireblocks vaults and raw signing.
It's designed to simplify integration with Fireblocks for secure Stacks transactions.

### **Two Usage Modes**

| Mode | Use Case | How |
|------|----------|-----|
| **TypeScript SDK** | Import into your Node.js application | `import { StacksSDK } from "stacks-fireblocks-sdk"` |
| **REST API Server** | Dockerized service for non-TS environments | `docker-compose up` or `node dist/server.js` |

### **Prerequisites**

- Fireblocks workspace with raw signing enabled.
- Fireblocks API key and secret key file.
- Node.js v18+
- Docker and Docker Compose (for REST API server mode).

---

## 🚀 Features

- **Secure Stacks Transactions**: All transactions are Fireblocks-signed and submitted to Stacks.
- **Fireblocks raw signing support**
- **Native STX transfers**: Send STX with optional gross transactions (fee deduction from recipient)
- **Fungible token transfers**: Support for SIP-010 token transfers (sBTC, USDC, etc.)
- **Stacking functionality**:
  - Solo stacking 
  - Pool delegation and stacking
  - Delegation management (delegate, revoke, allow contract caller)
  - Account status and eligibility checking
- **Transaction monitoring**: Real-time transaction status polling with error code mapping
- **REST API mode**: Easily integrate through HTTP requests.
- **Vault pooling**: Efficient per-vault instance management.

---

## 📦 Installation

### **Option 1: TypeScript SDK (for Node.js applications)**

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

### **Option 2: REST API Server (Docker)**

For non-TypeScript environments, run the SDK as a dockerized REST API service:

```bash
git clone https://github.com/fireblocks/stacks-fireblocks-sdk
cd stacks-fireblocks-sdk
cp .env.example .env
# Make sure your Fireblocks secret key is in ./secrets/fireblocks_secret.key
docker-compose up --build        # Dev Mode
docker-compose -f docker-compose.yml up --build  # Prod Mode
```

> API will run on port `3000` by default. Change via `PORT` in `.env`.

### **Option 3: Local Development**

```bash
git clone https://github.com/fireblocks/stacks-fireblocks-sdk
cd stacks-fireblocks-sdk
npm install
cp .env.example .env
```

Edit `.env` to include your API key, private key path, and Stacks network config.

```bash
npm run dev    # Start REST API server with hot reload
npm run build  # Build for production
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
| PORT                       | No       | 3000                                  | Port to run the REST API server         |

### Sample `.env`:

```dotenv
FIREBLOCKS_BASE_PATH=https://api.fireblocks.io/v1
FIREBLOCKS_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
FIREBLOCKS_SECRET_KEY_PATH=./secrets/fireblocks_secret.key
STACKS_NETWORK=TESTNET
PORT=3000
```

Note: Setting STACKS_NETWORK to anything other than TESTNET (or testnet) will set the network as mainnet.

> 🔒 Never commit your `.env` file or secret key to source control.

---

## 🔑 Secret Key Setup (Docker)

1. Place your Fireblocks private key at:

```
./secrets/fireblocks_secret.key
```

2. Your `.env` should reference this file **relative to the project root**:

```dotenv
FIREBLOCKS_SECRET_KEY_PATH=./secrets/fireblocks_secret.key
```

3. Docker Compose mounts this file automatically:

```yaml
volumes:
  - ./secrets/fireblocks_secret.key:/app/secrets/fireblocks_secret.key:ro
```

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
```

### **Transfer Fungible Tokens**

```typescript
import { TokenType } from "stacks-fireblocks-sdk";

// Transfer sBTC
const ftTransfer = await sdk.createFTTransaction(
  "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  0.1, // amount in token units
  TokenType.sBTC,
  "sBTC payment",
);

if (ftTransfer.success) {
  console.log("Transaction Hash:", ftTransfer.txHash);
}
```

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

## 🛠️ API Reference

### **Account Information Endpoints**

| Method | Route                               | Description                                                                |
| ------ | ----------------------------------- | -------------------------------------------------------------------------- |
| GET    | `/api/:vaultId/address`             | Fetch the Stacks address associated with the given vault                   |
| GET    | `/api/:vaultId/publicKey`           | Retrieve the public key for the vault account                              |
| GET    | `/api/:vaultId/btc-rewards-address` | Get the BTC rewards address associated with the given vault (for stacking) |

### **Balance Endpoints**

| Method | Route                       | Description                                   |
| ------ | --------------------------- | --------------------------------------------- |
| GET    | `/api/:vaultId/balance`     | Get the native STX balance                    |
| GET    | `/api/:vaultId/ft-balances` | Get all fungible token balances for the vault |

### **Transaction Endpoints**

| Method | Route                              | Description                                             |
| ------ | ---------------------------------- | ------------------------------------------------------- |
| GET    | `/api/:vaultId/transactions`       | List recent transactions for this vault                 |
| GET    | `/api/transactions/:txId`          | Get detailed transaction status with error code mapping |
| POST   | `/api/:vaultId/transfer`           | Transfer STX or Fungible Tokens to another address      |

### **Stacking Endpoints**

| Method | Route                                               | Description                                       |
| ------ | --------------------------------------------------- | ------------------------------------------------- |
| GET    | `/api/:vaultId/check-status`                        | Check account stacking status and delegation info |
| GET    | `/api/poxInfo`                                      | Fetch current PoX info from blockchain            |
| POST   | `/api/:vaultId/stacking/solo`                       | Solo stack STX with automatic signer signature    |
| POST   | `/api/:vaultId/stacking/pool/delegate`              | Delegate amonunt of STX to a stacking pool        |
| POST   | `/api/:vaultId/stacking/pool/allow-contract-caller` | Allow a pool contract to lock your STX            |
| POST   | `/api/:vaultId/revoke-delegation`                   | Revoke any active STX delegation                  |

### **Utility Endpoints**

| Method | Route          | Description                           |
| ------ | -------------- | ------------------------------------- |
| GET    | `/api/metrics` | Prometheus-compatible service metrics |

---

- **\* IMPORTANT NOTE \*\***: Transactions could sometimes pass at blockchain level but fail at smart contract level,
  in this case a {success: true, txid: <VALID-TX-ID>} 200 response will be returned to user, please double check
  the success of the transaction by polling the txid status with the `/api/:vaultId/transactions/:txId` endpoint.

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

## 📊 REST API Examples (cURL)

### **Get Account Address**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/123/address' \
  -H 'accept: application/json'
```

### **Check Balance**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/123/balance' \
  -H 'accept: application/json'
```

### **Transfer STX**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/123/transfer/stx' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "recipientAddress": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  "amount": 100.5,
  "grossTransaction": false,
  "note": "Payment for services"
}'
```

### **Solo Stack STX**
```bash
curl -X 'POST' \
  'http://localhost:3000/api/123/stacking/solo' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "signerKey": "02778d476704afa540ac01438f62c371dc387",
  "signerSig65Hex": "1997445c32fc1720b202995f656396b50c355",
  "amount": 6520000,
  "lockPeriod": 1,
  "authId": "1"
}'
```

### **Check Stacking Status**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/123/status' \
  -H 'accept: application/json'
```

### **Get Transaction Status**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/123/tx/0xabcd1234...' \
  -H 'accept: application/json'
```

---

## 📄 Development

### Run locally with hot reload

```bash
npm run dev
```

### Run tests

```bash
npm test
```

### Build for production

```bash
npm run build
```

---

## 🔗 API Documentation

Swagger UI API Documentation will be available at http://localhost:3000/api-docs after running the project.

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
- **PoX Contract**: `SP000000000000000000002Q6VF78.pox-4`

### Testnet

- **Network**: Stacks Testnet
- **API**: `https://api.testnet.hiro.so`
- **PoX Contract**: `ST000000000000000000002AMW42H.pox-4`

---

## 📚 Additional Resources

- [Stacks Documentation](https://docs.stacks.co)
- [Fireblocks Documentation](https://developers.fireblocks.com)
