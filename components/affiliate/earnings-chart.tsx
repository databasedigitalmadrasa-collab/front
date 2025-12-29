"use client"

import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


function CustomTooltip({
  active,
  payload,
  label,
}: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">
          Earnings: <span className="font-medium text-foreground">₹{payload[0].value.toLocaleString()}</span>
        </p>
      </div>
    )
  }
  return null
}

export interface EarningsChartProps {
  data?: { date: string; amount: number }[]
}

export function EarningsChart({ data = [] }: EarningsChartProps) {
  // Map backend data (date, amount) to Chart data (month, earnings)
  // Backend returns date 'YYYY-MM-DD'. We will format it to 'DD MMM'.
  const chartData = data.length > 0
    ? data.map(item => ({
      month: new Date(item.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
      earnings: item.amount
    }))
    : [
      // Empty state or default empty for visual?
      // Leaving empty data results in empty chart. 
      // User asked to remove default values. So if no data, empty chart.
    ]

  return (
    <Card className="bg-white border-gray-200 rounded-xl sm:rounded-2xl shadow-sm">
      <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-heading font-bold text-gray-900">Earnings Overview</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-gray-600">
          Your daily earnings earning_overview_graph trend (INR)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-4">
        <div className="h-[200px] sm:h-[280px] md:h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={9} tick={{ fontSize: 9 }} tickMargin={8} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={9}
                  tick={{ fontSize: 9 }}
                  tickMargin={5}
                  width={45}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="earnings" stroke="#0066ff" strokeWidth={2} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No earnings data yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
