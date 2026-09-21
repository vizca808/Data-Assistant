"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface UploadZoneProps {
  sessionId: string;
  onUploadComplete: () => void;
}

export function UploadZone({ sessionId, onUploadComplete }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const { data: sessionData } = useSession();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const token = (sessionData as any)?.accessToken;
      if (!token) return;
      await api.upload.file(token, sessionId, file);
      onUploadComplete();
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  }, [sessionId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"]
    }
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`glass-card p-8 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[200px] ${
          isDragActive ? "border-accent-primary bg-accent-glow" : "border-border hover:border-accent-secondary"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? "text-accent-primary" : "text-text-secondary"}`} />
        <h3 className="text-lg font-medium text-text-primary mb-2">
          {isDragActive ? "Drop file here..." : "Upload Data File"}
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Drag & drop a CSV, Excel, PDF, or TXT file here, or click to select
        </p>
        <div className="flex gap-2">
          <span className="px-2 py-1 rounded bg-bg-input text-xs text-text-secondary">CSV</span>
          <span className="px-2 py-1 rounded bg-bg-input text-xs text-text-secondary">XLSX</span>
          <span className="px-2 py-1 rounded bg-bg-input text-xs text-text-secondary">PDF</span>
          <span className="px-2 py-1 rounded bg-bg-input text-xs text-text-secondary">TXT</span>
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-bg-card/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <span className="spinner w-8 h-8 border-t-accent-primary"></span>
              <span className="text-sm font-medium text-text-primary">Uploading & processing...</span>
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/30 text-error flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
