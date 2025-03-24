// frontend/components/interview/EvaluationCard.jsx
import React from 'react';

const EvaluationCard = ({ evaluation }) => {
  // Fonction pour générer le style de couleur basé sur le score
  const getScoreColor = (score) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Fonction pour générer la barre de progression
  const ScoreBar = ({ score, label }) => {
    const percentage = (score / 5) * 100;
    
    return (
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          <span className={`text-sm font-semibold ${getScoreColor(score)}`}>{score}/5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="h-2.5 rounded-full" 
            style={{ 
              width: `${percentage}%`,
              backgroundColor: score >= 4.5 ? '#059669' : score >= 3.5 ? '#2563EB' : score >= 2.5 ? '#D97706' : '#DC2626'
            }}
          ></div>
        </div>
      </div>
    );
  };

  if (!evaluation) {
    return (
      <div className="p-4 bg-gray-50 rounded-md">
        <p className="text-gray-500 text-center">Aucune évaluation disponible.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Score global */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center rounded-full p-4 bg-gray-50">
          <span className={`text-4xl font-bold ${getScoreColor(evaluation.score_global)}`}>
            {evaluation.score_global.toFixed(1)}
          </span>
        </div>
        <h3 className="mt-2 text-xl font-semibold text-gray-800">Score global</h3>
      </div>

      {/* Scores détaillés */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 uppercase mb-3">Scores détaillés</h4>
        <ScoreBar score={evaluation.exactitude} label="Exactitude technique" />
        <ScoreBar score={evaluation.clarté} label="Clarté de communication" />
        <ScoreBar score={evaluation.profondeur} label="Profondeur de compréhension" />
      </div>

      {/* Feedback */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 uppercase mb-2">Feedback</h4>
        <p className="text-gray-700">{evaluation.feedback}</p>
      </div>

      {/* Points forts */}
      {evaluation.points_forts && evaluation.points_forts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 uppercase mb-2">Points forts</h4>
          <ul className="space-y-1">
            {evaluation.points_forts.map((point, index) => (
              <li key={index} className="flex">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Axes d'amélioration */}
      {evaluation.axes_amélioration && evaluation.axes_amélioration.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 uppercase mb-2">Axes d'amélioration</h4>
          <ul className="space-y-1">
            {evaluation.axes_amélioration.map((axe, index) => (
              <li key={index} className="flex">
                {axe !== "Parfait, aucune suggestion d'amélioration" ? (
                  <>
                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-gray-700">{axe}</span>
                  </>
                ) : (
                  <span className="text-green-600 italic">{axe}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EvaluationCard;