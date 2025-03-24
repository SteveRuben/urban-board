// frontend/components/interview/FollowUpQuestion.jsx
import React, { useState } from 'react';

/**
 * Composant qui affiche une question de suivi avec possibilité d'accepter ou de refuser
 */
const FollowUpQuestion = ({ 
  followUpData, 
  onAccept, 
  onDecline,
  isLoading = false
}) => {
  const [expanded, setExpanded] = useState(true);
  
  // Si pas de données ou chargement en cours
  if (!followUpData && !isLoading) {
    return null;
  }
  
  // Pendant le chargement
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-400 animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="flex space-x-1">
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
          </div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }
  
  // Déterminer la couleur de la bordure selon l'intention
  const getBorderColor = () => {
    if (!followUpData.intention) return 'border-blue-400';
    
    switch (followUpData.intention.toLowerCase()) {
      case 'clarification':
        return 'border-yellow-400';
      case 'approfondissement':
        return 'border-blue-400';
      case 'soutien':
        return 'border-green-400';
      default:
        return 'border-blue-400';
    }
  };
  
  // Icône selon l'intention
  const getIntentionIcon = () => {
    if (!followUpData.intention) return null;
    
    switch (followUpData.intention.toLowerCase()) {
      case 'clarification':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
      case 'approfondissement':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        );
      case 'soutien':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  // Texte selon la raison
  const getReasonText = () => {
    if (!followUpData.reason) return '';
    
    switch (followUpData.reason) {
      case 'unclear':
        return 'La réponse manque de clarté';
      case 'incomplete':
        return 'La réponse semble incomplète';
      case 'timeout':
        return `Temps de réflexion: ${followUpData.timeout_duration || '??'} sec`;
      default:
        return '';
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${getBorderColor()} transition-all duration-200 mb-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {getIntentionIcon()}
          <span className="ml-1 text-sm font-medium text-gray-700 capitalize">
            {followUpData.intention || 'Question de suivi'}
          </span>
          
          {followUpData.reason && (
            <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {getReasonText()}
            </span>
          )}
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={expanded ? "Réduire" : "Développer"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {expanded && (
        <>
          <p className="text-gray-800 font-medium mb-3">
            {followUpData.question}
          </p>
          
          {followUpData.link && (
            <p className="text-sm text-gray-600 italic mb-3">
              {followUpData.link}
            </p>
          )}
          
          <div className="flex justify-end space-x-3 mt-2">
            <button
              onClick={onDecline}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              Ignorer
            </button>
            <button
              onClick={onAccept}
              className="px-3 py-1 text-sm bg-primary-100 text-primary-700 hover:bg-primary-200 rounded focus:outline-none"
            >
              Poser cette question
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FollowUpQuestion;