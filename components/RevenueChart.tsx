'use client'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { formatPrice } from '@/lib/utils';

interface RevenueDataPoint {
    name: string;
    revenue: number;
    pending: number;
}

interface RevenueChartProps {
    data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
    return (
        <div className="stat-card animate-slide-up bg-white p-5 rounded-2xl" style={{ animationDelay: '200ms' }}>
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Revenue Overview</h3>
                <p className="text-sm text-muted-foreground">Collected vs Pending by Day</p>
            </div>
            <div className="h-75 pr-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(263, 70%, 50%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(263, 70%, 50%)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(215, 50%, 23%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(215, 50%, 23%)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
                            axisLine={{ stroke: 'hsl(220, 13%, 91%)' }}
                        />
                        <YAxis
                            tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
                            axisLine={{ stroke: 'hsl(220, 13%, 91%)' }}
                            tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(0, 0%, 100%)',
                                border: '1px solid hsl(220, 13%, 91%)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                            }}
                            formatter={(value: number | undefined) => [`LKR ${formatPrice(value ?? 0)}`, '']}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '12px', paddingBottom: '8px' }}
                        />

                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="hsl(263, 70%, 50%)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            name="Revenue"
                        />
                        <Area
                            type="monotone"
                            dataKey="pending"
                            stroke="hsl(215, 50%, 23%)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPending)"
                            name="Pending"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
