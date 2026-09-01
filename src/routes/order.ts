import { Router } from "express";
import {
  getAllOrders,
  createOrder,
  completeOrder,
  cancelOrder,
} from "../handlers/order";

const router = Router();

router.route("/").get(getAllOrders).post(createOrder);
router.route("/callback").post(completeOrder);
router.route("/cancel").post(cancelOrder);

export default router;
