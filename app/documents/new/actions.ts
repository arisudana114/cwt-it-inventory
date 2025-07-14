"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DocumentCategory } from "@/app/generated/prisma";

// Define the InSource type explicitly based on the return type of getInSourcesForProduct
export type InSource = {
  id: number;
  documentId: number;
  productId: number;
  qty: number; // Using 'any' to handle Decimal type
  unit: string;
  packageQty?: number | null; // Using 'any' to handle Decimal type
  packageUnit?: string | null;
  balance: number;
  packageBalance?: number | null;
  document: {
    documentNumber: string;
    registrationNumber: string;
    id: number;
    date: Date;
    direction: string;
  };
  inOutLinks: unknown[];
};

// Define validation schemas using Zod
const productItemSchema = z.object({
  productName: z.string().min(1),
  productCode: z.string().min(1),
  qty: z.coerce.number().positive(),
  unit: z.string().min(1),
  packageQty: z.coerce.number().optional(),
  packageUnit: z.string().optional(),
});





// This function will be called from the form to create the document
export async function createDocument(prevState: unknown, formData: FormData | { message: string, errors: Partial<Record<string, string[]>> }) {
  // If formData is not a FormData instance, it's a validation error from client-side
  if (
    formData &&
    typeof formData === "object" &&
    !(formData instanceof FormData)
  ) {
    return formData;
  }
  const direction = formData.get("direction") as "IN" | "OUT";

  try {
    if (direction === "IN") {
      return await createInDocument(formData);
    } else if (direction === "OUT") {
      return await createOutDocument(formData);
    } else {
      return { message: "Invalid document direction.", errors: {} };
    }
  } catch (error) {
    // Don't log redirect "errors" as they're not actual errors
    if (!(error instanceof Error && error.message === "NEXT_REDIRECT")) {
      console.error("Error creating document:", error);
    }

    if (error instanceof z.ZodError) {
      return {
        message: "Validation failed.",
        errors: error.flatten().fieldErrors,
      };
    }

    // If it's a redirect error, pass it along
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw to allow Next.js to handle the redirect
    }

    return { message: "An unexpected error occurred.", errors: {} };
  }
}

async function createInDocument(formData: FormData) {
  type ProductItemEntry = {
    index: number;
    key: string;
    value: FormDataEntryValue | null;
  };

  const productItems = Array.from(formData.keys())
    .filter((key) => key.startsWith("productItems"))
    .map((key) => {
      const match = key.match(/productItems\.(\d+)\.(.+)/);
      if (!match) return null;
      const index = match[1];
      return {
        index: parseInt(index),
        key: match[2],
        value: formData.get(key),
      } as ProductItemEntry;
    })
    .filter((item): item is ProductItemEntry => item !== null)
    .reduce((acc, { index, key, value }) => {
      if (!acc[index]) {
        acc[index] = {} as { [key: string]: FormDataEntryValue | null };
      }
      acc[index][key] = value;
      return acc;
    }, [] as { [key: string]: FormDataEntryValue | null }[]);

  await prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        documentNumber: formData.get("documentNumber") as string,
        registrationNumber:
          (formData.get("registrationNumber") as string) || null,
        date: new Date(formData.get("date") as string),
        direction: "IN",
        ddocumentCategory: formData.get("ddocumentCategory") as DocumentCategory,
        companyName: (formData.get("companyName") as string) || null,
        price: Number(formData.get("price") as string) || 0,
      },
    });

    for (const item of productItems) {
      const validatedItem = productItemSchema.parse(item);

      const product = await tx.product.upsert({
        where: { productCode: validatedItem.productCode },
        update: {
          productName: validatedItem.productName,
          qty: { increment: validatedItem.qty },
          packageQty: { increment: validatedItem.packageQty || 0 },
        },
        create: {
          productCode: validatedItem.productCode,
          productName: validatedItem.productName,
          qty: validatedItem.qty,
          unit: validatedItem.unit,
          packageQty: validatedItem.packageQty || 0,
          packageUnit: validatedItem.packageUnit || null,
        },
      });

      await tx.documentProductItem.create({
        data: {
          documentId: document.id,
          productId: product.id,
          qty: validatedItem.qty,
          unit: validatedItem.unit,
          packageQty: validatedItem.packageQty ?? null,
          packageUnit: validatedItem.packageUnit || null,
        },
      });
    }
  });

  revalidatePath("/documents");
  revalidatePath("/products");

  // Return success with redirect info instead of calling redirect directly
  return {
    success: true,
    redirectTo: "/documents",
    message: "Document created successfully.",
    errors: {},
  };
}

