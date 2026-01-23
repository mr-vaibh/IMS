"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import PRTable from "@/features/inventory/pr/PRTable";
import PRCreateModal from "@/features/inventory/pr/PRCreateModal";
import POCreateFromPRModal from "@/features/inventory/pr/POCreateFromPRModal";
import { fetchPRs } from "@/features/inventory/pr/api";
import { useAuth } from "@/lib/auth-context";


export default function PRPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [poPR, setPoPR] = useState<any | null>(null);

  const { permissions } = useAuth();
  
  function load() {
    fetchPRs()
      .then(res => setItems(res.items ?? res))
      .catch(() => setItems([]));
  }

  useEffect(load, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          Purchase Requisitions
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="btn-ghost border px-3 py-1"
        >
          Create PR
        </button>
      </div>

      <PRTable
        prs={items}
        onRefresh={load}
        onCreatePO={(pr) => setPoPR(pr)}
        permissions={permissions}
      />

      {showModal && (
        <PRCreateModal
          open
          onClose={() => setShowModal(false)}
          onCreated={load}
        />
      )}

      {poPR && (
        <POCreateFromPRModal
          pr={poPR}
          onClose={() => setPoPR(null)}
          onCreated={() => {
            setPoPR(null);
            load();
          }}
        />
      )}
    </div>
  );
}
