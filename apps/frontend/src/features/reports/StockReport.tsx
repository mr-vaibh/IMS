"use client";

import { StockReportRow } from "@/types/reports";
import ExportCSV from "./ExportCSV";

export default function StockReport({ rows }: { rows: StockReportRow[] }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <h2 className="font-semibold">Current Stock</h2>
        <ExportCSV filename="current_stock.csv" rows={rows} />
      </div>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Product</th>
            <th className="p-2 text-left">Warehouse</th>
            <th className="p-2 text-right">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="p-2">{r.product_name}</td>
              <td className="p-2">{r.warehouse_name}</td>
              <td className="p-2 text-right">{r.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
