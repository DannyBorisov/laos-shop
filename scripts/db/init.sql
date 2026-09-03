-- Local dev database: schema + minimal seed (1 category, 1 supplier, 1 product).
-- Auto-runs once when the postgres data volume is first created
-- (mounted at /docker-entrypoint-initdb.d/ by docker-compose).
--
-- Mirrors prisma/schema.prisma. If the Prisma schema changes, update this too,
-- or recreate the volume: docker compose down -v && docker compose up.

CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

CREATE TABLE "Category" (
  "id"       SERIAL PRIMARY KEY,
  "name"     TEXT NOT NULL UNIQUE,
  "nameLao"  TEXT,
  "imageUrl" TEXT
);

CREATE TABLE "Supplier" (
  "id"           SERIAL PRIMARY KEY,
  "name"         TEXT NOT NULL,
  "phoneNumber"  TEXT NOT NULL,
  "country"      TEXT NOT NULL,
  "templateName" TEXT NOT NULL,
  "languageCode" TEXT NOT NULL DEFAULT 'en_US',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Product" (
  "id"          SERIAL PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "price"       INTEGER NOT NULL,
  "description" TEXT,
  "imagePath"   TEXT,
  "videoPath"   TEXT,
  "quantity"    INTEGER NOT NULL DEFAULT 0,
  "categoryId"  INTEGER REFERENCES "Category"("id"),
  "supplierId"  INTEGER NOT NULL REFERENCES "Supplier"("id"),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "QrCode" (
  "id"            SERIAL PRIMARY KEY,
  "qrCode"        TEXT NOT NULL,
  "transactionId" TEXT NOT NULL UNIQUE,
  "link"          TEXT NOT NULL
);

CREATE TABLE "Order" (
  "id"          SERIAL PRIMARY KEY,
  "totalPrice"  INTEGER NOT NULL,
  "qrCodeId"    INTEGER UNIQUE REFERENCES "QrCode"("id"),
  "address"     TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "status"      "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "OrderItem" (
  "id"        SERIAL PRIMARY KEY,
  "orderId"   INTEGER NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES "Product"("id"),
  "quantity"  INTEGER NOT NULL,
  "price"     INTEGER NOT NULL,
  UNIQUE ("orderId", "productId")
);

-- Seed data
INSERT INTO "Category" ("name", "nameLao") VALUES ('Fillers', 'ຟິວເລີ');

INSERT INTO "Supplier" ("name", "phoneNumber", "country", "templateName")
VALUES ('Acme Pharma', '+8562055512345', 'Laos', 'supplier_restock_v1');

INSERT INTO "Product" ("name", "price", "description", "quantity", "categoryId", "supplierId")
VALUES ('filler elasty', 295000, 'FACIAL filler', 10, 1, 1);
