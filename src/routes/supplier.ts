import { Router } from "express";
import {
  getSuppliers,
  getSupplier,
  createSupplier,
} from "../handlers/supplier";

const router = Router();

router.route("/").get(getSuppliers).post(createSupplier);
router.route("/:id").get(getSupplier);

export default router;
