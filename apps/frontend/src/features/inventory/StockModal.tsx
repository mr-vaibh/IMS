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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-96">
        <h2 className="font-semibold mb-2">
          {type === "IN" ? "Stock In" : "Stock Out"}
        </h2>

        <input
          className="border w-full p-2 mb-2"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <input
          className="border w-full p-2 mb-4"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-3 py-1 bg-black text-white"
          >
            {loading ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
