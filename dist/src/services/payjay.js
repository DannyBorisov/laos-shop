"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../config"));
class Phajay {
    constructor(secretKey, isSandbox = false) {
        this.baseUrl = "https://payment-gateway.phajay.co/v1/api";
        this.secretKey = secretKey;
        if (isSandbox) {
            this.baseUrl += "/test";
        }
    }
    async request(endpoint, options = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                secretKey: this.secretKey,
                ...options.headers,
            },
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Phajay request failed (${response.status}): ${body}`);
        }
        return response.json();
    }
    async generateLBDQr(params) {
        return this.request("/payment/generate-ldb-qr", {
            method: "POST",
            body: JSON.stringify(params),
        });
    }
}
// sandbox is not working
const phajay = new Phajay(config_1.default.env.PHAJAY_SECRET, false);
exports.default = phajay;
