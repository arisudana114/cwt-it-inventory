import prisma from "@/lib/prisma";
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
import { Badge } from "@/components/ui/badge";

export default async function Documents() {
  // Fetch all IN documents with their product items
  const documents = await prisma.document.findMany({
    where: {
      direction: "IN",
    },
    include: {
      productItems: {
        include: {
          product: true,
          inOutLinks: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All IN Documents</h2>

      {documents.length === 0 ? (
        <p className="text-muted-foreground">No IN documents found.</p>
      ) : (
        <div className="space-y-8">
          {documents.map((document) => (
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
                  <Badge variant="secondary">
                    {document.ddocumentCategory}
                  </Badge>
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
                          // Calculate the total quantity used from this product item
                          const totalUsed = item.inOutLinks.reduce(
                            (sum, link) => sum + Number(link.qtyUsed),
                            0
                          );

                          // Calculate the remaining balance
                          const originalQty = Number(item.qty);
                          const remainingBalance = originalQty - totalUsed;

                          return (
                            <TableRow key={item.id}>
                              <TableCell>{item.product.productName}</TableCell>
                              <TableCell>{item.product.productCode}</TableCell>
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
    </div>
  );
}
