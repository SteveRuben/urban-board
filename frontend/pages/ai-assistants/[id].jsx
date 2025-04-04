// pages/ai-assistants/[id].jsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentIcon,
  DocumentPlusIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import aiAssistantService from '../../services/aiAssistantService';
import { formatDateToLocale } from '../../utils/dateUtils';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Composant pour la gestion des documents
const DocumentsManager = ({ assistantId, onError }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentType, setDocumentType] = useState('company_values');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await aiAssistantService.getAssistantDocuments(assistantId);
      setDocuments(data);
    } catch (err) {
      onError('Erreur lors du chargement des documents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [assistantId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Simuler une progression d'upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + 10;
          return next > 90 ? 90 : next;
        });
      }, 300);

      await aiAssistantService.uploadDocument(assistantId, file, documentType, description);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Réinitialiser le formulaire
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Actualiser la liste des documents
      await fetchDocuments();
    } catch (err) {
      onError('Erreur lors du téléchargement du document: ' + err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      await aiAssistantService.deleteDocument(assistantId, documentId);
      await fetchDocuments();
    } catch (err) {
      onError('Erreur lors de la suppression du document: ' + err.message);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      'company_values': 'Valeurs d\'entreprise',
      'job_description': 'Fiche de poste',
      'interview_guide': 'Guide d\'entretien',
      'technical_requirements': 'Exigences techniques',
      'other': 'Autre'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Télécharger un document</h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
                Type de document
              </label>
              <select
                id="documentType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="company_values">Valeurs d'entreprise</option>
                <option value="job_description">Fiche de poste</option>
                <option value="interview_guide">Guide d'entretien</option>
                <option value="technical_requirements">Exigences techniques</option>
                <option value="other">Autre</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (optionnelle)
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Brève description du document"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Fichier</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Téléchargez un fichier</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      ref={fileInputRef}
                      onChange={handleUpload}
                      disabled={uploading}
                      accept=".pdf,.docx,.txt,.md"
                    />
                  </label>
                  <p className="pl-1">ou glissez-déposez</p>
                </div>
                <p className="text-xs text-gray-500">PDF, DOCX, TXT, MD jusqu'à 10MB</p>
              </div>
            </div>
          </div>
          
          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary-600 h-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500 text-right">
                {uploadProgress === 100 ? 'Téléchargement terminé' : `${uploadProgress}% téléchargé...`}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Documents associés</h3>
          
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Chargement des documents...</p>
            </div>
          ) : documents.length > 0 ? (
            <div className="overflow-hidden border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taille
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'ajout
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900">
                            {doc.originalFilename}
                            {doc.description && (
                              <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getDocumentTypeLabel(doc.documentType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {doc.vectorIndexStatus === 'completed' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Indexé
                          </span>
                        ) : doc.vectorIndexStatus === 'processing' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            En cours d'indexation
                          </span>
                        ) : doc.vectorIndexStatus === 'failed' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Échec d'indexation
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateToLocale(doc.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <DocumentIcon className="h-10 w-10 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ajoutez des documents pour améliorer les connaissances de votre assistant.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant de test de l'assistant
const TestAssistant = ({ assistant, onError }) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleTest = async () => {
    if (!question.trim()) return;
    
    try {
      setLoading(true);
      const data = await aiAssistantService.testAssistant(assistant.id, { question });
      setResponse(data);
    } catch (err) {
      onError('Erreur lors du test de l\'assistant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTest();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tester votre assistant IA</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                Posez une question à votre assistant
              </label>
              <div className="mt-1">
                <textarea
                  id="question"
                  name="question"
                  rows={3}
                  className="shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Ex: Comment évalueriez-vous les compétences techniques d'un candidat pour ce poste ?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={handleTest}
                disabled={loading || !question.trim()}
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <ChatBubbleLeftRightIcon className="-ml-1 mr-2 h-4 w-4" />
                    Poser la question
                  </>
                )}
              </button>
            </div>
          </div>
          
          {response && (
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center mb-4">
                <CpuChipIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h4 className="font-medium text-gray-900">Réponse de l'assistant</h4>
                <span className="ml-2 text-xs text-gray-500">via {response.model}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-line">
                {response.content}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1 md:flex md:justify-between">
            <p className="text-sm text-blue-700">
              Cette interface de test vous permet de vérifier les réponses de votre assistant avant de l'utiliser dans des entretiens réels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Page de détails de l'assistant
const AIAssistantDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  useEffect(() => {
    fetchAssistant();
  }, [id]);
  
  const handleEdit = () => {
    router.push(`/ai-assistants/edit/${id}`);
  };
  
  const handleClone = async () => {
    try {
      await aiAssistantService.cloneAssistant(id, { name: `Copie de ${assistant.name}` });
      router.push('/ai-assistants');
    } catch (err) {
      setError('Erreur lors du clonage de l\'assistant: ' + err.message);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet assistant ? Cette action est irréversible.')) return;
    
    try {
      await aiAssistantService.deleteAssistant(id);
      router.push('/ai-assistants');
    } catch (err) {
      setError('Erreur lors de la suppression de l\'assistant: ' + err.message);
    }
  };

  const handleCreateInterview = () => {
    router.push({
      pathname: '/interviews/new',
      query: { assistantId: id }
    });
  };
  
  const handleError = (message) => {
    setError(message);
  };
  
  if (loading) {
    return (
      <DashboardLayout title="Détails de l'assistant IA">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement des détails de l'assistant...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!assistant && !loading) {
    return (
      <DashboardLayout title="Assistant non trouvé">
        <div className="text-center py-20 bg-gray-50 rounded-lg border">
          <ExclamationCircleIcon className="h-10 w-10 text-red-500 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Assistant non trouvé</h3>
          <p className="mt-1 text-sm text-gray-500">
            L'assistant que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <div className="mt-6">
            <Link href="/ai-assistants" legacyBehavior>
              <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <ArrowLeftIcon className="-ml-1 mr-2 h-4 w-4" />
                Retour à la liste des assistants
              </a>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title={assistant?.name || 'Détails de l\'assistant IA'}>
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 inline-flex items-center text-sm font-medium text-red-700 hover:text-red-900"
          >
            Fermer
          </button>
        </div>
      )}
      
      <div className="mb-6">
        <nav className="sm:hidden" aria-label="Back">
          <Link href="/ai-assistants" legacyBehavior>
            <a className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
              <ArrowLeftIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mr-1" aria-hidden="true" />
              Retour
            </a>
          </Link>
        </nav>
        <nav className="hidden sm:flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div className="flex">
                <Link href="/dashboard" legacyBehavior>
                  <a className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    Dashboard
                  </a>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                <Link href="/ai-assistants" legacyBehavior>
                  <a className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Assistants IA
                  </a>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                <span className="ml-4 text-sm font-medium text-gray-500 truncate max-w-xs">
                  {assistant?.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Détails de l'assistant IA
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Informations et configuration de l'assistant.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCreateInterview}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <VideoCameraIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
              Nouvel entretien
            </button>
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PencilIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
              Modifier
            </button>
            <button
              type="button"
              onClick={handleClone}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ClipboardDocumentCheckIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
              Cloner
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
              Supprimer
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Nom</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {assistant.name}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {assistant.description || "Aucune description"}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Modèle d'IA</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {assistant.model === 'claude-3-7-sonnet' ? 'Claude 3.7 Sonnet' : 
                 assistant.model === 'claude-3-opus' ? 'Claude 3 Opus' : 
                 assistant.model === 'gpt-4o' ? 'GPT-4o' : 
                 assistant.model}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Mode d'entretien</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {assistant.interviewMode === 'autonomous' ? 'Autonome (L\'IA mène l\'entretien)' : 
                 assistant.interviewMode === 'collaborative' ? 'Collaboratif (Assistance au recruteur)' : 
                 assistant.interviewMode === 'hybrid' ? 'Hybride (Combinaison des deux modes)' : 
                 assistant.interviewMode}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Secteur & Poste</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {assistant.industry && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
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
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Date de création</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDateToLocale(assistant.createdAt)}
              </dd>
            </div>
            {assistant.usageCount > 0 && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Utilisation</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  Utilisé dans {assistant.usageCount} entretien{assistant.usageCount > 1 ? 's' : ''}
                  {assistant.lastUsed && ` (dernière utilisation: ${formatDateToLocale(assistant.lastUsed)})`}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/5 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'flex items-center justify-center',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-900'
              )
            }
          >
            <DocumentPlusIcon className="w-5 h-5 mr-2" />
            Documents
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full py-2.5 text-sm font-medium leading-5 rounded-lg',
                'flex items-center justify-center',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-900'
              )
            }
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            Tester l'assistant
          </Tab>
        </Tab.List>
        
        <Tab.Panels>
          <Tab.Panel>
            <DocumentsManager 
              assistantId={id} 
              onError={handleError} 
            />
          </Tab.Panel>
          <Tab.Panel>
            <TestAssistant 
              assistant={assistant} 
              onError={handleError} 
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </DashboardLayout>
  );
};

export default AIAssistantDetails;