"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerUi = exports.specs = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
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
exports.specs = (0, swagger_jsdoc_1.default)(options);
