import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Stacks Fireblocks SDK API",
      version: "1.0.0",
      description: "API documentation for Stacks Fireblocks SDK",
    },
    servers: [
      { url: "http://localhost:3000/api", description: "Local server" },
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
