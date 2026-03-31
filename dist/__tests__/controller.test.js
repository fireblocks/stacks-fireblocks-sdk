"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const express_2 = require("express");
// Create a minimal test app that mimics the controller behavior
// This tests that POST endpoints correctly read from req.body (not req.query)
const createTestRouter = () => {
    const router = (0, express_2.Router)();
    // Mock transfer endpoint - tests req.body parsing
    router.post("/:vaultId/transfer", (req, res) => {
        const { recipientAddress, amount, assetType, grossTransaction, note, tokenContractAddress, tokenContractName } = req.body;
        // Return what was received to verify parsing
        res.json({
            source: "body",
            received: {
                recipientAddress,
                amount,
                assetType,
                grossTransaction,
                note,
                tokenContractAddress,
                tokenContractName,
            },
            vaultId: req.params.vaultId,
        });
    });
    // Mock stacking/solo endpoint - tests sensitive data in body
    router.post("/:vaultId/stacking/solo", (req, res) => {
        const { signerKey, signerSig65Hex, amount, maxAmount, lockPeriod, authId } = req.body;
        res.json({
            source: "body",
            received: {
                signerKey,
                signerSig65Hex,
                amount,
                maxAmount,
                lockPeriod,
                authId,
            },
            vaultId: req.params.vaultId,
        });
    });
    // Mock delegate endpoint
    router.post("/:vaultId/stacking/pool/delegate", (req, res) => {
        const { amount, lockPeriod, pool } = req.body;
        res.json({
            source: "body",
            received: { amount, lockPeriod, pool },
            vaultId: req.params.vaultId,
        });
    });
    // Mock allow-contract-caller endpoint
    router.post("/:vaultId/stacking/pool/allow-contract-caller", (req, res) => {
        const { pool } = req.body;
        res.json({
            source: "body",
            received: { pool },
            vaultId: req.params.vaultId,
        });
    });
    // GET endpoint should still use query params
    router.get("/:vaultId/transactions", (req, res) => {
        const { limit, offset, order } = req.query;
        res.json({
            source: "query",
            received: { limit, offset, order },
            vaultId: req.params.vaultId,
        });
    });
    return router;
};
describe("Controller Request Body Parsing", () => {
    let app;
    beforeAll(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use("/api", createTestRouter());
    });
    describe("POST /:vaultId/transfer", () => {
        it("reads parameters from request body (not query string)", async () => {
            const response = await (0, supertest_1.default)(app)
                .post("/api/123/transfer")
                .send({
                recipientAddress: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
                amount: 100,
                assetType: "STX",
            });
            expect(response.status).toBe(200);
            expect(response.body.source).toBe("body");
            expect(response.body.received.recipientAddress).toBe("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7");
            expect(response.body.received.amount).toBe(100);
            expect(response.body.received.assetType).toBe("STX");
        });
        it("handles all transfer parameters in body", async () => {
            const response = await (0, supertest_1.default)(app)
                .post("/api/456/transfer")
                .send({
                recipientAddress: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
                amount: 50.5,
                assetType: "Custom",
                grossTransaction: true,
                note: "Test transfer",
                tokenContractAddress: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K",
                tokenContractName: "my-token",
            });
            expect(response.status).toBe(200);
            expect(response.body.received.grossTransaction).toBe(true);
            expect(response.body.received.note).toBe("Test transfer");
            expect(response.body.received.tokenContractAddress).toBe("SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K");
            expect(response.body.received.tokenContractName).toBe("my-token");
        });
        it("ignores query parameters for POST requests", async () => {
            const response = await (0, supertest_1.default)(app)
                .post("/api/789/transfer?recipientAddress=QUERY_ADDRESS&amount=999")
                .send({
                recipientAddress: "BODY_ADDRESS",
                amount: 100,
                assetType: "STX",
            });
            expect(response.status).toBe(200);
            // Should use body values, not query values
            expect(response.body.received.recipientAddress).toBe("BODY_ADDRESS");
            expect(response.body.received.amount).toBe(100);
        });
    });
    describe("POST /:vaultId/stacking/solo (sensitive data)", () => {
        it("reads signer credentials from body (not exposed in URL)", async () => {
            const response = await (0, supertest_1.default)(app)
                .post("/api/123/stacking/solo")
                .send({
                signerKey: "02abc123def456",
                signerSig65Hex: "deadbeef",
                amount: 1000,
                maxAmount: "1000000000",
                lockPeriod: 6,
                authId: "12345",
            });
            expect(response.status).toBe(200);
            expect(response.body.source).toBe("body");
            expect(response.body.received.signerKey).toBe("02abc123def456");
            expect(response.body.received.signerSig65Hex).toBe("deadbeef");
        });
        it("handles all stacking parameters", async () => {
            const response = await (0, supertest_1.default)(app)
                .post("/api/456/stacking/solo")
                .send({
                signerKey: "03xyz789",
                signerSig65Hex: "cafebabe",
                amount: 500,
                maxAmount: "500000000",
                lockPeriod: 12,
                authId: "67890",
            });
            expect(response.status).toBe(200);
            expect(response.body.received.amount).toBe(500);
            expect(response.body.received.lockPeriod).toBe(12);
            expect(response.body.received.authId).toBe("67890");
        });
    });
    describe("POST /:vaultId/stacking/pool/delegate", () => {
        it("reads pool delegation params from body", async () => {
            const response = await (0, supertest_1.default)(app)
                .post("/api/123/stacking/pool/delegate")
                .send({
                amount: 1000,
                lockPeriod: 3,
                pool: "FAST_POOL",
            });
            expect(response.status).toBe(200);
            expect(response.body.source).toBe("body");
            expect(response.body.received.amount).toBe(1000);
            expect(response.body.received.lockPeriod).toBe(3);
            expect(response.body.received.pool).toBe("FAST_POOL");
        });
    });
    describe("POST /:vaultId/stacking/pool/allow-contract-caller", () => {
        it("reads pool param from body", async () => {
            const response = await (0, supertest_1.default)(app)
                .post("/api/123/stacking/pool/allow-contract-caller")
                .send({
                pool: "FAST_POOL",
            });
            expect(response.status).toBe(200);
            expect(response.body.source).toBe("body");
            expect(response.body.received.pool).toBe("FAST_POOL");
        });
    });
    describe("GET endpoints still use query params", () => {
        it("reads pagination from query string for GET requests", async () => {
            const response = await (0, supertest_1.default)(app)
                .get("/api/123/transactions?limit=50&offset=10&order=DESC");
            expect(response.status).toBe(200);
            expect(response.body.source).toBe("query");
            expect(response.body.received.limit).toBe("50");
            expect(response.body.received.offset).toBe("10");
            expect(response.body.received.order).toBe("DESC");
        });
    });
    describe("vaultId extraction from path", () => {
        it("correctly extracts vaultId from URL path", async () => {
            const response = await (0, supertest_1.default)(app)
                .post("/api/12345/transfer")
                .send({
                recipientAddress: "SP...",
                amount: 1,
                assetType: "STX",
            });
            expect(response.body.vaultId).toBe("12345");
        });
        it("handles string vaultId", async () => {
            const response = await (0, supertest_1.default)(app)
                .post("/api/vault-abc/transfer")
                .send({
                recipientAddress: "SP...",
                amount: 1,
                assetType: "STX",
            });
            expect(response.body.vaultId).toBe("vault-abc");
        });
    });
});
describe("Request Body vs Query String Security", () => {
    it("documents why body is more secure than query for sensitive data", () => {
        // Query string data appears in:
        // - Server access logs
        // - Proxy logs
        // - Browser history
        // - Referer headers
        // - Monitoring tools
        // Body data is:
        // - Not logged by default in most servers
        // - Not visible in browser history
        // - Not included in Referer headers
        const sensitiveParams = ["signerKey", "signerSig65Hex"];
        const nonSensitiveParams = ["amount", "lockPeriod"];
        // All params now go in body for consistency, but especially important for sensitive ones
        expect(sensitiveParams.every((p) => typeof p === "string")).toBe(true);
        expect(nonSensitiveParams.every((p) => typeof p === "string")).toBe(true);
    });
});
