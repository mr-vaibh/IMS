"use client";

import { useState, useMemo, useEffect } from "react";
import { InventoryRow } from "@/types/inventory";
import InventoryActions from "./InventoryActions";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";

interface Warehouse {
  id: string;
  name: string;
  deleted_at?: string | null;
}

interface Supplier {
  id: string;
  name: string;
  deleted_at?: string | null;
}

interface InventoryTableProps {
  rows: InventoryRow[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
}

export default function InventoryTable({
  rows,
  warehouses,
  suppliers,
}: InventoryTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<any[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [showDeleted, setShowDeleted] = useState(false);

  // Filter rows based on showDeleted checkbox
  const filteredRows = useMemo(() => {
    if (!showDeleted) {
      // show only NOT deleted rows
      return rows.filter((row) => !row.warehouse_deleted_at);
    }
    // show all rows
    return rows;
  }, [rows, showDeleted]);

  useEffect(() => {
    console.log("Filtered rows", filteredRows);
  }, [filteredRows]);

  const columns = useMemo<ColumnDef<InventoryRow>[]>(
    () => [
      {
        header: "Product",
        accessorKey: "product_name",
        filterFn: "includesString",
      },
      {
        header: "Warehouse",
        accessorKey: "warehouse_name",
        filterFn: (row, id, value) => {
          if (!value) return true;
          return row.getValue<string>(id) === value;
        },
        cell: (info) => info.getValue(),
      },
      {
        header: "Supplier",
        accessorKey: "supplier_name",
        cell: (info) => info.getValue() || "-",
        filterFn: (row, id, value) => {
          if (!value) return true;
          return row.getValue<string>(id) === value;
        },
      },
      {
        header: "Qty",
        accessorKey: "quantity",
        cell: (info) => {
          const quantity = info.getValue<number>();
          const unit = info.row.original.unit; // Access unit from original row data
          return `${quantity} ${unit || ""}`.trim();
        },
        meta: { align: "right" },
        filterFn: (row, id, value) => {
          const rowValue = row.getValue<number>(id);
          const [operator, num] = value;
          if (operator === "gt") return rowValue > num;
          if (operator === "lt") return rowValue < num;
          if (operator === "eq") return rowValue === num;
          return true;
        },
      },
      {
        header: "Actions",
        id: "actions",
        cell: (info) => (
          <InventoryActions
            productId={info.row.original.product_id}
            warehouseId={info.row.original.warehouse_id}
            warehouses={warehouses}
          />
        ),
      },
    ],
    [warehouses]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
    pageCount: Math.ceil(filteredRows.length / pagination.pageSize),
  });

  // Add this function inside InventoryTable component
  const exportCSV = () => {
    const rowsToExport = table.getFilteredRowModel().rows;
    if (!rowsToExport.length) return;

    const exportableColumns = columns.filter((col) => col.id !== "actions");

    const headers = exportableColumns.map((col) => col.header as string);

    const csvRows = rowsToExport.map((row) =>
      exportableColumns
        .map((col) => {
          const columnId = col.id ?? (col as any).accessorKey; // fallback safety
          const value = row.getValue(columnId as string);
          return `"${value ?? ""}"`;
        })
        .join(",")
    );

    const csvContent = [headers.join(","), ...csvRows].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "inventory.csv");
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-full p-2">
      {/* Show Deleted Checkbox - own row, right-aligned, single line */}
      <div className="mb-2 flex justify-end text-xs">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <input
            type="checkbox"
            id="showDeleted"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="cursor-pointer"
          />
          <label htmlFor="showDeleted" className="cursor-pointer">
            Show Deleted
          </label>
        </div>
      </div>

      {/* Search + Export Toolbar */}
      <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
        <input
          type="text"
          placeholder="Search..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full sm:w-48 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />

        <button
          onClick={exportCSV}
          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition"
        >
          Export CSV
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-md table-auto text-xs">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-2 py-1 text-left font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {/* Column Header */}
                    <div
                      className="flex items-center gap-1 cursor-pointer select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>

                    {/* Column Filter */}
                    {header.column.getCanFilter() &&
                      header.column.id !== "actions" && (
                        <div className="mt-1">
                          {header.column.id === "quantity" ? (
                            <div className="flex gap-1">
                              <select
                                value={
                                  columnFilters.find((f) => f.id === "quantity")
                                    ?.value?.[0] || ""
                                }
                                onChange={(e) => {
                                  const val = e.target.value as
                                    | "gt"
                                    | "lt"
                                    | "eq"
                                    | "";
                                  const num =
                                    columnFilters.find(
                                      (f) => f.id === "quantity"
                                    )?.value?.[1] || 0;
                                  setColumnFilters((old) =>
                                    [
                                      ...old.filter((f) => f.id !== "quantity"),
                                      val
                                        ? {
                                            id: "quantity",
                                            value: [val, Number(num)],
                                          }
                                        : null,
                                    ].filter(Boolean)
                                  );
                                }}
                                className="border p-0.5 rounded w-16 text-xs"
                              >
                                <option value="">Op</option>
                                <option value="gt">&gt;</option>
                                <option value="lt">&lt;</option>
                                <option value="eq">=</option>
                              </select>
                              <input
                                type="number"
                                value={
                                  columnFilters.find((f) => f.id === "quantity")
                                    ?.value?.[1] ?? ""
                                }
                                onChange={(e) => {
                                  const num = Number(e.target.value);
                                  const operator =
                                    columnFilters.find(
                                      (f) => f.id === "quantity"
                                    )?.value?.[0] || "";
                                  setColumnFilters((old) =>
                                    [
                                      ...old.filter((f) => f.id !== "quantity"),
                                      operator
                                        ? {
                                            id: "quantity",
                                            value: [operator, num],
                                          }
                                        : null,
                                    ].filter(Boolean)
                                  );
                                }}
                                className="border p-0.5 rounded w-16 text-xs"
                                placeholder="Qty"
                              />
                            </div>
                          ) : header.column.id === "warehouse_name" ? (
                            <select
                              value={
                                (header.column.getFilterValue() as string) ?? ""
                              }
                              onChange={(e) =>
                                header.column.setFilterValue(e.target.value)
                              }
                              className="border p-0.5 rounded w-full text-xs mt-1"
                            >
                              <option value="">All</option>
                              {warehouses.map((w) => (
                                <option key={w.id} value={w.name}>
                                  {w.name} {w.deleted_at ? " (deleted)" : ""}
                                </option>
                              ))}
                            </select>
                          ) : header.column.id === "supplier_name" ? (
                            <select
                              value={
                                (header.column.getFilterValue() as string) ?? ""
                              }
                              onChange={(e) =>
                                header.column.setFilterValue(e.target.value)
                              }
                              className="border p-0.5 rounded w-full text-xs mt-1"
                            >
                              <option value="">All</option>
                              {suppliers.map((s) => (
                                <option key={s.id} value={s.name}>
                                  {s.name} {s.deleted_at ? " (deleted)" : ""}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={
                                (header.column.getFilterValue() as string) ?? ""
                              }
                              onChange={(e) =>
                                header.column.setFilterValue(e.target.value)
                              }
                              className="border p-0.5 rounded w-full text-xs mt-1"
                              placeholder={`Filter`}
                            />
                          )}
                        </div>
                      )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-3 text-center text-gray-500 text-xs"
                >
                  No records found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  title={row.original.warehouse_deleted_at ? "Deleted" : undefined}
                  className={`${
                    row.original.warehouse_deleted_at
                      ? "bg-gray-200 text-gray-600"
                      : row.original.quantity === 0
                      ? "bg-red-100"
                      : "bg-white"
                  } hover:bg-gray-50`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-2 py-1 align-middle whitespace-nowrap ${"text-left"}`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-3 gap-2 text-gray-700 text-xs select-none">
        <div className="flex gap-1 items-center">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-0.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Prev
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 py-0.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>

          <select
            value={pagination.pageSize}
            onChange={(e) =>
              setPagination((old) => ({
                ...old,
                pageSize: Number(e.target.value),
                pageIndex: 0,
              }))
            }
            className="ml-2 px-2 py-0.5 border border-gray-300 rounded text-xs bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {[10, 50, 100, 500].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>

        <div>
          Page <span className="font-medium">{pagination.pageIndex + 1}</span>{" "}
          of <span className="font-medium">{table.getPageCount()}</span>
        </div>
      </div>
    </div>
  );
}
