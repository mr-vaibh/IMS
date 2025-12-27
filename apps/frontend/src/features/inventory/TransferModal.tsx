"use client";

import { useEffect, useState } from "react";
import { apiFetchClient, ApiError } from "@/lib/api.client";

import { toast } from "sonner";

import CompanySelect from "@/features/companies/CompanySelect";
import WarehouseSelect from "@/features/warehouses/WarehouseSelect";

interface Props {
  productId: string;
  fromWarehouseId: string;
  onClose: () => void;
}

export default function TransferModal({
  productId,
  fromWarehouseId,
  onClose,
}: Props) {
  const [companyId, setCompanyId] = useState("");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");

  // 🔥 FETCH WAREHOUSES WHEN COMPANY CHANGES
  useEffect(() => {
    if (!companyId) {
      setWarehouses([]);
      setToWarehouseId("");
      return;
    }

    apiFetchClient(`/companies/${companyId}/warehouses`)
      .then((res) => {
        const list = Array.isArray(res) ? res : res.items ?? [];
        setWarehouses(list);
      })
      .catch(() => setWarehouses([]));
  }, [companyId]);

  async function submit() {
    try {
      await apiFetchClient("/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          from_warehouse_id: fromWarehouseId,
          to_warehouse_id: toWarehouseId,
          quantity,
          reason,
        }),
      });

      toast.success("Stock transferred");
      onClose();
      window.location.reload();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Transfer failed");
      }
    }
  }

  const canSubmit = companyId && toWarehouseId && quantity > 0;

  const destinationWarehouses = warehouses.filter(
    (w) => w.id !== fromWarehouseId
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-96 space-y-3">
        <h2 className="font-semibold">Transfer Stock</h2>

        <CompanySelect
          value={companyId}
          onChange={(id) => {
            setCompanyId(id);
            setToWarehouseId("");
          }}
        />

        <WarehouseSelect
          warehouses={destinationWarehouses}
          value={toWarehouseId}
          onChange={setToWarehouseId}
        />

        {destinationWarehouses.length === 0 && (
          <p className="text-sm text-gray-500">
            No other warehouses available in this company
          </p>
        )}

        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Quantity"
          onChange={(e) => setQuantity(+e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Reason (optional)"
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="border px-3 py-1">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="px-3 py-1 bg-black text-white disabled:opacity-50"
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
