"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function DocumentFilters({
  defaultValues,
}: {
  defaultValues: {
    documentNumber?: string;
    registrationNumber?: string;
    productCode?: string;
    documentCategory?: string;
    startDate?: string;
    endDate?: string;
    remainingBalance?: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [documentNumber, setDocumentNumber] = useState(
    defaultValues.documentNumber || ""
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    defaultValues.registrationNumber || ""
  );
  const [productCode, setProductCode] = useState(
    defaultValues.productCode || ""
  );
  const [documentCategory, setDocumentCategory] = useState(
    defaultValues.documentCategory || ""
  );
  const [startDate, setStartDate] = useState(defaultValues.startDate || "");
  const [endDate, setEndDate] = useState(defaultValues.endDate || "");
  const [remainingBalance, setRemainingBalance] = useState(
    defaultValues.remainingBalance || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    const updateParam = (key: string, value: string) => {
      if (value.trim()) {
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }
    };

    updateParam("documentNumber", documentNumber);
    updateParam("registrationNumber", registrationNumber);
    updateParam("productCode", productCode);
    updateParam("documentCategory", documentCategory);
    updateParam("startDate", startDate);
    updateParam("endDate", endDate);
    updateParam("remainingBalance", remainingBalance);

    // Always reset pagination to first page
    params.set("page", "1");

    router.push(`/documents?${params.toString()}`);
  };

  const handleReset = () => {
    const tab = searchParams.get("tab");
    const newParams = new URLSearchParams();
    if (tab) {
      newParams.set("tab", tab);
    }
    newParams.set("page", "1");
    router.push(`/documents?${newParams.toString()}`);

    // Clear UI state too
    setDocumentNumber("");
    setRegistrationNumber("");
    setProductCode("");
    setDocumentCategory("");
    setStartDate("");
    setEndDate("");
    setRemainingBalance("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 mb-6 flex flex-wrap gap-4 items-end"
    >
      {/* Document Number */}
      <div className="flex flex-col">
        <label htmlFor="documentNumber" className="text-sm font-medium">
          Document Number
        </label>
        <input
          type="text"
          id="documentNumber"
          name="documentNumber"
          value={documentNumber}
          onChange={(e) => setDocumentNumber(e.target.value)}
          placeholder="Filter by document number"
          className="border border-input px-3 py-1 rounded text-sm"
        />
      </div>

      {/* Registration Number */}
      <div className="flex flex-col">
        <label htmlFor="registrationNumber" className="text-sm font-medium">
          Registration Number
        </label>
        <input
          type="text"
          id="registrationNumber"
          name="registrationNumber"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          placeholder="Filter by registration number"
          className="border border-input px-3 py-1 rounded text-sm"
        />
      </div>

      {/* Product Code */}
      <div className="flex flex-col">
        <label htmlFor="productCode" className="text-sm font-medium">
          Product Code
        </label>
        <input
          type="text"
          id="productCode"
          name="productCode"
          value={productCode}
          onChange={(e) => setProductCode(e.target.value)}
          placeholder="Filter by product code"
          className="border border-input px-3 py-1 rounded text-sm"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col">
        <label htmlFor="documentCategory" className="text-sm font-medium">
          Category
        </label>
        <select
          id="documentCategory"
          name="documentCategory"
          value={documentCategory}
          onChange={(e) => setDocumentCategory(e.target.value)}
          className="border border-input px-3 py-1 rounded text-sm dark:bg-black"
        >
          <option value="">All</option>
          <option value="BC_1_6">BC 1.6</option>
          <option value="BC_2_7">BC 2.7</option>
          <option value="BC_3_3">BC 3.3</option>
          <option value="BC_4_0">BC 4.0</option>
          <option value="P3BET">P3BET</option>
        </select>
      </div>

      {/* Start Date */}
      <div className="flex flex-col">
        <label htmlFor="startDate" className="text-sm font-medium">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-input px-3 py-1 rounded text-sm"
        />
      </div>

      {/* End Date */}
      <div className="flex flex-col">
        <label htmlFor="endDate" className="text-sm font-medium">
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          name="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-input px-3 py-1 rounded text-sm"
        />
      </div>

      {/* Remaining Balance Filter */}
      <div className="flex flex-col">
        <label htmlFor="remainingBalance" className="text-sm font-medium">
          Remaining Balance
        </label>
        <select
          id="remainingBalance"
          name="remainingBalance"
          value={remainingBalance}
          onChange={(e) => setRemainingBalance(e.target.value)}
          className="border border-input px-3 py-1 rounded text-sm dark:bg-black"
        >
          <option value="">All</option>
          <option value="zero">Only 0</option>
          <option value="nonzero">Only &gt; 0</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-2 rounded text-sm bg-primary text-black hover:bg-primary/90  cursor-pointer"
        >
          Filter
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-2 rounded text-sm border border-input text-muted-foreground hover:bg-muted cursor-pointer"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
