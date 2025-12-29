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
    <table className="table">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Product</th>
          <th className="p-2 text-left">Warehouse</th>
          <th className="p-2 text-left">Supplier</th>
          <th className="p-2 text-right">Qty</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={5} className="p-4 text-center text-gray-500">
              No records found
            </td>
          </tr>
        ) : (
          rows.map((r) => (
            <tr
              key={`${r.product_id}-${r.warehouse_id}`}
              className={r.quantity === 0 ? "bg-red-100" : ""}
            >
              <td className="p-2">{r.product_name}</td>
              <td className="p-2">{r.warehouse_name}</td>
              <td className="p-2">{r.supplier_name || "-"}</td>
              <td className="p-2 text-right">{r.quantity}</td>
              <td className="p-2">
                <InventoryActions
                  productId={r.product_id}
                  warehouseId={r.warehouse_id}
                  warehouses={warehouses}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
