import React from 'react';

interface HeatmapProps {
  correlation: Record<string, Record<string, number>>;
}

export function Heatmap({ correlation }: HeatmapProps) {
  const keys = Object.keys(correlation);
  if (keys.length < 2) return null;

  const getColor = (val: number): string => {
    if (val > 0) {
      return `rgba(16, 185, 129, ${val * 0.8})`;
    } else if (val < 0) {
      return `rgba(239, 68, 68, ${Math.abs(val) * 0.8})`;
    }
    return 'rgba(0,0,0,0)';
  };

  return (
    <div className="w-full overflow-x-auto custom-scrollbar pb-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-2 border border-zinc-700/50 bg-bg-secondary sticky left-0 z-10"></th>
            {keys.map((k) => (
              <th key={k} className="p-2 border border-zinc-700/50 font-medium text-text-secondary whitespace-nowrap bg-bg-secondary/50">
                {k.length > 15 ? k.substring(0, 15) + '...' : k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((rowKey) => (
            <tr key={rowKey}>
              <td className="p-2 border border-zinc-700/50 font-medium text-text-secondary whitespace-nowrap bg-bg-secondary sticky left-0 z-10">
                {rowKey.length > 15 ? rowKey.substring(0, 15) + '...' : rowKey}
              </td>
              {keys.map((colKey) => {
                const val = correlation[rowKey][colKey];
                return (
                  <td
                    key={colKey}
                    className="p-3 border border-zinc-700/50 text-center relative group cursor-default transition-colors hover:border-white"
                    style={{ backgroundColor: getColor(val) }}
                  >
                    <span className="font-mono font-medium drop-shadow-md text-white mix-blend-difference">{val.toFixed(2)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
