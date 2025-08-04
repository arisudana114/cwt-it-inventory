import { getProducts } from "./actions";
import { HistoryClientPage } from "./history-client-page";
import { Suspense } from "react";

export default async function HistoryPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">IN and OUT History</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <HistoryClientPage products={products} />
      </Suspense>
    </div>
  );
}