"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_1 = require("../handlers/product");
const router = (0, express_1.Router)();
router.route("/").get(product_1.getProducts).post(product_1.createProduct);
router.route("/:id").get(product_1.getProduct).put(product_1.updateProduct).delete(product_1.deleteProduct);
exports.default = router;
