// frontend/components/interview/Question.jsx
import React from 'react';

const Question = ({ question, index }) => {
  // Définir les couleurs en fonction de la difficulté
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'facile':
        return 'bg-green-100 text-green-800';
      case 'moyenne':
        return 'bg-yellow-100 text-yellow-800';
      case 'difficile':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Éviter les erreurs si la question n'est pas définie
  if (!question) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">Aucune question disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <span className="font-bold text-gray-600">Q{index + 1}:</span>
        {question.difficulty && (
          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
        )}
        {question.category && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
            {question.category}
          </span>
        )}
      </div>
      
      <h3 className="text-xl font-medium text-gray-800">{question.question}</h3>
      
      {question.description && (
        <p className="text-gray-600 mt-2">{question.description}</p>
      )}
      
      {/* Conseils ou contexte supplémentaire (optionnel) */}
      {question.hint && (
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{question.hint}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Question;