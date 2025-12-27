"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import AdjustmentTable from "@/features/adjustments/AdjustmentTable";
import RequestAdjustmentModal from "@/features/adjustments/RequestAdjustmentModal";

export default function AdjustmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  function load() {
    apiFetchClient("/inventory/adjustments")
      .then((res) => setItems(res.items ?? []))
      .catch(() => setItems([]));
  }

  useEffect(load, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          Inventory Adjustments
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="btn-ghost border px-3 py-1"
        >
          Request Adjustment
        </button>
      </div>

      <AdjustmentTable adjustments={items} />

      {showModal && (
        <RequestAdjustmentModal
          onClose={() => setShowModal(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
