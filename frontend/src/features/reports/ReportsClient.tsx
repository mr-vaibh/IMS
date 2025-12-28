"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import StockReport from "./StockReport";
import MovementReport from "./MovementReport";

export default function ReportsClient() {
  const [stock, setStock] = useState<any[]>([]);
  const [movement, setMovement] = useState<any[]>([]);

  useEffect(() => {
    apiFetchClient("/reports/stock").then(res =>
      setStock(res.items ?? res)
    );

    apiFetchClient("/reports/movement?limit=50&offset=0").then(res =>
      setMovement(res.items ?? res)
    );
  }, []);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-xl font-semibold">Inventory Reports</h1>

      <StockReport rows={stock} />
      <MovementReport rows={movement} />
    </div>
  );
}
