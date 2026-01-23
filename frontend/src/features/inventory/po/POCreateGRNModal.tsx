"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import { toast } from "sonner";

export default function POCreateGRNModal({
  po,
  onClose,
  onCreated,
}: {
  po: any;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // initialize received qty = ordered qty
    setItems(
      po.items.map((i: any) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        ordered_qty: i.quantity,
        received_qty: i.quantity,
      }))
    );
  }, [po]);

  function updateQty(index: number, qty: number) {
    if (qty < 0) return;
    const copy = [...items];
    copy[index].received_qty = qty;
    setItems(copy);
  }

  async function submit() {
    setLoading(true);

    try {
      await apiFetchClient("/inventory/grn", {
        method: "POST",
        body: JSON.stringify({
          order_id: po.id,
          items: items.map((i) => ({
            product_id: i.product_id,
            received_quantity: i.received_qty,
          })),
        }),
      });

      toast.success("GRN created & stock updated");
      onCreated();
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
        <h2 className="font-semibold text-lg">Goods Receipt (GRN)</h2>

        <div className="text-sm text-gray-600">
          PO: <span className="font-mono">{po.id.slice(0, 8)}</span>
        </div>

        <table className="table text-sm">
          <thead>
            <tr>
              <th>Product</th>
              <th className="text-right">Ordered</th>
              <th className="text-right">Received</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={`${i.product_id}-${idx}`} className="border-t">
                <td>{i.product_name}</td>
                <td>{i.ordered_qty}</td>
                <td>{i.received_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Saving…" : "Confirm GRN"}
          </button>
        </div>
      </div>
    </div>
  );
}
