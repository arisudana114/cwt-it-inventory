"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteDocument(documentId: number) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Find the document and related items
      const document = await tx.document.findUnique({
        where: { id: documentId },
        include: {
          productItems: {
            include: {
              inOutLinks: true,
              product: true,
            },
          },
          outDocuments: true,
        },
      });

      if (!document) throw new Error("Document not found");

      const isOut = document.direction === "OUT";

      // 2. If OUT, reverse qty deductions from inOutDocuments and products
      if (isOut) {
        for (const link of document.outDocuments) {
          // a. Restore qty to the source IN document line

          // b. Restore qty to global product stock
          await tx.product.update({
            where: { id: link.productId },
            data: {
              qty: {
                increment: link.qtyUsed,
              },
              packageQty: link.packageQtyUsed
                ? {
                    increment: link.packageQtyUsed,
                  }
                : undefined,
            },
          });
        }

        // c. Delete in_out_documents links
        await tx.inOutDocument.deleteMany({
          where: { outDocumentId: document.id },
        });
      }

      // 3. If IN, reverse qty increases
      if (!isOut) {
        for (const item of document.productItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              qty: {
                decrement: item.qty,
              },
              packageQty: item.packageQty
                ? { decrement: item.packageQty }
                : undefined,
            },
          });
        }
      }

      // 4. Delete document_product_items
      await tx.documentProductItem.deleteMany({
        where: { documentId },
      });

      // 5. Delete the document
      await tx.document.delete({
        where: { id: documentId },
      });
    });

    revalidatePath("/documents");
    revalidatePath("/products");
  } catch (err) {
    console.error("Failed to delete document:", err);
    throw new Error("Failed to delete document: " + (err as Error).message);
  }
}
