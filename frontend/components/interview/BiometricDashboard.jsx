// frontend/components/interview/BiometricDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const EMOTION_COLORS = {
  neutral: '#9ca3af',  // gray-400
  happy: '#34d399',    // green-400
  sad: '#60a5fa',      // blue-400
  angry: '#f87171',    // red-400
  surprised: '#fbbf24', // yellow-400
  fearful: '#a78bfa',  // purple-400
  disgusted: '#6ee7b7'  // emerald-400
};

const SCORE_COLORS = {
  low: '#f87171',      // red-400
  medium: '#fbbf24',   // yellow-400
  high: '#34d399'      // green-400
};

const BiometricDashboard = ({ biometricData, recordingHistory = [] }) => {
  const [emotionData, setEmotionData] = useState([]);
  const [engagementScores, setEngagementScores] = useState([]);
  const [emotionHistory, setEmotionHistory] = useState([]);
  
  // Préparer les données d'émotion pour le graphique circulaire
  useEffect(() => {
    if (biometricData?.emotions) {
      const data = Object.entries(biometricData.emotions)
        .filter(([_, value]) => value > 0.05) // Ignore les émotions négligeables
        .map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), // Capitaliser
          value: Math.round(value * 100)
        }))
        .sort((a, b) => b.value - a.value); // Trier par valeur décroissante
      
      setEmotionData(data);
    }
  }, [biometricData]);
  
  // Préparer les scores d'engagement pour le graphique à barres
  useEffect(() => {
    if (biometricData?.engagement) {
      const engagementMap = {
        "Faible": 1,
        "Moyen": 2,
        "Bon": 3,
        "Excellent": 4
      };
      
      const data = Object.entries(biometricData.engagement).map(([key, value]) => ({
        name: key === 'eyeContact' ? 'Contact visuel' : 
              key === 'posture' ? 'Posture' :
              key === 'gestures' ? 'Gestuelle' : 'Attention',
        score: engagementMap[value] || 0,
        rawValue: value
      }));
      
      setEngagementScores(data);
    }
  }, [biometricData]);
  
  // Préparer l'historique des émotions pour le graphique d'évolution
  useEffect(() => {
    if (recordingHistory.length > 0) {
      const history = recordingHistory.map((record, index) => {
        const emotions = record.emotions || {};
        return {
          time: `T${index+1}`,
          ...Object.entries(emotions).reduce((acc, [emotion, value]) => {
            acc[emotion] = Math.round(value * 100);
            return acc;
          }, {})
        };
      });
      
      setEmotionHistory(history);
    }
  }, [recordingHistory]);

  // Obtenir la couleur d'un score d'engagement
  const getScoreColor = (score) => {
    if (score <= 1) return SCORE_COLORS.low;
    if (score <= 2) return SCORE_COLORS.medium;
    return SCORE_COLORS.high;
  };
  
  // Si pas de données
  if (!biometricData) {
    return (
      <div className="p-4 text-center text-gray-500">
        Aucune donnée biométrique disponible
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Analyse biométrique en temps réel</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Graphique circulaire des émotions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Distribution des émotions</h4>
          {emotionData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emotionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {emotionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={EMOTION_COLORS[entry.name.toLowerCase()] || '#9ca3af'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">Pas assez de données</p>
            </div>
          )}
        </div>
        
        {/* Graphique à barres d'engagement */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Indicateurs d'engagement</h4>
          {engagementScores.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={engagementScores}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 4]} tickCount={5} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value, name, props) => [props.payload.rawValue, 'Niveau']}
                    labelFormatter={() => ''}
                  />
                  <Bar dataKey="score" name="Niveau">
                    {engagementScores.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getScoreColor(entry.score)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">Pas assez de données</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Résumé des observations */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Observations clés</h4>
        
        <ul className="space-y-2 text-sm">
          {/* Émotion dominante */}
          {emotionData.length > 0 && (
            <li className="flex items-start">
              <div className={`h-4 w-4 mt-0.5 rounded-full bg-${EMOTION_COLORS[emotionData[0].name.toLowerCase()] || 'gray-400'} mr-2`}></div>
              <span>
                <strong>Émotion dominante:</strong> {emotionData[0].name} ({emotionData[0].value}%) - 
                {emotionData[0].name.toLowerCase() === 'neutral' 
                  ? " Le candidat maintient une expression neutre." 
                  : emotionData[0].name.toLowerCase() === 'happy'
                    ? " Le candidat montre de l'enthousiasme et de la confiance."
                    : emotionData[0].name.toLowerCase() === 'surprised'
                    ? " Le candidat semble surpris par certaines questions."
                    : emotionData[0].name.toLowerCase() === 'sad'
                    ? " Le candidat peut sembler hésitant ou préoccupé."
                    : " Émotion notable à observer."}
              </span>
            </li>
          )}
          
          {/* Force d'engagement */}
          {engagementScores.length > 0 && (
            <li className="flex items-start">
              <div className="h-4 w-4 mt-0.5 rounded-full bg-blue-400 mr-2"></div>
              <span>
                <strong>Point fort d'engagement:</strong> {
                  engagementScores.sort((a, b) => b.score - a.score)[0].name
                } - {
                  engagementScores.sort((a, b) => b.score - a.score)[0].rawValue
                }
              </span>
            </li>
          )}
          
          {/* Point faible d'engagement */}
          {engagementScores.length > 0 && (
            <li className="flex items-start">
              <div className="h-4 w-4 mt-0.5 rounded-full bg-yellow-400 mr-2"></div>
              <span>
                <strong>Point à améliorer:</strong> {
                  engagementScores.sort((a, b) => a.score - b.score)[0].name
                } - {
                  engagementScores.sort((a, b) => a.score - b.score)[0].rawValue
                }
              </span>
            </li>
          )}
          
          {/* Conseils */}
          <li className="flex items-start mt-4">
            <div className="h-4 w-4 mt-0.5 rounded-full bg-green-400 mr-2"></div>
            <span>
              <strong>Conseil:</strong> {
                engagementScores.sort((a, b) => a.score - b.score)[0].name === 'Contact visuel'
                  ? "Encouragez le candidat à maintenir davantage de contact visuel."
                  : engagementScores.sort((a, b) => a.score - b.score)[0].name === 'Posture'
                  ? "Suggérez au candidat d'adopter une posture plus ouverte et engagée."
                  : engagementScores.sort((a, b) => a.score - b.score)[0].name === 'Gestuelle'
                  ? "Invitez le candidat à utiliser plus de gestes pour illustrer ses propos."
                  : "Posez des questions qui suscitent davantage l'intérêt du candidat."
              }
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BiometricDashboard;