"use client";

import { MovementReportRow } from "@/types/reports";
import ExportCSV from "./ExportCSV";

const typeStyles: Record<string, string> = {
  STOCK_IN: "bg-green-100 text-green-700",
  STOCK_OUT: "bg-red-100 text-red-700",
  ORDER: "bg-yellow-100 text-yellow-700",
  TRANSFER_IN: "bg-blue-100 text-blue-700",
  TRANSFER_OUT: "bg-purple-100 text-purple-700",
};

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

      <table className="table text-sm">
        <thead>
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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                No records found
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i}>
                <td className="p-2">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="p-2">{r.product_name}</td>
                <td className="p-2">{r.warehouse_name}</td>
                <td
                  className={`p-2 text-right font-medium ${
                    r.change > 0
                      ? "text-green-600"
                      : r.change < 0
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {r.change > 0 ? `+${r.change}` : r.change}
                </td>
                <td className="p-2 text-right">{r.balance_after}</td>
                <td className="p-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      typeStyles[r.reference_type] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {r.reference_type.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
