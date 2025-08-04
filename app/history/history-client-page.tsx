"use client";

import { getProductHistory } from "./actions";
import { ProductHistoryTable } from "./table";
import { ProductSelector } from "./product-selector";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function HistoryClientPage({ products }: { products: { productCode: string, productName: string }[] }) {
  const searchParams = useSearchParams();
  const productCode = searchParams.get("productCode");
  const [history, setHistory] = useState<{ date: Date; documentNumber: string; ddocumentCategory: string; type: "IN" | "OUT"; qty: number; unit: string; packageQty: number | null; packageUnit: string | null; balance: number; packageBalance: number | null; }[]>([]);

  useEffect(() => {
    if (productCode) {
      getProductHistory(productCode).then(setHistory);
    } else if (products.length > 0) {
      getProductHistory(products[0].productCode).then(setHistory);
    }
  }, [productCode, products]);

  return (
    <>
      <ProductSelector products={products} selectedProduct={productCode || products[0]?.productCode} />
      {productCode && <ProductHistoryTable history={history} />}
    </>
  );
}