"use client";

import { toast } from "sonner";

export default function PODetailsModal({
  po,
  onClose,
}: {
  po: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-3xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Purchase Order Details</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* PO ID WITH COPY */}
          <div className="flex items-center gap-2">
            <strong>PO ID:</strong>
            <span>{po.id.slice(0, 8)}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(po.id);
                toast.success("Copied");
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              Copy
            </button>
          </div>

          <div>
            <strong>Status:</strong> {po.status}
          </div>
          <div>
            <strong>Supplier:</strong> {po.supplier}
          </div>
          <div>
            <strong>Warehouse:</strong> {po.warehouse}
          </div>
          <div className="col-span-2">
            <strong>Created:</strong> {new Date(po.created_at).toLocaleString()}
          </div>
        </div>

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
            {po.items.map((i: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td>{i.product_name}</td>
                <td>{i.unit}</td>
                <td className="text-right">{i.quantity}</td>
                <td className="text-right">₹{i.rate}</td>
                <td className="text-right">₹{i.amount}</td>
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
