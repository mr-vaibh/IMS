"use client";

export default function ExportCSV({
  rows,
  filename,
}: {
  rows: any[];
  filename: string;
}) {
  function exportCSV() {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={exportCSV} className="border px-2 py-1 text-sm">
      Export CSV
    </button>
  );
}
