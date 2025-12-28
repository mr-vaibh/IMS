"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { apiFetchClient } from "@/lib/api.client";

export default function ProductCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (product: { id: string; name: string; sku: string }) => void;
}) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState(""); // default to "piece"
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");

    try {
      const res = await apiFetchClient("/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          sku: sku || undefined,
          price,
          unit,
          description,
        }),
      });

      onCreated(res);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Add Product" onClose={onClose}>
      <div className="space-y-3">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input className="border p-2 w-full" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="border p-2 w-full uppercase" placeholder="SKU (optional)" value={sku} onChange={e => setSku(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} />

        <select
          className="border p-2 w-full"
          value={unit}
          onChange={e => setUnit(e.target.value)}
        >
          <option value="" disabled>
            Select unit
          </option>
          <option value="pcs">Piece</option>
          <option value="kg">Kg</option>
          <option value="ltr">Litre</option>
          <option value="gram">Gram</option>
          <option value="millilitre">Millilitre</option>
          <option value="others">Others</option>
        </select>


        <textarea className="border p-2 w-full" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="border px-3 py-1">Cancel</button>
          <button onClick={submit} disabled={loading} className="bg-black text-white px-3 py-1">
            {loading ? "Saving..." : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
