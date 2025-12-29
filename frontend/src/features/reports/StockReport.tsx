"use client";

import { StockReportRow } from "@/types/reports";
import ExportCSV from "./ExportCSV";

export default function StockReport({ rows }: { rows: StockReportRow[] }) {
  const maxQuantity =
    rows.length > 0 ? Math.max(...rows.map((r) => r.quantity), 1) : 1;

  return (
    <div>
      <div className="flex justify-between mb-2">
        <h2 className="font-semibold">Current Stock</h2>
        <ExportCSV filename="current_stock.csv" rows={rows} />
      </div>

      <table className="table w-full">
        <thead>
          <tr>
            <th className="p-2 text-left">Product</th>
            <th className="p-2 text-left">Warehouse</th>
            <th className="p-2 text-right">
              <div className="inline-flex items-center gap-1 relative group">
                <span>Quantity</span>

                {/* Info icon */}
                <span
                  className="cursor-help text-gray-400 hover:text-gray-600"
                  aria-label="Quantity bar info"
                  tabIndex={0}
                >
                  ℹ️
                </span>

                {/* Tooltip */}
                <div className="absolute right-0 top-full mt-1 w-64 rounded bg-gray-900 text-white text-xs p-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition pointer-events-none z-10">
                  The progress bar shows stock relative to the highest quantity
                  in this table.
                </div>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-500">
                No records found
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const percentage = (r.quantity / maxQuantity) * 100;
              const hue = Math.max(0, Math.min(120, percentage * 1.2));

              return (
                <tr key={i} className="border-t">
                  <td className="p-2">{r.product_name}</td>
                  <td className="p-2">{r.warehouse_name}</td>

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
    </div>
  );
}
