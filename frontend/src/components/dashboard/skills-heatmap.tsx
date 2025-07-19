// frontend/components/dashboard/SkillsHeatmap.tsx
import React, { useState, useEffect } from 'react';

interface SkillData {
  position: string;
  skill: string;
  score: number;
}

interface HeatmapData {
  [position: string]: {
    [skill: string]: number | null;
  };
}

interface SkillsHeatmapProps {
  data: SkillData[];
}

const SkillsHeatmap: React.FC<SkillsHeatmapProps> = ({ data }) => {
  // États pour stocker les données transformées
  const [positions, setPositions] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({});

  // Transformer les données pour la heatmap
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Extraire les positions uniques
    const uniquePositions = [...new Set(data.map(item => item.position))];
    setPositions(uniquePositions);

    // Extraire les compétences uniques
    const uniqueSkills = [...new Set(data.map(item => item.skill))];
    setSkills(uniqueSkills);

    // Créer la structure de données pour la heatmap
    const heatmapObj: HeatmapData = {};
    uniquePositions.forEach(position => {
      heatmapObj[position] = {};
      uniqueSkills.forEach(skill => {
        // Initialiser à null (pas de données)
        heatmapObj[position][skill] = null;
      });
    });

    // Remplir avec les données réelles
    data.forEach(item => {
      heatmapObj[item.position][item.skill] = item.score;
    });

    setHeatmapData(heatmapObj);
  }, [data]);

  // Si aucune donnée
  if (!data || data.length === 0 || positions.length === 0 || skills.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Aucune donnée de compétence à afficher.</p>
      </div>
    );
  }

  // Obtenir une couleur en fonction du score
  const getScoreColor = (score: number | null): string => {
    if (score === null) return 'bg-gray-100'; // Pas de données
    
    if (score >= 9) return 'bg-green-800 text-black';
    if (score >= 8) return 'bg-green-600 text-black';
    if (score >= 7) return 'bg-green-500 text-black';
    if (score >= 6) return 'bg-blue-500 text-black';
    if (score >= 5) return 'bg-blue-400 text-black';
    if (score >= 4) return 'bg-yellow-400 text-gray-800';
    if (score >= 3) return 'bg-yellow-300 text-gray-800';
    return 'bg-red-400 text-black';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border p-3 text-sm font-medium text-gray-500 text-left">Poste / Compétence</th>
            {skills.map(skill => (
              <th key={skill} className="border p-3 text-sm font-medium text-gray-500 text-center">
                {skill}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map(position => (
            <tr key={position}>
              <td className="border p-3 bg-gray-50 font-medium text-gray-700">{position}</td>
              {skills.map(skill => (
                <td 
                  key={`${position}-${skill}`} 
                  className={`border p-3 text-center ${getScoreColor(heatmapData[position][skill])}`}
                >
                  {heatmapData[position][skill] !== null 
                    ? heatmapData[position][skill]?.toFixed(1) 
                    : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Légende */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Légende</h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-800 mr-1"></div>
            <span className="text-xs">9-10</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-600 mr-1"></div>
            <span className="text-xs">8-8.9</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-500 mr-1"></div>
            <span className="text-xs">7-7.9</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 mr-1"></div>
            <span className="text-xs">6-6.9</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-400 mr-1"></div>
            <span className="text-xs">5-5.9</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-yellow-400 mr-1"></div>
            <span className="text-xs">4-4.9</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-yellow-300 mr-1"></div>
            <span className="text-xs">3-3.9</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-red-400 mr-1"></div>
            <span className="text-xs">0-2.9</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-100 mr-1"></div>
            <span className="text-xs">Pas de données</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsHeatmap;