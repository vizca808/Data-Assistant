"use client";

import { useState } from "react";
import { FileInfo } from "@/lib/types";
import { useSession } from "next-auth/react";
import { Sparkles, Database, AlertCircle } from "lucide-react";

interface DataCleaningProps {
  sessionId: string;
  file: FileInfo;
  onCleanSuccess: () => void;
}

export function DataCleaning({ sessionId, file, onCleanSuccess }: DataCleaningProps) {
  const { data: sessionData } = useSession();
  const [handleMissing, setHandleMissing] = useState("mean");
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleClean = async () => {
    const token = (sessionData as any)?.accessToken;
    if (!token) return;

    setLoading(true);
    setResult(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(backendUrl + "/api/analytics/" + sessionId + "/clean", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          handle_missing: handleMissing,
          remove_duplicates: removeDuplicates,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.data);
        onCleanSuccess();
      } else {
        alert("Gagal membersihkan data.");
      }
    } catch (e) {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 border-accent-primary/30">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-bold text-text-primary">Pembersihan Data (Data Cleaning)</h2>
      </div>
      <p className="text-sm text-text-secondary mb-6">Secara otomatis membersihkan data yang duplikat dan mengisi nilai yang kosong (missing values).</p>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">Penanganan Nilai Kosong (Numerik)</label>
          <select 
            value={handleMissing}
            onChange={(e) => setHandleMissing(e.target.value)}
            className="w-full bg-bg-secondary border border-border text-text-primary rounded-xl py-2.5 px-4 text-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none"
          >
            <option value="mean">Isi dengan Rata-rata (Mean)</option>
            <option value="median">Isi dengan Nilai Tengah (Median)</option>
            <option value="drop">Hapus Baris yang Kosong</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">Hapus Duplikat</label>
          <div className="flex items-center gap-3 mt-3">
            <input 
              type="checkbox" 
              checked={removeDuplicates} 
              onChange={(e) => setRemoveDuplicates(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 bg-bg-secondary"
            />
            <span className="text-sm text-text-secondary">Hapus baris data yang sama persis</span>
          </div>
        </div>
      </div>

      <button 
        onClick={handleClean}
        disabled={loading}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? <div className="spinner w-4 h-4 border-2 border-white"></div> : <Database className="w-4 h-4" />}
        {loading ? "Sedang Membersihkan..." : "Bersihkan Data Sekarang"}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-emerald-400 mb-1">Berhasil dibersihkan!</h4>
            <p className="text-xs text-emerald-200/70">
              Total awal: {result.original_rows} baris. <br/>
              Dihapus: {result.rows_removed} baris. <br/>
              Total akhir: {result.cleaned_rows} baris.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
