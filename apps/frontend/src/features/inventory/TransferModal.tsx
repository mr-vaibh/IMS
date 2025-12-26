"use client";

import { useState } from "react";
import { apiFetchClient } from "@/lib/api.client";

interface Warehouse {
  id: string;
  name: string;
}

interface Props {
  productId: string;
  fromWarehouseId: string;
  warehouses: Warehouse[];
  onClose: () => void;
}

export default function TransferModal({
  productId,
  fromWarehouseId,
  warehouses,
  onClose,
}: Props) {
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidQty = typeof quantity === "number" && quantity > 0;
  const canSubmit = toWarehouseId && isValidQty && !loading;

  async function submit() {
    if (!toWarehouseId) {
      alert("Select destination warehouse");
      return;
    }

    if (!isValidQty) {
      alert("Quantity must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      await apiFetchClient("/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          from_warehouse_id: fromWarehouseId,
          to_warehouse_id: toWarehouseId,
          quantity,
          ...(reason ? { reason } : {}),
        }),
      });

      onClose();
      window.location.reload(); // acceptable for now
    } catch (err: any) {
      alert(err.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded w-96">
        <h2 className="font-semibold mb-3">Transfer Stock</h2>

        <select
          className="border w-full p-2 mb-2"
          value={toWarehouseId}
          onChange={(e) => setToWarehouseId(e.target.value)}
        >
          <option value="">Select destination warehouse</option>
          {warehouses
            .filter((w) => w.id !== fromWarehouseId)
            .map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
        </select>

        <input
          type="number"
          min={1}
          className="border w-full p-2 mb-2"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) =>
            setQuantity(e.target.value === "" ? "" : Number(e.target.value))
          }
        />

        <input
          className="border w-full p-2 mb-4"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1 border"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="px-3 py-1 bg-black text-white disabled:opacity-50"
          >
            {loading ? "Transferring..." : "Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}
