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

export const createCategory = async (req: Request, res: Response) => {
  const { name, nameLao, imageUrl } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      nameLao: nameLao?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
    },
  });
  res.status(201).json(category);
};

export const updateCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, nameLao, imageUrl } = req.body;

  const category = await prisma.category.update({
    where: { id: +id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(nameLao !== undefined && { nameLao: nameLao?.trim() || null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
    },
  });
  res.json(category);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.category.delete({ where: { id: +id } });
  res.status(204).send();
};
