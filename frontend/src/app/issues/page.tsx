"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import { toast } from "sonner";

type IssueStatus = "PENDING" | "APPROVED" | "REJECTED";

function StatusBadge({ status }: { status: IssueStatus }) {
  const styles: Record<IssueStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function IssuesPage() {
  const [items, setItems] = useState<any[]>([]);

  function load() {
    apiFetchClient("/inventory/issues")
      .then(setItems)
      .catch(() => toast.error("Failed to load issues"));
  }

  useEffect(load, []);

  async function decide(id: string, action: "APPROVE" | "REJECT") {
    try {
      await apiFetchClient(`/inventory/issues/${id}/decide`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      toast.success(`Issue ${action.toLowerCase()}d`);
      load();
    } catch {
      toast.error("Action failed");
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">
        Inventory Issues
      </h1>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left font-medium text-gray-600">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Warehouse</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3 text-right" />
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {i.product}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {i.warehouse}
                </td>
                <td className="px-4 py-3">{i.quantity}</td>
                <td className="px-4 py-3">{i.type_label}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={i.status} />
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-gray-500">
                  {i.notes || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {i.status === "PENDING" ? (
                    <div className="inline-flex gap-2">
                      <button
                        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                        onClick={() => decide(i.id, "APPROVE")}
                      >
                        Approve
                      </button>
                      <button
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                        onClick={() => decide(i.id, "REJECT")}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/issues/${i.id}/pass/pdf`}
                      target="_blank"
                      className="border rounded p-2"
                    >
                      Download Issue Pass
                    </a>
                  )
                }
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No inventory issues found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
