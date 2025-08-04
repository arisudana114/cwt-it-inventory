"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

type HistoryItem = {
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
};

export function ProductHistoryTable({ history }: { history: HistoryItem[] }) {
  return (
    <Table className="mt-4">
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Document</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
            <TableCell>{item.documentNumber}</TableCell>
            <TableCell>{item.ddocumentCategory}</TableCell>
            <TableCell>{item.type}</TableCell>
            <TableCell className={`${item.type === 'IN' ? 'text-green-500' : 'text-red-500'}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {item.type === 'IN' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                <span>
                  {`${item.qty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${item.unit}`}
                  {item.packageUnit && ` / ${item.packageQty?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${item.packageUnit}`}
                </span>
              </div>
            </TableCell>
            <TableCell>{`${item.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${item.unit}`}{item.packageUnit && ` / ${item.packageBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${item.packageUnit}`}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}