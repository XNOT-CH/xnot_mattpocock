"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#4b5563",
  "#ea580c",
];

function formatBaht(amount: number) {
  return amount.toLocaleString("th-TH", { minimumFractionDigits: 0 });
}

export function ExpenseByCategoryPie({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">ยังไม่มีรายจ่ายเดือนนี้</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={(entry) => entry.name}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatBaht(Number(value))} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendBar({
  data,
}: {
  data: { month: string; รายรับ: number; รายจ่าย: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ bottom: 16 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          fontSize={12}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={40}
          tick={{ fill: "#64748b" }}
        />
        <YAxis fontSize={12} tickFormatter={formatBaht} tick={{ fill: "#64748b" }} />
        <Tooltip formatter={(value) => formatBaht(Number(value))} />
        <Legend />
        <Bar dataKey="รายรับ" fill="#059669" />
        <Bar dataKey="รายจ่าย" fill="#e11d48" />
      </BarChart>
    </ResponsiveContainer>
  );
}
