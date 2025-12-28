"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetchClient } from "@/lib/api.client";
import { setActiveCompany, getActiveCompany } from "@/lib/company";
import { hasPermission } from "@/lib/permissions";

export default function Navbar() {
  const pathname = usePathname();

  const [perms, setPerms] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 🚫 Do nothing on login page
    if (pathname === "/login") return;

    apiFetchClient("/me/permissions")
      .then(setPerms)
      .catch(() => setPerms([]));

    apiFetchClient("/me")
      .then(setUser)
      .catch(() => setUser(null));
  }, [pathname]);

  async function logout() {
    await apiFetchClient("/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }

  // Optional: don't render navbar at all on login
  if (pathname === "/login") return null;

  return (
    <nav className="navbar mb-6">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-white/60 p-2 shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--primary)]">
              <rect width="24" height="24" rx="6" fill="currentColor" style={{opacity:0.08}} />
              <path d="M6 12h12" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="w-64">
            <span className="text-lg font-semibold text-slate-900">
              {user ? `${user.company_name}` : "No Company Selected"}
            </span>
            <div className="text-sm muted">{user?.email ?? ''}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/inventory" className="navbar-link">Inventory</Link>

          {hasPermission(perms, "inventory.view") && (
            <Link href="/reports" className="navbar-link">Reports</Link>
          )}

          {hasPermission(perms, "inventory.view_audit") && (
            <Link href="/audit" className="navbar-link">Audit</Link>
          )}

          {hasPermission(perms, "inventory.view_adjustments") && (
            <Link href="/adjustments" className="navbar-link">Adjustments</Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {user && (
            <div className="text-sm text-slate-700 text-right">
              <div className="font-medium">{user.username}</div>
              {user.role && <div className="muted text-xs">{user.role}</div>}
            </div>
          )}

          <button onClick={logout} className="btn-ghost">Logout</button>
        </div>
      </div>
    </nav>
  );
}
