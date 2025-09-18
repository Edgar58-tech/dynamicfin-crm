
'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface ChartComponentProps {
  type: 'pie' | 'bar' | 'line' | 'funnel';
  data: ChartData[];
  height?: number;
  showLegend?: boolean;
}

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#80D8C3', '#A19AD3', '#72BF78'];

export default function ChartComponent({ 
  type, 
  data, 
  height = 300, 
  showLegend = true 
}: ChartComponentProps) {
  
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-50 rounded-lg text-slate-500"
        style={{ height }}
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-2"></div>
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const formatTooltip = (value: any, name: any) => {
    if (typeof value === 'number') {
      return [value.toLocaleString(), name];
    }
    return [value, name];
  };

  switch (type) {
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      );

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tickLine={false}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickLine={false}
              tick={{ fontSize: 10 }}
            />
            <Tooltip 
              formatter={formatTooltip}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '6px',
                fontSize: '11px'
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
            <Bar 
              dataKey="value" 
              fill="#60B5FF" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tickLine={false}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              tickLine={false}
              tick={{ fontSize: 10 }}
            />
            <Tooltip 
              formatter={formatTooltip}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '6px',
                fontSize: '11px'
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#60B5FF" 
              strokeWidth={2}
              dot={{ fill: '#60B5FF', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'funnel':
      // Para el funnel, usaremos un bar chart horizontal
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tickLine={false} tick={{ fontSize: 10 }} />
            <YAxis 
              dataKey="name" 
              type="category" 
              tickLine={false}
              tick={{ fontSize: 10 }}
              width={70}
            />
            <Tooltip 
              formatter={formatTooltip}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '6px',
                fontSize: '11px'
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || COLORS[index % COLORS.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
}
