// pages/ai-assistants/[id].tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  ChevronLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  StarIcon,
  ChartBarIcon,
  CpuChipIcon,
  KeyIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  PlayIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { 
  AIAssistant,
  AssistantStats,
  AIDocument,
  ASSISTANT_TYPE_LABELS, 
  INDUSTRY_LABELS, 
  JOB_ROLE_LABELS, 
  SENIORITY_LABELS, 
  INTERVIEW_MODE_LABELS,
  MODEL_LABELS,
  PROVIDER_LABELS,
  normalizeAssistant
} from '@/types/assistant';
import aiAssistantService from '@/services/ai-assistant-service';
import { formatDate } from '@/lib/utils';

// Badge de statut API
const APIStatusBadge: React.FC<{ hasApiKey: boolean; provider?: string }> = ({ hasApiKey, provider }) => {
  if (!hasApiKey) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
        Pas d'API
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckBadgeIcon className="h-3 w-3 mr-1" />
      {PROVIDER_LABELS[provider as keyof typeof PROVIDER_LABELS] || 'API configurée'}
    </span>
  );
};

// Section d'informations générales
interface AssistantInfoSectionProps {
  assistant: AIAssistant;
}

const AssistantInfoSection: React.FC<AssistantInfoSectionProps> = ({ assistant }) => {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
            {assistant.isTemplate ? (
              <StarIcon className="h-8 w-8 text-yellow-600" />
            ) : (
              <CpuChipIcon className="h-8 w-8 text-primary-600" />
            )}
          </div>
          <div className="ml-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{assistant.name}</h1>
              {assistant.isTemplate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Template
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {assistant.description || 'Aucune description'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {ASSISTANT_TYPE_LABELS[assistant?.assistantType] || assistant?.assistantType}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Mode d'entretien</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                assistant.interviewMode === 'autonomous' ? 'bg-orange-100 text-orange-800' : 
                assistant.interviewMode === 'collaborative' ? 'bg-blue-100 text-blue-800' : 
                'bg-purple-100 text-purple-800'
              }`}>
                {INTERVIEW_MODE_LABELS[assistant.interviewMode] || assistant.interviewMode}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Modèle IA</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {MODEL_LABELS[assistant.model] || assistant.model}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Statut API</dt>
            <dd className="mt-1">
              <APIStatusBadge hasApiKey={assistant.hasApiKey || false} provider={assistant.apiProvider} />
            </dd>
          </div>
        </div>

        {(assistant.industry || assistant.jobRole || assistant.seniority) && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Contexte professionnel</h3>
            <div className="flex flex-wrap gap-2">
              {assistant.industry && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {INDUSTRY_LABELS[assistant.industry] || assistant.industry}
                </span>
              )}
              {assistant.jobRole && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {JOB_ROLE_LABELS[assistant.jobRole] || assistant.jobRole}
                </span>
              )}
              {assistant.seniority && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {SENIORITY_LABELS[assistant.seniority] || assistant.seniority}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Section des statistiques rapides
// interface QuickStatsProps {
//   assistant: AIAssistant;
//   stats?: AssistantStats;
// }

// const QuickStats: React.FC<QuickStatsProps> = ({ assistant, stats }) => {
//   const getLastUsedText = (): string => {
//     if (!assistant.lastUsed) return 'Jamais utilisé';
    
//     const lastUsed = new Date(assistant.lastUsed);
//     const now = new Date();
//     const diffMs = now.getTime() - lastUsed.getTime();
//     const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
//     if (diffDays === 0) return 'Aujourd\'hui';
//     if (diffDays === 1) return 'Hier';
//     return `Il y a ${diffDays} jours`;
//   };

//   return (
//     <div className="bg-white shadow rounded-lg">
//       <div className="px-4 py-5 sm:p-6">
//         <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Statistiques</h3>
//         <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           <div>
//             <dt className="text-sm font-medium text-gray-500">Utilisations</dt>
//             <dd className="mt-1 text-2xl font-semibold text-gray-900">
//               {stats?.usageCount || assistant.usageCount || 0}
//             </dd>
//           </div>
          
//           <div>
//             <dt className="text-sm font-medium text-gray-500">Équipes</dt>
//             <dd className="mt-1 text-2xl font-semibold text-gray-900">
//               {stats?.teamsCount || assistant.teamsCount || 0}
//             </dd>
//           </div>
          
//           <div>
//             <dt className="text-sm font-medium text-gray-500">Contenu généré</dt>
//             <dd className="mt-1 text-2xl font-semibold text-gray-900">
//               {stats?.totalContentGenerated || 0}
//             </dd>
//           </div>
//         </dl>
        
//         <div className="mt-4 pt-4 border-t border-gray-200">
//           <div className="flex items-center text-sm text-gray-500">
//             <ClockIcon className="h-4 w-4 mr-1" />
//             <span>Dernière utilisation: {getLastUsedText()}</span>
//           </div>
//           <div className="flex items-center text-sm text-gray-500 mt-1">
//             <CalendarIcon className="h-4 w-4 mr-1" />
//             <span>Créé le {formatDate(assistant.createdAt)}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// Section de configuration
interface ConfigurationSectionProps {
  assistant: AIAssistant;
}

const ConfigurationSection: React.FC<ConfigurationSectionProps> = ({ assistant }) => {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Configuration</h3>
        
        {/* Personnalité */}
        {assistant.personality && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Personnalité</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Convivialité</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 w-2 rounded-full ${
                        level <= (assistant.personality?.friendliness || 0) ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium text-gray-900 ml-2">
                    {assistant.personality.friendliness}/5
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Formalité</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 w-2 rounded-full ${
                        level <= (assistant.personality?.formality || 0) ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium text-gray-900 ml-2">
                    {assistant.personality.formality}/5
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Profondeur technique</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 w-2 rounded-full ${
                        level <= (assistant.personality?.technicalDepth || 0) ? 'bg-purple-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium text-gray-900 ml-2">
                    {assistant.personality.technicalDepth}/5
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Intensité des suivis</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 w-2 rounded-full ${
                        level <= (assistant.personality?.followUpIntensity || 0) ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium text-gray-900 ml-2">
                    {assistant.personality.followUpIntensity}/5
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Capacités */}
        {assistant.capabilities && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Capacités</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(assistant.capabilities).map(([key, enabled]) => (
                <div key={key} className="flex items-center">
                  <div className={`h-2 w-2 rounded-full mr-2 ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={`text-sm ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    {key === 'generateQuestions' ? 'Génération de questions' :
                     key === 'evaluateResponses' ? 'Évaluation des réponses' :
                     key === 'provideFeedback' ? 'Feedback' :
                     key === 'suggestFollowUps' ? 'Questions de suivi' :
                     key === 'realTimeCoaching' ? 'Coaching temps réel' :
                     key === 'biometricIntegration' ? 'Intégration biométrique' :
                     key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connaissances de base */}
        {assistant.baseKnowledge && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Connaissances de base</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(assistant.baseKnowledge).map(([key, enabled]) => (
                <div key={key} className="flex items-center">
                  <div className={`h-2 w-2 rounded-full mr-2 ${enabled ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <span className={`text-sm ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    {key === 'technicalSkills' ? 'Compétences techniques' :
                     key === 'softSkills' ? 'Soft skills' :
                     key === 'companyValues' ? 'Valeurs entreprise' :
                     key === 'industryTrends' ? 'Tendances secteur' :
                     key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Section des documents
interface DocumentsSectionProps {
  assistantId: string;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ assistantId }) => {
  const [documents, setDocuments] = useState<AIDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await aiAssistantService.getDocuments(assistantId);
        setDocuments(response.data);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [assistantId]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Documents</h3>
          <span className="text-sm text-gray-500">{documents.length} document(s)</span>
        </div>
        
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.originalFilename}</p>
                    <p className="text-xs text-gray-500">
                      {doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    doc.vectorIndexStatus === 'completed' ? 'bg-green-100 text-green-800' :
                    doc.vectorIndexStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    doc.vectorIndexStatus === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {doc.vectorIndexStatus === 'completed' ? 'Indexé' :
                     doc.vectorIndexStatus === 'processing' ? 'En cours' :
                     doc.vectorIndexStatus === 'failed' ? 'Erreur' :
                     'En attente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Aucun document associé</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant principal
export default function AIAssistantDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [assistant, setAssistant] = useState<AIAssistant | null>(null);
  const [stats, setStats] = useState<AssistantStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchAssistant = async (): Promise<void> => {
    if (!id || typeof id !== 'string') return;
    
    try {
      setLoading(true);
      const [assistantResponse] = await Promise.all([
        aiAssistantService.getAssistantById(id),
      ]);
      console.log('..',assistantResponse)
       const normalizedAssistant = normalizeAssistant(assistantResponse);
      setAssistant(normalizedAssistant);
      
      
      
      setError(null);
    } catch (err: any) {
      setError(`Erreur lors du chargement de l'assistant: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAssistant();
  }, [id]);
  
  const handleDuplicate = async (): Promise<void> => {
    if (!assistant) return;
    
    try {
      await aiAssistantService.duplicateAssistant(assistant.id, {
        name: `Copie de ${assistant.name}`,
        copyApiKey: false
      });
      
      router.push('/ai-assistants');
    } catch (err: any) {
      alert(`Erreur lors de la duplication: ${err.message}`);
    }
  };

  const handleMakeTemplate = async (): Promise<void> => {
    if (!assistant) return;
    
    try {
      await aiAssistantService.makeTemplate(assistant.id, {
        templateName: `Template - ${assistant.name}`,
        removeApiKey: true
      });
      
      // Recharger pour voir les changements
      await fetchAssistant();
    } catch (err: any) {
      alert(`Erreur lors de la création du template: ${err.message}`);
    }
  };
  
  const handleDelete = useCallback(async () => {
    if (!assistant || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await aiAssistantService.deleteAssistant(assistant.id);
      router.push('/ai-assistants');
    } catch (err: any) {
      alert(`Erreur lors de la suppression: ${err.message}`);
      setIsDeleting(false);
    }
  }, [assistant, isDeleting, router]);
  
  const cancelDelete = useCallback(() => {
    if (isDeleting) return;
    setDeleteConfirm(false);
  }, [isDeleting]);
  
  if (loading) {
    return (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement de l'assistant...</p>
        </div>
    );
  }
  
  if (error || !assistant) {
    return (
        <div className="text-center py-20">
          <CpuChipIcon className="h-10 w-10 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Erreur</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error || 'Assistant non trouvé'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/ai-assistants')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Retour à la liste
            </button>
          </div>
        </div>
    );
  }
  
  return (
    <>
      <head>
        <title>{assistant.name} - Détails</title>
      </head>
      
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/ai-assistants')}
            className="inline-flex items-center mr-4 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Retour
          </button>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">
            Détails de l'assistant
          </h1>
        </div>
        <div className="mt-3 flex sm:ml-4 sm:mt-0 space-x-2">
          
          <button
            onClick={handleDuplicate}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            Dupliquer
          </button>
          
          <button
            onClick={() => router.push(`/ai-assistants/edit/${assistant.id}`)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Modifier
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Supprimer
          </button>
        </div>
      </div>
      
      <div className="mt-6 space-y-6">
        {/* Informations générales */}
        <AssistantInfoSection assistant={assistant} />
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Statistiques */}
          {/* <QuickStats assistant={assistant} stats={stats || undefined} /> */}
          
          {/* Configuration */}
          <ConfigurationSection assistant={assistant} />
        </div>
        
        {/* Documents */}
        <DocumentsSection assistantId={assistant.id} />
        
        {/* Prompt personnalisé */}
        {assistant.customPrompt && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Prompt personnalisé</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                  {assistant.customPrompt}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de confirmation de suppression */}
      {deleteConfirm && assistant && (
      <div 
        className="fixed inset-0 z-50 overflow-y-auto"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
          <div 
            className="relative bg-white rounded-lg max-w-lg w-full mx-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>

              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Supprimer l'assistant IA
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Êtes-vous sûr de vouloir supprimer l'assistant <strong>{assistant.name}</strong> ? 
                    {assistant.teamsCount && assistant.teamsCount > 0 && (
                      <span className="text-amber-600">
                        {' '}Cet assistant est utilisé dans {assistant.teamsCount} équipe(s).
                      </span>
                    )}
                    {' '}Cette action est irréversible.
                  </p>
                </div>
              </div>
                  
              <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row sm:gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={cancelDelete}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDelete}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

// AIAssistantDetail.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
// export default AIAssistantDetail;