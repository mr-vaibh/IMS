"use client";

import { useEffect, useState } from "react";
import { apiFetchClient, ApiError } from "@/lib/api.client";

import ProductSelect from "@/features/products/ProductSelect";
import WarehouseSelect from "@/features/warehouses/WarehouseSelect";

import ProductCreateModal from "@/features/products/ProductCreateModal";
import WarehouseCreateModal from "@/features/warehouses/WarehousesCreateModal";

import { getActiveCompany } from "@/lib/company";
import { toast } from "sonner";

export default function StockInClient() {
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState(0);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  useEffect(() => {
    setCompanyId(getActiveCompany());
  }, []);

  useEffect(() => {
    apiFetchClient("/products").then((res) => setProducts(res.items ?? res));
    apiFetchClient("/warehouses").then(setWarehouses);
  }, []);

  async function submit() {
    try {
      await apiFetchClient("/inventory/stock-in", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          warehouse_id: warehouseId,
          quantity,
        }),
      });

      toast.success("Stock added");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Something went wrong");
      }
    }
  }

  const canSubmit = productId && warehouseId && quantity > 0;

  return (
    <div className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Stock In</h1>

      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <WarehouseSelect
            warehouses={warehouses}
            value={warehouseId}
            onChange={setWarehouseId}
          />
        </div>

        <button
          onClick={() => setShowWarehouseModal(true)}
          className="border px-3 py-2"
        >
          + Add
        </button>
      </div>

      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <ProductSelect
            products={products}
            value={productId}
            onChange={setProductId}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowProductModal(true)}
          className="border px-3 py-2 whitespace-nowrap"
        >
          + Add
        </button>
      </div>

      <input
        type="number"
        className="border p-2 w-full"
        placeholder="Quantity"
        onChange={(e) => setQuantity(+e.target.value)}
      />

      <button
        className="border px-4 py-2"
        onClick={submit}
        disabled={!canSubmit}
      >
        Submit
      </button>

      {showProductModal && (
        <ProductCreateModal
          onClose={() => setShowProductModal(false)}
          onCreated={(p) => {
            setProducts((prev) => [...prev, p]);
            setProductId(p.id);
          }}
        />
      )}

      {showWarehouseModal && (
        <WarehouseCreateModal
          companyId={companyId ?? null} // from context or selection
          onClose={() => setShowWarehouseModal(false)}
          onCreated={(w) => {
            setWarehouses((prev) => [...prev, w]);
            setWarehouseId(w.id);
          }}
        />
      )}
    </div>
  );
}
