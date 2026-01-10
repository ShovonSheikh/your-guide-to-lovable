import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyEarning {
  month_start: string;
  month_label: string;
  total_amount: number;
  tip_count: number;
  unique_supporters: number;
}

interface EarningsChartProps {
  data: MonthlyEarning[];
  loading?: boolean;
}

export function EarningsChart({ data, loading }: EarningsChartProps) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
        <p>No earnings data yet</p>
        <p className="text-sm mt-1">Your earnings history will appear here.</p>
      </div>
    );
  }

  // Reverse to show oldest to newest
  const chartData = [...data].reverse().map(d => ({
    name: d.month_label || new Date(d.month_start).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    amount: d.total_amount,
    tips: d.tip_count,
    supporters: d.unique_supporters,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-primary font-bold">৳{payload[0].value}</p>
          <p className="text-xs text-muted-foreground">
            {payload[0].payload.tips} tips from {payload[0].payload.supporters} supporters
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => `৳${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAmount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
