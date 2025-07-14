"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DocumentFilters({
  defaultValues,
}: {
  defaultValues: {
    documentNumber?: string;
    documentCategory?: string;
    startDate?: string;
    endDate?: string;
  };
}) {
  const router = useRouter();

  const [documentNumber, setDocumentNumber] = useState(
    defaultValues.documentNumber || ""
  );
  const [documentCategory, setDocumentCategory] = useState(
    defaultValues.documentCategory || ""
  );
  const [startDate, setStartDate] = useState(defaultValues.startDate || "");
  const [endDate, setEndDate] = useState(defaultValues.endDate || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (documentNumber.trim()) {
      params.set("documentNumber", documentNumber.trim());
    }
    if (documentCategory) {
      params.set("documentCategory", documentCategory);
    }
    if (startDate) {
      params.set("startDate", startDate);
    }
    if (endDate) {
      params.set("endDate", endDate);
    }

    // Always reset pagination to first page
    params.set("page", "1");

    router.push(`/documents?${params.toString()}`);
  };

  const handleReset = () => {
    // Clear the search params
    router.push("/documents");

    // Clear UI state too
    setDocumentNumber("");
    setDocumentCategory("");
    setStartDate("");
    setEndDate("");
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

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-2 rounded text-sm bg-primary text-white hover:bg-primary/90"
        >
          Filter
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-2 rounded text-sm border border-input text-muted-foreground hover:bg-muted"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
