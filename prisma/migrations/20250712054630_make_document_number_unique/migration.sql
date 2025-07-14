/*
  Warnings:

  - A unique constraint covering the columns `[document_number]` on the table `documents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "documents_document_number_key" ON "documents"("document_number");
