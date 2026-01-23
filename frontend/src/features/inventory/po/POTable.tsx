"use client";

import { toast } from "sonner";
import { apiFetchClient } from "@/lib/api.client";
import { useState, useMemo } from "react";
import GRNDetailsModal from "@/features/inventory/po/GRNDetailsModal";

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  RECEIVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function POTable({
  orders,
  onRefresh,
  onCreateGRN,
}: {
  orders: any[];
  onRefresh: () => void;
  onCreateGRN: (po: any) => void;
}) {
  const [openItems, setOpenItems] = useState<any[] | null>(null);
  const [openGRN, setOpenGRN] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  async function act(id: string, action: "approve" | "reject") {
    try {
      await apiFetchClient(`/inventory/po/${id}/${action}`, { method: "POST" });
      toast.success("PO updated");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  /** Filter orders by PO id */
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    return orders.filter((po) =>
      String(po.id).toLowerCase().includes(search.toLowerCase()),
    );
  }, [orders, search]);

  return (
    <>
      {/* SEARCH BAR */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search by PO ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm w-64"
        />
        {search && (
          <button
            className="text-xs text-gray-500 hover:underline"
            onClick={() => setSearch("")}
          >
            Clear
          </button>
        )}
      </div>

      <table className="table text-sm">
        <thead>
          <tr>
            <th>Products</th>
            <th>Supplier</th>
            <th>Warehouse</th>
            <th>Created</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                No purchase orders
              </td>
            </tr>
          ) : (
            filteredOrders.map((po) => (
              <tr key={po.id} className="border-t">
                <td>
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => setOpenItems(po.items)}
                  >
                    {po.items?.length ?? 0} item
                    {po.items?.length > 1 && "s"}
                  </button>
                </td>

                <td>{po.supplier_name}</td>
                <td>{po.warehouse_name}</td>
                <td className="text-gray-600">
                  {new Date(po.created_at).toLocaleString()}
                </td>

                <td>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      statusStyles[po.status]
                    }`}
                  >
                    {po.status}
                  </span>
                </td>

                <td>
                  {po.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        className="btn-success text-sm"
                        onClick={() => act(po.id, "approve")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-danger text-sm"
                        onClick={() => act(po.id, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {po.status === "APPROVED" &&
                    (po.grn_exists ? (
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 underline text-sm font-medium hover:text-blue-800"
                          onClick={() => setOpenGRN(po.grn)}
                        >
                          GRN Exists
                        </button>

                        <button
                          className="border rounded px-2 py-1"
                          onClick={() =>
                            window.open(
                              `/api/inventory/po/${po.id}/pdf`,
                              "_blank",
                            )
                          }
                        >
                          PO PDF
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-primary text-sm"
                        onClick={() => onCreateGRN(po)}
                      >
                        Create GRN
                      </button>
                    ))}

                  {po.status === "RECEIVED" && (
                    <div className="flex gap-2">
                      <button
                        className="text-blue-600 underline text-sm font-medium hover:text-blue-800"
                        onClick={() => setOpenGRN(po.grn)}
                      >
                        GRN Exists
                      </button>
                      
                      <button
                        className="border rounded px-2 py-1"
                        onClick={() =>
                          window.open(
                            `/api/inventory/po/${po.id}/pdf`,
                            "_blank",
                          )
                        }
                      >
                        PO PDF
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ITEMS MODAL */}
      {openItems && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-4">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-sm">PO Items</h3>
              <button onClick={() => setOpenItems(null)}>✕</button>
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
                {openItems.map((i: any, idx: number) => (
                  <tr key={`${i.product_name}-${idx}`} className="border-t">
                    <td>{i.product_name}</td>
                    <td>{i.unit}</td>
                    <td className="text-right">{i.quantity}</td>
                    <td className="text-right">₹ {i.rate}</td>
                    <td className="text-right">₹ {i.amount}</td>
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

      {openGRN && (
        <GRNDetailsModal grn={openGRN} onClose={() => setOpenGRN(null)} />
      )}
    </>
  );
}
