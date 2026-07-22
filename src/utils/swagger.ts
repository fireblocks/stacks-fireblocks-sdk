import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { version } from "../../package.json";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Stacks Fireblocks SDK API",
      version,
      description:
        "REST API for executing Stacks blockchain transactions via Fireblocks raw signing.",
    },
    servers: [
      { url: "http://localhost:3000/api", description: "Local server" },
    ],
    tags: [
      {
        name: "Account",
        description: "Vault address, public key, nonce, and account status",
      },
      { name: "Balances", description: "STX and fungible token balances" },
      {
        name: "Transactions",
        description:
          "STX/FT transfers, transaction history, and replace-by-fee",
      },
      {
        name: "Protocol Info",
        description: "PoX protocol state and cycle info",
      },
      {
        name: "PoX-5 Staking",
        description: "STX staking and signer management via PoX-5",
      },
      {
        name: "PoX-5 BTC Bonds",
        description:
          "BTC bond lifecycle: create, renew, unlock, and early-exit",
      },
      {
        name: "PoX-5 Rewards",
        description: "Reward calculation, claiming, and earned reward queries",
      },
      { name: "Utility", description: "Pool metrics and testnet faucet" },
    ],
    components: {
      parameters: {
        vaultId: {
          name: "vaultId",
          in: "path",
          required: true,
          description: "Fireblocks vault account ID",
          schema: { type: "string", example: "12345" },
        },
      },
    },
  },
  apis: ["./src/api/router.ts"],
};

export const specs = swaggerJsdoc(options);
export { swaggerUi };
