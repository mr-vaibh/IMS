"use client";

type ValuationRow = {
  product_name: string;
  warehouse_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_value: number;
};

import ReportLayout from "./ReportLayout";

export default function ValuationReport({ rows }: { rows: ValuationRow[] }) {
  const grandTotal = rows.reduce(
    (sum, r) => sum + r.total_value,
    0
  );

  return (
    <ReportLayout
      title="Inventory Valuation"
      filename="inventory_valuation.csv"
      rows={rows}
      pdfEndpoint="/reports/valuation/pdf"
    >
      <table className="table w-full text-sm">
        <thead>
          <tr>
            <th>Product</th>
            <th>Warehouse</th>
            <th>Qty</th>
            <th>Unit Cost</th>
            <th>Total Value</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.product_name}</td>
              <td>{r.warehouse_name}</td>
              <td>{r.quantity} {r.unit}</td>
              <td>₹{r.unit_cost}/-</td>
              <td className="font-bold">₹{r.total_value}/-</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="border-t">
            <td colSpan={4} className="text-right font-semibold">
              Grand Total: &nbsp;&nbsp;
            </td>
            <td className="font-bold">
              ₹{grandTotal}/-
            </td>
          </tr>
        </tfoot>
      </table>
    </ReportLayout>
  );
}
