"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_1 = require("../handlers/order");
const router = (0, express_1.Router)();
router.route("/").get(order_1.getAllOrders).post(order_1.createOrder);
router.route("/callback").post(order_1.handlePaymentCallback);
router.route("/cancel").post(order_1.cancelOrder);
exports.default = router;
