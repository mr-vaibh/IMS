"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";

export default function WarehousesClient() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    apiFetchClient("/warehouses").then(setItems);
  }, []);

  async function add() {
    await apiFetchClient("/warehouses", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    location.reload();
  }

  async function del(id: string) {
    await apiFetchClient(`/warehouses/${id}`, { method: "DELETE" });
    location.reload();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Warehouses</h1>

      {/* Add warehouse */}
      <div className="flex gap-3">
        <input
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Warehouse name"
        />
        <button className="btn-primary px-5">Add</button>
      </div>

      {/* List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {items.map((w, i) => (
          <div
            key={w.id}
            className={`flex items-center justify-between px-5 py-4 ${
              i !== items.length - 1 ? "border-b border-slate-100" : ""
            }`}
          >
            <span className="font-medium text-slate-800">{w.name}</span>

            <button className="text-sm text-red-600 hover:text-red-700 hover:underline">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
