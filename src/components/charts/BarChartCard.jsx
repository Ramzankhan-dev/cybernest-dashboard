// Bar chart card with gradient bars (Recharts, theme-aware).

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartTooltipProps } from "../../config/chartThemes";

export function BarChartCard({ title, subtitle, data, dataKeyX, gradientId, gradient, chartTheme }) {
  return (
    <div className="chart-card">
      <div className="card-header">
        <div>
          <h4>{title}</h4>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradient[0]} stopOpacity={1} />
              <stop offset="100%" stopColor={gradient[1]} stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeDasharray="3 4" />
          <XAxis dataKey={dataKeyX} fontSize={11} tick={{ fill: chartTheme.axis }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} fontSize={11} tick={{ fill: chartTheme.axis }} axisLine={false} tickLine={false} />
          <Tooltip {...chartTooltipProps} cursor={{ fill: chartTheme.cursor }} />
          <Bar dataKey="count" fill={`url(#${gradientId})`} radius={[8, 8, 3, 3]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
