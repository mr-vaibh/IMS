"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import StockReport from "@/components/reports/StockReport";
import MovementReport from "@/components/reports/MovementReport";
import ValuationReport from "@/components/reports/ValuationReport";
import LowStockReport from "@/components/reports/LowStockReport";
import AuditReport from "@/components/reports/AuditReport";
import OrderReport from "@/components/reports/OrderReport";
import AgingReport from "@/components/reports/AgingReport";
import MonthlyStockReport from "@/components/reports/MonthlyStockReport";

type ReportType =
  | "stock"
  | "monthly-stock"
  | "movement"
  | "valuation"
  | "low-stock"
  | "audit"
  | "order-items"
  | "aging";

export default function ReportsClient() {
  const [activeReport, setActiveReport] = useState<ReportType>("stock");

  const [stock, setStock] = useState<any[]>([]);
  const [movement, setMovement] = useState<any[]>([]);
  const [valuation, setValuation] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [aging, setAging] = useState<any[]>([]);

  const [productId, setProductId] = useState<string>("");
  const [month, setMonth] = useState<string>(""); // YYYY-MM

  const [monthlyStock, setMonthlyStock] = useState<any | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [lowStockThreshold, setLowStockThreshold] = useState(100);

  // Fetch data when report or filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    if (activeReport === "stock") {
      apiFetchClient(`/reports/stock?${params.toString()}`).then((res) =>
        setStock(res.items ?? res),
      );
    }

    if (activeReport === "movement") {
      apiFetchClient(`/reports/movement?${params.toString()}`).then((res) =>
        setMovement(res.items ?? res),
      );
    }

    if (activeReport === "valuation") {
      apiFetchClient("/reports/valuation").then((res) =>
        setValuation(res.items ?? res),
      );
    }

    if (activeReport === "low-stock") {
      apiFetchClient(`/reports/low-stock?threshold=${lowStockThreshold}`).then(
        (res) => setLowStock(res.items ?? res),
      );
    }

    if (activeReport === "audit") {
      apiFetchClient(`/reports/audit?${params.toString()}`).then((res) =>
        setAudit(res.items ?? res),
      );
    }

    if (activeReport === "order-items") {
      apiFetchClient(`/reports/orders?${params.toString()}`).then((res) =>
        setOrders(res.items ?? res),
      );
    }

    if (activeReport === "aging") {
      apiFetchClient("/reports/aging").then((res) =>
        setAging(res.items ?? res),
      );
    }
  }, [activeReport, startDate, endDate]);

  useEffect(() => {
    if (activeReport === "monthly-stock" && month) {
      apiFetchClient(`/reports/monthly-stock?month=${month}`).then((res) =>
        setMonthlyStock(res),
      );
    }
  }, [activeReport, month]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Inventory Reports</h1>

      {/* 🔹 Controls */}
      <div className="flex flex-wrap gap-4 items-end border p-4 rounded bg-gray-50">
        {/* Report selector */}
        <div className="flex flex-col text-sm">
          <label className="text-gray-600">Report</label>
          <select
            value={activeReport}
            onChange={(e) => setActiveReport(e.target.value as ReportType)}
            className="border rounded px-2 py-1"
          >
            <option value="stock">Current Stock</option>
            <option value="monthly-stock">Monthly Stock Tally</option>
            <option value="movement">Stock Movement</option>
            <option value="valuation">Inventory Valuation</option>
            <option value="low-stock">Low Stock / Reorder</option>
            <option value="audit">Audit Report</option>
            <option value="order-items">Order Items Report</option>
            <option value="aging">Inventory Aging</option>
          </select>
        </div>

        {/* Date filters */}
        {activeReport !== "monthly-stock" && (
          <>
            <div className="flex flex-col text-sm">
              <label className="text-gray-600">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded px-2 py-1"
                />
            </div>

            <div className="flex flex-col text-sm">
              <label className="text-gray-600">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded px-2 py-1"
                />
            </div>
          </>
        )}

        {activeReport === "monthly-stock" && (
          <div className="flex flex-col text-sm">
            <label className="text-gray-600">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
        )}
      </div>

      {/* 🔹 Active Report */}
      {activeReport === "stock" && <StockReport rows={stock} />}

      {activeReport === "movement" && (
        <MovementReport
          rows={movement}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {activeReport === "valuation" && <ValuationReport rows={valuation} />}

      {activeReport === "low-stock" && (
        <div className="flex flex-col text-sm">
          <label className="text-gray-600">Low stock threshold</label>
          <input
            type="number"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(Number(e.target.value))}
            className="border rounded px-2 py-1 w-24"
          />
        </div>
      )}

      {activeReport === "low-stock" && (
        <LowStockReport rows={lowStock} threshold={lowStockThreshold} />
      )}

      {activeReport === "audit" && (
        <AuditReport rows={audit} startDate={startDate} endDate={endDate} />
      )}

      {activeReport === "order-items" && (
        <OrderReport rows={orders} startDate={startDate} endDate={endDate} />
      )}

      {activeReport === "aging" && <AgingReport rows={aging} />}

      {activeReport === "monthly-stock" && monthlyStock && (
        <MonthlyStockReport data={monthlyStock} />
      )}
    </div>
  );
}