async function createOutDocument(formData: FormData) {
  console.log(
    "Creating OUT document with data:",
    Object.fromEntries(formData.entries())
  );

  // 1. Parse product items and their sources from form data
  const productItemsData = parseProductItemsFromFormData(formData);
  const sourcesData = parseSourcesFromFormData(formData);

  // 2. Start a transaction
  return await prisma.$transaction(async (tx) => {
    try {
      // 3a. Create the main OUT document
      const document = await tx.document.create({
        data: {
          documentNumber: formData.get("documentNumber") as string,
          registrationNumber:
            (formData.get("registrationNumber") as string) || null,
          date: new Date(formData.get("date") as string),
          direction: "OUT",
          ddocumentCategory: formData.get("ddocumentCategory") as DocumentCategory,
          companyName: (formData.get("companyName") as string) || null,
          price: Number(formData.get("price") as string) || 0,
        },
      });

      // 3b. Process each product item
      for (const item of productItemsData) {
        // Validate the product item
        const validatedItem = productItemSchema.parse(item);

        // i. Find the product by productCode
        const product = await tx.product.findUnique({
          where: { productCode: validatedItem.productCode },
        });

        if (!product) {
          throw new Error(`Product not found: ${validatedItem.productCode}`);
        }

        // ii. Create the DocumentProductItem for the OUT document
        await tx.documentProductItem.create({
          data: {
            documentId: document.id,
            productId: product.id,
            qty: validatedItem.qty,
            unit: validatedItem.unit,
            packageQty: validatedItem.packageQty ?? null,
            packageUnit: validatedItem.packageUnit || null,
          },
        });

        // iii. Decrement the global product stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            qty: { decrement: validatedItem.qty },
            packageQty: validatedItem.packageQty
              ? { decrement: validatedItem.packageQty }
              : undefined,
          },
        });

        // iv. Process each source for this product item
        const productSources = sourcesData
          .filter((s): s is NonNullable<typeof s> => s !== null)
          .filter((source) => source.productIndex === item.index);

        // Validate total quantity from sources matches product quantity
        const totalQtyUsed = productSources.reduce(
          (sum, source) => sum + Number(source.qtyUsed),
          0
        );

        if (totalQtyUsed !== Number(validatedItem.qty)) {
          throw new Error(
            `Total quantity from sources (${totalQtyUsed}) does not match ` +
              `the product quantity (${validatedItem.qty})`
          );
        }

        // Process each source
        for (const source of productSources) {
          // Get the source document product item
          const sourceItem = await tx.documentProductItem.findUnique({
            where: { id: source.sourceId },
            include: {
              document: true,
              inOutLinks: true,
            },
          });

          if (!sourceItem) {
            throw new Error(`Source item not found: ${source.sourceId}`);
          }

          // Calculate current balance
          const totalUsed = sourceItem.inOutLinks.reduce(
            (sum, link) => sum + link.qtyUsed.toNumber(),
            0
          );

          const balance = sourceItem.qty.toNumber() - totalUsed;

          // Validate source has enough balance
          if (Number(source.qtyUsed) > balance) {
            throw new Error(
              `Insufficient balance for source ${sourceItem.id}. ` +
                `Available: ${balance}, Requested: ${source.qtyUsed}`
            );
          }

          // Create InOutDocument record
          await tx.inOutDocument.create({
            data: {
              inDocumentId: sourceItem.document.id,
              outDocumentId: document.id,
              productId: product.id,
              productsPerDocumentId: sourceItem.id,
              qtyUsed: Number(source.qtyUsed),
              packageQtyUsed: source.packageQtyUsed
                ? Number(source.packageQtyUsed)
                : undefined,
              // packageQtyUsed field is not in the database schema yet
              // Uncomment after running the migration:
            },
          });

          // Log package quantity for debugging
          if (source.packageQtyUsed && Number(source.packageQtyUsed) > 0) {
            console.log(
              `Package quantity used: ${source.packageQtyUsed} for source ${sourceItem.id} (not stored in DB yet)`
            );
          }
        }
      }

      revalidatePath("/documents");
      revalidatePath("/products");

      return {
        success: true,
        redirectTo: "/documents",
        message: "Document created successfully.",
        errors: {},
      };
    } catch (error) {
      console.error("Error in createOutDocument transaction:", error);
      throw error;
    }
  });
}

// Helper function to parse product items from form data
function parseProductItemsFromFormData(formData: FormData) {
  type ProductItemEntry = {
    index: number;
    key: string;
    value: FormDataEntryValue | null;
  };

  // First, collect all entries by product index
  const entriesByIndex: Record<number, ProductItemEntry[]> = {};

  Array.from(formData.keys())
    .filter((key) => key.startsWith("productItems") && !key.includes("sources"))
    .forEach((key) => {
      const match = key.match(/productItems\.(\d+)\.(.+)/);
      if (!match) return;

      const index = parseInt(match[1]);
      const fieldKey = match[2];
      const value = formData.get(key);

      if (!entriesByIndex[index]) {
        entriesByIndex[index] = [];
      }

      entriesByIndex[index].push({
        index,
        key: fieldKey,
        value,
      });
    });

  // Then convert entries to product items
  const productItems = Object.keys(entriesByIndex).map((indexStr) => {
    const index = parseInt(indexStr);
    const entries = entriesByIndex[index];

    const item: { [key: string]: FormDataEntryValue | null | number } = { index };

    entries.forEach((entry) => {
      item[entry.key] = entry.value;
    });

    return item;
  });

  return productItems;
}

