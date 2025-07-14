import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import { redirect } from "next/navigation";
import { DocumentCategory } from "../generated/prisma";
import { DocumentFilters } from "@/components/DocumentFilters";

export default async function Documents({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const documentNumber =
    typeof params?.documentNumber === "string"
      ? params.documentNumber
      : undefined;

  const documentCategory = params?.documentCategory as string | undefined;
  const startDate = params?.startDate as string | undefined;
  const endDate = params?.endDate as string | undefined;

  const pageSize = 10; // Number of documents per page
  const currentPage = params?.page ? parseInt(String(params.page), 10) : 1;

  if (isNaN(currentPage) || currentPage < 1) {
    redirect("/documents?page=1");
  }

  const buildQueryString = (page: number) => {
    const params = new URLSearchParams();

    if (documentNumber) params.set("documentNumber", documentNumber);
    if (documentCategory) params.set("documentCategory", documentCategory);
    if (startDate) params.set("startDate", startDate.toString().split("T")[0]);
    if (endDate) params.set("endDate", endDate.toString().split("T")[0]);

    params.set("page", String(page));
    return `?${params.toString()}`;
  };

  const totalInDocuments = await prisma.document.count({
    where: { direction: "IN" },
  });

  const totalOutDocuments = await prisma.document.count({
    where: { direction: "OUT" },
  });

  const [inDocuments, outDocuments] = await Promise.all([
    await prisma.document.findMany({
      where: {
        direction: "IN",
        ...(documentNumber && {
          documentNumber: {
            contains: documentNumber,
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
      },
      include: {
        productItems: {
          include: {
            product: true,
            inOutLinks: {
              include: {
                outDocument: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
    }),
    await prisma.document.findMany({
      where: {
        direction: "OUT",
        ...(documentNumber && {
          documentNumber: {
            contains: documentNumber,
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
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
    }),
  ]);

  const totalInPages = Math.ceil(totalInDocuments / pageSize);
  const totalOutPages = Math.ceil(totalOutDocuments / pageSize);

  return (
    <Tabs defaultValue="in" className="space-y-6">
      <TabsList>
        <TabsTrigger value="in">IN Documents</TabsTrigger>
        <TabsTrigger value="out">OUT Documents</TabsTrigger>
      </TabsList>
      <DocumentFilters
        defaultValues={{
          documentNumber: Array.isArray(params?.documentNumber)
            ? params.documentNumber[0]
            : params?.documentNumber,
          documentCategory: Array.isArray(params?.documentCategory)
            ? params.documentCategory[0]
            : params?.documentCategory,
          startDate: Array.isArray(params?.startDate)
            ? params.startDate[0]
            : params?.startDate,
          endDate: Array.isArray(params?.endDate)
            ? params.endDate[0]
            : params?.endDate,
        }}
      />

      <TabsContent value="in">
        <h2 className="text-xl font-semibold mb-4">All IN Documents</h2>
        {inDocuments.length === 0 ? (
          <p className="text-muted-foreground">No IN documents found.</p>
        ) : (
          <div className="space-y-8">
            {inDocuments.map((document) => (
              <Card key={document.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        <div className="flex items-center gap-2">
                          <span className="bg-yellow-300 text-sm px-2 py-1 rounded-full text-black">
                            No AJU:
                          </span>{" "}
                          {document.documentNumber}
                        </div>
                      </CardTitle>
                      <CardDescription className="flex flex-col text-left">
                        <span>
                          Date: {new Date(document.date).toLocaleDateString()}
                        </span>

                        {document.registrationNumber && (
                          <span>
                            Registration: {document.registrationNumber}
                          </span>
                        )}

                        {document.companyName && (
                          <span>Company: {document.companyName}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">
                        {document.ddocumentCategory}
                      </Badge>
                      <DeleteDocumentButton documentId={document.id} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {document.productItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Original Qty</TableHead>
                            <TableHead>Used Qty</TableHead>
                            <TableHead>Remaining Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {document.productItems.map((item) => {
                            const totalUsed = item.inOutLinks.reduce(
                              (sum, link) => sum + Number(link.qtyUsed),
                              0
                            );
                            const totalPackageUsed = item.inOutLinks.reduce(
                              (sum, link) =>
                                sum + Number(link.packageQtyUsed || 0),
                              0
                            );
                            const originalQty = Number(item.qty);
                            const originalPackageQty = Number(
                              item.packageQty || 0
                            );
                            const remainingBalance = originalQty - totalUsed;
                            const remainingBalancePackage =
                              originalPackageQty - totalPackageUsed;

                            return (
                              <React.Fragment key={item.id}>
                                <TableRow>
                                  <TableCell>
                                    {item.product.productName}
                                  </TableCell>
                                  <TableCell>
                                    {item.product.productCode}
                                  </TableCell>
                                  <TableCell>
                                    {originalQty} {item.unit}
                                    {item.packageQty && item.packageUnit && (
                                      <span className="text-muted-foreground ml-1">
                                        / {Number(item.packageQty)}{" "}
                                        {item.packageUnit}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {totalUsed} {item.unit}
                                    {item.packageUnit && (
                                      <span className="text-muted-foreground ml-1">
                                        / {totalPackageUsed} {item.packageUnit}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`font-medium ${
                                        remainingBalance > 0
                                          ? "text-green-600"
                                          : "text-destructive"
                                      }`}
                                    >
                                      {remainingBalance} {item.unit}
                                      {item.packageUnit &&
                                      remainingBalancePackage !== null
                                        ? ` / ${remainingBalancePackage} ${item.packageUnit}`
                                        : ""}
                                    </span>
                                  </TableCell>
                                </TableRow>

                                {item.inOutLinks.length > 0 && (
                                  <TableRow>
                                    <TableCell colSpan={5}>
                                      <div className="text-sm text-muted-foreground space-y-1">
                                        <div className="font-medium text-xs mb-1">
                                          Used by OUT documents:
                                        </div>
                                        <ul className="list-disc list-inside ml-2">
                                          {item.inOutLinks.map((link) => (
                                            <li key={link.id}>
                                              OUT Doc{" "}
                                              {link.outDocument?.documentNumber}
                                              {link.outDocument
                                                ?.registrationNumber
                                                ? ` / ${link.outDocument.registrationNumber}`
                                                : ""}
                                              — {link.qtyUsed.toNumber()}{" "}
                                              {item.unit}
                                              {link.packageQtyUsed &&
                                                item.packageUnit && (
                                                  <span>
                                                    {" "}
                                                    /{" "}
                                                    {link.packageQtyUsed.toNumber()}{" "}
                                                    {item.packageUnit}
                                                  </span>
                                                )}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No products in this document.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className="flex justify-around mt-6 gap-2  w-1/4 mx-auto">
          <a
            href={buildQueryString(currentPage - 1)}
            className={`px-3 py-1 rounded text-sm border ${
              currentPage <= 1
                ? "text-gray-400 border-gray-300 cursor-not-allowed"
                : "text-primary border-primary hover:bg-primary/10"
            }`}
          >
            Previous
          </a>

          <span className="px-3 py-1 text-sm">Page {currentPage}</span>

          <a
            href={buildQueryString(currentPage + 1)}
            className={`px-3 py-1 rounded text-sm border ${
              currentPage >= totalInPages
                ? "text-gray-400 border-gray-300 cursor-not-allowed"
                : "text-primary border-primary hover:bg-primary/10"
            }`}
          >
            Next
          </a>
        </div>
      </TabsContent>

      <TabsContent value="out">
        <h2 className="text-xl font-semibold mb-4">All OUT Documents</h2>
        {outDocuments.length === 0 ? (
          <p className="text-muted-foreground">No OUT documents found.</p>
        ) : (
          <div className="space-y-8">
            {outDocuments.map((document) => (
              <Card key={document.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        <div className="flex items-center gap-2">
                          <span className="bg-yellow-300 text-sm px-2 py-1 rounded-full text-black">
                            No AJU:
                          </span>{" "}
                          {document.documentNumber}
                        </div>
                      </CardTitle>
                      <CardDescription className="flex flex-col text-left">
                        <span>
                          Date: {new Date(document.date).toLocaleDateString()}
                        </span>

                        {document.registrationNumber && (
                          <span>
                            Registration: {document.registrationNumber}
                          </span>
                        )}

                        {document.companyName && (
                          <span>Company: {document.companyName}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">
                        {document.ddocumentCategory}
                      </Badge>
                      <DeleteDocumentButton documentId={document.id} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {document.productItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>IN Source</TableHead>
                            <TableHead>Qty Used</TableHead>
                            <TableHead>Package Used</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {document.outDocuments.map((link) => (
                            <TableRow key={link.id}>
                              <TableCell>{link.product.productName}</TableCell>
                              <TableCell>{link.product.productCode}</TableCell>
                              <TableCell>
                                {link.inDocument.documentNumber} /{" "}
                                {link.inDocument.registrationNumber}
                              </TableCell>
                              <TableCell>
                                {Number(link.qtyUsed)} {link.productItem.unit}
                              </TableCell>
                              <TableCell>
                                {(link.packageQtyUsed ?? 0).toString()}{" "}
                                {link.productItem.packageUnit ?? ""}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No products used in this OUT document.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className="flex justify-around mt-6 gap-2  w-1/4 mx-auto mb-6">
          <a
            href={buildQueryString(currentPage - 1)}
            className={`px-3 py-1 rounded text-sm border ${
              currentPage <= 1
                ? "text-gray-400 border-gray-300 cursor-not-allowed"
                : "text-primary border-primary hover:bg-primary/10"
            }`}
          >
            Previous
          </a>

          <span className="px-3 py-1 text-sm">Page {currentPage}</span>

          <a
            href={buildQueryString(currentPage + 1)}
            className={`px-3 py-1 rounded text-sm border ${
              currentPage >= totalOutPages
                ? "text-gray-400 border-gray-300 cursor-not-allowed"
                : "text-primary border-primary hover:bg-primary/10"
            }`}
          >
            Next
          </a>
        </div>
      </TabsContent>
    </Tabs>
  );
}
