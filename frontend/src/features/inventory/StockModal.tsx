"use client";

import { useState } from "react";
import { apiFetchClient } from "@/lib/api.client";

interface Props {
  type: "IN" | "OUT";
  productId: string;
  warehouseId: string;
  onClose: () => void;
}

export default function StockModal({
  type,
  productId,
  warehouseId,
  onClose,
}: Props) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await apiFetchClient(
        type === "IN" ? "/inventory/stock-in" : "/inventory/stock-out",
        {
          method: "POST",
          body: JSON.stringify({
            product_id: productId,
            warehouse_id: warehouseId,
            quantity: Number(quantity),
            reason,
          }),
        }
      );

      onClose();
      window.location.reload(); // simple + safe for now
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 modal-backdrop flex items-center justify-center px-4">
      <div className="modal-panel bg-white w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] text-white">
          <h2 className="font-semibold mb-0">{type === "IN" ? "Stock In" : "Stock Out"}</h2>
          <button onClick={onClose} className="text-white opacity-90 hover:opacity-100">✕</button>
        </div>

        <div className="p-4">
          <div className="mb-3">
            <label className="block text-sm text-muted mb-1">Quantity</label>
            <input
              className="input"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-muted mb-1">Reason (optional)</label>
            <input
              className="input"
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className={`btn-primary ${loading ? 'opacity-60' : ''}`}
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
