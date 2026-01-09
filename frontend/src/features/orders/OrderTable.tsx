"use client";

import { apiFetchClient } from "@/lib/api.client";

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function OrderTable({
  orders,
}: {
  orders: any[];
}) {
  async function act(id: string, action: "approve" | "reject") {
    await apiFetchClient(`/inventory/orders/${id}/${action}`, {
      method: "POST",
    });
    window.location.reload();
  }

  return (
    <table className="table text-sm">
      <thead>
        <tr>
          <th className="p-2">Product</th>
          <th className="p-2">Warehouse</th>
          <th className="p-2">Delta</th>
          <th className="p-2">Reason</th>
          <th className="p-2">Status</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>

      <tbody>
        {orders.length === 0 ? (
          <tr>
            <td colSpan={6} className="p-4 text-center text-gray-500">
              No records found
            </td>
          </tr>
        ) : (
          orders.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="p-2">{a.product_name}</td>
              <td className="p-2">{a.warehouse_name}</td>

              <td
                className={`p-2 font-medium ${
                  a.delta > 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {a.delta > 0 ? "+" : ""}
                {a.delta}
              </td>

              <td className="p-2">{a.reason}</td>

              <td className="p-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusStyles[a.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {a.status}
                </span>
              </td>

              <td className="p-2">
                {a.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => act(a.id, "approve")}
                      className="btn-success text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => act(a.id, "reject")}
                      className="btn-danger text-sm"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {a.status === "APPROVED" && (
                  <button
                    className="btn-primary"
                    onClick={() =>
                      window.open(
                        `/api/inventory/orders/${a.id}/po/pdf`,
                        "_blank"
                      )
                    }
                  >
                    Download PO
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
