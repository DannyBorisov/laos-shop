import { Router } from "express";
import { basicAuth } from "../middleware/basicAuth";
import { getAllOrders } from "../handlers/order";
import { prisma } from "../data";

const router = Router();

// Apply basic auth to all admin routes
router.use(basicAuth);

// Get all orders
router.get("/orders", getAllOrders);

// Get dashboard stats
router.get("/stats", async (_req, res) => {
  try {
    const [totalOrders, totalProducts, pendingOrders, paidOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.product.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { status: "PAID" } }),
      ]);

    res.json({
      totalOrders,
      totalProducts,
      pendingOrders,
      paidOrders,
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
