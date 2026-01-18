"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";

export default function SuppliersClient() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    apiFetchClient("/suppliers").then(setItems);
  }, []);

  async function add() {
    if (!name.trim()) return;

    const newSupplier = await apiFetchClient("/suppliers", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    setItems((prev) => [...prev, newSupplier]);
    setName("");
  }

  async function del(id: string) {
    await apiFetchClient(`/suppliers/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Suppliers</h1>

      {/* Add supplier */}
      <div className="flex gap-3">
        <input
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Supplier name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn-primary px-5" onClick={add}>
          Add
        </button>
      </div>

      {/* List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {items.map((s, i) => (
          <div
            key={s.id}
            className={`flex items-center justify-between px-5 py-4 ${
              i !== items.length - 1 ? "border-b border-slate-100" : ""
            }`}
          >
            <span className="font-medium text-slate-800">{s.name}</span>

            <button
              className="text-sm text-red-600 hover:text-red-700 hover:underline"
              onClick={() => del(s.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
