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

interface Props {
  productId: string;
  warehouseId: string;
  onClose: () => void;
}

export default function IssueModal({ productId, warehouseId, onClose }: Props) {
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
    <div className="fixed inset-0 z-40 modal-backdrop flex items-center justify-center px-4">
      <div className="modal-panel bg-white w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] text-white">
          <h2 className="font-semibold">Issue Stock</h2>
          <button onClick={onClose} className="text-white opacity-90 hover:opacity-100">✕</button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-muted mb-1">Issue Type</label>
            <select
              className="border p-2 w-full"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
            >
              <option value="">Select issue type</option>
              {ISSUE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Quantity</label>
            <input
              type="number"
              className="border p-2 w-full"
              placeholder="Quantity"
              onChange={(e) => setQuantity(+e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Notes (optional)</label>
            <textarea
              className="border p-2 w-full"
              placeholder="Notes"
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit}
              className={`btn-warning ${!canSubmit ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
