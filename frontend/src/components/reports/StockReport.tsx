"use client";

import { useState } from "react";
import { StockReportRow } from "@/types/reports";
import ReportLayout from "./ReportLayout";

export default function StockReport({ rows }: { rows: StockReportRow[] }) {
  const [pageSize, setPageSize] = useState(50);

  const visibleRows = rows.slice(0, pageSize);

  const maxQuantity =
    visibleRows.length > 0
      ? Math.max(...visibleRows.map((r) => r.quantity), 1)
      : 1;

  return (
    <ReportLayout
      title="Current Stock"
      filename="current_stock.csv"
      rows={visibleRows}
      pdfEndpoint="/api/reports/stock/pdf"
    >
      {/* Pagination control */}
      <div className="p-3 border-b bg-gray-50 flex gap-3 justify-end items-center text-sm">
        <div className="flex items-center">
          <label className="text-gray-600 me-3">Rows:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </div>
      </div>

      <table className="table w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Product</th>
            <th className="p-2 text-left">Warehouse</th>
            <th className="p-2 text-right">Quantity</th>
          </tr>
        </thead>

        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="p-4 text-center text-gray-500"
              >
                No records found
              </td>
            </tr>
          ) : (
            visibleRows.map((r, i) => {
              const percentage = (r.quantity / maxQuantity) * 100;
              const hue = Math.max(0, Math.min(120, percentage * 1.2));

              return (
                <tr
                  key={i}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-2 font-medium">
                    {r.product_name}
                  </td>

                  <td className="p-2 text-gray-600">
                    {r.warehouse_name}
                  </td>

                  <td className="p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-full h-3 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: `hsl(${hue}, 80%, 45%)`,
                          }}
                        />
                      </div>

                      <span className="font-bold tabular-nums min-w-[3rem] text-right">
                        {r.quantity}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </ReportLayout>
  );
}
