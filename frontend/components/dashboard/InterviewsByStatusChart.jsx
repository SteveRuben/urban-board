// frontend/components/dashboard/InterviewsByStatusChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const InterviewsByStatusChart = ({ data }) => {
  // Si aucune donnée
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Aucune donnée de statut à afficher.</p>
      </div>
    );
  }

  // Couleurs pour les différents statuts
  const STATUS_COLORS = {
    'Planifiés': '#3B82F6', // bleu
    'En cours': '#F59E0B', // jaune
    'Terminés': '#10B981', // vert
    'Annulés': '#EF4444', // rouge
  };

  // Fonction personnalisée pour le tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-md">
          <p className="font-medium text-gray-800">{payload[0].name}</p>
          <p className="font-medium" style={{ color: payload[0].color }}>
            {payload[0].value} entretien(s)
          </p>
          <p className="text-sm text-gray-600">
            {Math.round((payload[0].value / data.reduce((sum, entry) => sum + entry.value, 0)) * 100)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Fonction pour obtenir la couleur selon le statut
  const getColor = (status) => {
    return STATUS_COLORS[status] || '#9CA3AF'; // gris par défaut
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getColor(entry.name)} 
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          align="center"
          layout="horizontal"
          wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default InterviewsByStatusChart;