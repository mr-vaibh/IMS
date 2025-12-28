"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import WarehouseSelect from "@/features/warehouses/WarehouseSelect";
import ScanBufferTable from "./ScanBufferTable";
import BarcodeScanner from "./BarcodeScanner";

interface BufferItem {
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
}

export default function ScanStockInClient() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [buffer, setBuffer] = useState<BufferItem[]>([]);
  const [skuInput, setSkuInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [scanMode, setScanMode] = useState<"manual" | "camera">("manual");
  const [lastScan, setLastScan] = useState<string | null>(null);

  useEffect(() => {
    apiFetchClient("/warehouses").then(setWarehouses);
  }, []);

  async function addBySKU(sku: string) {
    if (!sku) return;

    try {
      const res = await apiFetchClient(`/products?q=${sku}`);

      const product = res.items?.[0];
      if (!product) {
        alert("Product not found");
        return;
      }

      setBuffer((prev) => {
        const existing = prev.find((p) => p.product_id === product.id);
        if (existing) {
          return prev.map((p) =>
            p.product_id === product.id ? { ...p, quantity: p.quantity + 1 } : p
          );
        }

        return [
          ...prev,
          {
            product_id: product.id,
            sku: product.sku,
            name: product.name,
            quantity: 1,
          },
        ];
      });
    } finally {
      setSkuInput("");
    }
  }

  async function submit() {
    if (!warehouseId || buffer.length === 0) return;

    setLoading(true);
    try {
      await apiFetchClient("/inventory/stock-in/bulk", {
        method: "POST",
        body: JSON.stringify({
          warehouse_id: warehouseId,
          reference: "BARCODE_SCAN",
          items: buffer.map((b) => ({
            product_id: b.product_id,
            quantity: b.quantity,
          })),
        }),
      });

      setBuffer([]);
      alert("Stock added successfully");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">Scan Stock In</h1>

      <div className="flex gap-2">
        <button
          className={`border px-3 py-1 ${
            scanMode === "manual" ? "bg-black text-white" : ""
          }`}
          onClick={() => setScanMode("manual")}
        >
          Manual / Scanner
        </button>

        <button
          className={`border px-3 py-1 ${
            scanMode === "camera" ? "bg-black text-white" : ""
          }`}
          onClick={() => setScanMode("camera")}
        >
          Camera
        </button>
      </div>

      <WarehouseSelect
        warehouses={warehouses}
        value={warehouseId}
        onChange={setWarehouseId}
      />

      {scanMode === "manual" && (
        <input
          className="border p-2 w-full"
          placeholder="Scan or enter SKU and press Enter"
          value={skuInput}
          onChange={(e) => setSkuInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addBySKU(skuInput);
            }
          }}
          disabled={!warehouseId}
        />
      )}

      {scanMode === "camera" && warehouseId && (
        <BarcodeScanner
          onScan={(code) => addBySKU(code)}
          onError={(msg) => alert(msg)}
        />
      )}

      {lastScan && (
        <div className="text-green-700 text-sm">Scanned: {lastScan}</div>
      )}

      <ScanBufferTable items={buffer} onChange={setBuffer} />

      <button
        className="bg-black text-white px-4 py-2 disabled:opacity-50"
        disabled={!warehouseId || buffer.length === 0 || loading}
        onClick={submit}
      >
        {loading ? "Saving..." : "Submit Stock"}
      </button>
    </div>
  );
}
