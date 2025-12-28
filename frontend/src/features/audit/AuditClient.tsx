"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import AuditTable from "./AuditTable";
import { AuditLog } from "@/types/audits";

export default function AuditClient() {
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetchClient("/audit")
      .then((res) => {
        setAudits(res.items ?? res);
      })
      .finally(() => setLoading(false));
  }, []);

  console.log("AuditClient audits:", audits);

  if (loading) {
    return <div className="p-6">Loading audit trail…</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Audit Trail</h1>
      <AuditTable audits={audits} />
    </div>
  );
}
