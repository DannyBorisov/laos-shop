import { prisma } from "./data";

const categories = [
  {
    name: "Botox",
    nameLao: "ໂບຕ໋ອກ",
    imageUrl: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&q=80"
  },
  {
    name: "Fillers",
    nameLao: "ຟິວເລີ",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80"
  },
  {
    name: "Fat Dissolving",
    nameLao: "ລະລາຍໄຂມັນ",
    imageUrl: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=400&q=80"
  },
  {
    name: "Skin Brightening",
    nameLao: "ບຳລຸງຜິວ",
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80"
  },
  {
    name: "Thread Lift",
    nameLao: "ຍົກກະຊັບດ້ວຍເສັ້ນ",
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80"
  },
  {
    name: "Weight Loss",
    nameLao: "ລົດນ້ຳໜັກ",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80"
  },
];

// Keywords to match products to categories
const categoryKeywords: Record<string, string[]> = {
  "Botox": ["onetox", "botulax", "wellstox", "wondertox"],
  "Fillers": ["elasty", "neuranis", "etpq", "volonic", "filler"],
  "Fat Dissolving": ["slim queen", "line s up", "filoga", "fat dissolving"],
  "Skin Brightening": ["rejuran", "mellacel", "goldcel", "aqua meso", "exosome", "brigtens", "skin"],
  "Thread Lift": ["cog", "thread", "misko", "hiko", "ireborn", "doeten", "volume", "ifiller", "nomo", "screw", "line plus"],
  "Weight Loss": ["mounjaro"],
};

const seedCategories = async () => {
  console.log("Seeding categories...");

  // Create categories
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { nameLao: category.nameLao, imageUrl: category.imageUrl },
      create: category,
    });
  }

  console.log(`Created ${categories.length} categories`);

  // Get all categories from DB
  const dbCategories = await prisma.category.findMany();
  const categoryMap = new Map(dbCategories.map(c => [c.name, c.id]));

  // Get all products
  const products = await prisma.product.findMany();

  let updated = 0;
  for (const product of products) {
    const productNameLower = product.name.toLowerCase();
    const descriptionLower = (product.description || "").toLowerCase();

    // Find matching category
    let matchedCategory: string | null = null;

    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (productNameLower.includes(keyword.toLowerCase()) ||
            descriptionLower.includes(keyword.toLowerCase())) {
          matchedCategory = categoryName;
          break;
        }
      }
      if (matchedCategory) break;
    }

    if (matchedCategory) {
      const categoryId = categoryMap.get(matchedCategory);
      if (categoryId) {
        await prisma.product.update({
          where: { id: product.id },
          data: { categoryId },
        });
        updated++;
        console.log(`  ${product.name} -> ${matchedCategory}`);
      }
    } else {
      console.log(`  ${product.name} -> (no category)`);
    }
  }

  console.log(`Updated ${updated} products with categories`);
  console.log("Done!");
};

seedCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
