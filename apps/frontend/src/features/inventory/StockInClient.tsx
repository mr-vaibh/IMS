"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";

import ProductSelect from "@/features/products/ProductSelect.client";
import WarehouseSelect from "@/features/warehouses/WarehouseSelect.client";

export default function StockInClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    apiFetchClient("/products").then(res => setProducts(res.items ?? res));
    apiFetchClient("/warehouses").then(setWarehouses);
  }, []);

  async function submit() {
    await apiFetchClient("/inventory/stock-in", {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity,
      }),
    });

    alert("Stock added");
  }

  const canSubmit = productId && warehouseId && quantity > 0;

  return (
    <div className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Stock In</h1>

      <ProductSelect
        products={products}
        value={productId}
        onChange={setProductId}
      />

      <WarehouseSelect
        warehouses={warehouses}
        value={warehouseId}
        onChange={setWarehouseId}
      />


      <input
        type="number"
        className="border p-2 w-full"
        placeholder="Quantity"
        onChange={e => setQuantity(+e.target.value)}
        disabled={!canSubmit}
      />

      <button className="border px-4 py-2" onClick={submit}>
        Submit
      </button>
    </div>
  );
}
