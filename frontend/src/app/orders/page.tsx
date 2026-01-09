"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import OrderTable from "@/features/orders/OrderTable";
import RequestOrderModal from "@/features/orders/RequestOrderModal";

export default function OrdersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  function load() {
    apiFetchClient("/inventory/orders")
      .then((res) => setItems(res.items ?? []))
      .catch(() => setItems([]));
  }

  useEffect(load, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          Inventory Orders
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="btn-ghost border px-3 py-1"
        >
          Request Order
        </button>
      </div>

      <OrderTable orders={items} />

      {showModal && (
        <RequestOrderModal
          onClose={() => setShowModal(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
