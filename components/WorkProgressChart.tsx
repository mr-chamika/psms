'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface WorkProgressDataPoint {
    name: string;
    value: number;
    color: string;
}

interface WorkProgressChartProps {
    data: WorkProgressDataPoint[];
    title?: string;
}

export function WorkProgressChart({ data, title = 'Current Week Work Progress' }: WorkProgressChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    return (
        <div className="stat-card animate-slide-up bg-white p-5 rounded-2xl" style={{ animationDelay: '300ms' }}>
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">Overall order status distribution</p>
            </div>
            <div className="h-70 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={100}
                            paddingAngle={4}
                            dataKey="value"
                            label={({ value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                                if (value === 0 || midAngle == null || cx == null || cy == null || innerRadius == null || outerRadius == null) return null
                                const RADIAN = Math.PI / 180
                                const radius = innerRadius + (outerRadius - innerRadius) / 2
                                const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                const y = cy + radius * Math.sin(-midAngle * RADIAN)
                                return (
                                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600} fill="#ffffff">
                                        {total > 0 ? Math.round((value / total) * 100) : 0}% ({value})
                                    </text>

                                )
                            }}
                            labelLine={false}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(0, 0%, 100%)',
                                border: '1px solid hsl(220, 13%, 91%)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                            }}
                            formatter={(value) => [`${value} orders`, '']}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => {
                                const item = data.find(d => d.name === value)
                                return (
                                    <span style={{ color: 'hsl(222, 47%, 11%)', fontSize: '12px' }}>
                                        {value} ({item?.value ?? 0})
                                    </span>
                                )
                            }}

                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Overlay total in donut center */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    style={{ paddingBottom: '36px' }}
                >
                    <span className="text-2xl font-bold text-foreground">{total}</span>
                    <span className="text-xs text-muted-foreground">Total Orders</span>
                </div>
            </div>
        </div>
    );
}
