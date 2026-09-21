"use client";

import { useState, useRef } from "react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell
} from "recharts";
import { Settings2, Sparkles, Download, Plus, BarChart2, PieChart as PieIcon, LineChart as LineIcon, Trash2, LayoutGrid } from "lucide-react";
import { useSession } from "next-auth/react";
import html2canvas from "html2canvas";

interface ChartBuilderProps {
  sessionId: string;
  numericCols: string[];
  categoricalCols: string[];
}

interface ChartItem {
  id: string;
  config: { chartType: string; xCol: string; yCol: string; aggregation: string; colorTheme?: string };
  data: any[];
  insight: string;
  insightLoading: boolean;
  error: string;
}

export function ChartBuilder({ sessionId, numericCols, categoricalCols }: ChartBuilderProps) {
  const { data: sessionData } = useSession();
  
  const allCols = [...categoricalCols, ...numericCols];
  
  // Dashboard state to hold multiple charts
  const [charts, setCharts] = useState<ChartItem[]>([]);
  
  // Form State
  const [chartType, setChartType] = useState("bar");
  const [xCol, setXCol] = useState(categoricalCols[0] || allCols[0] || "");
  const [yCol, setYCol] = useState(numericCols[0] || "");
  const [aggregation, setAggregation] = useState("sum");
  const [colorTheme, setColorTheme] = useState("default");
  
  const [loading, setLoading] = useState(false);

  const addChart = async (customConfig?: { chartType: string; xCol: string; yCol: string; aggregation: string; colorTheme?: string }) => {
    const configToUse = customConfig || { chartType, xCol, yCol, aggregation, colorTheme };
    if (!configToUse.xCol || !configToUse.yCol) {
      alert("Harap pilih kolom X dan kolom Y terlebih dahulu.");
      return;
    }
    
    const token = (sessionData as any)?.accessToken;
    if (!token) return;

    setLoading(true);

    const newChartId = Date.now().toString();
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analytics/${sessionId}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          x_col: configToUse.xCol,
          y_col: configToUse.yCol,
          chart_type: configToUse.chartType,
          aggregation: configToUse.aggregation
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Gagal mengambil data grafik");
      }

      const d = await res.json();
      
      const newChart: ChartItem = {
        id: newChartId,
        config: {
          chartType: d.data.chart_type || configToUse.chartType,
          xCol: d.data.x_col || configToUse.xCol,
          yCol: d.data.y_col || configToUse.yCol,
          aggregation: d.data.aggregation || configToUse.aggregation
        },
        data: d.data.chart_data,
        insight: "",
        insightLoading: true,
        error: ""
      };
      
      // Add to top of list
      setCharts(prev => [newChart, ...prev]);
      
      // Fetch insight asynchronously
      generateInsight(newChartId, d.data.chart_data, newChart.config);
      
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat membuat grafik.");
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async (chartId: string, data: any[], config: any) => {
    const token = (sessionData as any)?.accessToken;
    if (!token || data.length === 0) {
      setCharts(prev => prev.map(c => c.id === chartId ? { ...c, insightLoading: false } : c));
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai/insight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          x_col: config.xCol,
          y_col: config.yCol,
          chart_type: config.chartType,
          aggregation: config.aggregation,
          chart_data: data
        })
      });
      if (res.ok) {
        const d = await res.json();
        setCharts(prev => prev.map(c => c.id === chartId ? { ...c, insight: d.data.insight, insightLoading: false } : c));
      } else {
        setCharts(prev => prev.map(c => c.id === chartId ? { ...c, insightLoading: false } : c));
      }
    } catch (e) {
      setCharts(prev => prev.map(c => c.id === chartId ? { ...c, insightLoading: false } : c));
    }
  };

  const removeChart = (id: string) => {
    setCharts(prev => prev.filter(c => c.id !== id));
  };

  const downloadChart = async (id: string, config: any) => {
    const element = document.getElementById(`chart-${id}`);
    if (element) {
      try {
        const canvas = await html2canvas(element, { backgroundColor: '#1e1e2d' });
        const link = document.createElement("a");
        link.download = `Chart_${config.xCol}_vs_${config.yCol}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        console.error("Gagal mendownload grafik:", err);
      }
    }
  };

  const renderChartGraphic = (chart: ChartItem) => {
    const { config, data } = chart;
    if (data.length === 0) return <div className="h-full flex items-center justify-center text-text-secondary">Tidak ada data</div>;

    const themeMap: Record<string, string[]> = {
      default: ["#3b82f6", "#ec4899", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"],
      ocean: ["#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd"],
      emerald: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
      sunset: ["#ea580c", "#f97316", "#fb923c", "#fcd34d", "#fde047"],
      purple: ["#7e22ce", "#9333ea", "#a855f7", "#c084fc", "#d8b4fe"],
    };

    const colors = themeMap[config.colorTheme || "default"] || themeMap.default;
    const primaryColor = colors[0];

    if (config.chartType === "bar") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey={config.xCol} stroke="#888" tick={{ fill: '#888', fontSize: 12 }} angle={-45} textAnchor="end" />
            <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(val)} />
            <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#3b3b4f', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey={config.yCol} fill={primaryColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (config.chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey={config.xCol} stroke="#888" tick={{ fill: '#888', fontSize: 12 }} angle={-45} textAnchor="end" />
            <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(val)} />
            <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#3b3b4f', color: '#fff' }} />
            <Line type="monotone" dataKey={config.yCol} stroke={primaryColor} strokeWidth={3} dot={{ r: 4, fill: primaryColor }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (config.chartType === "pie") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey={config.yCol} nameKey={config.xCol} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#3b3b4f', color: '#fff' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  // Natural language query input state
  const [nlQuery, setNlQuery] = useState("");
  const [nlLoading, setNlLoading] = useState(false);

  // Generate chart config automatically using AI and create chart immediately
  const handleGenerateAIChart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim() || nlLoading) return;

    const token = (sessionData as any)?.accessToken;
    if (!token) return;

    setNlLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai/parse-chart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: nlQuery,
          columns: allCols,
          numeric_columns: numericCols,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const conf = data.data;
        const finalChartType = conf.chart_type || chartType;
        const finalXCol = conf.x_col || xCol;
        const finalYCol = conf.y_col || yCol;
        const finalAgg = conf.aggregation || aggregation;

        // Update form controls
        setChartType(finalChartType);
        setXCol(finalXCol);
        setYCol(finalYCol);
        setAggregation(finalAgg);

        // Directly generate & render chart!
        await addChart({
          chartType: finalChartType,
          xCol: finalXCol,
          yCol: finalYCol,
          aggregation: finalAgg,
        });

        // Clear input prompt once created
        setNlQuery("");
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.detail || "AI gagal memproses konfigurasi grafik.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Terjadi kesalahan saat memproses permintaan AI.");
    } finally {
      setNlLoading(false);
    }
  };

  return (
    <section className="fade-in delay-400 mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <LayoutGrid className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Custom Dashboard</h2>
            <p className="text-xs text-text-secondary">Buat visualisasi interaktif manual atau minta bantuan AI instan</p>
          </div>
        </div>
      </div>

      {/* AI Prompt to Chart Generator */}
      <div className="glass-card border border-indigo-500/30 p-5 shadow-xl mb-6 bg-gradient-to-r from-indigo-950/20 via-zinc-900 to-cyan-950/20 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-accent-primary" />
          <h4 className="text-sm font-semibold text-text-primary">AI Smart Chart Generator</h4>
        </div>
        <p className="text-xs text-text-secondary mb-3">Ketik apa yang ingin Anda visualisasikan, AI akan otomatis memilih sumbu & langsung membuat grafiknya.</p>
        <form onSubmit={handleGenerateAIChart} className="flex gap-2">
          <input
            type="text"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            placeholder="Contoh: Rata-rata harga per kategori barang, atau Total order per tanggal..."
            className="flex-1 bg-bg-secondary border border-border text-text-primary rounded-xl px-4 py-2 text-xs sm:text-sm focus:border-accent-primary outline-none"
          />
          <button
            type="submit"
            disabled={nlLoading || !nlQuery.trim()}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium rounded-xl text-xs sm:text-sm flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-lg shadow-indigo-500/20"
          >
            {nlLoading ? <div className="spinner w-3.5 h-3.5 border-2 border-white"></div> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{nlLoading ? "Membuat..." : "Buat Grafik AI"}</span>
          </button>
        </form>
      </div>
      
      {/* Visual Builder UI */}
      <div className="glass-card border border-border p-6 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-text-secondary" />
          Pengaturan Grafik
        </h3>
        
        <div className="grid md:grid-cols-6 gap-5">
          {/* Chart Type Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary">Tipe Grafik</label>
            <div className="relative">
              <select 
                value={chartType} 
                onChange={e => setChartType(e.target.value)}
                className="w-full bg-bg-secondary border border-border text-text-primary rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none appearance-none cursor-pointer transition-all hover:border-accent-primary/50"
              >
                <option value="bar" className="bg-[#1a1a24] text-white">Bar Chart</option>
                <option value="line" className="bg-[#1a1a24] text-white">Line Chart</option>
                <option value="pie" className="bg-[#1a1a24] text-white">Donut Chart</option>
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                {chartType === 'bar' && <BarChart2 className="w-4 h-4" />}
                {chartType === 'line' && <LineIcon className="w-4 h-4" />}
                {chartType === 'pie' && <PieIcon className="w-4 h-4" />}
              </div>
            </div>
          </div>
          
          {/* X Axis */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary">Sumbu X (Grup Data)</label>
            <select 
              value={xCol} 
              onChange={e => setXCol(e.target.value)}
              className="w-full bg-bg-secondary border border-border text-text-primary rounded-xl py-2.5 px-4 text-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none appearance-none cursor-pointer transition-all hover:border-accent-primary/50"
            >
              {allCols.map(c => <option key={`x-${c}`} value={c} className="bg-[#1a1a24] text-white">{c}</option>)}
            </select>
          </div>
          
          {/* Y Axis */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary">Sumbu Y (Nilai)</label>
            <select 
              value={yCol} 
              onChange={e => setYCol(e.target.value)}
              className="w-full bg-bg-secondary border border-border text-text-primary rounded-xl py-2.5 px-4 text-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none appearance-none cursor-pointer transition-all hover:border-accent-primary/50"
            >
              {numericCols.map(c => <option key={`y-${c}`} value={c} className="bg-[#1a1a24] text-white">{c}</option>)}
            </select>
          </div>
          
          {/* Aggregation */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary">Metode Kalkulasi</label>
            <select 
              value={aggregation} 
              onChange={e => setAggregation(e.target.value)}
              className="w-full bg-bg-secondary border border-border text-text-primary rounded-xl py-2.5 px-4 text-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none appearance-none cursor-pointer transition-all hover:border-accent-primary/50"
            >
              <option value="sum" className="bg-[#1a1a24] text-white">Total (SUM)</option>
              <option value="mean" className="bg-[#1a1a24] text-white">Rata-rata (AVERAGE)</option>
              <option value="count" className="bg-[#1a1a24] text-white">Jumlah Baris (COUNT)</option>
              <option value="max" className="bg-[#1a1a24] text-white">Tertinggi (MAX)</option>
              <option value="min" className="bg-[#1a1a24] text-white">Terendah (MIN)</option>
              <option value="none" className="bg-[#1a1a24] text-white">Data Mentah</option>
            </select>
          </div>
          
          {/* Color Theme */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary">Tema Warna</label>
            <select 
              value={colorTheme} 
              onChange={e => setColorTheme(e.target.value)}
              className="w-full bg-bg-secondary border border-border text-text-primary rounded-xl py-2.5 px-4 text-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none appearance-none cursor-pointer transition-all hover:border-accent-primary/50"
            >
              <option value="default" className="bg-[#1a1a24] text-white">Default (Biru)</option>
              <option value="ocean" className="bg-[#1a1a24] text-white">Ocean (Biru Laut)</option>
              <option value="emerald" className="bg-[#1a1a24] text-white">Emerald (Hijau)</option>
              <option value="sunset" className="bg-[#1a1a24] text-white">Sunset (Jingga)</option>
              <option value="purple" className="bg-[#1a1a24] text-white">Purple (Ungu)</option>
            </select>
          </div>
          
          {/* Add Button */}
          <div className="flex items-end md:col-span-1 col-span-full mt-2 md:mt-0">
            <button 
              onClick={() => addChart()}
              disabled={loading || !xCol || !yCol}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="spinner w-4 h-4 border-2 border-white"></div>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Buat Grafik
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Charts */}
      <div className="space-y-6">
        {charts.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-2xl bg-bg-secondary/30">
            <BarChart2 className="w-12 h-12 text-text-secondary/50 mx-auto mb-3" />
            <p className="text-text-secondary">Belum ada grafik di dashboard.</p>
            <p className="text-xs text-text-secondary/70 mt-1">Gunakan panel di atas untuk membuat visualisasi dari data Anda.</p>
          </div>
        )}

        {charts.map((chart) => (
          <div key={chart.id} className="bg-[#1a1a24] rounded-2xl border border-border/40 overflow-hidden shadow-xl">
            {/* Chart Header */}
            <div className="px-6 py-4 border-b border-border/30 bg-[#1e1e2d] flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {chart.config.chartType === 'bar' && <BarChart2 className="w-5 h-5 text-blue-400" />}
                {chart.config.chartType === 'line' && <LineIcon className="w-5 h-5 text-pink-400" />}
                {chart.config.chartType === 'pie' && <PieIcon className="w-5 h-5 text-purple-400" />}
                {chart.config.aggregation.toUpperCase()} {chart.config.yCol} per {chart.config.xCol}
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => downloadChart(chart.id, chart.config)} 
                  className="text-text-secondary hover:text-white p-2 bg-[#2a2a3c] rounded-lg transition-colors border border-border/50"
                  title="Download PNG"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => removeChart(chart.id)} 
                  className="text-red-400/70 hover:text-red-400 p-2 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors border border-red-400/20"
                  title="Hapus Grafik"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Chart Body */}
            <div className="p-6">
              <div id={`chart-${chart.id}`} className="h-[400px] w-full relative">
                {renderChartGraphic(chart)}
              </div>
              
              {/* Insight Section */}
              <div className="mt-6 pt-6 border-t border-border/30 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center shrink-0 border border-accent-primary/20">
                  <Sparkles className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    AI Business Insight
                  </h4>
                  {chart.insightLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-border/40 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-border/40 rounded animate-pulse w-1/2"></div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {chart.insight || "Tidak ada insight yang tersedia untuk grafik ini."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
