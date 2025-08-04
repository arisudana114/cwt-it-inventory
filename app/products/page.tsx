import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

async function getProductStocks() {
  // Get all products
  const products = await prisma.product.findMany({
    select: {
      id: true,
      productName: true,
      productCode: true,
      unit: true,
      packageUnit: true,
    },
    orderBy: { productName: "asc" },
  });

  // For each product, sum IN and OUT quantities
  const stocks = await Promise.all(
    products.map(async (product) => {
      // Sum IN from DocumentProductItem (direction IN)
      const inSum = await prisma.documentProductItem.aggregate({
        where: {
          productId: product.id,
          document: { direction: "IN" },
        },
        _sum: { qty: true, packageQty: true },
      });

      // Sum OUT from InOutDocument (qtyUsed, packageQtyUsed)
      const outSum = await prisma.inOutDocument.aggregate({
        where: {
          productId: product.id,
        },
        _sum: { qtyUsed: true, packageQtyUsed: true },
      });

      return {
        ...product,
        inQty: inSum._sum.qty || new Decimal(0),
        outQty: outSum._sum.qtyUsed || new Decimal(0),
        inPackageQty: inSum._sum.packageQty || new Decimal(0),
        outPackageQty: outSum._sum.packageQtyUsed || new Decimal(0),
      };
    })
  );
  return stocks;
}

export default async function ProductStocksPage() {
  const stocks = await getProductStocks();
  // Helper to format numbers to 2 decimals, show 0 for near-zero
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fmt = (val: any) => {
    if (typeof val?.abs === "function" && val.abs().lessThan(1e-6))
      return "0.00";

    let numToFormat: number;

    if (typeof val?.toNumber === "function") {
      numToFormat = val.toNumber();
    } else if (typeof val === "number") {
      numToFormat = val;
    } else {
      return val?.toString?.() ?? "";
    }

    return numToFormat.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="max-w-screen mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Product Stocks</h1>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-yellow-300 text-black">
            <th className="border px-2 py-1">Product Name</th>
            <th className="border px-2 py-1">Product Code</th>
            <th className="border px-2 py-1">IN Qty</th>
            <th className="border px-2 py-1">OUT Qty</th>
            <th className="border px-2 py-1">Current Qty</th>
            <th className="border px-2 py-1">Unit</th>
            <th className="border px-2 py-1">IN Pkg Qty</th>
            <th className="border px-2 py-1">OUT Pkg Qty</th>
            <th className="border px-2 py-1">Current Pkg Qty</th>
            <th className="border px-2 py-1">Pkg Unit</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((p) => {
            const currentQty = p.inQty.minus(p.outQty);
            const currentPkgQty = p.inPackageQty.minus(p.outPackageQty);
            return (
              <tr key={p.productCode}>
                <td className="border px-2 py-2">{p.productName}</td>
                <td className="border px-2 py-2">{p.productCode}</td>
                <td className="border px-2 py-2">{fmt(p.inQty)}</td>
                <td className="border px-2 py-2">{fmt(p.outQty)}</td>
                <td className="border px-2 py-2 font-bold">
                  {fmt(currentQty)}
                </td>
                <td className="border px-2 py-2">{p.unit}</td>
                <td className="border px-2 py-2">{fmt(p.inPackageQty)}</td>
                <td className="border px-2 py-2">{fmt(p.outPackageQty)}</td>
                <td className="border px-2 py-2 font-bold">
                  {fmt(currentPkgQty)}
                </td>
                <td className="border px-2 py-2">{p.packageUnit || "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
