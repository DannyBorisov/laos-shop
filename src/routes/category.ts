import { Router } from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../handlers/category";

const router = Router();

router.route("/").get(getCategories).post(createCategory);
router.route("/:id").get(getCategory).put(updateCategory).delete(deleteCategory);

export default router;
