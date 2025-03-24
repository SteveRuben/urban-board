// frontend/components/dashboard/RecentInterviewsList.jsx
import React from 'react';
import Link from 'next/link';

const RecentInterviewsList = ({ interviews }) => {
  // Si aucun entretien
  if (!interviews || interviews.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">Aucun entretien récent à afficher.</p>
      </div>
    );
  }

  // Formatter une date
  const formatDate = (dateString) => {
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Planifié
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            En cours
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Terminé
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Annulé
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {interviews.map((interview) => (
          <li key={interview.id} className="py-4">
            <Link 
              href={`/interviews/${interview.id}`} 
              className="block hover:bg-gray-50 transition-colors rounded-md -m-2 p-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {interview.candidate_name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {interview.job_role}
                  </p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end">
                  <div className="mb-1">
                    {getStatusBadge(interview.status)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(interview.date)}
                  </p>
                </div>
              </div>
              
              {interview.status === 'completed' && interview.score && (
                <div className="mt-2 flex items-center">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full ${
                        interview.score >= 8 ? 'bg-green-500' :
                        interview.score >= 6 ? 'bg-blue-500' :
                        interview.score >= 4 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(interview.score / 10) * 100}%` }}
                    />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    interview.score >= 8 ? 'text-green-600' :
                    interview.score >= 6 ? 'text-blue-600' :
                    interview.score >= 4 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {interview.score.toFixed(1)}/10
                  </span>
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
      
      <div className="mt-4 text-center">
        <Link href="/interviews" className="text-primary-600 hover:text-primary-900 text-sm font-medium">
          Voir tous les entretiens
        </Link>
      </div>
    </div>
  );
};

export default RecentInterviewsList;