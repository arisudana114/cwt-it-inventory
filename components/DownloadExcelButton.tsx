"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { getDocumentsForExcel } from "@/app/documents/export-to-excel";

// Defines the props for the DownloadExcelButton component.
interface DownloadExcelButtonProps {
  filters: {
    documentNumber?: string;
    registrationNumber?: string;
    productCode?: string;
    documentCategory?: string;
    startDate?: string;
    endDate?: string;
    remainingBalance?: string;
    tab: "in" | "out";
  };
}

/**
 * A client-side component that provides a button to download documents as an Excel file.
 *
 * @param {DownloadExcelButtonProps} props - The properties for the component, including the filters.
 * @returns {JSX.Element} The rendered button component.
 */
export function DownloadExcelButton({ filters }: DownloadExcelButtonProps) {
  const [loading, setLoading] = useState(false);

  /**
   * Handles the click event for the download button.
   * Fetches the document data, converts it to an Excel file, and initiates the download.
   */
  const handleDownload = async () => {
    setLoading(true);
    try {
      // Fetch the data from the server action based on the current filters.
      const data = await getDocumentsForExcel(filters);

      // Create a new workbook and a worksheet from the fetched data.
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Documents");

      // Write the workbook to a binary string and trigger the download.
      XLSX.writeFile(workbook, "documents.xlsx");
    } catch (error) {
      console.error("Failed to download Excel file:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 cursor-pointer text-white"
    >
      {loading ? "Downloading..." : "Download as Excel"}
    </Button>
  );
}
