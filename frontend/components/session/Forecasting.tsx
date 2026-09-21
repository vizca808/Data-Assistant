"use client";

import { useState } from "react";
import { FileInfo } from "@/lib/types";
import { useSession } from "next-auth/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface ForecastingProps {
  sessionId: string;
  file: FileInfo;
  numericCols: string[];
}

export function Forecasting({ sessionId, file, numericCols }: ForecastingProps) {
  const { data: sessionData } = useSession();
  
  const dateCols = (file.columns || []).filter(c => c.toLowerCase().includes("tanggal") || c.toLowerCase().includes("date"));
  const defaultDate = dateCols.length > 0 ? dateCols[0] : (file.columns?.[0] || "");
  const defaultTarget = numericCols.length > 0 ? numericCols[0] : "";

  const [dateCol, setDateCol] = useState(defaultDate);
  const [targetCol, setTargetCol] = useState(defaultTarget);
  const [periods, setPeriods] = useState(30);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const handleForecast = async () => {
    const token = (sessionData as any)?.accessToken;
    if (!token) return;

    if (!dateCol || !targetCol) {
      alert("Pilih kolom tanggal dan target.");
      return;
    }

    setLoading(true);
    setChartData([]);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(backendUrl + "/api/analytics/" + sessionId + "/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          date_col: dateCol,
          target_col: targetCol,
          periods: Number(periods),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const combined = [...data.data.historical, ...data.data.forecast].map((item: any) => ({
          date: item.date,
          historical: item.type === 'historical' ? item.value : null,
          forecast: item.type === 'forecast' ? item.value : null,
        }));
        setChartData(combined);
      } else {
        const err = await res.json();
        alert("Gagal peramalan: " + err.detail);
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
        <TrendingUp className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-bold text-text-primary">Peramalan Tren (Time-Series Forecasting)</h2>
      </div>
      <p className="text-sm text-text-secondary mb-6">Proyeksikan data historis Anda ke masa depan menggunakan model pemulusan eksponensial (Holt-Winters).</p>
      
      <div className="grid md:grid-cols-4 gap-4 mb-6 items-end">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">Kolom Waktu/Tanggal</label>
          <select 
            value={dateCol}
            onChange={(e) => setDateCol(e.target.value)}
            className="w-full bg-bg-secondary border border-border text-text-primary rounded-xl py-2 px-3 text-sm focus:border-accent-primary outline-none"
          >
            {(file.columns || []).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">Kolom Target (Metrik)</label>
          <select 
            value={targetCol}
            onChange={(e) => setTargetCol(e.target.value)}
            className="w-full bg-bg-secondary border border-border text-text-primary rounded-xl py-2 px-3 text-sm focus:border-accent-primary outline-none"
          >
            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">Periode (Hari)</label>
          <input 
            type="number" 
            value={periods}
            onChange={(e) => setPeriods(Number(e.target.value))}
            className="w-full bg-bg-secondary border border-border text-text-primary rounded-xl py-2 px-3 text-sm focus:border-accent-primary outline-none"
          />
        </div>
        <button 
          onClick={handleForecast}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 h-[42px]"
        >
          {loading ? <div className="spinner w-4 h-4 border-2 border-white"></div> : <TrendingUp className="w-4 h-4" />}
          Ramal Tren
        </button>
      </div>

      {chartData.length > 0 && (
        <div className="h-[400px] mt-8 bg-bg-secondary/30 p-4 rounded-xl border border-border/50">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} angle={-45} textAnchor="end" />
              <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(val)} />
              <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#3b3b4f', color: '#fff' }} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="historical" name="Data Historis" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="forecast" name="Proyeksi Masa Depan" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