// Helper function to parse sources from form data
function parseSourcesFromFormData(formData: FormData) {
  type SourceEntry = {
    productIndex: number;
    sourceId: number;
    qtyUsed: FormDataEntryValue;
    packageQtyUsed?: FormDataEntryValue;
  };

  // First collect all source entries by their identifiers
  const sourceEntries: Record<string, Partial<SourceEntry>> = {};

  Array.from(formData.keys())
    .filter((key) => key.includes("sources"))
    .forEach((key) => {
      // Handle qtyUsed entries
      const qtyMatch = key.match(
        /productItems\.(\d+)\.sources\.(\d+)\.qtyUsed/
      );
      if (qtyMatch) {
        const productIndex = parseInt(qtyMatch[1]);
        const sourceId = parseInt(qtyMatch[2]);
        const qtyUsed = formData.get(key);

        if (!qtyUsed || Number(qtyUsed) <= 0) return;

        const entryKey = `${productIndex}-${sourceId}`;
        if (!sourceEntries[entryKey]) {
          sourceEntries[entryKey] = {
            productIndex,
            sourceId,
          };
        }

        sourceEntries[entryKey].qtyUsed = qtyUsed;
        return;
      }

      // Handle packageQtyUsed entries
      const pkgMatch = key.match(
        /productItems\.(\d+)\.sources\.(\d+)\.packageQtyUsed/
      );
      if (pkgMatch) {
        const productIndex = parseInt(pkgMatch[1]);
        const sourceId = parseInt(pkgMatch[2]);
        const packageQtyUsed = formData.get(key);

        // Skip if no package quantity provided or it's zero/negative
        if (!packageQtyUsed || Number(packageQtyUsed) <= 0) return;

        const entryKey = `${productIndex}-${sourceId}`;
        if (!sourceEntries[entryKey]) {
          sourceEntries[entryKey] = {
            productIndex,
            sourceId,
          };
        }

        sourceEntries[entryKey].packageQtyUsed = packageQtyUsed;
      }
    });

  // Convert to array and filter out entries without qtyUsed
  const sources = Object.values(sourceEntries).filter(
    (entry): entry is SourceEntry =>
      entry.productIndex !== undefined &&
      entry.sourceId !== undefined &&
      entry.qtyUsed !== undefined
  );

  return sources;
}

// This function can be called by the client to find available IN documents for a product
export async function getInSourcesForProduct(productCode: string) {
  if (!productCode) return [];

  const baseCode = productCode.slice(0, 7);

  const matchingProducts = await prisma.product.findMany({
    where: {
      productCode: {
        startsWith: baseCode,
      },
    },
  });

  if (!matchingProducts.length) return [];

  const productIds = matchingProducts.map((p) => p.id);

  const inDocumentItems = await prisma.documentProductItem.findMany({
    where: {
      productId: { in: productIds },
      document: {
        direction: "IN",
      },
    },
    include: {
      document: true,
      inOutLinks: true,
    },
  });

  const convertDecimalToNumber = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return obj;

    // ✅ Skip Date objects
    if (obj instanceof Date) return obj;

    // ✅ Convert Decimal.js objects (from Prisma)
    if (
      typeof obj === "object" &&
      obj !== null &&
      "toNumber" in obj &&
      typeof obj.toNumber === "function"
    ) {
      return obj.toNumber();
    }

    // ✅ Recurse through arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => convertDecimalToNumber(item));
    }

    // ✅ Recurse through objects
    if (typeof obj === "object") {
      const result: { [key: string]: unknown } = {};
      for (const key in obj) {
        result[key] = convertDecimalToNumber((obj as { [key: string]: unknown })[key]);
      }
      return result;
    }

    return obj;
  };

  const sourcesWithBalance = inDocumentItems
    .map((item) => {
      const totalUsed = item.inOutLinks.reduce(
        (sum, link) =>
          sum +
          (typeof link.qtyUsed.toNumber === "function"
            ? link.qtyUsed.toNumber()
            : Number(link.qtyUsed)),
        0
      );

      const balance =
        (typeof item.qty.toNumber === "function"
          ? item.qty.toNumber()
          : Number(item.qty)) - totalUsed;

      // Calculate total packageQtyUsed if exists
      const totalPackageUsed = item.inOutLinks.reduce(
        (sum, link) =>
          sum +
          (link.packageQtyUsed &&
          typeof link.packageQtyUsed.toNumber === "function"
            ? link.packageQtyUsed.toNumber()
            : Number(link.packageQtyUsed ?? 0)),
        0
      );

      // Remaining package qty balance
      const packageBalance =
        item.packageQty && typeof item.packageQty.toNumber === "function"
          ? item.packageQty.toNumber() - totalPackageUsed
          : Number(item.packageQty ?? 0) - totalPackageUsed;

      const itemWithNumberValues = convertDecimalToNumber({
        ...item,
        balance,
        packageBalance,
      }) as InSource;

      return itemWithNumberValues;
    })
    .filter((item) => item.balance > 0);

  return sourcesWithBalance;
}
