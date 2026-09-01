import { Handler } from "express";
import phajay, { PhajayPaymentStatus } from "../services/payjay";
import { prisma } from "../data";
import { Order, OrderStatus } from "@prisma/client";
import whatsapp from "../services/whatsapp";
import config from "../config";

interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

interface GenerateQRRequest {
  amount: number;
  items: OrderItem[];
  phoneNumber: string;
  address: string;
}

interface PhajayCallback {
  paymentMethod: string;
  transactionId: string;
  txnAmount: number;
  refNo: string;
  exReferenceNo: string;
  merchantName: string;
  description: string;
  txnDateTime: string;
  billNumber: string;
  sourceAccount: string;
  sourceName: string;
  sourceCurrency: string;
  userId: string;
  status: string;
  message: string;
  tag1?: string;
  tag2?: string;
  tag3?: string;
  tag4?: string;
  tag5?: string;
  tag6?: string;
}

export const getAllOrders: Handler = async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
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
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const createOrder: Handler = async (req, res) => {
  const { amount, items, phoneNumber, address } = req.body as GenerateQRRequest;
  let order: Order | undefined = undefined;

  try {
    order = await prisma.order.create({
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

    const qrResponse = await phajay.generateLBDQr({
      amount,
      description: `Order #${order.id}`,
      tag1: "" + order.id,
    });

    console.log(qrResponse);

    const qrCode = await prisma.qrCode.create({
      data: {
        qrCode: qrResponse.qrCode,
        transactionId: qrResponse.transactionId,
        link: qrResponse.link,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { qrCodeId: qrCode.id },
    });

    res.json({
      transactionId: qrResponse.transactionId,
      qrCode: qrResponse.qrCode,
      link: qrResponse.link,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Failed to generate QR code:", error);

    if (order) {
      prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });
    }

    res.status(500).json({ error: "Failed to process order" });
  }
};

export const completeOrder: Handler = async (req, res) => {
  const callback = req.body as PhajayCallback;

  console.log("Payment callback received:", {
    transactionId: callback.transactionId,
    status: callback.status,
    amount: callback.txnAmount,
    orderId: callback.tag1,
  });

  try {
    const orderId = callback.tag1 || null;

    if (!orderId) {
      console.error("Order ID not found in callback tag1");
      return res.status(400).json({ error: "Order ID missing" });
    }

    const order = await prisma.order.findUnique({
      where: { id: +orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      console.error("Order not found:", orderId);
      return res.status(404).json({ error: "Order not found" });
    }

    // 2. Update order status based on payment status
    if (callback.status === PhajayPaymentStatus.PaymentCompleted) {
      // Subtract stock for each item in the order
      await prisma.$transaction([
        // Update order status
        prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        }),
        // Decrement product quantities
        ...order.items.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          }),
        ),
      ]);

      console.log("Order marked as PAID and stock updated:", order.id);

      const itemsList = order.items
        .map((item) => `- ${item.product.name} x${item.quantity}`)
        .join("\n");

      whatsapp.sendTemplate({
        to: config.env.WHATSAPP_ORDER_FULFILLMENT_PHONE_NUMBER,
        templateName: "new_order",
        languageCode: "lo_LA",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: `${order.id}` },
              { type: "text", text: `${order.phoneNumber}` },
              { type: "text", text: `${order.address}` },
              { type: "text", text: `${itemsList}` },
            ],
          },
        ],
      });
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });

      console.log("Order marked as FAILED:", order.id);
    }

    // 3. Acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to process payment callback:", error);
    res.status(500).json({ error: "Failed to process callback" });
  }
};

export const cancelOrder: Handler = async (req, res) => {
  const orderId = req.body.tag1;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({ error: "Order cannot be cancelled" });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "FAILED" },
    });

    console.log("Order cancelled:", orderId);

    res.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    console.error("Failed to cancel order:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
};
