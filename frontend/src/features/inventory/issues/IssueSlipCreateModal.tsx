"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import { toast } from "sonner";

export default function IssueSlipCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    apiFetchClient("/products").then((r) => setProducts(r.items));
    apiFetchClient("/warehouses").then(setWarehouses);
  }, []);

  function addItem() {
    setItems([...items, { product_id: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!warehouseId || items.length === 0) {
      toast.error("Warehouse and items required");
      return;
    }

    try {
      await apiFetchClient("/inventory/issue-slips", {
        method: "POST",
        body: JSON.stringify({
          warehouse_id: warehouseId,
          items,
        }),
      });

      toast.success("Issue Slip created");
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Create Issue Slip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Warehouse */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Warehouse
          </label>
          <select
            className="border rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="">Select Warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Items</h3>
            <button
              onClick={addItem}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Item
            </button>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              No items added yet
            </p>
          )}

          {items.map((i, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_100px_32px] gap-2 items-center"
            >
              <select
                className="border rounded-lg p-2"
                value={i.product_id}
                onChange={(e) => {
                  const copy = [...items];
                  copy[idx].product_id = e.target.value;
                  setItems(copy);
                }}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                className="border rounded-lg p-2 text-center"
                value={i.quantity}
                onChange={(e) => {
                  const copy = [...items];
                  copy[idx].quantity = Number(e.target.value);
                  setItems(copy);
                }}
              />

              <button
                onClick={() => removeItem(idx)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Create Slip
          </button>
        </div>
      </div>
    </div>
  );
}
