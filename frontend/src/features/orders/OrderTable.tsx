"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiFetchClient, ApiError } from "@/lib/api.client";

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  RECEIVED: "bg-blue-100 text-blue-700",
};

type OrderItem = {
  product: {
    name: string;
    sku: string;
    unit: string;
  };
  quantity: number;
  unit: string;
  rate: string;
  amount: string;
};

type Order = {
  id: string;
  warehouse_name: string;
  status: string;
  created_at: string;
  items: OrderItem[];
};

export default function OrderTable({ orders }: { orders: Order[] }) {
  const [openItems, setOpenItems] = useState<OrderItem[] | null>(null);
  const [loadingStockIn, setLoadingStockIn] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    try {
      await apiFetchClient(`/inventory/orders/${id}/${action}`, {
        method: "POST",
      });

      toast.success("Order updated successfully");
      window.location.reload();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Something went wrong");
      }
    }
  }

  async function stockInOrder(orderId: string) {
    try {
      setLoadingStockIn(orderId);
      const res = await apiFetchClient(
        `/inventory/orders/${orderId}/stock-in`,
        {
          method: "POST",
        }
      );
      toast.success("Stocked in successfully!");
      window.location.reload();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to stock in order");
      }
    } finally {
      setLoadingStockIn(null);
    }
  }

  return (
    <>
      <table className="table text-sm">
        <thead>
          <tr>
            <th className="p-2">Product</th>
            <th className="p-2">Warehouse</th>
            <th className="p-2">Created</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No records found
              </td>
            </tr>
          ) : (
            orders.map((a) => (
              <tr key={a.id} className="border-t">
                {/* PRODUCTS */}
                <td className="p-2">
                  {a.items.length === 0 ? (
                    <span className="text-gray-400 italic">No items</span>
                  ) : (
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => setOpenItems(a.items)}
                    >
                      {a.items.length} item
                      {a.items.length > 1 && "s"}
                    </button>
                  )}
                </td>

                <td className="p-2">{a.warehouse_name}</td>

                <td className="p-2 text-gray-600">
                  {new Date(a.created_at).toLocaleString()}
                </td>

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
                    <div className="flex gap-2">
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
                      <button
                        className="btn-success"
                        disabled={loadingStockIn === a.id}
                        onClick={() => stockInOrder(a.id)}
                      >
                        {loadingStockIn === a.id ? "Stocking..." : "Stock In"}
                      </button>
                    </div>
                  )}

                  {a.status === "RECEIVED" && (
                    <div className="flex gap-2">
                      <button
                        className="border rounded p-2"
                        onClick={() =>
                          window.open(
                            `/api/inventory/orders/${a.id}/received/pdf`,
                            "_blank"
                          )
                        }
                      >
                        Download Received Slip
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* PRODUCT ITEMS MODAL */}
      {openItems && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm">Order Items</h3>
              <button
                className="text-gray-500 hover:text-black"
                onClick={() => setOpenItems(null)}
              >
                ✕
              </button>
            </div>

            <table className="table text-sm">
              <thead>
                <tr>
                  <th className="p-2">Product</th>
                  <th className="p-2">SKU</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>

              <tbody>
                {openItems.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-xs text-gray-500">
                        Unit: {item.unit}
                      </div>
                    </td>

                    <td className="p-2 text-gray-600">{item.product.sku}</td>

                    <td className="p-2 text-right">{item.quantity}</td>

                    <td className="p-2 text-right">₹{item.rate}</td>

                    <td className="p-2 text-right font-medium">
                      ₹{item.amount}
                    </td>
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
    </>
  );
}
