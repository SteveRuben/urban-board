// frontend/components/dashboard/JobPositionPieChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Définition des interfaces
interface DataEntry {
  name: string;
  value: number;
  // D'autres propriétés optionnelles si nécessaire
}

interface JobPositionPieChartProps {
  data: DataEntry[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: DataEntry;
    // Autres propriétés renvoyées par recharts
  }>;
}

interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
  index: number;
}

const JobPositionPieChart: React.FC<JobPositionPieChartProps> = ({ data }) => {
  // Si aucune donnée
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Aucune donnée de poste à afficher.</p>
      </div>
    );
  }

  // Couleurs pour les différentes parties du camembert
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  // Fonction personnalisée pour le tooltip
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-md">
          <p className="font-medium text-gray-800">{payload[0].name}</p>
          <p className="text-primary-600 font-medium">{payload[0].value} entretien(s)</p>
          <p className="text-sm text-gray-600">
            {Math.round((payload[0].value / data.reduce((sum, entry) => sum + entry.value, 0)) * 100)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Fonction personnalisée pour les labels du camembert
  const renderCustomizedLabel = (props: PieLabelProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, index } = props;
    
    // Ne pas afficher les labels si le secteur est trop petit
    if (percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right"
          wrapperStyle={{ fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default JobPositionPieChart;