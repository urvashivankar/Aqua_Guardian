import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StatusPieChartProps {
    data: Array<{ status: string; count: number }>;
}

const COLORS = {
    'Pending': '#f59e0b',    // Amber
    'Investigating': '#3b82f6', // Blue
    'Verified': '#8b5cf6',   // Violet
    'Resolved': '#10b981'    // Emerald
};

const StatusPieChart: React.FC<StatusPieChartProps> = ({ data }) => {
    const formattedData = data.map(item => ({
        name: item.status,
        value: item.count
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={formattedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                >
                    {formattedData.map((entry, index) => (
                        // @ts-ignore
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                    }}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default StatusPieChart;
