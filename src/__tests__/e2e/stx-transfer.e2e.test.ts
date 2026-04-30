/**
 * E2E Test: STX Transfer between two vault accounts
 *
 * This test performs a round-trip STX transfer:
 * 1. Transfer from Vault A to Vault B
 * 2. Wait for confirmation
 * 3. Transfer from Vault B back to Vault A
 * 4. Wait for confirmation
 *
 * Required environment variables:
 * - FIREBLOCKS_API_KEY: Fireblocks API key
 * - FIREBLOCKS_SECRET_KEY: Fireblocks secret key (inline PEM or base64 encoded)
 * - VAULT_A_ID: First vault account ID
 * - VAULT_B_ID: Second vault account ID
 * - STACKS_NETWORK: Set to "TESTNET" for testnet
 */

import { StacksSDK } from "../../StacksSDK";
import { FireblocksConfig } from "../../services/types";

// Test configuration
const TRANSFER_AMOUNT = 0.001; // Small amount in STX
const TX_CONFIRMATION_TIMEOUT = 180000; // 3 minutes
const TX_POLL_INTERVAL = 5000; // 5 seconds

// Skip if environment variables are not set
const runE2E = process.env.FIREBLOCKS_API_KEY &&
               process.env.FIREBLOCKS_SECRET_KEY &&
               process.env.VAULT_A_ID &&
               process.env.VAULT_B_ID;

const describeE2E = runE2E ? describe : describe.skip;

describeE2E("E2E: STX Transfer", () => {
  let sdkA: StacksSDK;
  let sdkB: StacksSDK;
  let addressA: string;
  let addressB: string;

  const getFireblocksConfig = (): FireblocksConfig => {
    const secretKey = process.env.FIREBLOCKS_SECRET_KEY!;

    // Check if it's base64 encoded (doesn't start with -----BEGIN)
    const apiSecret = secretKey.startsWith("-----BEGIN")
      ? secretKey
      : Buffer.from(secretKey, "base64").toString("utf-8");

    return {
      apiKey: process.env.FIREBLOCKS_API_KEY!,
      apiSecret,
      testnet: process.env.STACKS_NETWORK === "TESTNET",
    };
  };

  const waitForTxConfirmation = async (
    sdk: StacksSDK,
    txId: string,
    timeoutMs: number = TX_CONFIRMATION_TIMEOUT
  ): Promise<void> => {
    // Initial delay to allow tx to be indexed
    console.log(`Waiting for transaction ${txId} to be indexed...`);
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await sdk.getTxStatusById(txId);

      // Handle 404 (tx not yet indexed) as pending
      if (status.error?.includes("404")) {
        console.log(`Transaction ${txId} not yet indexed, waiting...`);
        await new Promise((resolve) => setTimeout(resolve, TX_POLL_INTERVAL));
        continue;
      }

      if (!status.success) {
        throw new Error(`Failed to get tx status: ${status.error}`);
      }

      const txStatus = status.data?.tx_status;
      console.log(`Transaction ${txId} status: ${txStatus}`);

      if (txStatus === "success") {
        return;
      }

      if (txStatus === "abort_by_response" || txStatus === "abort_by_post_condition") {
        throw new Error(`Transaction failed: ${status.data?.tx_error || txStatus}`);
      }

      await new Promise((resolve) => setTimeout(resolve, TX_POLL_INTERVAL));
    }

    throw new Error(`Transaction ${txId} timed out after ${timeoutMs}ms`);
  };

  beforeAll(async () => {
    const config = getFireblocksConfig();
    const vaultA = process.env.VAULT_A_ID!;
    const vaultB = process.env.VAULT_B_ID!;

    console.log(`Initializing SDK for Vault A (${vaultA})...`);
    sdkA = await StacksSDK.create(vaultA, config);
    addressA = sdkA.getAddress();
    console.log(`Vault A address: ${addressA}`);

    console.log(`Initializing SDK for Vault B (${vaultB})...`);
    sdkB = await StacksSDK.create(vaultB, config);
    addressB = sdkB.getAddress();
    console.log(`Vault B address: ${addressB}`);
  }, 60000); // 1 minute timeout for setup

  it("should have sufficient STX balance in Vault A", async () => {
    const balance = await sdkA.getBalance();
    expect(balance.success).toBe(true);
    console.log(`Vault A balance: ${balance.balance} STX`);

    // Need at least transfer amount + some gas
    expect(balance.balance).toBeGreaterThan(TRANSFER_AMOUNT + 0.01);
  });

  it("should transfer STX from Vault A to Vault B", async () => {
    console.log(`Transferring ${TRANSFER_AMOUNT} STX from Vault A to Vault B...`);

    const result = await sdkA.createNativeTransaction(
      addressB,
      TRANSFER_AMOUNT,
      false, // not gross transaction
      "E2E Test: A to B"
    );

    expect(result.success).toBe(true);
    expect(result.txHash).toBeDefined();
    console.log(`Transaction submitted: ${result.txHash}`);

    // Wait for confirmation
    await waitForTxConfirmation(sdkA, result.txHash!);
    console.log(`Transaction confirmed: ${result.txHash}`);
  }, TX_CONFIRMATION_TIMEOUT + 30000);

  it("should transfer STX from Vault B back to Vault A", async () => {
    console.log(`Transferring ${TRANSFER_AMOUNT} STX from Vault B to Vault A...`);

    const result = await sdkB.createNativeTransaction(
      addressA,
      TRANSFER_AMOUNT,
      false, // not gross transaction
      "E2E Test: B to A"
    );

    expect(result.success).toBe(true);
    expect(result.txHash).toBeDefined();
    console.log(`Transaction submitted: ${result.txHash}`);

    // Wait for confirmation
    await waitForTxConfirmation(sdkB, result.txHash!);
    console.log(`Transaction confirmed: ${result.txHash}`);
  }, TX_CONFIRMATION_TIMEOUT + 30000);
});
