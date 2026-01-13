"use client";

import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import { toast } from "sonner";

export default function AccountSettings() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetchClient("/me").then((u) => {
      setUsername(u.username);
      setPhone(u.phone_number ?? "");
    });
  }, []);

  async function save() {
    setLoading(true);
    try {
      await apiFetchClient("/me", {
        method: "PUT",
        body: JSON.stringify({
          username,
          phone_number: phone,
        }),
      });
      toast.success("Account updated");
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
        <h2 className="text-lg font-semibold text-slate-900">My Account</h2>
        <p className="text-sm text-slate-500">
          Manage your personal account details
        </p>
      </div>

      {/* Username */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Username</label>
        <input
          placeholder="yourname"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      {/* Phone number */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Phone number
        </label>
        <input
          placeholder="+91 XXXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
