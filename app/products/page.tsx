import prisma from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProductListPage() {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All Products</h1>
      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Code</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Package Qty</TableHead>
                <TableHead>Package Unit</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.productCode}</TableCell>
                  <TableCell>{product.productName}</TableCell>
                  <TableCell className="text-right">
                    {Number(product.qty).toLocaleString()}
                  </TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell className="text-right">
                    {Number(product.packageQty).toLocaleString()}
                  </TableCell>
                  <TableCell>{product.packageUnit ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {new Date(
                      product.updatedAt ?? product.createdAt!
                    ).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
