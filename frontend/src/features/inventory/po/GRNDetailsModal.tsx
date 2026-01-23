"use client";

import { toast } from "sonner";

export default function GRNDetailsModal({
  grn,
  onClose,
}: {
  grn: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-2xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Goods Receipt Note</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="text-sm grid grid-cols-2 gap-4">
          {/* GRN ID WITH COPY */}
          <div className="flex items-center gap-2">
            <strong>GRN ID:</strong>
            <span>{grn.id.slice(0, 8)}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(grn.id);
                toast.success("Copied");
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              Copy
            </button>
          </div>

          <div>
            <strong>Status:</strong> {grn.status}
          </div>
          <div>
            <strong>Received By:</strong> {grn.received_by}
          </div>
          <div>
            <strong>Date:</strong> {new Date(grn.created_at).toLocaleString()}
          </div>
        </div>

        <table className="table text-sm">
          <thead>
            <tr>
              <th>Product</th>
              <th className="text-right">Qty Received</th>
            </tr>
          </thead>
          <tbody>
            {grn.items.map((i: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td>{i.product_name}</td>
                <td className="text-right">{i.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
