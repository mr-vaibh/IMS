"use client";

import ReportLayout from "./ReportLayout";

export default function OrderReport({
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
      title="Inventory Orders Items"
      filename="order_report.csv"
      rows={rows}
      pdfEndpoint={`/reports/orders/pdf?${query}`}
    >
      <table className="table w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2">Date</th>
            <th className="p-2">Product</th>
            <th className="p-2">Warehouse</th>
            <th className="p-2 text-right">Delta</th>
            <th className="p-2">Status</th>
            <th className="p-2">Requested By</th>
            <th className="p-2">Approved By</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">
                No order records found
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td>{new Date(r.order_created_at).toLocaleString()}</td>

                <td>{r.product_name}</td>

                <td>{r.warehouse_name}</td>

                <td className="text-right text-red-600">{r.delta}</td>

                <td>{r.order_status}</td>

                <td>{r.requested_by_username || "System"}</td>

                <td>{r.approved_by_username || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </ReportLayout>
  );
}
