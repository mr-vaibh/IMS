"use client";

import { useState } from "react";
import { AuditLog } from "@/types/audits";
import AuditDiffModal from "./AuditDiffModal";

export default function AuditTable({ audits }: { audits: AuditLog[] }) {
  const [selected, setSelected] = useState<AuditLog | null>(null);

  return (
    <>
      <table className="table text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">Entity</th>
            <th className="p-2 text-left">Action</th>
            <th className="p-2 text-left">User</th>
            <th className="p-2 text-left">Details</th>
          </tr>
        </thead>
        <tbody>
          {audits.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="p-2 whitespace-nowrap">
                {new Date(a.time).toLocaleString()}
              </td>

              <td className="p-2">
                {a.entity}{" "}
                <span className="text-gray-500">
                  ({a.entity_id})
                </span>
              </td>

              <td className="p-2 font-medium">{a.action}</td>

              <td className="p-2">
                {a.actor?.username ?? "System"}
              </td>

              <td className="p-2">
                <button
                  onClick={() => setSelected(a)}
                  className="btn-ghost text-sm"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AuditDiffModal
        open={!!selected}
        onClose={() => setSelected(null)}
        oldData={selected?.old_data}
        newData={selected?.new_data}
      />
    </>
  );
}
