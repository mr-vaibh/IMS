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

export default function CreateIssueSlipModal({
  productId,
  warehouseId,
  onClose,
  onCreated,
}: {
  productId: string;
  warehouseId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [quantity, setQuantity] = useState<number | "">("");
  const [issueType, setIssueType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = quantity !== "" && quantity > 0 && issueType;

  async function submit() {
    if (!isValid) return;

    setLoading(true);
    try {
      await apiFetchClient("/inventory/issue-slips", {
        method: "POST",
        body: JSON.stringify({
          warehouse_id: warehouseId,
          items: [
            {
              product_id: productId,
              quantity,
            },
          ],
          issue_type: issueType,
          notes,
        }),
      });

      toast.success("Issue slip created (pending approval)");
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to create issue slip");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-lg px-4 py-3 text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)]">
          <h2 className="text-sm font-semibold">Create Issue Slip</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-4">
            <div className="flex flex-col">
                <label className="block text-sm font-medium mb-1">Issue Type</label>
                <select
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
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

            <div className="flex flex-col">
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                type="number"
                min={1}
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                value={quantity}
                onChange={(e) =>
                    setQuantity(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Enter quantity"
                />
            </div>

            <div className="flex flex-col">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remarks"
                />
            </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!isValid || loading}
              className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Create Issue Slip"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
