"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import GRNTable from "@/features/inventory/grn/GRNTable";

export default function GRNPage() {
  const [items, setItems] = useState<any[]>([]);

  function load() {
    apiFetchClient("/inventory/grn")
      .then(res => setItems(res))
      .catch(() => setItems([]));
  }

  useEffect(load, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Goods Receipt Notes (GRN)</h1>

      <GRNTable grns={items} onRefresh={load} />
    </div>
  );
}
