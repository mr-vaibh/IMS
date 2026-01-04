"use client";

import ReportLayout from "./ReportLayout";

export default function LowStockReport({
  rows,
  threshold,
}: {
  rows: any[];
  threshold: number;
}) {
  return (
    <ReportLayout
      title="Low Stock"
      filename="low_stock_report.csv"
      rows={rows}
      pdfEndpoint={`/reports/low-stock/pdf?threshold=${threshold}`}
    >
      <table className="table w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Product</th>
            <th className="p-2 text-left">Warehouse</th>
            <th className="p-2 text-right">Current Qty</th>
            <th className="p-2 text-right">Threshold</th>
            <th className="p-2 text-right">Shortfall</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="p-4 text-center text-gray-500"
              >
                No low stock items 🎉
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const shortfall = threshold - r.quantity;

              return (
                <tr
                  key={i}
                  className="border-t hover:bg-red-50"
                >
                  <td className="p-2 font-medium">
                    {r.product_name}
                  </td>

                  <td className="p-2 text-gray-600">
                    {r.warehouse_name}
                  </td>

                  <td className="p-2 text-right font-semibold text-red-600 tabular-nums">
                    {r.quantity}
                  </td>

                  <td className="p-2 text-right tabular-nums text-gray-700">
                    {threshold}
                  </td>

                  <td
                    className={`p-2 text-right font-semibold tabular-nums ${
                      shortfall > 0
                        ? "text-red-700"
                        : "text-gray-600"
                    }`}
                  >
                    {shortfall}
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
