"use client";

import { apiFetchClient } from "@/lib/api.client";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ISSUED: "bg-blue-100 text-blue-700",
};

export default function IssueSlipTable({
  slips,
  onRefresh,
}: {
  slips: any[];
  onRefresh: () => void;
}) {
  async function act(id: string, action: string) {
    try {
      await apiFetchClient(`/inventory/issue-slips/${id}/${action}`, {
        method: "POST",
      });
      toast.success("Updated");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function execute(id: string) {
    if (
      !confirm(
        "This will deduct stock and generate Issue Pass.\n\nDo you want to continue?",
      )
    ) {
      return;
    }

    try {
      await apiFetchClient(`/inventory/issue/${id}/execute`, {
        method: "POST",
      });

      toast.success("Issue Pass generated & stock updated");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <table className="table text-sm">
      <thead>
        <tr>
          <th>ID</th>
          <th>Warehouse</th>
          <th>Requested By</th>
          <th>Created</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {slips.length === 0 ? (
          <tr>
            <td colSpan={6} className="p-4 text-center text-gray-500">
              No issue slips
            </td>
          </tr>
        ) : (
          slips.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="font-mono">{s.id.slice(0, 8)}</td>
              <td>{s.warehouse}</td>
              <td>{s.requested_by}</td>
              <td>{new Date(s.created_at).toLocaleString()}</td>

              <td>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[s.status]}`}
                >
                  {s.status}
                </span>
              </td>

              <td className="space-x-2">
                {s.status === "PENDING" && (
                  <>
                    <button
                      className="btn-success text-sm"
                      onClick={() => act(s.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-danger text-sm"
                      onClick={() => act(s.id, "reject")}
                    >
                      Reject
                    </button>
                  </>
                )}

                {s.status === "APPROVED" && (
                  <>
                    <button
                      className="border rounded px-2 py-1 text-sm"
                      onClick={() =>
                        window.open(
                          `/api/inventory/issue-slips/${s.id}/pdf`,
                          "_blank",
                        )
                      }
                    >
                      Issue Slip PDF
                    </button>

                    <button
                      className="btn-primary text-sm"
                      onClick={() => execute(s.id)}
                    >
                      Generate Issue Pass
                    </button>
                  </>
                )}

                {s.status === "ISSUED" && (
                  <>
                    <button
                      className="border rounded px-2 py-1 text-sm"
                      onClick={() =>
                        window.open(
                          `/api/inventory/issue-slips/${s.id}/pdf`,
                          "_blank",
                        )
                      }
                    >
                      Issue Slip PDF
                    </button>

                    <button
                      className="border rounded px-2 py-1 text-sm"
                      onClick={() =>
                        window.open(
                          `/api/inventory/issues/${s.id}/pass/pdf`,
                          "_blank",
                        )
                      }
                    >
                      Issue Pass PDF
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
