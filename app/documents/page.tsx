import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
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
import { deleteDocument } from "./delete_document";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";

export default async function Documents() {
  const [inDocuments, outDocuments] = await Promise.all([
    prisma.document.findMany({
      where: { direction: "IN" },
      include: {
        productItems: {
          include: {
            product: true,
            inOutLinks: true,
          },
        },
      },
      orderBy: { date: "desc" },
    }),
    prisma.document.findMany({
      where: { direction: "OUT" },
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
    }),
  ]);

  return (
    <Tabs defaultValue="in" className="space-y-6">
      <TabsList>
        <TabsTrigger value="in">IN Documents</TabsTrigger>
        <TabsTrigger value="out">OUT Documents</TabsTrigger>
      </TabsList>

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
                      <CardTitle>{document.documentNumber}</CardTitle>
                      <CardDescription>
                        Date: {new Date(document.date).toLocaleDateString()}
                        {document.registrationNumber && (
                          <span className="ml-4">
                            Registration: {document.registrationNumber}
                          </span>
                        )}
                        {document.companyName && (
                          <span className="ml-4 block mt-1">
                            Company: {document.companyName}
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
                            const originalQty = Number(item.qty);
                            const remainingBalance = originalQty - totalUsed;

                            return (
                              <TableRow key={item.id}>
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
                                  </span>
                                </TableCell>
                              </TableRow>
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
                      <CardTitle>{document.documentNumber}</CardTitle>
                      <CardDescription>
                        Date: {new Date(document.date).toLocaleDateString()}
                        {document.registrationNumber && (
                          <span className="ml-4">
                            Registration: {document.registrationNumber}
                          </span>
                        )}
                        {document.companyName && (
                          <span className="ml-4 block mt-1">
                            Company: {document.companyName}
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
                                {link.inDocument.documentNumber}
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
      </TabsContent>
    </Tabs>
  );
}
