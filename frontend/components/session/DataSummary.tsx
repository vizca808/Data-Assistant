"use client";

import { FileInfo } from "@/lib/types";
import { FileText, Database, Hash, Type } from "lucide-react";

interface DataSummaryProps {
  file: FileInfo;
}

export function DataSummary({ file }: DataSummaryProps) {
  let summary = file.summary;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-accent-glow text-accent-primary">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">{file.filename}</h3>
          <p className="text-xs text-text-secondary uppercase">{file.file_type} {file.file_size ? `• ${(file.file_size / 1024).toFixed(1)} KB` : ""}</p>
        </div>
      </div>

      {file.row_count !== null && file.row_count !== undefined && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-bg-input border border-border">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs font-medium">Rows</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{file.row_count.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-bg-input border border-border">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <Hash className="w-4 h-4" />
              <span className="text-xs font-medium">Columns</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{file.col_count?.toLocaleString()}</p>
          </div>
        </div>
      )}

      {summary && (
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-3">Column Statistics</h4>
          <div className="space-y-3">
            {Object.entries(summary).map(([col, stats]: [string, any]) => (
              <div key={col} className="p-3 rounded-lg bg-bg-secondary border border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">{col}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-bg-input text-text-secondary">
                    {stats.type || "string"}
                  </span>
                </div>
                {stats.type === "numeric" && stats.mean !== undefined && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-text-muted block">Min</span>
                      <span className="text-text-secondary font-medium">{Number(stats.min).toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">Mean</span>
                      <span className="text-text-secondary font-medium">{Number(stats.mean).toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">Max</span>
                      <span className="text-text-secondary font-medium">{Number(stats.max).toFixed(1)}</span>
                    </div>
                  </div>
                )}
                {stats.type === "categorical" && stats.unique !== undefined && (
                  <div className="text-xs text-text-secondary">
                    <span className="text-text-primary font-medium">{stats.unique}</span> unique values
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
