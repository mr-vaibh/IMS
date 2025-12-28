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
    <div>
      <h1 className="text-xl mb-4">Warehouses</h1>

      <div className="flex gap-2 mb-4">
        <input className="border p-2" placeholder="Name"
          onChange={e => setName(e.target.value)} />
        <button onClick={add} className="border px-3">Add</button>
      </div>

      {items.map(w => (
        <div key={w.id} className="flex justify-between border-b py-2">
          {w.name}
          <button onClick={() => del(w.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
