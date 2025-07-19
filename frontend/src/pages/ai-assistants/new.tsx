// pages/ai-assistants/new.tsx
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  CreateAssistantData, 
  ASSISTANT_TYPE_LABELS, 
  INDUSTRY_LABELS, 
  JOB_ROLE_LABELS, 
  SENIORITY_LABELS, 
  INTERVIEW_MODE_LABELS,
  MODEL_LABELS,
  PROVIDER_LABELS,
  getDefaultCapabilities,
  getDefaultPersonality,
  getDefaultBaseKnowledge,
  AssistantType,
  InterviewMode,
  AIModel,
  APIProvider,
  IndustryType,
  JobRoleType,
  SeniorityLevel
} from '@/types/assistant';
import aiAssistantService from '@/services/ai-assistant-service';
import DashboardLayout from '@/components/layout/dashboard-layout';

// Composant Tooltip
interface TooltipProps {
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
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

// Composant FormField
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

// Composant pour la section des clés d'API
interface APIKeySectionProps {
  apiKey: string;
  apiProvider: APIProvider | '';
  showApiKey: boolean;
  onApiKeyChange: (value: string) => void;
  onProviderChange: (value: APIProvider | '') => void;
  onToggleVisibility: () => void;
}

const APIKeySection: React.FC<APIKeySectionProps> = ({
  apiKey,
  apiProvider,
  showApiKey,
  onApiKeyChange,
  onProviderChange,
  onToggleVisibility
}) => {
  return (
    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
            <KeyIcon className="h-5 w-5 mr-2" />
            Clé d'API
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Configurez la clé d'API pour permettre à l'assistant d'utiliser les services d'IA.
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
          <FormField 
            label="Fournisseur d'API" 
            id="apiProvider"
            tooltip="Choisissez le fournisseur d'IA que vous souhaitez utiliser"
          >
            <select
              id="apiProvider"
              name="apiProvider"
              value={apiProvider}
              onChange={(e) => onProviderChange(e.target.value as APIProvider | '')}
              className="max-w-lg block focus:ring-primary-500 focus:border-primary-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Sélectionner un fournisseur...</option>
              {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </FormField>
          
          {apiProvider && (
            <FormField 
              label="Clé d'API" 
              id="apiKey"
              tooltip="Votre clé d'API sera chiffrée et stockée de manière sécurisée"
            >
              <div className="flex rounded-md shadow-sm">
                <input
                  type={showApiKey ? "text" : "password"}
                  name="apiKey"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  className="flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={`Entrez votre clé d'API ${PROVIDER_LABELS[apiProvider as APIProvider]}`}
                />
                <button
                  type="button"
                  onClick={onToggleVisibility}
                  className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {showApiKey ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                💡 La clé d'API est optionnelle lors de la création. Vous pourrez l'ajouter plus tard.
              </p>
            </FormField>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant principal
export default function NewAIAssistant() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<CreateAssistantData>({
    name: '',
    description: '',
    model: 'claude-3-7-sonnet' as AIModel,
    assistantType: 'recruiter' as AssistantType,
    interviewMode: 'collaborative' as InterviewMode,
    personality: getDefaultPersonality(),
    baseKnowledge: getDefaultBaseKnowledge(),
    capabilities: getDefaultCapabilities(),
    customPrompt: '',
    questionBank: []
  });
  
  const [apiKey, setApiKey] = useState<string>('');
  const [apiProvider, setApiProvider] = useState<APIProvider | ''>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
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
          ...(prev[parent as keyof CreateAssistantData] as object || {}),
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
    
    if (!formData.name.trim()) {
      errors.name = 'Le nom de l\'assistant est requis';
    }
    
    if (!formData.assistantType) {
      errors.assistantType = 'Le type d\'assistant est requis';
    }
    
    if (!formData.model) {
      errors.model = 'Le modèle IA est requis';
    }
    
    if (!formData.interviewMode) {
      errors.interviewMode = 'Le mode d\'entretien est requis';
    }
    
    if (apiProvider && !apiKey.trim()) {
      errors.apiKey = 'La clé d\'API est requise si un fournisseur est sélectionné';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const dataToSend: CreateAssistantData = {
        ...formData
      };
      
      // Ajouter les informations de clé d'API si fournies
      if (apiProvider && apiKey.trim()) {
        dataToSend.apiKey = apiKey.trim();
        dataToSend.apiProvider = apiProvider;
      }
      
      console.log('Données du formulaire avant envoi:', dataToSend);
      
      const response = await aiAssistantService.createAssistant(dataToSend);
      
      console.log('Assistant créé:', response);
      setSuccess(true);
      
      // Redirection après un court délai
      setTimeout(() => {
        router.push('/ai-assistants');
      }, 1500);
      
    } catch (err: any) {
      console.error('Erreur complète:', err);
      setError(err.message || 'Erreur lors de la création de l\'assistant');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <head>
        <title>Nouvel assistant IA</title>
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
            Nouvel assistant IA
          </h1>
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
            Assistant créé avec succès! Redirection...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-4">
          {/* Informations générales */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Informations générales</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Informations de base pour configurer votre assistant IA.
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
                    value={formData.name}
                    onChange={handleChange}
                    className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    placeholder="Assistant d'entretien technique"
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
                    value={formData.description}
                    onChange={handleChange}
                    className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Cet assistant aide à conduire des entretiens techniques pour des postes d'ingénieurs logiciels..."
                  />
                </FormField>
                
                <FormField 
                  label="Type d'assistant" 
                  id="assistantType"
                  tooltip="Le type d'assistant détermine son rôle principal"
                  required
                  error={fieldErrors.assistantType}
                >
                  <select
                    id="assistantType"
                    name="assistantType"
                    value={formData.assistantType}
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
                  tooltip="Détermine le niveau d'autonomie de l'assistant pendant l'entretien"
                  required
                  error={fieldErrors.interviewMode}
                >
                  <select
                    id="interviewMode"
                    name="interviewMode"
                    value={formData.interviewMode}
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
                  tooltip="Le modèle d'intelligence artificielle à utiliser"
                  required
                  error={fieldErrors.model}
                >
                  <select
                    id="model"
                    name="model"
                    value={formData.model}
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
          
          {/* Section Clé d'API */}
          <APIKeySection
            apiKey={apiKey}
            apiProvider={apiProvider}
            showApiKey={showApiKey}
            onApiKeyChange={setApiKey}
            onProviderChange={setApiProvider}
            onToggleVisibility={() => setShowApiKey(!showApiKey)}
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
                <FormField 
                  label="Industrie" 
                  id="industry"
                  tooltip="Secteur d'activité pour lequel l'assistant est spécialisé"
                >
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
                
                <FormField 
                  label="Poste" 
                  id="jobRole"
                  tooltip="Rôle professionnel pour lequel l'assistant est conçu"
                >
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
                
                <FormField 
                  label="Niveau" 
                  id="seniority"
                  tooltip="Niveau d'expérience ciblé"
                >
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
                <FormField 
                  label="Convivialité" 
                  id="personality.friendliness"
                  tooltip="Niveau de chaleur et d'empathie dans les interactions (1=Formel, 5=Très chaleureux)"
                >
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

                <FormField 
                  label="Formalité" 
                  id="personality.formality"
                  tooltip="Niveau de formalité dans le langage (1=Très décontracté, 5=Très formel)"
                >
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

                <FormField 
                  label="Profondeur technique" 
                  id="personality.technicalDepth"
                  tooltip="Niveau de détail technique dans les questions (1=Général, 5=Très technique)"
                >
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

                <FormField 
                  label="Intensité des questions de suivi" 
                  id="personality.followUpIntensity"
                  tooltip="Fréquence et profondeur des questions de suivi (1=Basique, 5=Très approfondi)"
                >
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
                <FormField 
                  label="Prompt personnalisé" 
                  id="customPrompt"
                  tooltip="Instructions spécifiques pour personnaliser le comportement de l'assistant"
                >
                  <textarea
                    name="customPrompt"
                    id="customPrompt"
                    rows={6}
                    value={formData.customPrompt || ''}
                    onChange={handleChange}
                    className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 rounded-md"
                    placeholder="1. Commencer par une présentation brève et professionnelle
2. Poser des questions techniques adaptées au niveau du candidat
3. Approfondir les réponses par des questions de suivi..."
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
              disabled={loading}
              className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </>
              ) : (
                'Créer l\'assistant'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

// NewAIAssistant.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
// export default NewAIAssistant;