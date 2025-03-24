// frontend/components/resume/RecommendedQuestionsCard.jsx
import React, { useState } from 'react';

const RecommendedQuestionsCard = ({ questions = [] }) => {
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState(-1);

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500 italic">Aucune question recommandée disponible.</p>
      </div>
    );
  }

  // Fonction pour basculer l'affichage des détails d'une question
  const toggleQuestionDetails = (index) => {
    if (expandedQuestionIndex === index) {
      setExpandedQuestionIndex(-1); // Fermer si déjà ouvert
    } else {
      setExpandedQuestionIndex(index); // Ouvrir le nouveau
    }
  };

  // Fonction pour copier la question dans le presse-papiers
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Feedback visuel temporaire (pourrait être amélioré avec un toast)
        alert('Question copiée dans le presse-papiers');
      },
      (err) => {
        console.error('Erreur lors de la copie :', err);
      }
    );
  };

  return (
    <div className="recommended-questions-card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-800">Questions d'entretien recommandées</h3>
        <p className="text-sm text-gray-500">{questions.length} question{questions.length > 1 ? 's' : ''}</p>
      </div>
      
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div 
            key={index} 
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* En-tête de la question */}
            <div 
              className="flex items-start justify-between p-4 cursor-pointer bg-white hover:bg-gray-50"
              onClick={() => toggleQuestionDetails(index)}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-800">{question.question}</div>
                
                {/* Afficher les tags si disponibles */}
                {question.type && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {question.type && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {question.type}
                      </span>
                    )}
                    {question.difficulty && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        question.difficulty === 'facile' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                    )}
                    {question.skill_to_assess && (
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        {question.skill_to_assess}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0 flex items-center">
                <button 
                  className="text-gray-400 hover:text-primary-600 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(question.question);
                  }}
                  title="Copier la question"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
                <button 
                  className="text-gray-400 hover:text-primary-600 p-1 ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleQuestionDetails(index);
                  }}
                  title={expandedQuestionIndex === index ? "Réduire" : "Voir plus"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${expandedQuestionIndex === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Détails de la question (rationale et éléments de réponse attendus) */}
            {expandedQuestionIndex === index && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                {/* Raison de la question */}
                {question.rationale && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Pourquoi poser cette question</h4>
                    <p className="text-sm text-gray-600">{question.rationale}</p>
                  </div>
                )}
                
                {/* Éléments de réponse attendus */}
                {question.expected_answer_elements && question.expected_answer_elements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Éléments de réponse attendus</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {question.expected_answer_elements.map((element, idx) => (
                        <li key={idx}>{element}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Bouton pour utiliser cette question dans un entretien */}
                <div className="mt-4 text-right">
                  <button
                    className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Ici, vous pourriez implémenter la fonctionnalité pour ajouter
                      // cette question à un entretien existant ou en créer un nouveau
                      alert('Fonctionnalité à venir : Ajouter cette question à un entretien');
                    }}
                  >
                    Utiliser cette question
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedQuestionsCard;