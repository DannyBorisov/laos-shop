import { readFileSync } from "fs";
import { prisma } from "./data";

const parsePrice = (priceStr: string): number => {
  const cleaned = priceStr.replace(/[^0-9]/g, "");
  return parseInt(cleaned) || 0;
};

const seed = async () => {
  const csv = readFileSync("product - Sheet1.csv", "utf-8");
  const lines = csv.split("\n").slice(1); // skip header

  // Products need a supplier; use a placeholder for seeded data.
  const supplier = await prisma.supplier.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Unknown",
      phoneNumber: "-",
      country: "-",
      templateName: "-",
    },
  });

  const products = lines
    .filter((line) => line.trim())
    .map((line) => {
      const [name, priceStr, description, imagePath] = line.split(",");
      return {
        name: name?.trim() || "",
        price: parsePrice(priceStr || ""),
        description: description?.trim() || null,
        imagePath: imagePath?.trim() || null,
        quantity: 0,
        supplierId: supplier.id,
      };
    });

  console.log(`Seeding ${products.length} products...`);

  // Clear existing data (order matters due to foreign keys)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.qrCode.deleteMany();
  await prisma.product.deleteMany();

  await prisma.product.createMany({ data: products });

  console.log("Done!");
};

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
