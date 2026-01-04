export async function apiFetchServer(path: string) {
  const res = await fetch(`/api${path}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch");
  }

  return res.json();
}
