"use client";

type ValuationRow = {
  product_name: string;
  warehouse_name: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
};


import ReportLayout from "./ReportLayout";

export default function ValuationReport({ rows }: { rows: ValuationRow[] }) {
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
            <th className="text-right">Qty</th>
            <th className="text-right">Unit Cost</th>
            <th className="text-right">Total Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.product_name}</td>
              <td>{r.warehouse_name}</td>
              <td className="text-right">{r.quantity}</td>
              <td className="text-right">₹{r.unit_cost}/-</td>
              <td className="text-right font-medium">₹{r.total_value}/-</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportLayout>
  );
}
