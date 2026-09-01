import { Router } from "express";
import { getCategories, getCategory } from "../handlers/category";

const router = Router();

router.route("/").get(getCategories);
router.route("/:id").get(getCategory);

export default router;
