"use client";

import { MovementReportRow } from "@/types/reports";
import ExportCSV from "./ExportCSV";

export default function MovementReport({
  rows,
}: {
  rows: MovementReportRow[];
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <h2 className="font-semibold">Stock Movement (Recent)</h2>
        <ExportCSV filename="stock_movement.csv" rows={rows} />
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Time</th>
            <th className="p-2">Product</th>
            <th className="p-2">Warehouse</th>
            <th className="p-2 text-right">Change</th>
            <th className="p-2 text-right">Balance</th>
            <th className="p-2">Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="p-2">
                {new Date(r.created_at).toLocaleString()}
              </td>
              <td className="p-2">{r.product_name}</td>
              <td className="p-2">{r.warehouse_name}</td>
              <td className="p-2 text-right">{r.change}</td>
              <td className="p-2 text-right">{r.balance_after}</td>
              <td className="p-2">{r.reference_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
