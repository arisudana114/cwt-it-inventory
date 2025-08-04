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
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import { DocumentCategory } from "@/app/generated/prisma";
import { Pagination } from "@/components/Pagination";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function DocumentList({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const tabParam = Array.isArray(params?.tab) ? params.tab[0] : params?.tab;
  const tabValue = tabParam === "out" ? "out" : "in";

  const documentNumber =
    typeof params?.documentNumber === "string"
      ? params.documentNumber
      : undefined;
  const registrationNumber =
    typeof params?.registrationNumber === "string"
      ? params.registrationNumber
      : undefined;
  const productCode =
    typeof params?.productCode === "string" ? params.productCode : undefined;

  const documentCategory = params?.documentCategory as string | undefined;
  const startDate = params?.startDate as string | undefined;
  const endDate = params?.endDate as string | undefined;
  const remainingBalanceFilter = params?.remainingBalance as string | undefined;

  const pageSize = 50;
  const currentPage = params?.page ? parseInt(String(params.page), 10) : 1;

  const [
    allFilteredInDocumentsRaw,
    paginatedOutDocuments,
    allFilteredOutDocuments,
  ] = await Promise.all([
    prisma.document.findMany({
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
            date: { gte: new Date(startDate), lte: new Date(endDate) },
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
            inOutLinks: { include: { outDocument: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    }),
    prisma.document.findMany({
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
            date: { gte: new Date(startDate), lte: new Date(endDate) },
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
        productItems: { include: { product: true, inOutLinks: true } },
        outDocuments: {
          include: { inDocument: true, product: true, productItem: true },
        },
      },
      orderBy: { date: "desc" },
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
    }),
    prisma.document.findMany({
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
            date: { gte: new Date(startDate), lte: new Date(endDate) },
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
        productItems: { include: { product: true, inOutLinks: true } },
        outDocuments: {
          include: { inDocument: true, product: true, productItem: true },
        },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  let allFilteredInDocuments;
  if (
    remainingBalanceFilter === "zero" ||
    remainingBalanceFilter === "nonzero"
  ) {
    allFilteredInDocuments = allFilteredInDocumentsRaw.filter((doc) => {
      const hasNonZero = doc.productItems.some((item) => {
        const totalUsed = item.inOutLinks.reduce(
          (sum, link) => sum + Number(link.qtyUsed),
          0
        );
        return Number(item.qty) - totalUsed > 0;
      });
      return remainingBalanceFilter === "zero" ? !hasNonZero : hasNonZero;
    });
  } else {
    allFilteredInDocuments = allFilteredInDocumentsRaw;
  }

  const totalInPages = Math.ceil(allFilteredInDocuments.length / pageSize);
  const paginatedInDocuments = allFilteredInDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalOutPages = Math.ceil(allFilteredOutDocuments.length / pageSize);

  if (tabValue === "in") {
    return (
      <>
        <h2 className="text-xl font-semibold mb-4">{`${
          allFilteredInDocuments.length
        } IN Document${
          allFilteredInDocuments.length === 1 ? "" : "s"
        } found`}</h2>
        {paginatedInDocuments.length === 0 ? (
          <p className="text-muted-foreground">No IN documents found.</p>
        ) : (
          <div className="space-y-8">
            {paginatedInDocuments.map((document) => (
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
                        {document.price && (
                          <span>
                            Price:{" "}
                            {new Intl.NumberFormat(
                              document.price.toNumber() > 10000000
                                ? "id-ID"
                                : "en-US",
                              {
                                style: "currency",
                                currency:
                                  document.price.toNumber() > 10000000
                                    ? "IDR"
                                    : "USD",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }
                            ).format(document.price.toNumber())}
                          </span>
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
                            const remainingBalance =
                              Number(item.qty) - totalUsed;
                            const remainingBalancePackage =
                              Number(item.packageQty || 0) - totalPackageUsed;

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
                                    {Number(item.qty)} {item.unit}
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
                                                : ""}{" "}
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalInPages}
          tab="in"
        />
      </>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">{`${
        allFilteredOutDocuments.length
      } OUT Document${
        allFilteredOutDocuments.length === 1 ? "" : "s"
      } found`}</h2>
      {paginatedOutDocuments.length === 0 ? (
        <p className="text-muted-foreground">No OUT documents found.</p>
      ) : (
        <div className="space-y-8">
          {paginatedOutDocuments.map((document) => (
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
                        <span>Registration: {document.registrationNumber}</span>
                      )}
                      {document.companyName && (
                        <span>Company: {document.companyName}</span>
                      )}
                      {document.price && (
                        <span>
                          Price:{" "}
                          {new Intl.NumberFormat(
                            document.price.toNumber() > 10000000
                              ? "id-ID"
                              : "en-US",
                            {
                              style: "currency",
                              currency:
                                document.price.toNumber() > 10000000
                                  ? "IDR"
                                  : "USD",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }
                          ).format(document.price.toNumber())}
                        </span>
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalOutPages}
        tab="out"
      />
    </>
  );
}
