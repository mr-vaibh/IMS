"use client";

import { useState } from "react";
import { apiFetchClient, ApiError } from "@/lib/api.client";
import { toast } from "sonner";

export default function SupplierCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (supplier: any) => void;
}) {
  const [name, setName] = useState("");

  async function submit() {
    try {
      const supplier = await apiFetchClient("/suppliers", {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      onCreated(supplier);
      toast.success("Supplier created");
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to create supplier"
      );
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-96 space-y-4">
        <h2 className="font-semibold">Add Supplier</h2>

        <input
          className="border p-2 w-full rounded"
          placeholder="Supplier name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={submit} className="btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
