"use client";

import ReportLayout from "./ReportLayout";

export default function MonthlyStockReport({ data }: { data: any }) {
  if (!data) return null;

  const days = Array.from({ length: data.days }, (_, i) => i + 1);

  return (
    <ReportLayout
      title={`Monthly Stock Report (${data.month})`}
      filename={`monthly_stock_${data.month}.csv`}
    >
      <div className="overflow-x-auto">
        <table className="table text-xs min-w-max">
          <thead className="bg-gray-50">
            <tr>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Unit</th>
              <th>Opening</th>
              {days.map(d => (
                <th key={d}>{d}</th>
              ))}
              <th>Closing</th>
            </tr>
          </thead>

          <tbody>
            {data.rows.map((r: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td>{r.product_name}</td>
                <td>{r.warehouse_name}</td>
                <td>{r.unit}</td>
                <td className="font-medium">{r.opening}</td>

                {days.map(d => (
                  <td key={d}>{r.daily[d]}</td>
                ))}

                <td className="font-semibold">{r.closing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
