"use client";

import { toast } from "sonner";
import { apiFetchClient } from "@/lib/api.client";
import { useMemo, useState } from "react";

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function GRNTable({
  grns,
  onRefresh,
}: {
  grns: any[];
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");

  async function approve(id: string) {
    try {
      await apiFetchClient(`/inventory/grn/${id}/approve`, { method: "POST" });
      toast.success("GRN approved & stock updated");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  /** Filter GRNs by ID */
  const filteredGRNs = useMemo(() => {
    if (!search.trim()) return grns;
    return grns.filter((g) =>
      String(g.id).toLowerCase().includes(search.toLowerCase()),
    );
  }, [grns, search]);

  return (
    <>
      {/* SEARCH BAR */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search by GRN ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm w-64"
        />
        {search && (
          <button
            className="text-xs text-gray-500 hover:underline"
            onClick={() => setSearch("")}
          >
            Clear
          </button>
        )}
      </div>

      <table className="table text-sm">
        <thead>
          <tr>
            <th className="p-2">GRN ID</th>
            <th className="p-2">Warehouse</th>
            <th className="p-2">Received By</th>
            <th className="p-2">Created</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredGRNs.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                No GRNs found
              </td>
            </tr>
          ) : (
            filteredGRNs.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="p-2 font-mono">{g.id.slice(0, 8)}</td>
                <td className="p-2">{g.warehouse}</td>
                <td className="p-2">{g.received_by}</td>
                <td className="p-2 text-gray-600">
                  {new Date(g.created_at).toLocaleString()}
                </td>

                <td className="p-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      statusStyles[g.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {g.status}
                  </span>
                </td>

                <td className="p-2 flex gap-2">
                  {g.status === "PENDING" && (
                    <button
                      onClick={() => approve(g.id)}
                      className="btn-success text-sm"
                    >
                      Stock In
                    </button>
                  )}

                  <button
                    className="border rounded p-2 text-sm"
                    onClick={() =>
                      window.open(
                        `/api/inventory/grn/${g.id}/pdf`,
                        "_blank",
                      )
                    }
                  >
                    GRN PDF
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
