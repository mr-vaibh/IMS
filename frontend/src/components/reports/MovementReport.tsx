"use client";

import { MovementReportRow } from "@/types/reports";
import ReportLayout from "./ReportLayout";

type Props = {
  rows: MovementReportRow[];
  startDate?: string;
  endDate?: string;
};

export default function MovementReport({
  rows,
  startDate,
  endDate,
}: Props) {
  return (
    <ReportLayout
      title="Stock Movement"
      filename="stock_movement.csv"
      rows={rows}
      pdfEndpoint="/reports/movement/pdf"
      filters={{ startDate, endDate }}
    >
      <table className="table w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2">Time</th>
            <th className="p-2">Product</th>
            <th className="p-2">Warehouse</th>
            <th className="p-2 text-center">Change</th>
            <th className="p-2 text-center">Balance</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="p-4 text-center text-gray-500"
              >
                No records found
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="p-2">
                  {new Date(r.created_at).toLocaleString()}
                </td>

                <td className="p-2 font-medium">
                  {r.product_name}
                </td>

                <td className="p-2 text-gray-600">
                  {r.warehouse_name}
                </td>

                <td
                  className={`p-2 text-center font-medium tabular-nums ${
                    r.change > 0
                      ? "text-green-600"
                      : r.change < 0
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {r.change > 0 ? `+${r.change}` : r.change}
                </td>

                <td className="p-2 text-center tabular-nums text-gray-800">
                  {r.balance_after}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </ReportLayout>
  );
}
