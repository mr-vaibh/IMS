"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetchClient } from "@/lib/api.client";
import { hasPermission } from "@/lib/permissions";

export default function Navbar() {
  const pathname = usePathname();
  const [perms, setPerms] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
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

  if (pathname === "/login") return null;

  return (
    <nav className="navbar mb-6 sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2 md:px-6">
        {/* Logo & Company Info */}
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-white/60 p-2 shadow-sm">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[var(--primary)]"
            >
              <rect
                width="24"
                height="24"
                rx="6"
                fill="currentColor"
                style={{ opacity: 0.08 }}
              />
              <path
                d="M6 12h12"
                stroke="#2563eb"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="w-48 md:w-64">
            <span className="text-lg font-semibold text-slate-900 block truncate">
              {user ? user.company_name : "No Company Selected"}
            </span>
            <div className="text-sm muted truncate">{user?.email ?? ""}</div>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/inventory" className="navbar-link">
            Inventory
          </Link>

          {hasPermission(perms, "inventory.view") && (
            <Link href="/reports" className="navbar-link">
              Reports
            </Link>
          )}

          {hasPermission(perms, "inventory.view_audit") && (
            <Link href="/audit" className="navbar-link">
              Audit
            </Link>
          )}

          {hasPermission(perms, "inventory.view_adjustments") && (
            <Link href="/adjustments" className="navbar-link">
              Adjustments
            </Link>
          )}

          {hasPermission(perms, "inventory.issue_view") && (
            <Link href="/issues" className="navbar-link">
              Issues
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {user && (
            <span className="text-sm text-slate-700 font-medium">{user.username}</span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Logout Button */}
        <div className="hidden md:block ml-4">
          <button onClick={logout} className="btn-ghost">
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <Link href="/inventory" className="block navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Inventory
          </Link>
          {hasPermission(perms, "inventory.view") && (
            <Link href="/reports" className="block navbar-link" onClick={() => setMobileMenuOpen(false)}>
              Reports
            </Link>
          )}
          {hasPermission(perms, "inventory.view_audit") && (
            <Link href="/audit" className="block navbar-link" onClick={() => setMobileMenuOpen(false)}>
              Audit
            </Link>
          )}
          {hasPermission(perms, "inventory.view_adjustments") && (
            <Link href="/adjustments" className="block navbar-link" onClick={() => setMobileMenuOpen(false)}>
              Adjustments
            </Link>
          )}
          {hasPermission(perms, "inventory.issue_view") && (
            <Link href="/issues" className="block navbar-link" onClick={() => setMobileMenuOpen(false)}>
              Issues
            </Link>
          )}

          <button
            onClick={logout}
            className="w-full mt-2 btn-ghost"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
