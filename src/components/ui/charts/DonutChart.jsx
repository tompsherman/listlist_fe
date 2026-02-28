/**
 * DonutChart Component
 * Donut/pie chart for proportions.
 * Wraps recharts for simple data array consumption.
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './Charts.css';

const DEFAULT_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  'var(--color-info)',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
];

export default function DonutChart({
  data,
  nameKey = 'name',
  valueKey = 'value',
  colors = DEFAULT_COLORS,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true,
  showTooltip = true,
  showLabels = false,
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

  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey={valueKey}
            nameKey={nameKey}
            label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
            labelLine={showLabels}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || colors[index % colors.length]}
              />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
              }}
              formatter={(value, name) => [value, name]}
            />
          )}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12 }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
