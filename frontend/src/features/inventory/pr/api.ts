import { apiFetchClient } from "@/lib/api.client";

export const fetchPRs = (query?: string) =>
  apiFetchClient(`/inventory/pr${query ? `?${query}` : ""}`);

export const createPR = (payload: {
  warehouse_id: string;
  items: { product_id: string; quantity: number }[];
}) =>
  apiFetchClient("/inventory/pr", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const approvePR = (id: string) =>
  apiFetchClient(`/inventory/pr/${id}/approve`, {
    method: "POST",
  });

export const rejectPR = (id: string, reason?: string) =>
  apiFetchClient(`/inventory/pr/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
