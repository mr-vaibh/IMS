"use client";

import { useState } from "react";
import StockModal from "./StockModal";
import TransferModal from "./TransferModal";

interface Warehouse {
  id: string;
  name: string;
}

type ActionType = "IN" | "OUT" | "TRANSFER" | null;

export default function InventoryActions({
  productId,
  warehouseId,
  warehouses,
}: {
  productId: string;
  warehouseId: string;
  warehouses: Warehouse[];
}) {
  const [modal, setModal] = useState<ActionType>(null);

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setModal("IN")}
          className="px-2 py-1 text-sm border"
        >
          + In
        </button>

        <button
          onClick={() => setModal("OUT")}
          className="px-2 py-1 text-sm border"
        >
          − Out
        </button>

        <button
          onClick={() => setModal("TRANSFER")}
          className="px-2 py-1 text-sm border"
        >
          ⇄ Transfer
        </button>
      </div>

      {modal === "IN" && (
        <StockModal
          type="IN"
          productId={productId}
          warehouseId={warehouseId}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "OUT" && (
        <StockModal
          type="OUT"
          productId={productId}
          warehouseId={warehouseId}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "TRANSFER" && (
        <TransferModal
          productId={productId}
          fromWarehouseId={warehouseId}
          warehouses={warehouses}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
