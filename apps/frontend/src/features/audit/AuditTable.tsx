"use client";

import { AuditLog } from "@/types/audits";

export default function AuditTable({ audits }: { audits: AuditLog[] }) {
  return (
    <table className="w-full border border-gray-300 text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Time</th>
          <th className="p-2 text-left">Entity</th>
          <th className="p-2 text-left">Action</th>
          <th className="p-2 text-left">Actor</th>
          <th className="p-2 text-left">Details</th>
        </tr>
      </thead>
      <tbody>
        {audits.map((a) => (
          <tr key={a.id} className="border-t">
            <td className="p-2 whitespace-nowrap">
              {new Date(a.created_at).toLocaleString()}
            </td>
            <td className="p-2">
              {a.entity} <span className="text-gray-500">({a.entity_id})</span>
            </td>
            <td className="p-2 font-medium">{a.action}</td>
            <td className="p-2">{a.actor_id ?? "System"}</td>
            <td className="p-2">
              <details className="cursor-pointer">
                <summary className="underline text-blue-600">View</summary>
                <pre className="mt-2 p-2 bg-gray-50 border text-xs overflow-auto max-h-64">
{JSON.stringify(
  { old: a.old_data, new: a.new_data },
  null,
  2
)}
                </pre>
              </details>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
