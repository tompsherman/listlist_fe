/**
 * BarChart Component
 * Bar chart for comparisons.
 * Wraps recharts for simple data array consumption.
 */

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './Charts.css';

export default function BarChart({
  data,
  xKey = 'name',
  bars = [{ key: 'value', color: 'var(--color-primary)' }],
  height = 300,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  layout = 'horizontal',
  className = '',
}) {
  // Guard against undefined/empty data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className={`chart-container ${className}`} style={{ height }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
          No data
        </div>
      </div>
    );
  }

  const isVertical = layout === 'vertical';

  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} layout={layout}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
          {isVertical ? (
            <>
              <XAxis
                type="number"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                stroke="var(--color-border)"
              />
              <YAxis
                dataKey={xKey}
                type="category"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                stroke="var(--color-border)"
                width={80}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                stroke="var(--color-border)"
              />
              <YAxis
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                stroke="var(--color-border)"
              />
            </>
          )}
          {showTooltip && (
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
              }}
            />
          )}
          {showLegend && <Legend />}
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              fill={bar.color}
              radius={[4, 4, 0, 0]}
              name={bar.name || bar.key}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
