"use client";

import { apiFetchClient } from "@/lib/api.client";

export default function OrderActions({ order }: { order: any }) {
  if (order.status !== "PENDING") {
    return null;
  }

  async function approve() {
    await apiFetchClient(`/inventory/orders/${order.id}/approve`, {
      method: "POST",
    });
    window.location.reload();
  }

  async function reject() {
    await apiFetchClient(`/inventory/orders/${order.id}/reject`, {
      method: "POST",
    });
    window.location.reload();
  }

  return (
    <div className="flex gap-2">
      <button onClick={approve} className="btn-success">
        Approve
      </button>
      <button onClick={reject} className="btn-danger">
        Reject
      </button>
    </div>
  );
}
