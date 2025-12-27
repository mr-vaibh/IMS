"use client";

export async function apiFetchClient(
  path: string,
  options: RequestInit = {}
) {
  const res = await fetch(`http://localhost:8000/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();

  const authPages = ["/login", "/signup"];
  if (
    res.status === 401 &&
    JSON.parse(text)?.detail === "Invalid or expired token" &&
    !authPages.includes(window.location.pathname)
  ) {
    window.location.href = "/login";
    return;
  }


  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}
