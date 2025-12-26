"use client";

import AdjustmentActions from "./AdjustmentActions";

export default function AdjustmentTable({ adjustments }: { adjustments: any[] }) {
  return (
    <table className="w-full border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2">Product</th>
          <th className="p-2">Warehouse</th>
          <th className="p-2 text-right">Delta</th>
          <th className="p-2">Status</th>
          <th className="p-2">Requested By</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {adjustments.map((a) => (
          <tr key={a.id}>
            <td className="p-2">{a.product_name}</td>
            <td className="p-2">{a.warehouse_name}</td>
            <td className="p-2 text-right">{a.delta}</td>
            <td className="p-2">{a.status}</td>
            <td className="p-2">{a.requested_by}</td>
            <td className="p-2">
              <AdjustmentActions adjustment={a} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
