"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import IssueSlipTable from "@/features/inventory/issues/IssueSlipTable";
import IssueSlipCreateModal from "@/features/inventory/issues/IssueSlipCreateModal";

export default function IssueSlipPage() {
  const [slips, setSlips] = useState<any[]>([]);
  const [openCreate, setOpenCreate] = useState(false);

  function load() {
    apiFetchClient("/inventory/issue-slips")
      .then(setSlips)
      .catch(() => setSlips([]));
  }

  useEffect(load, []);

  return (
    <div className="p-6 space-y-4">
      {/* HEADER + CREATE BUTTON */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Issue Slips</h1>

        <button
          onClick={() => setOpenCreate(true)}
          className="btn-primary"
        >
          + Create Issue Slip
        </button>
      </div>

      {/* TABLE */}
      <IssueSlipTable slips={slips} onRefresh={load} />

      {/* CREATE MODAL */}
      {openCreate && (
        <IssueSlipCreateModal
          onClose={() => setOpenCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
