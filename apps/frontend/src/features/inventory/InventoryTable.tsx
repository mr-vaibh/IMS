"use client";

import { InventoryRow } from "@/types/inventory";
import InventoryActions from "./InventoryActions";

interface Warehouse {
  id: string;
  name: string;
}

export default function InventoryTable({
  rows,
  warehouses,
}: {
  rows: InventoryRow[];
  warehouses: Warehouse[];
}) {
  console.log("Rendering InventoryTable with rows:", rows);
  return (
    <table className="w-full border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Product</th>
          <th className="p-2 text-left">Warehouse</th>
          <th className="p-2 text-right">Qty</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={`${r.product_id}-${r.warehouse_id}`}>
            <td className="p-2">{r.product_name}</td>
            <td className="p-2">{r.warehouse_name}</td>
            <td className="p-2 text-right">{r.quantity}</td>
            <td className="p-2">
              <InventoryActions
                productId={r.product_id}
                warehouseId={r.warehouse_id}
                warehouses={warehouses}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
