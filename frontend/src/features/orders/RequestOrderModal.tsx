"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import ProductSelect from "@/features/products/ProductSelect";
import WarehouseSelect from "@/features/warehouses/WarehouseSelect";
import SupplierSelect from "@/features/suppliers/SupplierSelect";
import { toast } from "sonner";

type OrderItem = {
  product_id: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
};

type Product = {
  id: string;
  name: string;
  unit: string;
  price: number;
};

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestOrderModal({ onClose, onSuccess }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [warehouseId, setWarehouseId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetchClient("/products").then(r => setProducts(r.items ?? []));
    apiFetchClient("/warehouses").then(setWarehouses);
    apiFetchClient("/suppliers").then(setSuppliers);
  }, []);

  function addProduct() {
    if (!selectedProduct) return;

    const p = products.find((x) => x.id === selectedProduct);
    if (!p) return;

    if (items.some((i) => i.product_id === p.id)) {
      toast.error("Product already added");
      return;
    }

    const price = Number(p.price);

    if (Number.isNaN(price)) {
      toast.error("Invalid product price");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        product_id: p.id,
        name: p.name,
        unit: p.unit,
        price, // ✅ guaranteed number
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

  const totalAmount = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  async function submit() {
    if (!warehouseId || !supplierId || items.length === 0) {
      toast.error("Warehouse, Supplier and items are required");
      return;
    }

    setLoading(true);

    try {
      await apiFetchClient("/inventory/orders/request", {
        method: "POST",
        body: JSON.stringify({
          warehouse_id: warehouseId,
          supplier_id: supplierId,
          reason,
          items: items.map(i => ({
            product_id: i.product_id,
            quantity: i.qty,
          })),
        }),
      });

      toast.success("Order requested");
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 modal-backdrop flex items-center justify-center px-4">
      <div className="modal-panel bg-white w-full max-w-3xl p-5 space-y-4">
        <h2 className="font-semibold text-lg">Request Inventory Order</h2>

        <label>From</label>
        <SupplierSelect
          suppliers={suppliers}
          value={supplierId}
          onChange={setSupplierId}
        />

        <label>To</label>
        <WarehouseSelect
          warehouses={warehouses}
          value={warehouseId}
          onChange={setWarehouseId}
        />

        {/* Add product */}
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

        {/* Products table */}
        <table className="table text-sm">
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit</th>
              <th className="w-24">Qty</th>
              <th>Rate</th>
              <th>Amount</th>
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
                    onChange={(e) => updateQty(idx, Number(e.target.value))}
                  />
                </td>
                <td>{i.price.toFixed(2)}</td>
                <td>{(i.qty * i.price).toFixed(2)}</td>
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
                <td colSpan={6} className="text-center text-gray-500 p-4">
                  No products added
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <textarea
          className="border p-2 w-full rounded"
          placeholder="Remark (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <div className="font-medium">Total: ₹ {totalAmount.toFixed(2)}</div>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button onClick={submit} disabled={loading} className="btn-primary">
              {loading ? "Submitting…" : "Submit Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
