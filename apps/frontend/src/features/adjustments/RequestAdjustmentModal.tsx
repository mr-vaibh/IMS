"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import ProductSelect from "@/features/products/ProductSelect";
import WarehouseSelect from "@/features/warehouses/WarehouseSelect";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestAdjustmentModal({
  onClose,
  onSuccess,
}: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetchClient("/products")
      .then((res) => setProducts(res.items ?? []))
      .catch(() => setProducts([]));

    apiFetchClient("/warehouses")
      .then(setWarehouses)
      .catch(() => setWarehouses([]));
  }, []);

  async function submit() {
    if (!productId || !warehouseId || delta === 0 || !reason) {
      setError("All fields are required. Delta cannot be zero.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiFetchClient("/inventory/adjustments/request", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          warehouse_id: warehouseId,
          delta,
          reason,
        }),
      });

      onSuccess();  
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-96 space-y-3">
        <h2 className="font-semibold">Request Inventory Adjustment</h2>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <ProductSelect
          products={products}
          value={productId}
          onChange={setProductId}
        />

        <WarehouseSelect
          warehouses={warehouses}
          value={warehouseId}
          onChange={setWarehouseId}
        />

        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Adjustment (+ / -)"
          value={delta || ""}
          onChange={(e) => setDelta(Number(e.target.value))}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Reason (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border px-3 py-1"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="bg-black text-white px-3 py-1 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
