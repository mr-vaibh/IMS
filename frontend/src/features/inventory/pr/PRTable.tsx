"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiFetchClient } from "@/lib/api.client";
import PODetailsModal from "@/features/inventory/pr/PODetailsModal";
import { hasPermission } from "@/lib/permissions";

const statusStyles: Record<string, string> = {
  SUBMITTED: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function PRTable({
  prs,
  onRefresh,
  onCreatePO,
  permissions,
}: {
  prs: any[];
  onRefresh: () => void;
  onCreatePO: (pr: any) => void;
  permissions: string[];
}) {
  const [openItems, setOpenItems] = useState<any[] | null>(null);
  const [openPO, setOpenPO] = useState<any | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    try {
      await apiFetchClient(`/inventory/pr/${id}/${action}`, {
        method: "POST",
      });
      toast.success("PR updated");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const canCreatePO = permissions.includes("inventory.po.create");

  return (
    <>
      <table className="table text-sm">
        <thead>
          <tr>
            <th className="p-2">Products</th>
            <th className="p-2">Warehouse</th>
            <th className="p-2">Created</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {prs.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No records found
              </td>
            </tr>
          ) : (
            prs.map((pr) => (
              <tr key={pr.id} className="border-t">
                {/* PRODUCTS */}
                <td className="p-2">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => setOpenItems(pr.items)}
                  >
                    {pr.items.length} item{pr.items.length > 1 && "s"}
                  </button>
                </td>

                <td className="p-2">{pr.warehouse_name}</td>

                <td className="p-2 text-gray-600">
                  {new Date(pr.created_at).toLocaleString()}
                </td>

                <td className="p-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      statusStyles[pr.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {pr.status}
                  </span>
                </td>

                <td className="p-2">
                  {pr.status === "SUBMITTED" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(pr.id, "approve")}
                        className="btn-success text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => act(pr.id, "reject")}
                        className="btn-danger text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {pr.status === "APPROVED" &&
                    (pr.po_exists ? (
                      <button
                        className="text-blue-600 text-sm font-medium underline hover:text-blue-800"
                        onClick={() => setOpenPO(pr.po)}
                      >
                        PO Exists
                      </button>
                    ) : canCreatePO ? (
                      <button
                        className="btn-primary text-sm"
                        onClick={() => onCreatePO(pr)}
                      >
                        Create PO
                      </button>
                    ) : (
                      <span className="text-green-600 text-sm font-medium">
                        Ready for PO
                      </span>
                    ))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ITEMS MODAL — DITTO */}
      {openItems && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm">PR Items</h3>
              <button onClick={() => setOpenItems(null)}>✕</button>
            </div>

            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit</th>
                  <th className="text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {openItems.map((i, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{i.product_name}</td>
                    <td className="p-2">{i.unit}</td>
                    <td className="p-2 text-right">{i.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end">
              <button
                className="btn-secondary text-sm"
                onClick={() => setOpenItems(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {openPO && <PODetailsModal po={openPO} onClose={() => setOpenPO(null)} />}
    </>
  );
}
