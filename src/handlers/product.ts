import { Request, Response } from "express";
import { prisma } from "../data";
import { getSignedUrl } from "../services/gcp-storage";

type ProductWithPaths = {
  imagePath: string | null;
  videoPath: string | null;
  [key: string]: unknown;
};

const addMediaUrls = async (product: ProductWithPaths) => {
  const result = { ...product, imageUrl: null as string | null, videoUrl: null as string | null };

  if (product.imagePath) {
    try {
      result.imageUrl = await getSignedUrl(product.imagePath);
    } catch {
      // Image not found in storage
    }
  }

  if (product.videoPath) {
    try {
      result.videoUrl = await getSignedUrl(product.videoPath);
    } catch {
      // Video not found in storage
    }
  }

  return result;
};

export const getProducts = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, category } = req.query;
  const skip = (+page - 1) * +limit;

  const where = category ? { categoryId: +category } : {};

  const [dbProducts, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: +limit,
      orderBy: { id: "asc" },
      include: { supplier: true },
    }),
    prisma.product.count({ where }),
  ]);

  const products = await Promise.all(dbProducts.map(addMediaUrls));

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

export const getProduct = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const dbProduct = await prisma.product.findUnique({
    where: { id: +id },
    include: { supplier: true },
  });
  if (!dbProduct) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const product = await addMediaUrls(dbProduct);
  res.json(product);
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, price, description, imagePath, videoPath, quantity, supplierId } =
    req.body;
  if (supplierId == null) {
    res.status(400).json({ error: "supplierId is required" });
    return;
  }
  const dbProduct = await prisma.product.create({
    data: {
      name,
      price,
      description,
      imagePath,
      videoPath,
      quantity,
      supplierId,
    },
    include: { supplier: true },
  });
  const product = await addMediaUrls(dbProduct);
  res.status(201).json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, price, description, imagePath, videoPath, quantity, supplierId } =
    req.body;
  if (supplierId === null) {
    res.status(400).json({ error: "supplierId cannot be null" });
    return;
  }
  const dbProduct = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      name,
      price,
      description,
      imagePath,
      videoPath,
      quantity,
      ...(supplierId !== undefined && { supplierId }),
    },
    include: { supplier: true },
  });
  const product = await addMediaUrls(dbProduct);
  res.json(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.product.delete({ where: { id: +id } });
  res.status(204).send();
};
