"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";

export default function SuppliersClient() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  useEffect(() => {
    apiFetchClient("/suppliers").then(setItems);
  }, []);

  async function add() {
    if (!name.trim()) return;

    const newSupplier = await apiFetchClient("/suppliers", {
      method: "POST",
      body: JSON.stringify({ name, address }),
    });

    setItems((prev) => [...prev, newSupplier]);
    setName("");
    setAddress("");
  }

  function startEdit(s: any) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditAddress(s.address || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditAddress("");
  }

  async function saveEdit(id: string) {
    const updated = await apiFetchClient(`/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: editName,
        address: editAddress,
      }),
    });

    setItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s)),
    );

    cancelEdit();
  }

  async function del(id: string) {
    await apiFetchClient(`/suppliers/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((s) => s.id !== id));
  }

  const active = items.filter((s) => !s.deleted_at);
  const deleted = items.filter((s) => s.deleted_at);

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

        <textarea
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2"
          placeholder="Address & Details"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <button className="btn-primary px-5" onClick={add}>
          Add
        </button>
      </div>

      {/* Active Suppliers */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {active.map((s, i) => (
          <div
            key={s.id}
            className={`px-5 py-4 ${
              i !== active.length - 1 ? "border-b border-slate-100" : ""
            }`}
          >
            {editingId === s.id ? (
              <div className="flex items-start gap-3">
                <input
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />

                <textarea
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                />

                <button
                  className="text-sm text-green-600 hover:underline"
                  onClick={() => saveEdit(s.id)}
                >
                  Save
                </button>

                <button
                  className="text-sm text-slate-500 hover:underline"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800">{s.name}</span>
                  {s.address && (
                    <span className="text-sm text-slate-500 whitespace-pre-line">
                      {s.address}
                    </span>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => startEdit(s)}
                  >
                    Edit
                  </button>

                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => del(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Deleted Suppliers */}
      {deleted.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 shadow-sm">
          <div className="px-5 py-3 text-sm font-semibold text-red-700">
            Deleted Suppliers
          </div>

          {deleted.map((s, i) => (
            <div
              key={s.id}
              className={`px-5 py-4 text-red-700 ${
                i !== deleted.length - 1 ? "border-b border-red-200" : ""
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{s.name}</span>
                {s.address && (
                  <span className="text-sm opacity-80">{s.address}</span>
                )}
                <span className="text-xs opacity-70 mt-1">
                  Deleted on {new Date(s.deleted_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
