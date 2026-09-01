"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.handlePaymentCallback = exports.createOrder = exports.getAllOrders = void 0;
const payjay_1 = __importDefault(require("../services/payjay"));
const data_1 = require("../data");
const client_1 = require("@prisma/client");
const getAllOrders = async (_req, res) => {
    try {
        const orders = await data_1.prisma.order.findMany({
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(orders);
    }
    catch (error) {
        console.error("Failed to fetch orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};
exports.getAllOrders = getAllOrders;
const createOrder = async (req, res) => {
    const { amount, items, phoneNumber, address } = req.body;
    let order = undefined;
    try {
        order = await data_1.prisma.order.create({
            data: {
                totalPrice: amount,
                phoneNumber,
                address,
                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
            include: { items: true },
        });
        const qrResponse = await payjay_1.default.generateLBDQr({
            amount,
            description: `Order #${order.id}`,
            tag1: "" + order.id,
        });
        console.log(qrResponse);
        const qrCode = await data_1.prisma.qrCode.create({
            data: {
                qrCode: qrResponse.qrCode,
                transactionId: qrResponse.transactionId,
                link: qrResponse.link,
            },
        });
        await data_1.prisma.order.update({
            where: { id: order.id },
            data: { qrCodeId: qrCode.id },
        });
        res.json({
            transactionId: qrResponse.transactionId,
            qrCode: qrResponse.qrCode,
            link: qrResponse.link,
            orderId: order.id,
        });
    }
    catch (error) {
        console.error("Failed to generate QR code:", error);
        if (order) {
            data_1.prisma.order.update({
                where: { id: order.id },
                data: { status: client_1.OrderStatus.FAILED },
            });
        }
        res.status(500).json({ error: "Failed to process order" });
    }
};
exports.createOrder = createOrder;
const handlePaymentCallback = async (req, res) => {
    const callback = req.body;
    console.log("Payment callback received:", {
        transactionId: callback.transactionId,
        status: callback.status,
        amount: callback.txnAmount,
        orderId: callback.tag1,
    });
    try {
        // 1. Find order by tag1 (order.id)
        const orderId = callback.tag1 ? parseInt(callback.tag1, 10) : null;
        if (!orderId) {
            console.error("Order ID not found in callback tag1");
            return res.status(400).json({ error: "Order ID missing" });
        }
        const order = await data_1.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            console.error("Order not found:", orderId);
            return res.status(404).json({ error: "Order not found" });
        }
        // 2. Update order status based on payment status
        if (callback.status === "PAYMENT_COMPLETED") {
            await data_1.prisma.order.update({
                where: { id: order.id },
                data: { status: "PAID" },
            });
            console.log("Order marked as PAID:", order.id);
        }
        else {
            await data_1.prisma.order.update({
                where: { id: order.id },
                data: { status: "FAILED" },
            });
            console.log("Order marked as FAILED:", order.id);
        }
        // 3. Acknowledge receipt
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error("Failed to process payment callback:", error);
        res.status(500).json({ error: "Failed to process callback" });
    }
};
exports.handlePaymentCallback = handlePaymentCallback;
const cancelOrder = async (req, res) => {
    const orderId = req.body.tag1;
    try {
        const order = await data_1.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        if (order.status !== "PENDING") {
            return res.status(400).json({ error: "Order cannot be cancelled" });
        }
        await data_1.prisma.order.update({
            where: { id: orderId },
            data: { status: "FAILED" },
        });
        console.log("Order cancelled:", orderId);
        res.json({ success: true, message: "Order cancelled" });
    }
    catch (error) {
        console.error("Failed to cancel order:", error);
        res.status(500).json({ error: "Failed to cancel order" });
    }
};
exports.cancelOrder = cancelOrder;
