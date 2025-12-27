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
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-6 py-3 flex gap-4 items-center">
        {/* Display the company name */}
        <div className="ml-6 w-64">
          <span className="text-lg font-bold text-gray-700">
            {user ? `${user.company_name}` : "No Company Selected"}
          </span>
        </div>
        
        <Link href="/inventory">Inventory</Link>

        {hasPermission(perms, "inventory.view") && (
          <Link href="/reports">Reports</Link>
        )}

        {hasPermission(perms, "inventory.view_audit") && (
          <Link href="/audit">Audit</Link>
        )}

        {hasPermission(perms, "inventory.view_adjustments") && (
          <Link href="/adjustments">Adjustments</Link>
        )}

        <div className="ml-auto flex items-center gap-4">
          {user && (
            <div className="text-sm text-gray-700">
              <span className="font-medium">{user.username}</span>
              {user.role && (
                <span className="text-gray-500"> ({user.role})</span>
              )}
            </div>
          )}

          <button onClick={logout} className="border px-3 py-1">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
