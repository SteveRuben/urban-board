// frontend/components/resume/ExperienceCard.jsx
import React from 'react';

const ExperienceCard = ({ experience = [] }) => {
  if (!experience || experience.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500 italic">Aucune expérience professionnelle pertinente identifiée.</p>
      </div>
    );
  }

  return (
    <div className="experience-card">
      <h3 className="text-lg font-medium text-gray-800 mb-6">Expérience professionnelle pertinente</h3>
      
      <div className="relative border-l-2 border-gray-200 ml-3">
        {experience.map((exp, index) => (
          <div key={index} className="mb-8 ml-6">
            {/* Point de chronologie */}
            <div className="absolute w-4 h-4 bg-primary-500 rounded-full -left-2 mt-1 border-2 border-white"></div>
            
            {/* En-tête de l'expérience */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <div>
                <h4 className="text-md font-semibold text-gray-800">{exp.position}</h4>
                <div className="text-sm text-gray-600">{exp.company}</div>
              </div>
              <div className="text-sm font-medium text-gray-500 mt-1 sm:mt-0">
                {exp.duration}
              </div>
            </div>
            
            {/* Points clés */}
            {exp.highlights && exp.highlights.length > 0 && (
              <ul className="mt-3 space-y-2">
                {exp.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Bordure de séparation pour tous sauf le dernier */}
            {index < experience.length - 1 && (
              <div className="border-b border-gray-100 mt-4 pb-3"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperienceCard;