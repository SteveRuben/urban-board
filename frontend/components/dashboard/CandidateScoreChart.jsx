// frontend/components/dashboard/CandidateScoreChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CandidateScoreChart = ({ data }) => {
  // Si aucune donnée
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Aucune donnée de score à afficher.</p>
      </div>
    );
  }

  // Fonction personnalisée pour le tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-md">
          <p className="font-medium text-gray-800">{label}</p>
          <p className="text-sm text-gray-600">{payload[0].payload.position}</p>
          <p className="font-medium text-primary-600">Score: {payload[0].value.toFixed(1)}/10</p>
        </div>
      );
    }
    return null;
  };

  // Formatter pour afficher un score sur 10
  const scoreFormatter = (value) => `${value.toFixed(1)}`;

  // Obtenir une couleur en fonction du score
  const getScoreColor = (score) => {
    if (score >= 8) return '#10B981'; // vert
    if (score >= 6) return '#3B82F6'; // bleu
    if (score >= 4) return '#F59E0B'; // jaune
    return '#EF4444'; // rouge
  };

  // Créer des barres colorées selon le score
  const renderColorfulBar = (props) => {
    const { x, y, width, height, value } = props;
    const color = getScoreColor(value);
    
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={color} rx={2} ry={2} />
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis 
          type="number" 
          domain={[0, 10]} 
          tickCount={6} 
          tick={{ fontSize: 12 }}
          tickFormatter={scoreFormatter}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={100}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="score" 
          name="Score du candidat" 
          radius={[0, 4, 4, 0]}
          barSize={16}
          shape={renderColorfulBar}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CandidateScoreChart;