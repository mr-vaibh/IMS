"use client";

import { apiFetchClient } from "@/lib/api.client";

export default function AdjustmentTable({
  adjustments,
}: {
  adjustments: any[];
}) {
  async function act(id: string, action: "approve" | "reject") {
    await apiFetchClient(
      `/inventory/adjustments/${id}/${action}`,
      { method: "POST" }
    );
    window.location.reload();
  }

  return (
    <table className="w-full border text-sm">
      <thead className="bg-gray-100">
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
        {adjustments.map((a) => (
          <tr key={a.id} className="border-t">
            <td className="p-2">{a.product_name}</td>
            <td className="p-2">{a.warehouse_name}</td>

            <td
              className={`p-2 font-medium ${
                a.delta > 0
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {a.delta > 0 ? "+" : ""}
              {a.delta}
            </td>

            <td className="p-2">{a.reason}</td>
            <td className="p-2">{a.status}</td>

            <td className="p-2">
              {a.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => act(a.id, "approve")}
                    className="border px-2 py-1"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(a.id, "reject")}
                    className="border px-2 py-1"
                  >
                    Reject
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
