"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const data_1 = require("./data");
const parsePrice = (priceStr) => {
    const cleaned = priceStr.replace(/[^0-9]/g, "");
    return parseInt(cleaned) || 0;
};
const seed = async () => {
    const csv = (0, fs_1.readFileSync)("product - Sheet1.csv", "utf-8");
    const lines = csv.split("\n").slice(1); // skip header
    const products = lines
        .filter((line) => line.trim())
        .map((line) => {
        const [name, priceStr, description, imageUrl] = line.split(",");
        return {
            name: name?.trim() || "",
            price: parsePrice(priceStr || ""),
            description: description?.trim() || null,
            imageUrl: imageUrl?.trim() || null,
            quantity: 0,
        };
    });
    console.log(`Seeding ${products.length} products...`);
    // Clear existing data (order matters due to foreign keys)
    await data_1.prisma.orderItem.deleteMany();
    await data_1.prisma.order.deleteMany();
    await data_1.prisma.qrCode.deleteMany();
    await data_1.prisma.product.deleteMany();
    await data_1.prisma.product.createMany({ data: products });
    console.log("Done!");
};
seed()
    .catch(console.error)
    .finally(() => data_1.prisma.$disconnect());
