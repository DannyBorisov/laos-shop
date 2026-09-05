import { Request, Response, Handler } from "express";
import { prisma } from "../data";

interface CreateSupplierRequest {
  name: string;
  phoneNumber: string;
  country: string;
  templateName: string;
  languageCode?: string;
}

export const getSuppliers: Handler = async (_req, res) => {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { id: "asc" },
  });
  res.json(suppliers);
};

export const getSupplier: Handler = async (req, res) => {
  const id = req.params.id as string;
  const supplier = await prisma.supplier.findUnique({
    where: { id: +id },
    include: { products: true },
  });
  if (!supplier) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }
  res.json(supplier);
};

export const createSupplier: Handler = async (req, res) => {
  const { name, phoneNumber, country, templateName, languageCode } =
    req.body as CreateSupplierRequest;

  if (!name || !phoneNumber || !country || !templateName) {
    res.status(400).json({
      error: "name, phoneNumber, country and templateName are required",
    });
    return;
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      phoneNumber,
      country,
      templateName,
      ...(languageCode ? { languageCode } : {}),
    },
  });

  res.status(201).json(supplier);
};

export const updateSupplier: Handler = async (req, res) => {
  const id = req.params.id as string;
  const { name, phoneNumber, country, templateName, languageCode } =
    req.body as Partial<CreateSupplierRequest>;

  const supplier = await prisma.supplier.update({
    where: { id: +id },
    data: {
      name,
      phoneNumber,
      country,
      templateName,
      languageCode,
    },
  });

  res.json(supplier);
};
