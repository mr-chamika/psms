'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OrderTypeDataPoint {
    name: string;
    count: number;
    color: string;
}

interface OrderTypeSummaryChartProps {
    data: OrderTypeDataPoint[];
}

export function OrderTypeSummaryChart({ data }: OrderTypeSummaryChartProps) {
    return (
        <div className="bg-white w-full h-full p-6 rounded-2xl shadow-2xs border border-gray-100 animate-slide-up min-h-120" style={{ animationDelay: '350ms' }}>
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">Daily Order Type Summary</h3>
            </div>
            <div className="h-full w-full  pb-6 pr-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            width={80}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                            }}
                            formatter={(value: number | undefined) => [`${value} orders`, '']}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
