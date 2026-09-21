"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { FileInfo } from "@/lib/types";
import { UploadZone } from "./UploadZone";
import { ChartBuilder } from "./ChartBuilder";
import { DataTable } from "./DataTable";
import { 
  Activity, AlertTriangle, Database, FileText, 
  BarChart3, Sparkles, BrainCircuit, Network, X, ArrowLeft, Download 
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, Legend } from "recharts";
import Link from "next/link";
import { Heatmap } from "./Heatmap";
import { DataCleaning } from "./DataCleaning";
import { Forecasting } from "./Forecasting";

interface SmartReportProps {
  sessionId: string;
}

export function SmartReport({ sessionId }: SmartReportProps) {
  const { data: sessionData } = useSession();
  
  const [file, setFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [clusters, setClusters] = useState<any>(null);

  const fetchData = async () => {
    const token = (sessionData as any)?.accessToken;
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      // 1. Check Session & File
      const session = await api.sessions.get(token, sessionId);
      if (session && session.file) {
        setFile(session.file);
        
        // 2. Start AI Processing
        setAiProcessing(true);
        
        // Fetch Profile & Insights
        const profRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analytics/${sessionId}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profRes.ok) {
          const pData = await profRes.json();
          setProfile(pData.data);
        }

        // Fetch Anomalies
        const anomRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analytics/${sessionId}/anomalies`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (anomRes.ok) {
          const aData = await anomRes.json();
          setAnomalies(aData.data);
        }

        // Fetch Clustering
        const clusRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analytics/${sessionId}/clustering`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (clusRes.ok) {
          const cData = await clusRes.json();
          setClusters(cData.data);
        }
        
        setAiProcessing(false);
      } else {
        setFile(null);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memproses data.");
    } finally {
      setLoading(false);
      setAiProcessing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sessionId, sessionData]);

  if (loading && !aiProcessing) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-bg-primary">
        <span className="spinner"></span>
      </div>
    );
  }

  // No file uploaded yet
  if (!file) {
    return (
      <div className="w-full h-full bg-bg-secondary p-8 flex items-center justify-center relative">
        <Link href="/" className="absolute top-8 left-8 text-text-secondary hover:text-white flex items-center gap-2 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Kembali ke Dashboard
        </Link>
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
              <BrainCircuit className="w-8 h-8 text-accent-primary" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">AI Data Analyst</h1>
            <p className="text-text-secondary">
              Unggah file CSV atau Excel Anda. AI akan secara otomatis memprofilkan data, 
              mencari anomali, dan melakukan segmentasi tersembunyi secara offline.
            </p>
          </div>
          <div className="bg-bg-primary rounded-xl border border-border p-6 shadow-xl">
            <UploadZone sessionId={sessionId} onUploadComplete={fetchData} />
          </div>
        </div>
      </div>
    );
  }

  // File uploaded, AI is processing
  if (aiProcessing) {
    return (
      <div className="w-full h-full bg-bg-secondary flex flex-col items-center justify-center gap-6 p-8 relative">
        <Link href="/" className="absolute top-8 left-8 text-text-secondary hover:text-white flex items-center gap-2 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Kembali ke Dashboard
        </Link>
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-accent-primary/20 border-t-accent-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="w-8 h-8 text-accent-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-text-primary mb-2">AI Sedang Membedah Data...</h2>
          <p className="text-text-secondary text-sm">
            Menganalisis statistik, menjalankan algoritma deteksi anomali (Isolation Forest), 
            dan mencari segmentasi (K-Means Clustering). Mohon tunggu beberapa detik.
          </p>
        </div>
      </div>
    );
  }

  // Report Dashboard
  return (
    <div className="w-full h-full bg-bg-secondary overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/80 backdrop-blur-md border-b border-border p-4 px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-text-secondary hover:text-white transition-colors mr-2 p-2 hover:bg-bg-secondary rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Executive Summary Report</h1>
            <p className="text-xs text-text-secondary flex items-center gap-2">
              <span>{file.filename}</span>
              <span className="w-1 h-1 rounded-full bg-border"></span>
              <span>{file.file_size ? (file.file_size / 1024).toFixed(2) : '0'} KB</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-all cursor-pointer"
            title="Cetak / Unduh PDF Laporan"
          >
            <Download className="w-3.5 h-3.5 text-accent-primary" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => setFile(null)}
            className="flex items-center gap-2 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Ganti File
          </button>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Smart Insights (AI Text) */}
        {profile?.stats?.smart_insights && (
          <section className="fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent-primary" />
              <h2 className="text-xl font-bold text-text-primary">AI Smart Insights</h2>
            </div>
            <div className="glass-card p-6 border-accent-primary/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
              <ul className="space-y-3 relative z-10">
                {profile.stats.smart_insights.map((insight: string, i: number) => (
                  <li key={i} className="flex gap-3 text-text-secondary leading-relaxed">
                    <span className="text-accent-primary mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Data Overview Cards */}
        {profile?.stats && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-in delay-100">
            <div className="glass-card p-5">
              <p className="text-text-secondary text-sm font-medium">Total Baris</p>
              <p className="text-3xl font-bold text-text-primary mt-2">{profile.stats.row_count}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-text-secondary text-sm font-medium">Total Kolom</p>
              <p className="text-3xl font-bold text-text-primary mt-2">{profile.stats.col_count}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-text-secondary text-sm font-medium">Kolom Numerik</p>
              <p className="text-3xl font-bold text-accent-primary mt-2">{profile.stats.numeric_columns.length}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-text-secondary text-sm font-medium">Kolom Kategori</p>
              <p className="text-3xl font-bold text-purple-400 mt-2">{profile.stats.categorical_columns.length}</p>
            </div>
          </section>
        )}

        {/* Correlation Heatmap */}
        {profile?.correlation && Object.keys(profile.correlation).length > 1 && (
          <section className="fade-in delay-150">
            <div className="flex items-center gap-2 mb-4">
              <Network className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-text-primary">Heatmap Korelasi</h2>
            </div>
            <div className="glass-card p-6">
              <p className="text-sm text-text-secondary mb-4">Melihat hubungan antar kolom numerik. Nilai mendekati 1 (hijau) berarti korelasi positif kuat, mendekati -1 (merah) korelasi negatif kuat.</p>
              <Heatmap correlation={profile.correlation} />
            </div>
          </section>
        )}

        {/* Data Cleaning */}
        <section className="fade-in delay-150">
          <DataCleaning 
            sessionId={sessionId} 
            file={file} 
            onCleanSuccess={() => {
              // Reload profile data if needed, or rely on page refresh
            }} 
          />
        </section>

        {/* Forecasting */}
        <section className="fade-in delay-150">
          <Forecasting sessionId={sessionId} file={file} numericCols={profile?.stats?.numeric_columns || []} />
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Clustering Section */}
          {clusters?.chart_data && clusters.chart_data.length > 0 && (
            <section className="fade-in delay-200">
              <div className="flex items-center gap-2 mb-4">
                <Network className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-text-primary">Segmentasi Data (K-Means)</h2>
              </div>
              <div className="glass-card p-6 h-[400px] flex flex-col">
                <p className="text-sm text-text-secondary mb-4">{clusters.insight}</p>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis type="number" dataKey={clusters.x_col} name={clusters.x_col} stroke="#888" fontSize={12} />
                      <YAxis type="number" dataKey={clusters.y_col} name={clusters.y_col} stroke="#888" fontSize={12} />
                      <ZAxis type="number" dataKey="Cluster" range={[60, 60]} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }} 
                        contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#3b3b4f', color: '#fff' }}
                      />
                      <Scatter data={clusters.chart_data} name="Segmentasi">
                        {clusters.chart_data.map((entry: any, index: number) => {
                          const colors = ["#a855f7", "#3b82f6", "#ef4444", "#10b981", "#f59e0b"];
                          return <Cell key={`cell-${index}`} fill={colors[entry.Cluster % colors.length]} />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          )}

          {/* Anomaly Detection Section */}
          <section className="fade-in delay-300">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-text-primary">Deteksi Anomali</h2>
            </div>
            <div className="glass-card p-6 h-[400px] flex flex-col border-orange-500/20">
              {anomalies?.anomaly_count > 0 ? (
                <>
                  <p className="text-text-secondary text-sm mb-4">
                    AI menemukan <span className="font-bold text-orange-500">{anomalies.anomaly_count} baris tak wajar</span>.
                  </p>
                  <div className="flex-1 overflow-auto custom-scrollbar border border-border rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-bg-primary sticky top-0">
                        <tr>
                          <th className="p-3 text-xs font-semibold text-text-secondary uppercase">Idx</th>
                          {profile?.stats?.numeric_columns.slice(0, 3).map((c: string) => (
                            <th key={c} className="p-3 text-xs font-semibold text-text-secondary uppercase truncate">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {anomalies.anomalies_data.map((row: any, i: number) => (
                          <tr key={i} className="border-t border-border/50 hover:bg-bg-primary/50">
                            <td className="p-3 text-sm text-text-primary">#{anomalies.anomalies_indices[i]}</td>
                            {profile?.stats?.numeric_columns.slice(0, 3).map((c: string) => (
                              <td key={c} className="p-3 text-sm text-text-secondary truncate">{row[c]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Activity className="w-12 h-12 text-green-500 mb-4 opacity-50" />
                  <p className="text-text-primary font-medium">Data Normal</p>
                  <p className="text-text-secondary text-sm">Tidak ditemukan anomali statistik.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Data Preview Table */}
        {file && profile?.stats?.preview && (
          <section className="fade-in delay-350">
            <DataTable file={file} previewData={profile.stats.preview} />
          </section>
        )}

        {/* Interactive Chart Builder */}
        {profile?.stats && (
          <ChartBuilder 
            sessionId={sessionId}
            numericCols={profile.stats.numeric_columns || []}
            categoricalCols={profile.stats.categorical_columns || []}
          />
        )}

      </div>
    </div>
  );
}
