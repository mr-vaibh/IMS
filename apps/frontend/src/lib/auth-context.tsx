"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/api.client";

type AuthContextType = {
  permissions: string[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const perms = await apiFetchClient("/me/permissions");
      setPermissions(perms);
    } catch {
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        permissions,
        loading,
        refresh: load,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
