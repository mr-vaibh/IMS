"use client";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(
    message: string,
    status: number,
    code?: string
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getCSRFToken() {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith("csrftoken="))
    ?.split("=")[1];
}

export async function apiFetchClient(
  path: string,
  options: RequestInit = {}
) {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "X-CSRFToken": getCSRFToken() || "",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  // 🔒 auth redirect (still OK to centralize)
  if (res.status === 401) {
    if (!["/login", "/signup"].includes(window.location.pathname)) {
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  // ❌ any other error → THROW
  if (!res.ok) {
    throw new ApiError(
      data?.message || `Request failed`,
      res.status,
      data?.code
    );
  }

  return data;
}
