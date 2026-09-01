"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeEnv = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
var NodeEnv;
(function (NodeEnv) {
    NodeEnv["Development"] = "development";
    NodeEnv["Production"] = "production";
})(NodeEnv || (exports.NodeEnv = NodeEnv = {}));
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum([NodeEnv.Development, NodeEnv.Production]),
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    PHAJAY_SECRET: zod_1.z.string(),
});
const env = EnvSchema.parse(process.env);
exports.default = { env };
