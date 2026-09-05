import { Router } from "express";
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
} from "../handlers/supplier";

const router = Router();

router.route("/").get(getSuppliers).post(createSupplier);
router.route("/:id").get(getSupplier).put(updateSupplier);

export default router;
