// frontend/components/resume/EducationCard.jsx
import React from 'react';

const EducationCard = ({ education = [] }) => {
  if (!education || education.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500 italic">Aucune formation identifiée.</p>
      </div>
    );
  }

  // Fonction pour déterminer la couleur du badge de pertinence
  const getRelevanceColor = (relevance) => {
    const relevanceLower = relevance?.toLowerCase();
    
    if (relevanceLower === 'haute') {
      return 'bg-green-100 text-green-800';
    } else if (relevanceLower === 'moyenne') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (relevanceLower === 'faible') {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="education-card">
      <h3 className="text-lg font-medium text-gray-800 mb-6">Formation et éducation</h3>
      
      <div className="space-y-6">
        {education.map((edu, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between mb-2">
              <div>
                <h4 className="text-md font-semibold text-gray-800">{edu.degree}</h4>
                <div className="text-sm text-gray-600">{edu.institution}</div>
              </div>
              
              <div className="text-sm font-medium text-gray-500 mt-1 sm:mt-0 flex items-center">
                {edu.year && (
                  <span className="hidden sm:inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {edu.year}
                  </span>
                )}
              </div>
            </div>
            
            {/* Badge de pertinence */}
            {edu.relevance && (
              <div className="mt-1">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRelevanceColor(edu.relevance)}`}>
                  Pertinence: {edu.relevance}
                </span>
              </div>
            )}
            
            {/* Description ou détails supplémentaires */}
            {edu.description && (
              <div className="mt-3 text-sm text-gray-600">
                {edu.description}
              </div>
            )}
            
            {/* Bordure de séparation pour tous sauf le dernier */}
            {index < education.length - 1 && (
              <div className="border-b border-gray-200 mt-4"></div>
            )}
          </div>
        ))}
      </div>
      
      {/* Échelle temporelle graphique - pour une version future */}
      {/* <div className="mt-8">
        <h4 className="text-md font-medium text-gray-700 mb-3">Chronologie des formations</h4>
        <div className="h-24 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Chronologie graphique (à venir)</p>
        </div>
      </div> */}
    </div>
  );
};

export default EducationCard;