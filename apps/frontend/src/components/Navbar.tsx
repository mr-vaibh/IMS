"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import { hasPermission } from "@/lib/permissions";

export default function Navbar() {
  const [perms, setPerms] = useState<string[]>([]);

  useEffect(() => {
    // fetch current user permissions
    apiFetchClient("/me/permissions")
      .then((p) => setPerms(p))
      .catch(() => setPerms([]));
  }, []);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  }

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-6 py-3 flex gap-4 items-center">
        <Link href="/inventory">Inventory</Link>

        {hasPermission(perms, "inventory.view") && (
          <Link href="/reports">Reports</Link>
        )}

        {hasPermission(perms, "inventory.view_audit") && (
          <Link href="/audit">Audit</Link>
        )}

        <div className="ml-auto">
          <button onClick={logout} className="border px-3 py-1">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
