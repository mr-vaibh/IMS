"use client";

import { useState } from "react";
import { apiFetchClient } from "@/lib/api.client";

export default function RequestAdjustmentModal({
  productId,
  warehouseId,
  onClose,
}: {
  productId: string;
  warehouseId: string;
  onClose: () => void;
}) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await apiFetchClient("/inventory/adjustments", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          warehouse_id: warehouseId,
          delta: Number(delta),
          reason,
        }),
      });

      onClose();
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-96">
        <h2 className="font-semibold mb-2">Request Adjustment</h2>

        <input
          className="border w-full p-2 mb-2"
          placeholder="Delta (+ / -)"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
        />

        <input
          className="border w-full p-2 mb-4"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="border px-3 py-1">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="bg-black text-white px-3 py-1"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
