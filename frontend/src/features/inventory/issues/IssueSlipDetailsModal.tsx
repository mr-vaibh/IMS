"use client";

export default function IssueSlipDetailsModal({
  slip,
  onClose,
}: {
  slip: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg w-full max-w-2xl p-4 space-y-4">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">Issue Slip Details</h3>
          <button
            className="text-gray-500 hover:text-black"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* META */}
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
          <div>
            <span className="font-medium">Slip ID:</span>
            <div className="font-mono">{slip.id}</div>
          </div>

          <div>
            <span className="font-medium">Warehouse:</span>
            <div>{slip.warehouse_name}</div>
          </div>

          <div>
            <span className="font-medium">Requested By:</span>
            <div>{slip.requested_by}</div>
          </div>

          <div>
            <span className="font-medium">Status:</span>
            <div>{slip.status}</div>
          </div>

          <div className="col-span-2">
            <span className="font-medium">Purpose:</span>
            <div className="text-gray-600">{slip.purpose}</div>
          </div>

          <div>
            <span className="font-medium">Created At:</span>
            <div className="text-gray-600">
              {new Date(slip.created_at).toLocaleString()}
            </div>
          </div>

          {slip.approved_by && (
            <div>
              <span className="font-medium">Approved By:</span>
              <div>{slip.approved_by}</div>
            </div>
          )}
        </div>

        {/* ITEMS TABLE */}
        <table className="table text-sm mt-3">
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit</th>
              <th className="text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {slip.items.map((i: any, idx: number) => (
              <tr key={`${i.product_id}-${idx}`} className="border-t">
                <td>{i.product_name}</td>
                <td>{i.unit}</td>
                <td className="text-right">{i.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="flex justify-end pt-2">
          <button className="btn-secondary text-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
