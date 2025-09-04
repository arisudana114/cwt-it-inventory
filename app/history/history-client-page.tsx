"use client";

import { getProductHistory } from "./actions";
import { ProductHistoryTable } from "./table";
import { ProductSelector } from "./product-selector";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function HistoryClientPage({
  products,
}: {
  products: { productCode: string; productName: string }[];
}) {
  const searchParams = useSearchParams();
  const productCode = searchParams.get("productCode");
  const [history, setHistory] = useState<
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
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      setLoading(true);
      try {
        let data: {
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
        }[] = [];
        if (productCode) {
          data = await getProductHistory(productCode);
        } else if (products.length > 0) {
          data = await getProductHistory(products[0].productCode);
        }
        if (isMounted) setHistory(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [productCode, products]);

  return (
    <>
      <ProductSelector
        products={products}
        selectedProduct={productCode || products[0]?.productCode}
      />
      {loading ? (
        <div className="flex justify-center items-center py-8 text-gray-500">
          Loading...
        </div>
      ) : (
        productCode && <ProductHistoryTable history={history} />
      )}
    </>
  );
}
