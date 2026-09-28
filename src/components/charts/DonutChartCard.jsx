// Donut chart card with legend (Recharts, theme-aware colours passed in).

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { chartTooltipProps } from "../../config/chartThemes";
import { percentOf } from "../../utils/numbers";

// Donut + legend used for the two categorical charts (real API values).
export function DonutChartCard({ title, subtitle, data, colors, centerLabel }) {
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  return (
    <div className="chart-card">
      <div className="card-header">
        <div>
          <h4>{title}</h4>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="donut-wrap">
        <div className="donut-box">
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={78}
                paddingAngle={total > 0 && data.filter((d) => d.value > 0).length > 1 ? 3 : 0}
                cornerRadius={6}
                stroke="none"
              >
                {data.map((entry, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip {...chartTooltipProps} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <strong>{total}</strong>
            <span>{centerLabel}</span>
          </div>
        </div>
        <ul className="chart-legend">
          {data.map((d, i) => {
            const pct = percentOf(d.value, total);
            return (
              <li key={d.name}>
                <span className="legend-dot" style={{ background: colors[i % colors.length] }} />
                <span className="legend-name">{d.name}</span>
                <span className="legend-value">
                  {d.value}
                  {pct != null && <span className="legend-pct">{pct}%</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
