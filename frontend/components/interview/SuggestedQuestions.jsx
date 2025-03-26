// frontend/components/interview/SuggestedQuestions.jsx
import React from 'react';
import { RefreshCw, Check, Code, Users } from 'lucide-react';

/**
 * Composant qui affiche les questions suggérées par l'IA en mode collaboratif
 */
const SuggestedQuestions = ({ questions, onUseQuestion, onRequestNewSuggestion }) => {
  const questionTypeIconMap = {
    technical: <Code size={16} className="text-blue-600" />,
    behavioral: <Users size={16} className="text-green-600" />,
    problem_solving: <Code size={16} className="text-purple-600" />,
    experience: <Users size={16} className="text-amber-600" />,
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500 mb-4">Aucune question suggérée actuellement</p>
        <button
          onClick={onRequestNewSuggestion}
          className="inline-flex items-center px-3 py-2 text-sm font-medium bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100"
        >
          <RefreshCw size={16} className="mr-2" />
          Demander une suggestion
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="max-h-72 overflow-y-auto">
        {questions.map((question) => (
          <div
            key={question.id}
            className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200 transition-colors hover:border-primary-300"
          >
            <div className="mb-2 flex items-center text-sm text-gray-500">
              <span className="mr-1">
                {questionTypeIconMap[question.type] || questionTypeIconMap.technical}
              </span>
              <span className="capitalize">
                {question.type === 'technical' ? 'Technique' : 
                 question.type === 'behavioral' ? 'Comportemental' : 
                 question.type === 'problem_solving' ? 'Résolution de problème' : 
                 question.type === 'experience' ? 'Expérience' : 
                 question.type}
              </span>
            </div>
            <p className="text-gray-800 text-sm mb-2">{question.question}</p>
            <div className="flex justify-end">
              <button
                onClick={() => onUseQuestion(question)}
                className="flex items-center text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                <Check size={14} className="mr-1" />
                Utiliser
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center pt-2">
        <button
          onClick={onRequestNewSuggestion}
          className="inline-flex items-center px-3 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
        >
          <RefreshCw size={16} className="mr-2" />
          Plus de suggestions
        </button>
      </div>
    </div>
  );
};

export default SuggestedQuestions;