"use client";

import { apiFetchClient } from "@/lib/api.client";

export default function AdjustmentActions({ adjustment }: { adjustment: any }) {
  if (adjustment.status !== "PENDING") {
    return null;
  }

  async function approve() {
    await apiFetchClient(`/inventory/adjustments/${adjustment.id}/approve`, {
      method: "POST",
    });
    window.location.reload();
  }

  async function reject() {
    await apiFetchClient(`/inventory/adjustments/${adjustment.id}/reject`, {
      method: "POST",
    });
    window.location.reload();
  }

  return (
    <div className="flex gap-2">
      <button onClick={approve} className="px-2 py-1 border text-green-600">
        Approve
      </button>
      <button onClick={reject} className="px-2 py-1 border text-red-600">
        Reject
      </button>
    </div>
  );
}
