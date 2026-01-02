"use client";

import ExportCSV from "./ExportCSV";

type Filters = {
  startDate?: string;
  endDate?: string;
};

type ReportLayoutProps<T> = {
  title: string;
  filename: string;
  rows: T[];
  pdfEndpoint?: string;
  filters?: Filters;
  children: React.ReactNode;
};

export default function ReportLayout<T>({
  title,
  filename,
  rows,
  pdfEndpoint,
  filters,
  children,
}: ReportLayoutProps<T>) {
  const downloadPDF = () => {
    if (!pdfEndpoint) return;

    const params = new URLSearchParams();
    if (filters?.startDate) params.append("start_date", filters.startDate);
    if (filters?.endDate) params.append("end_date", filters.endDate);

    const qs = params.toString();
    const url = `${process.env.NEXT_PUBLIC_API_URL}${pdfEndpoint}${
      qs ? `?${qs}` : ""
    }`;

    window.open(url, "_blank");
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">{title}</h2>

        <div className="flex gap-2">
          <ExportCSV filename={filename} rows={rows} />

          {pdfEndpoint && (
            <button
              onClick={downloadPDF}
              className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm"
            >
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="border rounded bg-white overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
