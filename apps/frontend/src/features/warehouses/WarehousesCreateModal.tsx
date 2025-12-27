"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { apiFetchClient } from "@/lib/api.client";

export default function WarehouseCreateModal({
  companyId,
  onClose,
  onCreated,
}: {
  companyId: string | null;
  onClose: () => void;
  onCreated: (warehouse: { id: string; name: string; code: string }) => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");

    try {
      const res = await apiFetchClient("/warehouses", {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId,
          name,
          code,
        }),
      });

      onCreated(res);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Add Warehouse" onClose={onClose}>
      <div className="space-y-3">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input className="border p-2 w-full" placeholder="Warehouse name" value={name} onChange={e => setName(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Code (WH-001)" value={code} onChange={e => setCode(e.target.value)} />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="border px-3 py-1">Cancel</button>
          <button onClick={submit} disabled={loading} className="bg-black text-white px-3 py-1">
            {loading ? "Saving..." : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
