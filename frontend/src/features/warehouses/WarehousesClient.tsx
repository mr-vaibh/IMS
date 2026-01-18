"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";

export default function WarehousesClient() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");

  useEffect(() => {
    apiFetchClient("/warehouses").then(setItems);
  }, []);

  async function add() {
    if (!name.trim()) return;

    const newWarehouse = await apiFetchClient("/warehouses", {
      method: "POST",
      body: JSON.stringify({ name, location }),
    });

    setItems((prev) => [...prev, newWarehouse]);
    setName("");
    setLocation("");
  }

  function startEdit(w: any) {
    setEditingId(w.id);
    setEditName(w.name);
    setEditLocation(w.location || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditLocation("");
  }

  async function saveEdit(id: string) {
    const updated = await apiFetchClient(`/warehouses/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: editName,
        location: editLocation,
      }),
    });

    setItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updated } : w)),
    );

    cancelEdit();
  }

  async function del(id: string) {
    await apiFetchClient(`/warehouses/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((w) => w.id !== id));
  }

  const active = items.filter((w) => !w.deleted_at);
  const deleted = items.filter((w) => w.deleted_at);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Warehouses</h1>

      {/* Add warehouse */}
      <div className="flex gap-3">
        <input
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Warehouse name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <button className="btn-primary px-5" onClick={add}>
          Add
        </button>
      </div>

      {/* Active Warehouses */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {active.map((w, i) => (
          <div
            key={w.id}
            className={`px-5 py-4 ${
              i !== active.length - 1 ? "border-b border-slate-100" : ""
            }`}
          >
            {editingId === w.id ? (
              <div className="flex items-start gap-3">
                <input
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />

                <textarea
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                />

                <button
                  className="text-sm text-green-600 hover:underline"
                  onClick={() => saveEdit(w.id)}
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
                  <span className="font-medium text-slate-800">{w.name}</span>
                  {w.location && (
                    <span className="text-sm text-slate-500 whitespace-pre-line">{w.location}</span>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => startEdit(w)}
                  >
                    Edit
                  </button>

                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => del(w.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Deleted Warehouses */}
      {deleted.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 shadow-sm">
          <div className="px-5 py-3 text-sm font-semibold text-red-700">
            Deleted Warehouses
          </div>

          {deleted.map((w, i) => (
            <div
              key={w.id}
              className={`px-5 py-4 text-red-700 ${
                i !== deleted.length - 1 ? "border-b border-red-200" : ""
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{w.name}</span>
                {w.location && (
                  <span className="text-sm opacity-80">{w.location}</span>
                )}
                <span className="text-xs opacity-70 mt-1">
                  Deleted on {new Date(w.deleted_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
