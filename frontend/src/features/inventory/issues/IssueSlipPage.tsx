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
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Issue Slips</h1>

        <button
          className="btn-primary"
          onClick={() => setOpenCreate(true)}
        >
          Create Issue Slip
        </button>
      </div>

      <IssueSlipTable slips={slips} onRefresh={load} />

      {openCreate && (
        <IssueSlipCreateModal
          onClose={() => setOpenCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
