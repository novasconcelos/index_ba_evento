"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function StatusDonut({ data }: { data: Slice[] }) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="label"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {filtered.map((d) => (
            <Cell key={d.label} fill={d.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function StagesBar({ data }: { data: Slice[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <XAxis type="number" allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={150}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
