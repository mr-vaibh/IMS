"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";

export default function ProductsClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");

  useEffect(() => {
    apiFetchClient("/products").then(setProducts);
  }, []);

  async function add() {
    await apiFetchClient("/products", {
      method: "POST",
      body: JSON.stringify({ name, sku }),
    });
    location.reload();
  }

  async function del(id: string) {
    await apiFetchClient(`/products/${id}`, { method: "DELETE" });
    location.reload();
  }

  return (
    <div>
      <h1 className="text-xl mb-4">Products</h1>

      <div className="flex gap-2 mb-4">
        <input className="border p-2" placeholder="Name" onChange={e => setName(e.target.value)} />
        <input className="border p-2" placeholder="SKU" onChange={e => setSku(e.target.value)} />
        <button className="border px-3" onClick={add}>Add</button>
      </div>

      <ul>
        {products.map(p => (
          <li key={p.id} className="flex justify-between border-b py-2">
            {p.name} ({p.sku})
            <button onClick={() => del(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
