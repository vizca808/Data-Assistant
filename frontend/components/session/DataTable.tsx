"use client";

import { useState, useEffect } from "react";
import { FileInfo } from "@/lib/types";

interface DataTableProps {
  file: FileInfo;
}

export function DataTable({ file }: DataTableProps) {
  // Mock data for preview, in a real app we'd fetch the first 10 rows from the backend
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real scenario, this would be an API call to get table sample
    // Here we just simulate a loading state since we don't have the endpoint for row data yet
    setLoading(true);
    setTimeout(() => {
      setData([]);
      setLoading(false);
    }, 500);
  }, [file]);

  let columns: string[] = file.columns || [];

  if (loading) {
    return (
      <div className="glass-card p-6 flex justify-center items-center h-48">
        <span className="spinner w-8 h-8"></span>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-text-secondary h-48 flex items-center justify-center">
        No tabular data preview available.
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-border bg-bg-secondary flex justify-between items-center">
        <h3 className="font-medium text-sm text-text-primary">Data Preview</h3>
        <span className="text-xs px-2 py-1 bg-bg-input rounded text-text-secondary">First 5 rows</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase bg-bg-input">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 font-medium whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* If we had actual preview rows from backend: */}
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={idx} className="border-b border-border-subtle hover:bg-bg-card-hover transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-text-primary whitespace-nowrap">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted italic">
                  Data preview will be available in future updates
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
