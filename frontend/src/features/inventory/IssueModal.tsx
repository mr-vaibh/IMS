"use client";

import { useState } from "react";
import { apiFetchClient, ApiError } from "@/lib/api.client";
import { toast } from "sonner";

const ISSUE_TYPES = [
  { value: "PRODUCTION", label: "Used in Production" },
  { value: "SALES", label: "Used for Sale" },
  { value: "MARKETING", label: "Used for Marketing" },
  { value: "INTERNAL_USE", label: "Internal Use" },
  { value: "SAMPLE", label: "Sample / Demo" },
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
      await apiFetchClient("/inventory/issue", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          warehouse_id: warehouseId,
          quantity,
          issue_type: issueType,
          notes,
        }),
      });

      toast.success("Stock issued successfully");
      onClose();
      window.location.reload();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to issue stock");
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
          <option value="">Select purpose</option>
          {ISSUE_TYPES.map((t) => (
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
          placeholder="Notes / reference (optional)"
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="border px-3 py-1">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="px-3 py-1 bg-black text-white disabled:opacity-50"
          >
            Issue
          </button>
        </div>
      </div>
    </div>
  );
}
