"use client";

import { useEffect, useState } from "react";
import InventoryTable from "./InventoryTable";
import { apiFetchClient } from "@/lib/api.client";

export default function InventoryClient() {
  const [rows, setRows] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const inventory = await apiFetchClient("/inventory");
        const warehouses = await apiFetchClient("/warehouses");

        setRows(inventory.items);
        setWarehouses(warehouses);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p className="p-6">Loading inventory…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Inventory</h1>
      <InventoryTable rows={rows} warehouses={warehouses} />
    </div>
  );
}
