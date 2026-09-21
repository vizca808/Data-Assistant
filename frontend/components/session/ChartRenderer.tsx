"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";

interface ChartRendererProps {
  chartData: string; // JSON string from AI
}

const COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f43f5e', '#eab308'];

export function ChartRenderer({ chartData }: ChartRendererProps) {
  let config: any = null;
  try {
    config = JSON.parse(chartData);
  } catch (e) {
    return <div className="p-4 text-error text-sm bg-error/10 rounded-lg">Failed to parse chart data</div>;
  }

  if (!config || !config.type || !config.data || !Array.isArray(config.data)) {
    return <div className="p-4 text-error text-sm bg-error/10 rounded-lg">Invalid chart configuration</div>;
  }

  const { type, title, data } = config;

  // Extract keys for mapping lines/bars, assume first key is X axis (often 'name')
  // and the rest are values
  const keys = Object.keys(data[0] || {}).filter(k => k !== 'name');

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {keys.map((key, idx) => (
                <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {keys.map((key, idx) => (
                <Line type="monotone" key={key} dataKey={key} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {keys.map((key, idx) => (
                <Area type="monotone" key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} stroke={COLORS[idx % COLORS.length]} fillOpacity={0.3} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'pie':
        // For pie chart, usually only 1 value key is needed
        const valKey = keys[0];
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Pie
                data={data}
                dataKey={valKey}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={type === 'donut' ? 60 : 0}
                fill="#8884d8"
                label={false}
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <div className="p-4 text-text-secondary text-sm">Unsupported chart type: {type}</div>;
    }
  };

  return (
    <div className="mt-4 p-4 rounded-xl bg-bg-card border border-border">
      {title && <h4 className="text-sm font-semibold text-text-primary mb-4 text-center">{title}</h4>}
      {renderChart()}
    </div>
  );
}
