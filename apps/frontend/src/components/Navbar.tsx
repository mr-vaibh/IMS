"use client";

import Link from "next/link";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { permissions, loading } = useAuth();

  if (loading) return null;

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-6 py-3 flex gap-4 items-center">
        <Link href="/inventory">Inventory</Link>

        {hasPermission(permissions, "inventory.view") && (
          <Link href="/reports">Reports</Link>
        )}

        {hasPermission(permissions, "inventory.view_audit") && (
          <Link href="/audit">Audit</Link>
        )}

        <div className="ml-auto">
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}

function LogoutButton() {
  const { refresh } = useAuth();

  async function logout() {
    try {
      await fetch("http://localhost:8000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      await refresh(); // clear permissions
      window.location.href = "/login";
    }
  }

  return (
    <button onClick={logout} className="border px-3 py-1">
      Logout
    </button>
  );
}
