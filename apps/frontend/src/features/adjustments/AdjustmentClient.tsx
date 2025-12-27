"use client";

import { useState } from "react";
import AdjustmentTable from "./AdjustmentTable";
import RequestAdjustmentModal from "./RequestAdjustmentModal";

export default function AdjustmentClient({
  initialItems,
}: {
  initialItems: any[];
}) {
  const [items, setItems] = useState(initialItems);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowModal(true)}
          className="border px-3 py-1"
        >
          Request Adjustment
        </button>
      </div>

      <AdjustmentTable adjustments={items} />

      {showModal && (
        <RequestAdjustmentModal
          onClose={() => setShowModal(false)}
          onCreated={(adj) =>
            setItems((prev) => [adj, ...prev])
          }
        />
      )}
    </>
  );
}
