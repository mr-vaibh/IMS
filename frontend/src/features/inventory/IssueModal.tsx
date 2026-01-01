"use client";

import { useState } from "react";
import { apiFetchClient, ApiError } from "@/lib/api.client";
import { toast } from "sonner";

const ISSUE_TYPES = [
  { value: "PRODUCTION", label: "Production" },
  { value: "INTERNAL", label: "Internal Use" },
  { value: "MARKETING", label: "Marketing / Samples" },
  { value: "LOSS", label: "Loss / Damage" },
  { value: "OTHER", label: "Other" },
];

export default function IssueModal({
  productId,
  warehouseId,
  onClose,
}: {
  productId: string;
  warehouseId: string;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(0);
  const [issueType, setIssueType] = useState("");
  const [notes, setNotes] = useState("");

  async function submit() {
    try {
      await apiFetchClient("/inventory/issues/create", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          warehouse_id: warehouseId,
          quantity,
          issue_type: issueType,
          notes,
        }),
      });

      toast.success("Issue request created");
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to create issue");
      }
    }
  }

  const canSubmit = quantity > 0 && issueType;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-96 space-y-3">
        <h2 className="font-semibold">Issue Stock</h2>

        <select
          className="border p-2 w-full"
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
        >
          <option value="">Select issue type</option>
          {ISSUE_TYPES.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Quantity"
          onChange={(e) => setQuantity(+e.target.value)}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Notes (optional)"
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="btn-warning disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
