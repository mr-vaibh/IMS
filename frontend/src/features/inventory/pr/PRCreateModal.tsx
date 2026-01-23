"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import ProductSelect from "@/features/products/ProductSelect";
import WarehouseSelect from "@/features/warehouses/WarehouseSelect";
import { toast } from "sonner";

type PRItem = {
  product_id: string;
  name: string;
  unit: string;
  qty: number;
};

type Product = {
  id: string;
  name: string;
  unit: string;
};

type Warehouse = {
  id: string;
  name: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function PRCreateModal({ open, onClose, onCreated }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [warehouseId, setWarehouseId] = useState("");
  const [items, setItems] = useState<PRItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    apiFetchClient("/products").then(r => setProducts(r.items ?? []));
    apiFetchClient("/warehouses").then(setWarehouses);
  }, [open]);

  if (!open) return null;

  function addProduct() {
    if (!selectedProduct) return;

    const p = products.find(x => x.id === selectedProduct);
    if (!p) return;

    if (items.some(i => i.product_id === p.id)) {
      toast.error("Product already added");
      return;
    }

    setItems(prev => [
      ...prev,
      {
        product_id: p.id,
        name: p.name,
        unit: p.unit,
        qty: 1,
      },
    ]);

    setSelectedProduct("");
  }

  function updateQty(index: number, qty: number) {
    if (!Number.isFinite(qty) || qty < 1) return;
    setItems(items.map((i, idx) => (idx === index ? { ...i, qty } : i)));
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!warehouseId || items.length === 0) {
      toast.error("Warehouse and items are required");
      return;
    }

    setLoading(true);

    try {
      await apiFetchClient("/inventory/pr", {
        method: "POST",
        body: JSON.stringify({
          warehouse_id: warehouseId,
          items: items.map(i => ({
            product_id: i.product_id,
            quantity: i.qty,
          })),
        }),
      });

      toast.success("Purchase Requisition created");
      onCreated();
      onClose();
      setItems([]);
      setWarehouseId("");
    } catch (e: any) {
      toast.error(e.message || "Failed to create PR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 modal-backdrop flex items-center justify-center px-4">
      <div className="modal-panel bg-white w-full max-w-3xl p-5 space-y-4">
        <h2 className="font-semibold text-lg">Create Purchase Requisition</h2>

        <label>Warehouse</label>
        <WarehouseSelect
          warehouses={warehouses}
          value={warehouseId}
          onChange={setWarehouseId}
        />

        <label>Products</label>
        <div className="flex gap-2">
          <ProductSelect
            products={products}
            value={selectedProduct}
            onChange={setSelectedProduct}
          />
          <button className="btn-primary" onClick={addProduct}>
            Add
          </button>
        </div>

        {/* Items table */}
        <table className="table text-sm">
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit</th>
              <th className="w-24">Qty</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={i.product_id}>
                <td>{i.name}</td>
                <td>{i.unit}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    className="border p-1 w-20"
                    value={i.qty}
                    onChange={e => updateQty(idx, Number(e.target.value))}
                  />
                </td>
                <td>
                  <button
                    className="text-red-600"
                    onClick={() => removeItem(idx)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 p-4">
                  No products added
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Submitting…" : "Submit PR"}
          </button>
        </div>
      </div>
    </div>
  );
}
