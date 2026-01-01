"use client";

import { useState } from "react";
import StockModal from "./StockModal";
import TransferModal from "./TransferModal";
import IssueModal from "./IssueModal";

interface Warehouse {
  id: string;
  name: string;
}

type ActionType = "IN" | "OUT" | "TRANSFER" | "ISSUE" | null;

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
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setModal("ISSUE")}
          className="btn-ghost text-sm"
        >
          📦 Issue
        </button>
        <button
          onClick={() => setModal("TRANSFER")}
          className="btn-ghost text-sm"
        >
          ⇄ Transfer
        </button>
        <button
          onClick={() => setModal("IN")}
          className="btn-primary text-sm"
        >
          + In
        </button>

        <button
          onClick={() => setModal("OUT")}
          className="btn-danger text-sm"
        >
          − Out
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
          onClose={() => setModal(null)}
        />
      )}

      {modal === "ISSUE" && (
        <IssueModal
          productId={productId}
          warehouseId={warehouseId}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
