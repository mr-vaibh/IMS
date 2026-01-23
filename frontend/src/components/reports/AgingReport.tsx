"use client";

import ReportLayout from "./ReportLayout";

const bucketStyles: Record<string, string> = {
  "0–30": "bg-green-100 text-green-700",
  "31–60": "bg-yellow-100 text-yellow-700",
  "61–90": "bg-orange-100 text-orange-700",
  "90+": "bg-red-100 text-red-700",
  UNKNOWN: "bg-gray-100 text-gray-700",
};

export default function AgingReport({
  rows,
}: {
  rows: any[];
}) {
  return (
    <ReportLayout
      title="Inventory Aging Report"
      filename="aging_report.csv"
      rows={rows}
      pdfEndpoint="/reports/aging/pdf"
    >
      <table className="table w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2">Product</th>
            <th className="p-2">Warehouse</th>
            <th className="p-2 text-right">Quantity</th>
            <th className="p-2">Last Stock-In</th>
            <th className="p-2 text-right">Age (Days)</th>
            <th className="p-2">Bucket</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                No aging data found
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td>{r.product_name}</td>

                <td>{r.warehouse}</td>

                <td>{r.quantity}</td>

                <td>
                  {r.last_in_date
                    ? new Date(r.last_in_date).toLocaleDateString()
                    : "—"}
                </td>

                <td className="text-center">
                  {r.age_days ?? "—"}
                </td>

                <td>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      bucketStyles[r.bucket] || bucketStyles.UNKNOWN
                    }`}
                  >
                    {r.bucket}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </ReportLayout>
  );
}
