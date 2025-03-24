// frontend/components/resume/FitScoreCard.jsx
import React from 'react';

const FitScoreCard = ({ score, justification }) => {
  // Fonction pour déterminer la couleur du score
  const getScoreColor = (score) => {
    if (score >= 8.5) return 'bg-green-500';
    if (score >= 7) return 'bg-blue-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Fonction pour déterminer le texte d'évaluation
  const getEvaluationText = (score) => {
    if (score >= 8.5) return 'Excellente adéquation';
    if (score >= 7) return 'Bonne adéquation';
    if (score >= 5) return 'Adéquation moyenne';
    return 'Adéquation faible';
  };

  // Calculer le pourcentage pour la barre de progression
  const scorePercentage = (score / 10) * 100;

  return (
    <div className="fit-score-card">
      <h3 className="text-md font-medium text-gray-800 mb-3">Adéquation au poste</h3>
      
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
        {/* Score circulaire */}
        <div className="flex items-center justify-center">
          <div className="relative w-24 h-24">
            {/* Cercle de fond */}
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#eee"
                strokeWidth="3"
                strokeDasharray="100, 100"
              />
              {/* Cercle de score */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={getScoreColor(score).replace('bg-', 'stroke-')}
                strokeWidth="3"
                strokeDasharray={`${scorePercentage}, 100`}
                className={getScoreColor(score)}
              />
              {/* Texte du score */}
              <text x="18" y="20.35" className="score-text text-3xl font-bold" textAnchor="middle">
                {score}
              </text>
            </svg>
          </div>
        </div>
        
        {/* Description du score */}
        <div className="flex-1">
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Score d'adéquation</span>
              <span className={`text-sm font-semibold ${
                score >= 8.5 ? 'text-green-600' : 
                score >= 7 ? 'text-blue-600' : 
                score >= 5 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {score}/10
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${getScoreColor(score)}`}
                style={{ width: `${scorePercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-2">
            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
              score >= 8.5 ? 'bg-green-100 text-green-800' : 
              score >= 7 ? 'bg-blue-100 text-blue-800' : 
              score >= 5 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {getEvaluationText(score)}
            </span>
            
            {justification && (
              <p className="mt-2 text-gray-600 text-sm">{justification}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitScoreCard;