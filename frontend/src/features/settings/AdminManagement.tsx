"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";
import { hasPermission } from "@/lib/permissions";

export default function AdminManagement() {
  const [perms, setPerms] = useState<string[]>([]);

  useEffect(() => {
    apiFetchClient("/me/permissions")
      .then(setPerms)
      .catch(() => setPerms([]));
  }, []);

  if (!hasPermission(perms, "company.manage")) return null;

  return (
    <div className="rounded-xl bg-white shadow-[0_10px_30px_rgba(16,24,40,0.08)] p-6 space-y-5">
      <h2 className="font-semibold">Administration</h2>

      <div className="flex gap-3">
        <Link href="/warehouses" className="btn-primary">
          Manage Warehouses
        </Link>

        <Link href="/suppliers" className="btn-primary">
          Manage Suppliers
        </Link>
      </div>
    </div>
  );
}
