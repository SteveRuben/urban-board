// frontend/components/resume/SkillsCard.jsx
import React from 'react';

const SkillsCard = ({ technicalSkills = [], softSkills = [] }) => {
  // Générer une couleur aléatoire cohérente pour un tag de compétence
  const getSkillColor = (skill, isTechnical = true) => {
    // Utiliser une fonction simple basée sur la somme des codes de caractères
    const sum = skill.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Liste de couleurs pour les compétences techniques
    const technicalColors = [
      'bg-blue-100 text-blue-800',
      'bg-indigo-100 text-indigo-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800',
    ];
    
    // Liste de couleurs pour les soft skills
    const softColors = [
      'bg-orange-100 text-orange-800',
      'bg-amber-100 text-amber-800',
      'bg-yellow-100 text-yellow-800',
      'bg-lime-100 text-lime-800',
      'bg-emerald-100 text-emerald-800',
      'bg-pink-100 text-pink-800',
    ];
    
    // Sélectionner une couleur basée sur la somme
    const colorList = isTechnical ? technicalColors : softColors;
    return colorList[sum % colorList.length];
  };

  return (
    <div className="skills-card">
      {/* Compétences techniques */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Compétences techniques</h3>
        
        {technicalSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {technicalSkills.map((skill, index) => (
              <span 
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium ${getSkillColor(skill, true)}`}
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Aucune compétence technique identifiée.</p>
        )}
      </div>
      
      {/* Soft skills */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">Compétences non techniques</h3>
        
        {softSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {softSkills.map((skill, index) => (
              <span 
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium ${getSkillColor(skill, false)}`}
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Aucune compétence non technique identifiée.</p>
        )}
      </div>
      
      {/* Visualisation graphique des compétences - à implémenter dans une version future */}
      {/* <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Répartition des compétences</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Graphique de répartition des compétences (à venir)</p>
        </div>
      </div> */}
    </div>
  );
};

export default SkillsCard;