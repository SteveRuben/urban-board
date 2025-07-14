// pages/ai-assistants/edit/[id].tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ChevronLeftIcon,
  CheckIcon,
  XMarkIcon,
  CpuChipIcon,
  QuestionMarkCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { 
  UpdateAssistantData, 
  AIAssistant,
  APIKeyData,
  ASSISTANT_TYPE_LABELS, 
  INDUSTRY_LABELS, 
  JOB_ROLE_LABELS, 
  SENIORITY_LABELS, 
  INTERVIEW_MODE_LABELS,
  MODEL_LABELS,
  PROVIDER_LABELS,
  AssistantType,
  InterviewMode,
  AIModel,
  APIProvider,
  IndustryType,
  JobRoleType,
  SeniorityLevel,
  normalizeAssistant
} from '@/types/assistant';
import aiAssistantService from '@/services/ai-assistant-service';

// Composants réutilisés de la page de création
const Tooltip: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="relative flex items-center group">
      <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 ml-1 cursor-help" />
      <div className="absolute z-10 invisible group-hover:visible bg-black text-white p-2 rounded text-xs w-64 bottom-full mb-2 left-1/2 transform -translate-x-1/2">
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-solid border-transparent border-t-black"></div>
      </div>
    </div>
  );
};

interface FormFieldProps {
  label: string;
  id: string;
  children: React.ReactNode;
  tooltip?: string;
  required?: boolean;
  error?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, id, children, tooltip, required = false, error }) => {
  return (
    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
      >
        <div className="flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {tooltip && <Tooltip text={tooltip} />}
        </div>
      </label>
      <div className="mt-1 sm:mt-0 sm:col-span-2">
        {children}
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

// Section de gestion des clés d'API
interface APIKeyManagementProps {
  assistant: AIAssistant;
  onApiKeyUpdate: () => void;
}

const APIKeyManagement: React.FC<APIKeyManagementProps> = ({ assistant, onApiKeyUpdate }) => {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [newProvider, setNewProvider] = useState<APIProvider | ''>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleUpdateApiKey = async () => {
    if (!newApiKey.trim() || !newProvider) return;

    try {
      setUpdating(true);
      await aiAssistantService.updateApiKey(assistant.id, {
        apiKey: newApiKey.trim(),
        apiProvider: newProvider
      });
      
      setNewApiKey('');
      setNewProvider('');
      setShowUpdateForm(false);
      onApiKeyUpdate();
    } catch (error: any) {
      alert(`Erreur lors de la mise à jour: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer la clé d\'API ?')) return;

    try {
      setRemoving(true);
      await aiAssistantService.removeApiKey(assistant.id);
      onApiKeyUpdate();
    } catch (error: any) {
      alert(`Erreur lors de la suppression: ${error.message}`);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
            <KeyIcon className="h-5 w-5 mr-2" />
            Gestion des clés d'API
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Configurez ou modifiez la clé d'API de l'assistant.
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          {assistant.hasApiKey ? (
            <div className="space-y-4">
              {/* État actuel */}
              <div className="bg-green-50 p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-green-800">
                      Clé d'API configurée
                    </h4>
                    <div className="mt-1 text-sm text-green-700">
                      <p>Fournisseur: {PROVIDER_LABELS[assistant.apiProvider as APIProvider] || assistant.apiProvider}</p>
                      <p>Clé: {assistant.apiKeyMasked}</p>
                      {assistant.apiKeyLastUpdated && (
                        <p>Dernière mise à jour: {new Date(assistant.apiKeyLastUpdated).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowUpdateForm(!showUpdateForm)}
                      className="text-sm bg-white text-green-700 border border-green-300 rounded px-3 py-1 hover:bg-green-50"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={handleRemoveApiKey}
                      disabled={removing}
                      className="text-sm bg-red-600 text-white rounded px-3 py-1 hover:bg-red-700 disabled:opacity-50"
                    >
                      {removing ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Formulaire de mise à jour */}
              {showUpdateForm && (
                <div className="border rounded-md p-4 space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Mettre à jour la clé d'API</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fournisseur</label>
                    <select
                      value={newProvider}
                      onChange={(e) => setNewProvider(e.target.value as APIProvider)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Choisir un fournisseur...</option>
                      {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nouvelle clé d'API</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Entrez la nouvelle clé d'API"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        {showApiKey ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowUpdateForm(false)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleUpdateApiKey}
                      disabled={!newApiKey.trim() || !newProvider || updating}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updating ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pas de clé configurée */}
              <div className="bg-yellow-50 p-4 rounded-md">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800">
                      Aucune clé d'API configurée
                    </h4>
                    <p className="mt-1 text-sm text-yellow-700">
                      Configurez une clé d'API pour permettre à l'assistant d'utiliser les services d'IA.
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulaire d'ajout */}
              <div className="border rounded-md p-4 space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Ajouter une clé d'API</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fournisseur</label>
                  <select
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value as APIProvider)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Choisir un fournisseur...</option>
                    {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Clé d'API</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Entrez votre clé d'API"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {showApiKey ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleUpdateApiKey}
                    disabled={!newApiKey.trim() || !newProvider || updating}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating ? 'Ajout...' : 'Ajouter la clé d\'API'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant principal d'édition
const EditAIAssistant: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [assistant, setAssistant] = useState<AIAssistant | null>(null);
  const [formData, setFormData] = useState<UpdateAssistantData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const fetchAssistant = async (): Promise<void> => {
    if (!id || typeof id !== 'string') return;
    
    try {
      setLoading(true);
      const response = await aiAssistantService.getAssistantById(id);
      const normalizedAssistant = normalizeAssistant(response);
      setAssistant(normalizedAssistant);
      console.log('......',normalizedAssistant)
      // Initialiser le formulaire avec les données existantes
      setFormData({
        name: normalizedAssistant.name,
        description: normalizedAssistant.description,
        model: normalizedAssistant.model,
        assistantType: normalizedAssistant.assistantType,
        industry: normalizedAssistant.industry,
        jobRole: normalizedAssistant.jobRole,
        seniority: normalizedAssistant.seniority,
        interviewMode: normalizedAssistant.interviewMode,
        personality: normalizedAssistant.personality,
        baseKnowledge: normalizedAssistant.baseKnowledge,
        capabilities: normalizedAssistant.capabilities,
        customPrompt: normalizedAssistant.customPrompt,
        questionBank: normalizedAssistant.questionBank,
        avatar: normalizedAssistant.avatar
      });
      
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Nettoyer l'erreur du champ modifié
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Gérer les champs imbriqués
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UpdateAssistantData] as object || {}),
          [child]: type === 'checkbox' ? checked : type === 'range' ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Le nom de l\'assistant est requis';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm() || !assistant) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await aiAssistantService.updateAssistant(assistant.id, formData);
      
      setSuccess(true);
      
      // Mettre à jour les données locales
      const updatedAssistant = normalizeAssistant(response);
      setAssistant(updatedAssistant);
      
      // Masquer le message de succès après quelques secondes
      setTimeout(() => setSuccess(false), 3000);
       router.push(`/ai-assistants/${updatedAssistant.id}`)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de l\'assistant');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement de l'assistant...</p>
        </div>
    );
  }
  
  if (!assistant) {
    return (
        <div className="text-center py-20">
          <CpuChipIcon className="h-10 w-10 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Assistant non trouvé</h3>
          <p className="mt-1 text-sm text-gray-500">
            L'assistant demandé n'existe pas ou vous n'avez pas les permissions pour y accéder.
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
        <title>Modifier {assistant.name}</title>
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
            Modifier {assistant.name}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/ai-assistants/${assistant.id}`)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            Voir les détails
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            <div className="flex">
              <XMarkIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium">Erreur</h3>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 flex items-center">
            <CheckIcon className="h-5 w-5 mr-2" />
            Assistant mis à jour avec succès!
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-4">
          {/* Informations générales */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Informations générales</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Informations de base de votre assistant IA.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                <FormField 
                  label="Nom de l'assistant" 
                  id="name"
                  required
                  error={fieldErrors.name}
                >
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </FormField>
                
                <FormField 
                  label="Description" 
                  id="description"
                  tooltip="Une brève description de l'objectif et du comportement de l'assistant"
                >
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={formData.description || ''}
                    onChange={handleChange}
                    className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 rounded-md"
                  />
                </FormField>
                
                <FormField 
                  label="Type d'assistant" 
                  id="assistantType"
                  required
                >
                  <select
                    id="assistantType"
                    name="assistantType"
                    value={formData.assistantType || ''}
                    onChange={handleChange}
                    className="max-w-lg block focus:ring-primary-500 focus:border-primary-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    {Object.entries(ASSISTANT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </FormField>
                
                <FormField 
                  label="Mode d'entretien" 
                  id="interviewMode"
                  required
                >
                  <select
                    id="interviewMode"
                    name="interviewMode"
                    value={formData.interviewMode || ''}
                    onChange={handleChange}
                    className="max-w-lg block focus:ring-primary-500 focus:border-primary-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    {Object.entries(INTERVIEW_MODE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </FormField>
                
                <FormField 
                  label="Modèle IA" 
                  id="model"
                  required
                >
                  <select
                    id="model"
                    name="model"
                    value={formData.model || ''}
                    onChange={handleChange}
                    className="max-w-lg block focus:ring-primary-500 focus:border-primary-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    {Object.entries(MODEL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          </div>
          
          {/* Gestion des clés d'API */}
          <APIKeyManagement 
            assistant={assistant} 
            onApiKeyUpdate={fetchAssistant}
          />
          
          {/* Contexte professionnel */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Contexte professionnel</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Adaptez l'assistant à un contexte professionnel spécifique.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                <FormField label="Industrie" id="industry">
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry || ''}
                    onChange={handleChange}
                    className="max-w-lg block focus:ring-primary-500 focus:border-primary-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Non spécifié</option>
                    {Object.entries(INDUSTRY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </FormField>
                
                <FormField label="Poste" id="jobRole">
                  <select
                    id="jobRole"
                    name="jobRole"
                    value={formData.jobRole || ''}
                    onChange={handleChange}
                    className="max-w-lg block focus:ring-primary-500 focus:border-primary-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Non spécifié</option>
                    {Object.entries(JOB_ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </FormField>
                
                <FormField label="Niveau" id="seniority">
                  <select
                    id="seniority"
                    name="seniority"
                    value={formData.seniority || ''}
                    onChange={handleChange}
                    className="max-w-lg block focus:ring-primary-500 focus:border-primary-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Non spécifié</option>
                    {Object.entries(SENIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          </div>

          {/* Personnalité */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Personnalité</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configurez la personnalité et le style de l'assistant.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                <FormField label="Convivialité" id="personality.friendliness">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">Formel</span>
                    <input
                      type="range"
                      name="personality.friendliness"
                      id="personality.friendliness"
                      min="1"
                      max="5"
                      value={formData.personality?.friendliness || 3}
                      onChange={handleChange}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500">Chaleureux</span>
                    <span className="text-sm font-medium text-gray-900 w-6">
                      {formData.personality?.friendliness || 3}
                    </span>
                  </div>
                </FormField>

                <FormField label="Formalité" id="personality.formality">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">Décontracté</span>
                    <input
                      type="range"
                      name="personality.formality"
                      id="personality.formality"
                      min="1"
                      max="5"
                      value={formData.personality?.formality || 3}
                      onChange={handleChange}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500">Formel</span>
                    <span className="text-sm font-medium text-gray-900 w-6">
                      {formData.personality?.formality || 3}
                    </span>
                  </div>
                </FormField>

                <FormField label="Profondeur technique" id="personality.technicalDepth">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">Général</span>
                    <input
                      type="range"
                      name="personality.technicalDepth"
                      id="personality.technicalDepth"
                      min="1"
                      max="5"
                      value={formData.personality?.technicalDepth || 3}
                      onChange={handleChange}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500">Technique</span>
                    <span className="text-sm font-medium text-gray-900 w-6">
                      {formData.personality?.technicalDepth || 3}
                    </span>
                  </div>
                </FormField>

                <FormField label="Intensité des questions de suivi" id="personality.followUpIntensity">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">Basique</span>
                    <input
                      type="range"
                      name="personality.followUpIntensity"
                      id="personality.followUpIntensity"
                      min="1"
                      max="5"
                      value={formData.personality?.followUpIntensity || 3}
                      onChange={handleChange}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500">Approfondi</span>
                    <span className="text-sm font-medium text-gray-900 w-6">
                      {formData.personality?.followUpIntensity || 3}
                    </span>
                  </div>
                </FormField>
              </div>
            </div>
          </div>

          {/* Connaissances de base */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Connaissances de base</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Domaines de connaissances que l'assistant doit couvrir.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-4">
                <div className="flex items-center">
                  <input
                    id="baseKnowledge.technicalSkills"
                    name="baseKnowledge.technicalSkills"
                    type="checkbox"
                    checked={formData.baseKnowledge?.technicalSkills || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="baseKnowledge.technicalSkills" className="ml-2 block text-sm text-gray-900">
                    Compétences techniques
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="baseKnowledge.softSkills"
                    name="baseKnowledge.softSkills"
                    type="checkbox"
                    checked={formData.baseKnowledge?.softSkills || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="baseKnowledge.softSkills" className="ml-2 block text-sm text-gray-900">
                    Compétences comportementales
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="baseKnowledge.companyValues"
                    name="baseKnowledge.companyValues"
                    type="checkbox"
                    checked={formData.baseKnowledge?.companyValues || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="baseKnowledge.companyValues" className="ml-2 block text-sm text-gray-900">
                    Valeurs de l'entreprise
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="baseKnowledge.industryTrends"
                    name="baseKnowledge.industryTrends"
                    type="checkbox"
                    checked={formData.baseKnowledge?.industryTrends || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="baseKnowledge.industryTrends" className="ml-2 block text-sm text-gray-900">
                    Tendances du secteur
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Capacités */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Capacités</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fonctionnalités que l'assistant peut utiliser.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-4">
                <div className="flex items-center">
                  <input
                    id="capabilities.generateQuestions"
                    name="capabilities.generateQuestions"
                    type="checkbox"
                    checked={formData.capabilities?.generateQuestions || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="capabilities.generateQuestions" className="ml-2 block text-sm text-gray-900">
                    Générer des questions
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="capabilities.evaluateResponses"
                    name="capabilities.evaluateResponses"
                    type="checkbox"
                    checked={formData.capabilities?.evaluateResponses || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="capabilities.evaluateResponses" className="ml-2 block text-sm text-gray-900">
                    Évaluer les réponses
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="capabilities.provideFeedback"
                    name="capabilities.provideFeedback"
                    type="checkbox"
                    checked={formData.capabilities?.provideFeedback || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="capabilities.provideFeedback" className="ml-2 block text-sm text-gray-900">
                    Fournir des commentaires
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="capabilities.suggestFollowUps"
                    name="capabilities.suggestFollowUps"
                    type="checkbox"
                    checked={formData.capabilities?.suggestFollowUps || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="capabilities.suggestFollowUps" className="ml-2 block text-sm text-gray-900">
                    Suggérer des questions de suivi
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="capabilities.realTimeCoaching"
                    name="capabilities.realTimeCoaching"
                    type="checkbox"
                    checked={formData.capabilities?.realTimeCoaching || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="capabilities.realTimeCoaching" className="ml-2 block text-sm text-gray-900">
                    Coaching en temps réel
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="capabilities.biometricIntegration"
                    name="capabilities.biometricIntegration"
                    type="checkbox"
                    checked={formData.capabilities?.biometricIntegration || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="capabilities.biometricIntegration" className="ml-2 block text-sm text-gray-900">
                    Intégration biométrique
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Instructions personnalisées */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Instructions personnalisées</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Instructions spécifiques pour guider le comportement de l'assistant.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                <FormField label="Prompt personnalisé" id="customPrompt">
                  <textarea
                    name="customPrompt"
                    id="customPrompt"
                    rows={6}
                    value={formData.customPrompt || ''}
                    onChange={handleChange}
                    className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Instructions spécifiques pour personnaliser le comportement de l'assistant..."
                  />
                </FormField>
              </div>
            </div>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/ai-assistants')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

// EditAIAssistant.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
export default EditAIAssistant;