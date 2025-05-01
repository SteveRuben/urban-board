// frontend/components/resume/ResumeAnalysisResult.tsx
import React, { JSX } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Award, 
  BookOpen, 
  Briefcase, 
  HelpCircle, 
  Download, 
  Send 
} from 'lucide-react';
import { ResumeAnalysisResultProps } from '@/types/resume';


const ResumeAnalysisResult: React.FC<ResumeAnalysisResultProps> = ({ analysis, jobRole }) => {
  if (!analysis) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="text-center py-6">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analyse non disponible</h3>
          <p className="text-gray-600 mb-4">Les résultats de l'analyse n'ont pas pu être chargés.</p>
        </div>
      </div>
    );
  }

  if (analysis.error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="text-center py-6">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur lors de l'analyse</h3>
          <p className="text-gray-600 mb-4">{analysis.error}</p>
          <p className="text-gray-500 text-sm">Veuillez réessayer avec un autre fichier ou vérifier que le document est valide.</p>
        </div>
      </div>
    );
  }

  // Obtenir la couleur du score en fonction de la valeur
  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    return 'text-yellow-600';
  };

  // Obtenir le statut de correspondance en fonction du score
  const getFitStatus = (score: number): { text: string; icon: JSX.Element; color: string } => {
    if (score >= 8.5) {
      return {
        text: 'Excellente correspondance',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        color: 'bg-green-100 text-green-800'
      };
    } else if (score >= 7) {
      return {
        text: 'Bonne correspondance',
        icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
        color: 'bg-blue-100 text-blue-800'
      };
    } else if (score >= 5) {
      return {
        text: 'Correspondance moyenne',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        color: 'bg-yellow-100 text-yellow-800'
      };
    } else {
      return {
        text: 'Correspondance faible',
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        color: 'bg-red-100 text-red-800'
      };
    }
  };

  const fitStatus = analysis.fit_score ? getFitStatus(analysis.fit_score) : {
    text: 'Non évalué',
    icon: <HelpCircle className="h-5 w-5 text-gray-500" />,
    color: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-8">
      {/* Résumé */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Résumé de l'analyse</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${fitStatus.color}`}>
            {fitStatus.icon}
            <span className="ml-1">{fitStatus.text}</span>
          </span>
        </div>
        <div className="p-6">
          {/* Score de correspondance */}
          {analysis.fit_score && (
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Score de correspondance</h4>
                <div className="flex items-baseline">
                  <span className={`text-3xl font-bold ${getScoreColor(analysis.fit_score)}`}>
                    {analysis.fit_score.toFixed(1)}
                  </span>
                  <span className="text-gray-500 ml-1">/10</span>
                </div>
              </div>
              <div className="w-24 h-24 relative">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={analysis.fit_score >= 8 ? '#059669' : analysis.fit_score >= 6 ? '#2563eb' : '#d97706'}
                    strokeWidth="3"
                    strokeDasharray={`${analysis.fit_score * 10}, 100`}
                  />
                  <text x="18" y="20.5" textAnchor="middle" fontSize="8" fill="currentColor">
                    {analysis.fit_score.toFixed(1)}/10
                  </text>
                </svg>
              </div>
            </div>
          )}

          {/* Résumé du profil */}
          {analysis.resume_summary && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Résumé du profil</h4>
              <p className="text-gray-800">{analysis.resume_summary}</p>
            </div>
          )}

          {/* Justification du score */}
          {analysis.fit_justification && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Justification</h4>
              <p className="text-gray-800">{analysis.fit_justification}</p>
            </div>
          )}
        </div>
      </div>

      {/* Forces et faiblesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Forces */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Points forts</h3>
          </div>
          <div className="p-6">
            {analysis.strengths && analysis.strengths.length > 0 ? (
              <ul className="space-y-3">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-800">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun point fort identifié</p>
            )}
          </div>
        </div>

        {/* Faiblesses */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Axes d'amélioration</h3>
          </div>
          <div className="p-6">
            {analysis.gaps && analysis.gaps.length > 0 ? (
              <ul className="space-y-3">
                {analysis.gaps.map((gap, index) => (
                  <li key={index} className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-800">{gap}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun axe d'amélioration identifié</p>
            )}
          </div>
        </div>
      </div>

      {/* Compétences */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Compétences identifiées</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Compétences techniques */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Compétences techniques</h4>
              {analysis.technical_skills && analysis.technical_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.technical_skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucune compétence technique identifiée</p>
              )}
            </div>

            {/* Soft skills */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Compétences comportementales</h4>
              {analysis.soft_skills && analysis.soft_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.soft_skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucune compétence comportementale identifiée</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expérience professionnelle */}
      {analysis.relevant_experience && analysis.relevant_experience.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Expérience professionnelle pertinente</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {analysis.relevant_experience.map((exp, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4 py-1">
                  <div className="flex items-start mb-2">
                    <Briefcase className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-gray-900 font-medium">{exp.position}</h4>
                      <p className="text-gray-600">{exp.company} · {exp.duration}</p>
                    </div>
                  </div>
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="ml-7 mt-3 space-y-2">
                      {exp.highlights.map((highlight, hIndex) => (
                        <li key={hIndex} className="text-gray-700 text-sm">
                          • {highlight}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Formation */}
      {analysis.education && analysis.education.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Formation</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analysis.education.map((edu, index) => (
                <div key={index} className="flex items-start">
                  <BookOpen className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-gray-900 font-medium">{edu.degree}</h4>
                    <p className="text-gray-600">{edu.institution} · {edu.year}</p>
                    {edu.relevance && (
                      <p className="text-sm mt-1">
                        <span className="text-gray-500">Pertinence pour le poste: </span>
                        <span className={
                          edu.relevance === 'haute' ? 'text-green-600' : 
                          edu.relevance === 'moyenne' ? 'text-blue-600' : 
                          'text-gray-600'
                        }>
                          {edu.relevance}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Questions recommandées */}
      {analysis.recommended_questions && analysis.recommended_questions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Questions d'entretien recommandées</h3>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
              {analysis.recommended_questions.length} questions
            </span>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {analysis.recommended_questions.map((q, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 font-medium mb-2">{q.question}</p>
                  {q.rationale && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Pourquoi poser cette question: </span> 
                        {q.rationale}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={{
                pathname: '/interviews/new',
                query: { resume_analysis: 'true', job_role: jobRole }
              }}
              className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700 w-full"
            >
              <Send className="h-5 w-5 mr-2" />
              Créer un entretien
            </Link>
            <button
              onClick={() => {
                // Logique pour télécharger l'analyse au format PDF
                alert('Fonctionnalité de téléchargement en cours de développement');
              }}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 w-full"
            >
              <Download className="h-5 w-5 mr-2" />
              Télécharger l'analyse
            </button>
          </div>
        </div>
      </div>

      {/* Informations de contact */}
      {analysis.contact_info && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Informations de contact</h3>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {analysis.contact_info.email && (
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">Email:</span>
                  <a href={`mailto:${analysis.contact_info.email}`} className="text-blue-600 hover:underline">
                    {analysis.contact_info.email}
                  </a>
                </div>
              )}
              {analysis.contact_info.phone && (
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">Téléphone:</span>
                  <a href={`tel:${analysis.contact_info.phone}`} className="text-blue-600 hover:underline">
                    {analysis.contact_info.phone}
                  </a>
                </div>
              )}
              {analysis.contact_info.linkedin && (
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">LinkedIn:</span>
                  <a href={`https://${analysis.contact_info.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {analysis.contact_info.linkedin}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Informations sur l'analyse */}
      {analysis.metadata && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Analyse générée le {new Date(analysis.metadata.analysis_timestamp).toLocaleString()} pour le poste "{analysis.metadata.job_role || jobRole}"
          </p>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysisResult;