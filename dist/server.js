"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const router_1 = __importDefault(require("./api/router"));
const swagger_1 = require("./utils/swagger");
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Swagger UI setup
app.use("/api-docs", swagger_1.swaggerUi.serve, swagger_1.swaggerUi.setup(swagger_1.specs));
app.get("/api-docs-json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swagger_1.specs);
});
// Apply routes
app.use("/api", router_1.default);
// Start the server only if this file is run directly (not imported)
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Stacks-Fireblocks SDK API server running on port ${PORT}`);
    });
}
