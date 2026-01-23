"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import POCreateGRNModal from "@/features/inventory/po/POCreateGRNModal";
import POTable from "@/features/inventory/po/POTable";

export default function POPage() {
  const [pos, setPOs] = useState<any[]>([]);
  const [grnPO, setGrnPO] = useState<any | null>(null);

  function load() {
    apiFetchClient("/inventory/po")
      .then((res) => setPOs(res.items ?? res))
      .catch(() => setPOs([]));
  }

  useEffect(load, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Purchase Orders</h1>

      <POTable
        orders={pos}
        onRefresh={load}
        onCreateGRN={(po) => setGrnPO(po)}
      />

      {grnPO && (
        <POCreateGRNModal
          po={grnPO}
          onClose={() => setGrnPO(null)}
          onCreated={load}
        />
      )}
    </div>
  );
}
