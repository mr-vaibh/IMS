"use client";

import { useEffect, useRef } from "react";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";

import ReportLayout from "./ReportLayout";

export default function MonthlyStockReport({ data }: { data: any }) {
  const tableRef = useRef<HTMLDivElement>(null);
  const tabulatorRef = useRef<Tabulator | null>(null);

  if (!data) return null;

  const days = Array.from({ length: data.days }, (_, i) => i + 1);

  // 🔥 Flatten rows for export
  const exportRows = data.rows.map((r: any) => {
    const row: Record<string, any> = {
      Product: r.product_name,
      Warehouse: r.warehouse_name,
      Unit: r.unit,
      Opening: r.opening,
    };

    days.forEach((d) => {
      row[`Day ${d}`] = r.daily[d];
    });

    row["Closing"] = r.closing;
    return row;
  });

  useEffect(() => {
    if (!tableRef.current) return;

    // Destroy old instance on re-render
    tabulatorRef.current?.destroy();

    tabulatorRef.current = new Tabulator(tableRef.current, {
      data: data.rows,
      layout: "fitData",
      movableColumns: false,
      reactiveData: true,

      columns: [
        {
          title: "Product",
          field: "product_name",
          frozen: true,
          headerSort: false,
        },
        {
          title: "Warehouse",
          field: "warehouse_name",
          frozen: true,
          headerSort: false,
        },
        {
          title: "Unit",
          field: "unit",
          frozen: true,
          headerSort: false,
        },
        {
          title: "Opening",
          field: "opening",
          hozAlign: "right",
        },

        // 🔁 Dynamic day columns
        ...days.map((d) => ({
          title: d.toString(),
          field: `daily.${d}`,
          hozAlign: "right",
        })),

        {
          title: "Closing",
          field: "closing",
          hozAlign: "right",
        },
      ],
    });

    return () => {
      tabulatorRef.current?.destroy();
      tabulatorRef.current = null;
    };
  }, [data]);

  return (
    <ReportLayout
      title={`Monthly Stock Report (${data.month})`}
      filename={`monthly_stock_${data.month}.csv`}
      rows={exportRows}
    >
      <div ref={tableRef} />
    </ReportLayout>
  );
}
