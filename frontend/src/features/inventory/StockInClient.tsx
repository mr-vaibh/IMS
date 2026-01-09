"use client";

import { useEffect, useState } from "react";
import { apiFetchClient, ApiError } from "@/lib/api.client";

import ProductSelect from "@/features/products/ProductSelect";
import WarehouseSelect from "@/features/warehouses/WarehouseSelect";
import SupplierSelect from "@/features/suppliers/SupplierSelect";

import ProductCreateModal from "@/features/products/ProductCreateModal";
import WarehouseCreateModal from "@/features/warehouses/WarehousesCreateModal";
import SupplierCreateModal from "@/features/suppliers/SupplierCreateModal";

import { getActiveCompany } from "@/lib/company";
import { toast } from "sonner";

export default function StockInClient() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<{ company_name: string } | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState(0);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  useEffect(() => {
    setCompanyId(getActiveCompany());
  }, []);

  useEffect(() => {
    apiFetchClient("/suppliers").then(setSuppliers);
  }, []);

  useEffect(() => {
    apiFetchClient("/me")
      .then(setCompany)
      .catch(() => setCompany(null));
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
          supplier_id: supplierId || null,
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
    <div className="card p-6 max-w-md space-y-4">
      <div className="flex flex-col items-center justify-between">
        <h1 className="text-2xl font-semibold">Stock Inventory Manager</h1>
        {company && (
          <div className="text-sm text-muted">
            <span className="font-bold">{company.company_name}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm text-muted mb-1">Warehouse</label>
          <WarehouseSelect
            warehouses={warehouses}
            value={warehouseId}
            onChange={setWarehouseId}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowWarehouseModal(true)}
          className="btn-ghost px-3 py-2 whitespace-nowrap"
        >
          + Add
        </button>
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm text-muted mb-1">Product</label>
          <ProductSelect
            products={products}
            value={productId}
            onChange={setProductId}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowProductModal(true)}
          className="btn-ghost px-3 py-2 whitespace-nowrap"
        >
          + Add
        </button>
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm text-muted mb-1">
            Supplier (optional)
          </label>
          <SupplierSelect
            suppliers={suppliers}
            value={supplierId}
            onChange={setSupplierId}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowSupplierModal(true)}
          className="btn-ghost px-3 py-2 whitespace-nowrap"
        >
          + Add
        </button>
      </div>

      <div>
        <label className="block text-sm text-muted mb-1">Quantity</label>
        <input
          type="number"
          className="border p-2 w-full rounded"
          placeholder="Quantity"
          onChange={(e) => setQuantity(+e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className={`btn-primary ${
            !canSubmit ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          Add Stock
        </button>
      </div>

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

      {showSupplierModal && (
        <SupplierCreateModal
          onClose={() => setShowSupplierModal(false)}
          onCreated={(s) => {
            setSuppliers((prev) => [...prev, s]);
            setSupplierId(s.id);
          }}
        />
      )}
    </div>
  );
}
