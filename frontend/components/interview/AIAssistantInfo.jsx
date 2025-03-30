// components/interview/AIAssistantInfo.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CpuChipIcon, 
  DocumentTextIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import aiAssistantService from '../../services/aiAssistantService';

// Badge de mode d'entretien
const InterviewModeBadge = ({ mode }) => {
  const colorClass = 
    mode === 'autonomous' ? 'bg-orange-100 text-orange-800' : 
    mode === 'collaborative' ? 'bg-blue-100 text-blue-800' : 
    'bg-purple-100 text-purple-800';
  
  const label = 
    mode === 'autonomous' ? 'Autonome' : 
    mode === 'collaborative' ? 'Collaboratif' : 
    'Hybride';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
};

// Composant d'information sur l'assistant IA
const AIAssistantInfo = ({ assistantId, interviewMode, canEdit = false, interviewId = null }) => {
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAssistant = async () => {
      if (!assistantId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await aiAssistantService.getAssistantById(assistantId);
        setAssistant(data);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement de l\'assistant: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssistant();
  }, [assistantId]);
  
  const getModeMismatchWarning = () => {
    if (!assistant) return null;
    
    // Si l'assistant est en mode hybride, pas de problème
    if (assistant.interviewMode === 'hybrid') return null;
    
    // Si les modes correspondent, pas de problème
    if (assistant.interviewMode === interviewMode) return null;
    
    return (
      <div className="mt-4 bg-yellow-50 p-3 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Cet assistant est optimisé pour le mode <strong>{assistant.interviewMode === 'autonomous' ? 'autonome' : 'collaboratif'}</strong> mais est utilisé en mode <strong>{interviewMode === 'autonomous' ? 'autonome' : interviewMode === 'collaborative' ? 'collaboratif' : 'hybride'}</strong>. 
              {canEdit && interviewId && (
                <Link href={`/interviews/edit/${interviewId}`} legacyBehavior>
                  <a className="ml-1 font-medium text-yellow-700 underline">
                    Modifier l'entretien
                  </a>
                </Link>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg px-4 py-5 sm:p-6 animate-pulse">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/5 mt-2"></div>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-lg px-4 py-5 sm:p-6">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <QuestionMarkCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erreur lors du chargement de l'assistant IA
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <ArrowPathIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!assistant) {
    return (
      <div className="bg-white shadow-sm rounded-lg px-4 py-5 sm:p-6">
        <div className="bg-yellow-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <QuestionMarkCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Assistant IA non trouvé
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>L'assistant IA associé à cet entretien n'est plus disponible.</p>
              </div>
              {canEdit && interviewId && (
                <div className="mt-4">
                  <Link href={`/interviews/edit/${interviewId}`} legacyBehavior>
                    <a className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                      <PencilIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                      Modifier l'entretien
                    </a>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-sm rounded-lg px-4 py-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
            <CpuChipIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{assistant.name}</h3>
            <div className="flex items-center mt-1 space-x-2">
              <InterviewModeBadge mode={assistant.interviewMode} />
              <span className="text-xs text-gray-500">
                {assistant.model === 'claude-3-7-sonnet' ? 'Claude 3.7 Sonnet' : 
                assistant.model === 'claude-3-opus' ? 'Claude 3 Opus' : 
                assistant.model === 'gpt-4o' ? 'GPT-4o' : 
                assistant.model}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <Link href={`/ai-assistants/${assistant.id}`} legacyBehavior>
            <a className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <DocumentTextIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
              Détails
            </a>
          </Link>
        </div>
      </div>
      
      <p className="mt-3 text-sm text-gray-500">
        {assistant.description || 'Aucune description disponible.'}
      </p>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {assistant.industry && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {assistant.industry === 'technology' ? 'Technologie' : 
            assistant.industry === 'finance' ? 'Finance' : 
            assistant.industry === 'healthcare' ? 'Santé' : 
            assistant.industry === 'education' ? 'Éducation' : 
            assistant.industry === 'retail' ? 'Commerce' : 
            assistant.industry === 'manufacturing' ? 'Industrie' : 
            assistant.industry}
          </span>
        )}
        
        {assistant.jobRole && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {assistant.jobRole === 'software-engineer' ? 'Ingénieur logiciel' : 
            assistant.jobRole === 'data-scientist' ? 'Data Scientist' : 
            assistant.jobRole === 'product-manager' ? 'Chef de produit' : 
            assistant.jobRole === 'designer' ? 'Designer' : 
            assistant.jobRole === 'marketing' ? 'Marketing' : 
            assistant.jobRole === 'sales' ? 'Ventes' : 
            assistant.jobRole === 'customer-support' ? 'Support client' : 
            assistant.jobRole}
          </span>
        )}
        
        {assistant.seniority && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {assistant.seniority === 'entry-level' ? 'Débutant' : 
            assistant.seniority === 'mid-level' ? 'Intermédiaire' : 
            assistant.seniority === 'senior' ? 'Senior' : 
            assistant.seniority === 'management' ? 'Management' : 
            assistant.seniority === 'executive' ? 'Exécutif' : 
            assistant.seniority}
          </span>
        )}
      </div>
      
      {getModeMismatchWarning()}
    </div>
  );
};

export default AIAssistantInfo;