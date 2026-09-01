"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const config_1 = __importDefault(require("./config"));
const app = (0, express_1.default)();
// Simple logger
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", routes_1.default);
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
// For local development
if (process.env.NODE_ENV !== "production") {
    app.listen(config_1.default.env.PORT, () => {
        console.log(`Server running on port ${config_1.default.env.PORT}`);
    });
}
// Export for Vercel
exports.default = app;
