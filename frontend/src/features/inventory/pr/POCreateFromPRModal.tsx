"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import SupplierSelect from "@/features/suppliers/SupplierSelect";
import { toast } from "sonner";

export default function POCreateFromPRModal({
  pr,
  onClose,
  onCreated,
}: {
  pr: any;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetchClient("/suppliers").then(setSuppliers);

    const initial: Record<string, number> = {};
    pr.items.forEach((i: any) => {
      initial[i.product_id] = Number(i.price); // 👈 price from backend
    });
    setPrices(initial);
  }, [pr]);

  async function submit() {
    if (!supplierId) {
      toast.error("Supplier is required");
      return;
    }

    setLoading(true);

    try {
      await apiFetchClient(`/inventory/po/from-pr/${pr.id}`, {
        method: "POST",
        body: JSON.stringify({
          supplier_id: supplierId,
          items: pr.items.map((i: any) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            rate: prices[i.product_id],
          })),
        }),
      });

      toast.success("Purchase Order created");
      onCreated();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 modal-backdrop flex items-center justify-center px-4">
      <div className="modal-panel bg-white w-full max-w-3xl p-5 space-y-4">
        <h2 className="font-semibold text-lg">Create Purchase Order</h2>

        <div className="text-sm text-gray-600">
          PR: <span className="font-mono">{pr.id.slice(0, 8)}</span>
        </div>

        <label>Supplier</label>
        <SupplierSelect
          suppliers={suppliers}
          value={supplierId}
          onChange={setSupplierId}
        />

        <table className="table text-sm">
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {pr.items.map((i: any, idx: number) => {
              const rate = prices[i.product_id] ?? 0;
              const amount = rate * i.quantity;

              return (
                <tr key={`${i.product_id}-${idx}`} className="border-t">
                  <td>{i.product_name}</td>
                  <td>{i.unit}</td>
                  <td className="text-right">{i.quantity}</td>
                  <td className="text-right">₹ {rate.toFixed(2)}</td>
                  <td className="text-right font-medium">
                    ₹ {amount.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={submit} disabled={loading} className="btn-primary">
            {loading ? "Creating…" : "Create PO"}
          </button>
        </div>
      </div>
    </div>
  );
}
