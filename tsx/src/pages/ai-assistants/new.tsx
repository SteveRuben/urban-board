// pages/ai-assistants/new.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ChevronLeftIcon,
  CheckIcon,
  XMarkIcon,
  CpuChipIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { AIAssistant, TooltipProps, InterviewMode, AIModel } from '@/types/assistant';
import aiAssistantService from '@/services/ai-assistant-service';
import DashboardLayout from '@/components/layout/dashboard-layout';



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

// Form field component
interface FormFieldProps {
  label: string;
  id: string;
  children: React.ReactNode;
  tooltip?: string;
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ label, id, children, tooltip, required = false }) => {
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
      </div>
    </div>
  );
};

// Main component
const NewAIAssistant: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<AIAssistant>({
    id: '',
    name: '',
    description: '',
    interviewMode: 'collaborative',
    model: 'claude-3-7-sonnet',
    persona: '',
    instructions: ''
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Le nom de l\'assistant est requis');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const createdAssistant = await aiAssistantService.createAssistant(formData);
      
      setSuccess(true);
      
      // Redirect to the list page after a short delay
      setTimeout(() => {
        router.push('/ai-assistants');
      }, 1500);
      
    } catch (err) {
      setError(`Erreur lors de la création de l'assistant: ${(err as Error).message}`);
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
            <a href="/ai-assistants"className="inline-flex items-center mr-4 text-sm font-medium text-gray-500 hover:text-gray-700">
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Retour
            </a>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">
            Nouvel assistant IA
          </h1>
        </div>
      </div>
      
      <div className="mt-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 flex items-center">
            <CheckIcon className="h-5 w-5 mr-2" />
            Assistant créé avec succès! Redirection...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-4">
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
                >
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    placeholder="Assistant d'entretien technique"
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
                  label="Mode d'entretien" 
                  id="interviewMode"
                  tooltip="Détermine le niveau d'autonomie de l'assistant pendant l'entretien"
                  required
                >
                  <select
                    id="interviewMode"
                    name="interviewMode"
                    value={formData.interviewMode}
                    onChange={handleChange}
                    className="max-w-lg block focus:ring-primary-500 focus:border-primary-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="autonomous">Autonome</option>
                    <option value="collaborative">Collaboratif</option>
                    <option value="hybrid">Hybride</option>
                  </select>
                </FormField>
                
                <FormField 
                  label="Modèle IA" 
                  id="model"
                  tooltip="Le modèle d'intelligence artificielle à utiliser"
                  required
                >
                  <select
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="max-w-lg block focus:ring-primary-500 focus:border-primary-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="gpt-4o">GPT-4o</option>
                  </select>
                </FormField>
              </div>
            </div>
          </div>
          
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
                    <option value="technology">Technologie</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Santé</option>
                    <option value="education">Éducation</option>
                    <option value="retail">Commerce</option>
                    <option value="manufacturing">Industrie</option>
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
                    <option value="software-engineer">Ingénieur logiciel</option>
                    <option value="data-scientist">Data Scientist</option>
                    <option value="product-manager">Chef de produit</option>
                    <option value="designer">Designer</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Ventes</option>
                    <option value="customer-support">Support client</option>
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
                    <option value="entry-level">Débutant</option>
                    <option value="mid-level">Intermédiaire</option>
                    <option value="senior">Senior</option>
                    <option value="management">Management</option>
                    <option value="executive">Exécutif</option>
                  </select>
                </FormField>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Configuration avancée</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Options avancées pour personnaliser davantage le comportement de l'assistant.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                <FormField 
                  label="Persona" 
                  id="persona"
                  tooltip="Personnalité et ton à adopter par l'assistant"
                >
                  <textarea
                    name="persona"
                    id="persona"
                    rows={4}
                    value={formData.persona || ''}
                    onChange={handleChange}
                    className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Professionnel et bienveillant, pose des questions précises..."
                  />
                </FormField>
                
                <FormField 
                  label="Instructions" 
                  id="instructions"
                  tooltip="Instructions spécifiques pour guider le comportement de l'assistant"
                >
                  <textarea
                    name="instructions"
                    id="instructions"
                    rows={6}
                    value={formData.instructions || ''}
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
          
          <div className="flex justify-end">
            <>
              <a href="/ai-assistants"  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Annuler
              </a>
            </>
            <button
              type="submit"
              disabled={loading}
              className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
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

NewAIAssistant.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
export default NewAIAssistant;