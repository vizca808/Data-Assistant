"use client";

import { useState, useMemo } from "react";
import { FileInfo } from "@/lib/types";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Table as TableIcon } from "lucide-react";

interface DataTableProps {
  file: FileInfo;
  previewData?: any[];
}

export function DataTable({ file, previewData = [] }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const columns: string[] = file.columns || [];

  // Handle Sort
  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(col);
      setSortAsc(true);
    }
  };

  // Filter & Sort data
  const filteredData = useMemo(() => {
    if (!previewData || previewData.length === 0) return [];
    
    let result = [...previewData];

    // Search filter across all columns
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        if (typeof valA === "number" && typeof valB === "number") {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [previewData, searchTerm, sortColumn, sortAsc]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  if (columns.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-text-secondary h-40 flex items-center justify-center">
        Tidak ada data tabular yang dapat dipratinjau.
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden border border-border/80">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-border bg-bg-secondary flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <TableIcon className="w-5 h-5 text-accent-primary" />
          <h3 className="font-semibold text-sm text-text-primary">Preview Dataset ({filteredData.length} baris)</h3>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (filteredData.length === 0) return;
              const csvRows = [];
              const headers = columns.join(",");
              csvRows.push(headers);
              for (const row of filteredData) {
                const values = columns.map(col => {
                  let val = row[col] !== null && row[col] !== undefined ? String(row[col]) : "";
                  if (val.includes(",") || val.includes("\"") || val.includes("\n")) {
                    val = `"${val.replace(/"/g, '""')}"`;
                  }
                  return val;
                });
                csvRows.push(values.join(","));
              }
              const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `export_${file.filename}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-all"
            title="Download CSV"
          >
            Export CSV
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari dalam tabel..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-1.5 bg-bg-primary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-primary w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="text-[11px] text-text-secondary uppercase bg-bg-primary/90 sticky top-0 backdrop-blur-sm z-10">
            <tr>
              <th className="px-4 py-3 font-semibold text-text-muted border-b border-border w-12 text-center">#</th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col)}
                  className="px-4 py-3 font-semibold whitespace-nowrap cursor-pointer hover:text-white transition-colors border-b border-border select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortColumn === col ? "text-accent-primary" : "text-text-muted opacity-50"}`} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="border-b border-border/40 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-2.5 text-text-muted text-center font-mono">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 text-text-primary whitespace-nowrap">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-text-muted italic">
                  {searchTerm ? "Tidak ada baris yang cocok dengan pencarian." : "Belum ada baris preview yang tersedia."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-3 border-t border-border bg-bg-secondary flex items-center justify-between text-xs text-text-secondary">
        <div>
          Halaman <span className="font-semibold text-text-primary">{currentPage}</span> dari <span className="font-semibold text-text-primary">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
