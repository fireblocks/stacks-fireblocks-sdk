import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./api/router";
import { swaggerUi, specs } from "./utils/swagger";
import { ValidationError } from "./utils/validation";
import { formatErrorMessage } from "./utils/errorHandling";

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

// Validation error middleware — must be registered after routes
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: `Bad Request: ${err.message}` });
    return;
  }
  next(err);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled API error:", err);
  if (res.headersSent) return;
  res.status(500).json({ success: false, error: formatErrorMessage(err) });
});

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Not Found" });
});

// A rejected promise outside a request handler terminates the process by default,
// which would take the API down on a transient upstream failure.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", formatErrorMessage(reason));
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", formatErrorMessage(error));
  process.exit(1);
});

// Start the server only if this file is run directly (not imported)
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Stacks-Fireblocks SDK API server running on port ${PORT}`);
  });
}

export { app };
