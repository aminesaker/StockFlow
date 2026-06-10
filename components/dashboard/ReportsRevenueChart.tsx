'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

type Point = { bucket: string; amount: number }

const fmtEur = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k €` : `${n.toFixed(0)} €`

function fmtTick(bucket: string, granularity: 'day' | 'month') {
  // bucket = "YYYY-MM-DD" ou "YYYY-MM"
  const parts = bucket.split('-')
  if (granularity === 'month') return `${parts[1]}/${parts[0].slice(2)}`
  return `${parts[2]}/${parts[1]}`
}

export default function ReportsRevenueChart({
  data, granularity,
}: { data: Point[]; granularity: 'day' | 'month' }) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Aucune vente sur la période
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
        <XAxis
          dataKey="bucket"
          tickFormatter={(b) => fmtTick(b, granularity)}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtEur} width={56} />
        <Tooltip
          formatter={(v: number) => [`${Number(v).toFixed(2)} €`, 'CA']}
          labelFormatter={(b: string) => fmtTick(b, granularity)}
          contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 12 }}
        />
        <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#rev)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
