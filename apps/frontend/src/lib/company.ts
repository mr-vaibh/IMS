export function getActiveCompany() {
  if (typeof document === "undefined") {
    return null;
  }

  return document.cookie
    .split("; ")
    .find((c) => c.startsWith("company_id="))
    ?.split("=")[1] ?? null;
}

export function setActiveCompany(id: string) {
  if (typeof document === "undefined") return;

  document.cookie = `company_id=${id}; path=/; SameSite=Lax`;
}
