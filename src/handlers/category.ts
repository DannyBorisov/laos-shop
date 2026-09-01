import { Request, Response } from "express";
import { prisma } from "../data";

export const getCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
  });
  res.json(categories);
};

export const getCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const category = await prisma.category.findUnique({
    where: { id: +id },
  });
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(category);
};
