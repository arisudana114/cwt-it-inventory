-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('BC_1_6', 'BC_2_7', 'BC_3_3', 'BC_4_0', 'P3BET');

-- CreateTable
CREATE TABLE "document_product_items" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "qty" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "package_qty" DECIMAL(65,30),
    "package_unit" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_product_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "document_number" TEXT NOT NULL,
    "registration_number" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "direction" "Direction" NOT NULL,
    "document_category" "DocumentCategory" NOT NULL,
    "company_name" TEXT,
    "price" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "in_out_documents" (
    "id" SERIAL NOT NULL,
    "in_document_id" INTEGER NOT NULL,
    "out_document_id" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "products_per_documents_id" INTEGER NOT NULL,
    "qty_used" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "in_out_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_code" TEXT NOT NULL,
    "qty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "package_qty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "package_unit" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");

-- AddForeignKey
ALTER TABLE "document_product_items" ADD CONSTRAINT "document_product_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_product_items" ADD CONSTRAINT "document_product_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_out_documents" ADD CONSTRAINT "in_out_documents_in_document_id_fkey" FOREIGN KEY ("in_document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_out_documents" ADD CONSTRAINT "in_out_documents_out_document_id_fkey" FOREIGN KEY ("out_document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_out_documents" ADD CONSTRAINT "in_out_documents_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_out_documents" ADD CONSTRAINT "in_out_documents_products_per_documents_id_fkey" FOREIGN KEY ("products_per_documents_id") REFERENCES "document_product_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
