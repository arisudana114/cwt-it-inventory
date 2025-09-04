"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProductSelector({
  products,
  selectedProduct,
}: {
  products: { productCode: string; productName: string }[];
  selectedProduct?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (productCode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("productCode", productCode);
    router.push(`?${params.toString()}`);
  };

  return (
    <Select onValueChange={handleSelect} value={selectedProduct}>
      <SelectTrigger className="w-[450px]">
        <SelectValue placeholder="Select a product" />
      </SelectTrigger>
      <SelectContent>
        {products.map((product) => (
          <SelectItem key={product.productCode} value={product.productCode}>
            {product.productName} ({product.productCode})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
