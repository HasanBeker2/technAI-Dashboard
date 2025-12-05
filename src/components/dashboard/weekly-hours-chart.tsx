'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts'

interface WeeklyHoursChartProps {
    data: {
        name: string
        hours: number
    }[]
    totalHours: number
}

export function WeeklyHoursChart({ data, totalHours }: WeeklyHoursChartProps) {
    return (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Timesheet Widget</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Weekly Hours Overview
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold gradient-text">{totalHours} Hours</p>
                </div>
            </div>

            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barCategoryGap="20%">
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(180, 100%, 50%)" stopOpacity={1} />
                                <stop offset="100%" stopColor="hsl(200, 98%, 39%)" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(217, 33%, 17%)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
                            tickFormatter={(value) => `${value}h`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(222, 47%, 8%)',
                                border: '1px solid hsl(217, 33%, 17%)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                            }}
                            labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                            formatter={(value: number) => [`${value}h`, 'Hours']}
                        />
                        <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={50}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.hours > 0 ? 'url(#barGradient)' : 'hsl(217, 33%, 17%)'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Day labels with hours */}
            <div className="mt-4 flex justify-between text-center">
                {data.map((day) => (
                    <div key={day.name} className="flex-1">
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {day.name}:
                        </p>
                        <p className="text-sm font-medium">
                            {day.hours > 0 ? `${day.hours}h` : '-'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}
