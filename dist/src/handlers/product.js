"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getProducts = void 0;
const data_1 = require("../data");
const gcp_storage_1 = require("../services/gcp-storage");
const addVideoUrl = async (product) => {
    if (!product.videoPath)
        return { ...product, videoUrl: null };
    try {
        const videoUrl = await (0, gcp_storage_1.getSignedUrl)(product.videoPath);
        return { ...product, videoUrl };
    }
    catch {
        return { ...product, videoUrl: null };
    }
};
const getProducts = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (+page - 1) * +limit;
    const [dbProducts, total] = await Promise.all([
        data_1.prisma.product.findMany({
            skip,
            take: +limit,
            orderBy: { id: "asc" },
        }),
        data_1.prisma.product.count(),
    ]);
    const products = await Promise.all(dbProducts.map(addVideoUrl));
    res.json({
        products,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / +limit),
        },
    });
};
exports.getProducts = getProducts;
const getProduct = async (req, res) => {
    const id = req.params.id;
    const dbProduct = await data_1.prisma.product.findUnique({
        where: { id: +id },
    });
    if (!dbProduct) {
        res.status(404).json({ error: "Product not found" });
        return;
    }
    const product = await addVideoUrl(dbProduct);
    res.json(product);
};
exports.getProduct = getProduct;
const createProduct = async (req, res) => {
    const { name, price, description, imageUrl, videoPath, quantity } = req.body;
    const dbProduct = await data_1.prisma.product.create({
        data: { name, price, description, imageUrl, videoPath, quantity },
    });
    const product = await addVideoUrl(dbProduct);
    res.status(201).json(product);
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const id = req.params.id;
    const { name, price, description, imageUrl, videoPath, quantity } = req.body;
    const dbProduct = await data_1.prisma.product.update({
        where: { id: parseInt(id) },
        data: { name, price, description, imageUrl, videoPath, quantity },
    });
    const product = await addVideoUrl(dbProduct);
    res.json(product);
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const id = req.params.id;
    await data_1.prisma.product.delete({ where: { id: +id } });
    res.status(204).send();
};
exports.deleteProduct = deleteProduct;
