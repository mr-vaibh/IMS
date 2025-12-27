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
    (res.status === 401) &&
    !authPages.includes(window.location.pathname)
  ) {
    window.location.href = "/login";
    return;
  }

  if (res.status === 403) {
    alert("You do not have permission to perform this action.");
    return;
  }


  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return text ? JSON.parse(text) : {};
}
