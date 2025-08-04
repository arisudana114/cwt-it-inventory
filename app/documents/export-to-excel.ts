"use server";

import prisma from "@/lib/prisma";
import { DocumentCategory } from "@/app/generated/prisma";

// Define the structure of the document data we expect to fetch.
type DocumentData = {
  documentNumber: string;
  registrationNumber: string | null;
  date: Date;
  ddocumentCategory: string;
  productName: string;
  productCode: string;
  qty: number;
  unit: string;
  packageQty: number | null;
  packageUnit: string | null;
  remainingBalance: number;
  remainingPackage: number | null;
};

/**
 * Fetches and processes document data based on specified filters for Excel export.
 *
 * @param {object} filters - The filter criteria for the documents.
 * @returns {Promise<DocumentData[]>} A promise that resolves to an array of processed document data.
 */
export async function getDocumentsForExcel(filters: {
  documentNumber?: string;
  registrationNumber?: string;
  productCode?: string;
  documentCategory?: string;
  startDate?: string;
  endDate?: string;
  remainingBalance?: string;
  tab: "in" | "out";
}): Promise<DocumentData[]> {
  const {
    documentNumber,
    registrationNumber,
    productCode,
    documentCategory,
    startDate,
    endDate,
    remainingBalance: remainingBalanceFilter,
    tab,
  } = filters;

  if (tab === "in") {
    // Fetch raw data for "IN" documents based on the provided filters.
    const inDocumentsRaw = await prisma.document.findMany({
      where: {
        direction: "IN",
        ...(documentNumber && {
          documentNumber: { contains: documentNumber, mode: "insensitive" },
        }),
        ...(registrationNumber && {
          registrationNumber: {
            contains: registrationNumber,
            mode: "insensitive",
          },
        }),
        ...(documentCategory && {
          ddocumentCategory: { equals: documentCategory as DocumentCategory },
        }),
        ...(startDate &&
          endDate && {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        ...(productCode && {
          productItems: {
            some: {
              product: {
                productCode: { contains: productCode, mode: "insensitive" },
              },
            },
          },
        }),
      },
      include: {
        productItems: {
          include: {
            product: true,
            inOutLinks: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Filter the raw "IN" documents by remaining balance if the filter is applied.
    let filteredInDocuments = inDocumentsRaw;
    if (
      remainingBalanceFilter === "zero" ||
      remainingBalanceFilter === "nonzero"
    ) {
      filteredInDocuments = inDocumentsRaw.filter((doc) => {
        const hasNonZero = doc.productItems.some((item) => {
          const totalUsed = item.inOutLinks.reduce(
            (sum, link) => sum + Number(link.qtyUsed),
            0
          );

          return Number(item.qty) - totalUsed > 0;
        });
        return remainingBalanceFilter === "zero" ? !hasNonZero : hasNonZero;
      });
    }

    // Process the filtered "IN" documents to format them for the Excel export.
    const processedData = filteredInDocuments.flatMap((doc) =>
      doc.productItems.map((item) => {
        const totalUsed = item.inOutLinks.reduce(
          (sum, link) => sum + Number(link.qtyUsed),
          0
        );
        const totalPackageUsed = item.inOutLinks.reduce(
          (sum, link) => sum + Number(link.packageQtyUsed || 0),
          0
        );
        const remainingBalance = Number(item.qty) - totalUsed;
        const remainingPackage =
          item.packageQty != null
            ? Number(item.packageQty) - totalPackageUsed
            : null;

        return {
          documentNumber: doc.documentNumber,
          registrationNumber: doc.registrationNumber,
          date: doc.date,
          ddocumentCategory: doc.ddocumentCategory,
          productName: item.product.productName,
          productCode: item.product.productCode,
          qty: Number(item.qty),
          unit: item.unit,
          packageQty: item.packageQty != null ? Number(item.packageQty) : null,
          packageUnit: item.packageUnit,
          remainingBalance,
          remainingPackage,
        };
      })
    );
    return processedData;
  } else {
    const outDocuments = await prisma.document.findMany({
      where: {
        direction: "OUT",
        ...(documentNumber && {
          documentNumber: { contains: documentNumber, mode: "insensitive" },
        }),
        ...(registrationNumber && {
          registrationNumber: {
            contains: registrationNumber,
            mode: "insensitive",
          },
        }),
        ...(documentCategory && {
          ddocumentCategory: { equals: documentCategory as DocumentCategory },
        }),
        ...(startDate &&
          endDate && {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        ...(productCode && {
          productItems: {
            some: {
              product: {
                productCode: { contains: productCode, mode: "insensitive" },
              },
            },
          },
        }),
      },
      include: {
        productItems: {
          include: {
            product: true,
            inOutLinks: true,
          },
        },
        outDocuments: {
          include: {
            inDocument: true,
            product: true,
            productItem: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const processedData = outDocuments.flatMap((doc) =>
      doc.outDocuments.map((link) => ({
        documentNumber: doc.documentNumber,
        registrationNumber: doc.registrationNumber,
        date: doc.date,
        ddocumentCategory: doc.ddocumentCategory,
        productName: link.product.productName,
        productCode: link.product.productCode,
        qty: Number(link.qtyUsed),
        unit: link.productItem.unit,
        packageQty: Number(link.packageQtyUsed) || null,
        packageUnit: link.productItem.packageUnit || null,
        remainingBalance: 0, // Not applicable for OUT documents
        remainingPackage: 0, // Not applicable for OUT documents
      }))
    );

    return processedData;
  }
}