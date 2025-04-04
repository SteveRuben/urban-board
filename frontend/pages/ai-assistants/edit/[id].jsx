// pages/ai-assistants/edit/[id].jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import AIAssistantConfigurator from '../../../components/ai-assistants/AIAssistantConfigurator';
import aiAssistantService from '../../../services/aiAssistantService';

const EditAIAssistant = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Charger les données de l'assistant
  useEffect(() => {
    const fetchAssistant = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await aiAssistantService.getAssistantById(id);
        setAssistant(data);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement de l\'assistant: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssistant();
  }, [id]);
  
  const handleUpdateSuccess = () => {
    // Rediriger vers la page de détails de l'assistant
    router.push(`/ai-assistants/${id}`);
  };
  
  const handleError = (errorMessage) => {
    setError(errorMessage);
    // Faire défiler jusqu'au message d'erreur
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <DashboardLayout title="Modifier l'assistant IA">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/ai-assistants/${id}`} legacyBehavior>
          <a className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5 mr-1 text-gray-400" aria-hidden="true" />
            Retour aux détails de l'assistant
          </a>
        </Link>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erreur
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="ml-3 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <ArrowPathIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-20 bg-white shadow-sm rounded-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement des données de l'assistant...</p>
        </div>
      ) : !assistant ? (
        <div className="text-center py-20 bg-white shadow-sm rounded-lg">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <ExclamationCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Assistant non trouvé</h3>
          <p className="mt-1 text-sm text-gray-500">
            L'assistant que vous souhaitez modifier n'existe pas ou a été supprimé.
          </p>
          <div className="mt-6">
            <Link href="/ai-assistants" legacyBehavior>
              <a className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <DocumentTextIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Retour à la liste des assistants
              </a>
            </Link>
          </div>
        </div>
      ) : (
        <AIAssistantConfigurator 
          assistantId={id}
          initialData={assistant}
          isEditMode={true}
          onSuccess={handleUpdateSuccess}
          onError={handleError}
        />
      )}
    </DashboardLayout>
  );
};

export default EditAIAssistant;