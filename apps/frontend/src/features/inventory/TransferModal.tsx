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
    <div className="fixed inset-0 z-40 modal-backdrop flex items-center justify-center px-4">
      <div className="modal-panel bg-white w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] text-white">
          <h2 className="font-semibold">Transfer Stock</h2>
          <button onClick={onClose} className="text-white opacity-90 hover:opacity-100">✕</button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-muted mb-1">Company</label>
            <CompanySelect
              value={companyId}
              onChange={(id) => {
                setCompanyId(id);
                setToWarehouseId("");
              }}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Destination Warehouse</label>
            <WarehouseSelect
              warehouses={destinationWarehouses}
              value={toWarehouseId}
              onChange={setToWarehouseId}
            />

            {destinationWarehouses.length === 0 && (
              <p className="text-sm text-muted mt-2">No other warehouses available in this company</p>
            )}
          </div>

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

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="btn-ghost">
              Cancel
            </button>

            <button
              onClick={submit}
              disabled={!canSubmit}
              className={`btn-primary ${!canSubmit ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
