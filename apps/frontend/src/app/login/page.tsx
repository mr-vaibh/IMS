"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth(); // This is the key for updating permissions

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect target from middleware
  const next = searchParams.get("next") || "/inventory";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Required for cookie-based auth
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      /**
       * CRITICAL STEP
       * Fetch permissions immediately after login
       * so Navbar updates without reload
       */
      await refresh();

      // Redirect to intended page
      router.replace(next);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={submit}
        className="border p-6 w-80 rounded space-y-4"
      >
        <h1 className="text-lg font-semibold">Login</h1>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input
          className="border p-2 w-full"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          className="border p-2 w-full"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-2 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
