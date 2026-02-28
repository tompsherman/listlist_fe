/**
 * LineChart Component
 * Line chart for trends over time.
 * Wraps recharts for simple data array consumption.
 */

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './Charts.css';

export default function LineChart({
  data,
  xKey = 'name',
  lines = [{ key: 'value', color: 'var(--color-primary)' }],
  height = 300,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  className = '',
}) {
  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
          <XAxis
            dataKey={xKey}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            stroke="var(--color-border)"
          />
          <YAxis
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            stroke="var(--color-border)"
          />
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
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name={line.name || line.key}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
