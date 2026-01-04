"use client";

import ReportLayout from "./ReportLayout";

export default function AuditReport({
  rows,
  startDate,
  endDate,
}: {
  rows: any[];
  startDate?: string;
  endDate?: string;
}) {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const query = params.toString();

  return (
    <ReportLayout
      title="Inventory Audit"
      filename="audit_report.csv"
      rows={rows}
      pdfEndpoint={`/reports/audit/pdf?${query}`}
    >
      <table className="table w-full text-sm table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 w-[14%]">Date</th>
            <th className="p-2 w-[14%]">Product</th>
            <th className="p-2 w-[14%]">Warehouse</th>
            <th className="p-2 w-[12%]">Action</th>
            <th className="p-2 w-[8%] text-right">Change</th>
            <th className="p-2 w-[8%] text-right">Balance</th>
            <th className="p-2 w-[20%]">Reference</th>
            <th className="p-2 w-[10%]">User</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">
                No audit records found
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="p-2">{r["product__name"]}</td>
                <td className="p-2">{r["warehouse__name"]}</td>
                <td className="p-2 font-medium">{r.reference_type}</td>
                <td className="p-2 text-right tabular-nums">{r.change}</td>
                <td className="p-2 text-right tabular-nums">
                  {r.balance_after}
                </td>
                <td className="p-2 text-xs font-mono break-all">
                  {r.reference_id}
                </td>
                <td className="p-2">
                  {r.created_by__username || "System"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </ReportLayout>
  );
}
