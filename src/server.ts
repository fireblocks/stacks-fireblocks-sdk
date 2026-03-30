import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./api/router";
import { swaggerUi, specs } from "./utils/swagger";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

// Swagger UI setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.get("/api-docs-json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

// Apply routes
app.use("/api", router);

// Start the server only if this file is run directly (not imported)
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Stacks-Fireblocks SDK API server running on port ${PORT}`);
  });
}

export { app };
