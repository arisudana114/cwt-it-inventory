"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Define validation schemas using Zod
const productItemSchema = z.object({
  productName: z.string().min(1),
  productCode: z.string().min(1),
  qty: z.coerce.number().positive(),
  unit: z.string().min(1),
  packageQty: z.coerce.number().optional(),
  packageUnit: z.string().optional(),
});

const inOutSourceSchema = z.object({
  inDocumentProductItemId: z.coerce.number(),
  qtyUsed: z.coerce.number().positive(),
  packageQtyUsed: z.coerce.number().optional(),
});

const outProductItemSchema = productItemSchema.extend({
  sources: z.array(inOutSourceSchema),
});

// This function will be called from the form to create the document
export async function createDocument(prevState: any, formData: FormData | any) {
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
      return { message: "Invalid document direction." };
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

    return { message: "An unexpected error occurred." };
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
        acc[index] = {};
      }
      acc[index][key] = value;
      return acc;
    }, [] as any[]);

  await prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        documentNumber: formData.get("documentNumber") as string,
        registrationNumber:
          (formData.get("registrationNumber") as string) || null,
        date: new Date(formData.get("date") as string),
        direction: "IN",
        ddocumentCategory: formData.get("ddocumentCategory") as any,
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
          ddocumentCategory: formData.get("ddocumentCategory") as any,
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
        const documentProductItem = await tx.documentProductItem.create({
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

    const item: any = { index };

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

  const product = await prisma.product.findUnique({
    where: { productCode },
  });

  if (!product) return [];

  const inDocumentItems = await prisma.documentProductItem.findMany({
    where: {
      productId: product.id,
      document: {
        direction: "IN",
      },
    },
    include: {
      document: true,
      inOutLinks: true, // These are the times this item has been used as a source
    },
  });

  // Helper function to convert Decimal objects to numbers
  const convertDecimalToNumber = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Check if it's a Decimal object (has toNumber method)
    if (
      typeof obj === "object" &&
      obj !== null &&
      "toNumber" in obj &&
      typeof obj.toNumber === "function"
    ) {
      return obj.toNumber();
    }

    // If it's an array, convert each item
    if (Array.isArray(obj)) {
      return obj.map((item) => convertDecimalToNumber(item));
    }

    // If it's an object, convert each property
    if (typeof obj === "object" && obj !== null) {
      const result: any = {};
      for (const key in obj) {
        result[key] = convertDecimalToNumber(obj[key]);
      }
      return result;
    }

    // Otherwise return as is
    return obj;
  };

  const sourcesWithBalance = inDocumentItems
    .map((item) => {
      // Calculate regular quantity balance
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

      // For package quantity, since we don't have packageQtyUsed in the database yet,
      // we'll just use the full packageQty as the balance for now
      let packageBalance = undefined;
      if (item.packageQty) {
        packageBalance =
          typeof item.packageQty.toNumber === "function"
            ? item.packageQty.toNumber()
            : Number(item.packageQty);
      }

      // Convert all Decimal objects to numbers
      const itemWithNumberValues = convertDecimalToNumber({
        ...item,
        balance,
        packageBalance,
      });

      return itemWithNumberValues;
    })
    .filter((item) => item.balance > 0);

  return sourcesWithBalance;
}
