// pages/ai-assistants/index.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  CpuChipIcon,
  ChevronRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layout/DashboardLayout';
import aiAssistantService from '../../services/aiAssistantService';
import { formatDateToLocale } from '../../utils/dateUtils';

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

// Card d'assistant IA
const AIAssistantCard = ({ assistant, onDelete, onClone }) => {
  const router = useRouter();
  
  // Calculer le temps écoulé depuis la dernière utilisation
  const getLastUsedText = () => {
    if (!assistant.lastUsed) return 'Jamais utilisé';
    
    const lastUsed = new Date(assistant.lastUsed);
    const now = new Date();
    const diffMs = now - lastUsed;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  };
  
  const handleEdit = () => {
    router.push(`/ai-assistants/edit/${assistant.id}`);
  };
  
  const handleDetails = () => {
    router.push(`/ai-assistants/${assistant.id}`);
  };
  
  const handleClone = (e) => {
    e.stopPropagation();
    onClone(assistant);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(assistant);
  };
  
  return (
    <div 
      onClick={handleDetails}
      className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
              <CpuChipIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">{assistant.name}</h3>
              <InterviewModeBadge mode={assistant.interviewMode} />
            </div>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={handleEdit}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500"
              title="Modifier"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleClone}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500"
              title="Cloner"
            >
              <ClipboardDocumentCheckIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500"
              title="Supprimer"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <p className="mt-3 text-sm text-gray-500 line-clamp-2">
          {assistant.description || 'Aucune description'}
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
              {assistant.jobRole === 'software-engineer' ? 'Ing. logiciel' : 
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
          
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {assistant.model === 'claude-3-7-sonnet' ? 'Claude 3.7 Sonnet' : 
             assistant.model === 'claude-3-opus' ? 'Claude 3 Opus' : 
             assistant.model === 'gpt-4o' ? 'GPT-4o' : 
             assistant.model}
          </span>
        </div>
        
        <div className="mt-4 border-t pt-4 flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>Créé le {formatDateToLocale(assistant.createdAt)}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500">
              {assistant.usageCount > 0 
                ? `Utilisé ${assistant.usageCount} fois` 
                : 'Jamais utilisé'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Page principale de liste des assistants
const AIAssistantList = () => {
  const router = useRouter();
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cloningAssistant, setCloningAssistant] = useState(null);
  
  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const data = await aiAssistantService.getAllAssistants();
      setAssistants(data ?? []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des assistants: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAssistants();
  }, []);
  
  const handleCloneAssistant = async (assistant) => {
    try {
      setCloningAssistant(assistant.id);
      await aiAssistantService.cloneAssistant(assistant.id, { name: `Copie de ${assistant.name}` });
      await fetchAssistants();
    } catch (err) {
      setError('Erreur lors du clonage de l\'assistant: ' + err.message);
    } finally {
      setCloningAssistant(null);
    }
  };
  
  const handleDeleteAssistant = async (assistant) => {
    setDeleteConfirm(assistant);
  };
  
  const confirmDelete = async () => {
    try {
      await aiAssistantService.deleteAssistant(deleteConfirm.id);
      await fetchAssistants();
      setDeleteConfirm(null);
    } catch (err) {
      setError('Erreur lors de la suppression de l\'assistant: ' + err.message);
    }
  };
  
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };
  
  return (
    <>
        <head>
            <title>Mes assistants IA</title>
        </head>
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:leading-9">
          Mes assistants IA
        </h1>
        <div className="mt-3 flex sm:ml-4 sm:mt-0">
          <Link href="/ai-assistants/gallery" legacyBehavior>
            <a className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">
              <CpuChipIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Galerie de modèles
            </a>
          </Link>
          <Link href="/ai-assistants/create" legacyBehavior>
            <a className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Nouvel assistant
            </a>
          </Link>
        </div>
      </div>
      
      <div className="mt-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
            <button
              onClick={fetchAssistants}
              className="ml-2 inline-flex items-center text-sm font-medium text-red-700 hover:text-red-900"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Réessayer
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Chargement de vos assistants IA...</p>
          </div>
        ) : assistants.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {assistants.map((assistant) => (
              <AIAssistantCard
                key={assistant.id}
                assistant={assistant}
                onDelete={handleDeleteAssistant}
                onClone={handleCloneAssistant}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg border">
            <CpuChipIcon className="h-10 w-10 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun assistant IA</h3>
            <p className="mt-1 text-sm text-gray-500">
              Créez votre premier assistant IA pour vous aider dans vos entretiens.
            </p>
            <div className="mt-6">
              <Link href="/ai-assistants/gallery" legacyBehavior>
                <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100">
                  <CpuChipIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Explorer la galerie de modèles
                </a>
              </Link>
              <Link href="/ai-assistants/create" legacyBehavior>
                <a className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Créer un assistant personnalisé
                </a>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de confirmation de suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={cancelDelete}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span 
              className="hidden sm:inline-block sm:align-middle sm:h-screen" 
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <TrashIcon 
                    className="h-6 w-6 text-red-600" 
                    aria-hidden="true" 
                  />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 
                    className="text-lg leading-6 font-medium text-gray-900"
                  >
                    Supprimer l'assistant IA
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer l'assistant <strong>{deleteConfirm.name}</strong> ? Cette action est irréversible.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-black hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={confirmDelete}
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={cancelDelete}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantList;