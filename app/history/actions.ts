"use server";

import prisma from "@/lib/prisma";

export async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: { productName: "asc" },
  });
  return products.map((product) => ({
    ...product,
    qty: product.qty.toString(),
    packageQty: product.packageQty?.toString(),
  }));
}

export async function getProductHistory(
  productCode: string
): Promise<
  {
    date: Date;
    documentNumber: string;
    ddocumentCategory: string;
    type: "IN" | "OUT";
    qty: number;
    unit: string;
    packageQty: number | null;
    packageUnit: string | null;
    balance: number;
    packageBalance: number | null;
  }[]
> {
  const product = await prisma.product.findUnique({
    where: { productCode },
    include: {
      productItems: {
        include: {
          document: true,
        },
        where: {
          document: {
            direction: "IN",
          },
        },
      },
      inOutLinks: {
        include: {
          outDocument: true,
          productItem: true, // Include productItem to get the package unit
        },
      },
    },
  });

  if (!product) return [];

  const inEvents = product.productItems.map((item) => ({
    date: item.document.date,
    documentNumber: item.document.documentNumber,
    ddocumentCategory: item.document.ddocumentCategory,
    type: "IN" as const,
    qty: Number(item.qty),
    unit: item.unit,
    packageQty: item.packageQty ? Number(item.packageQty) : null,
    packageUnit: item.packageUnit,
  }));

  const outEvents = product.inOutLinks.map((link) => ({
    date: link.outDocument.date,
    documentNumber: link.outDocument.documentNumber,
    ddocumentCategory: link.outDocument.ddocumentCategory,
    type: "OUT" as const,
    qty: -Number(link.qtyUsed),
    unit: product.unit,
    packageQty: link.packageQtyUsed ? -Number(link.packageQtyUsed) : null,
    packageUnit: link.productItem.packageUnit,
  }));

  const history = [...inEvents, ...outEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let balance = 0;
  let packageBalance = 0;

  return history.map((item) => {
    balance += item.qty;
    packageBalance += item.packageQty || 0;
    return { ...item, balance, packageBalance };
  });
}