// frontend/components/dashboard/CandidateScoreChart.tsx
import React, { JSX } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarProps } from 'recharts';

// Définition des interfaces
interface CandidateScore {
  name: string;
  score: number;
  position: string;
  [key: string]: any; // Pour d'autres propriétés potentielles
}

interface CandidateScoreChartProps {
  data: CandidateScore[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: CandidateScore;
    [key: string]: any;
  }>;
  label?: string;
}

interface ColorfulBarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  [key: string]: any;
}

const CandidateScoreChart: React.FC<CandidateScoreChartProps> = ({ data }) => {
  // Si aucune donnée
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Aucune donnée de score à afficher.</p>
      </div>
    );
  }

  // Fonction personnalisée pour le tooltip
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
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
  const scoreFormatter = (value: number): string => `${value.toFixed(1)}`;

  // Obtenir une couleur en fonction du score
  const getScoreColor = (score: number): string => {
    if (score >= 8) return '#10B981'; // vert
    if (score >= 6) return '#3B82F6'; // bleu
    if (score >= 4) return '#F59E0B'; // jaune
    return '#EF4444'; // rouge
  };

  // Créer des barres colorées selon le score
  const renderColorfulBar = (props: BarProps): JSX.Element => {
    const { x, y, width, height,  name} = props;
    const color = getScoreColor(name as number);
    
    return (
      <g>
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          fill={color} 
          rx={2} 
          ry={2} 
        />
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