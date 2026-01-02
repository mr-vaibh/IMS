"use client";

import ReportLayout from "./ReportLayout";

export default function AdjustmentReport({ rows }: { rows: any[] }) {
  return (
    <ReportLayout
      title="Inventory Adjustments"
      filename="adjustment_report.csv"
      rows={rows}
      pdfEndpoint="/api/reports/adjustments/pdf"
    >
      <table className="table w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2">Date</th>
            <th className="p-2">Product</th>
            <th className="p-2">Warehouse</th>
            <th className="p-2 text-right">Delta</th>
            <th className="p-2">Status</th>
            <th className="p-2">Reason</th>
            <th className="p-2">Requested By</th>
            <th className="p-2">Approved By</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">
                No adjustment records found
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">
                  {new Date(r.created_at).toLocaleString()}
                </td>

                <td className="p-2">
                  {r["product__name"]}
                </td>

                <td className="p-2">
                  {r["warehouse__name"]}
                </td>

                <td className="p-2 text-right tabular-nums">
                  {r.delta}
                </td>

                <td className="p-2 font-medium">
                  {r.status}
                </td>

                <td className="p-2 max-w-xs truncate" title={r.reason}>
                  {r.reason || "—"}
                </td>

                <td className="p-2">
                  {r["requested_by__username"] || "System"}
                </td>

                <td className="p-2">
                  {r["approved_by__username"] || "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </ReportLayout>
  );
}
