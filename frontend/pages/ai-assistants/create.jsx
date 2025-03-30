// pages/ai-assistants/create.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  ExclamationCircleIcon,
  CpuChipIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import AIAssistantConfigurator from '../../components/ai/AIAssistantConfigurator';
import aiAssistantService from '../../services/aiAssistantService';

const CreateAIAssistant = () => {
  const router = useRouter();
  const { templateId } = router.query;
  
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(templateId ? true : false);
  const [error, setError] = useState(null);
  
  // Si un templateId est fourni, charger le modèle
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;
      
      try {
        setLoading(true);
        const templates = await aiAssistantService.getAssistantTemplates();
        const foundTemplate = templates.find(t => t.id === templateId);
        
        if (foundTemplate) {
          setTemplate(foundTemplate);
        } else {
          setError("Le modèle demandé n'a pas été trouvé.");
        }
      } catch (err) {
        setError('Erreur lors du chargement du modèle: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
  }, [templateId]);
  
  const handleCreateSuccess = (assistantId) => {
    // Rediriger vers la page de détails du nouvel assistant
    router.push(`/ai-assistants/${assistantId}`);
  };
  
  const handleError = (errorMessage) => {
    setError(errorMessage);
    // Faire défiler jusqu'au message d'erreur
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div>
      <head>
        <title>Créer un assistant IA</title>
      </head>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/ai-assistants" legacyBehavior>
          <a className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5 mr-1 text-gray-400" aria-hidden="true" />
            Retour à la liste des assistants
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
              </div>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-20 bg-white shadow-sm rounded-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement du modèle d'assistant...</p>
        </div>
      ) : templateId && !template ? (
        <div className="text-center py-20 bg-white shadow-sm rounded-lg">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <ExclamationCircleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Modèle non trouvé</h3>
          <p className="mt-1 text-sm text-gray-500">
            Le modèle d'assistant que vous avez demandé n'est pas disponible.
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <Link href="/ai-assistants/gallery" legacyBehavior>
              <a className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <FolderIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Explorer la galerie
              </a>
            </Link>
            <Link href="/ai-assistants/create" legacyBehavior>
              <a className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <CpuChipIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Créer sans modèle
              </a>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {template && (
            <div className="mb-6 bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CpuChipIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Création basée sur un modèle
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Vous créez un assistant basé sur le modèle <strong>{template.name}</strong>. 
                      Vous pouvez personnaliser tous les paramètres selon vos besoins.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <AIAssistantConfigurator 
            initialData={template} 
            onSuccess={handleCreateSuccess}
            onError={handleError}
          />
        </>
      )}
    </div>
  );
};

export default CreateAIAssistant;