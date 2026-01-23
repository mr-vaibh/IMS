"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";

export default function CompanySettings() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetchClient("/me/permissions").then(setPerms);

    apiFetchClient("/me").then((u) => {
      setName(u.company_name ?? "");
      setAddress(u.company_address ?? "");
    });
  }, []);

  if (!hasPermission(perms, "company.manage")) return null;

  async function save() {
    setLoading(true);
    try {
      await apiFetchClient("/company", {
        method: "PUT",
        body: JSON.stringify({ name, address }),
      });
      toast.success("Company updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-[0_10px_30px_rgba(16,24,40,0.08)] p-6 space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">
          Company Settings
        </h2>
        <p className="text-sm text-slate-500">
          Update your company information below
        </p>
      </div>

      {/* Company name */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Company name
        </label>
        <input
          placeholder="Acme Inc."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Company address */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Company address
        </label>
        <textarea
          rows={3}
          placeholder="Address & Details"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-2">
        <button onClick={save} disabled={loading} className="btn-primary">
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {loading ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
