// pages/ai-assistants/gallery.tsx
import { useState, useEffect, ReactElement, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { 
  UserCircleIcon, 
  CpuChipIcon, 
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import aiAssistantService from '@/services/ai-assistant-service';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { NextPageWithLayout } from '@/types/page';

// Types
interface Filter {
  id: string;
  name: string;
}

interface AssistantTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  jobRole: string;
  seniority: string;
  interviewMode: 'autonomous' | 'collaborative' | 'hybrid';
  highlights?: string[];
  [key: string]: any; // Pour toute propriété supplémentaire
}

interface AssistantTemplateCardProps {
  template: AssistantTemplate;
  onSelect: (template: AssistantTemplate) => void;
  getLayout?: (page: ReactElement) => ReactNode;
}

// Filtres pour la galerie
const industryFilters: Filter[] = [
  { id: 'all', name: 'Tous les secteurs' },
  { id: 'technology', name: 'Technologie' },
  { id: 'finance', name: 'Finance' },
  { id: 'healthcare', name: 'Santé' },
  { id: 'education', name: 'Éducation' },
  { id: 'retail', name: 'Commerce de détail' },
  { id: 'manufacturing', name: 'Industrie' }
];

const roleFilters: Filter[] = [
  { id: 'all', name: 'Tous les postes' },
  { id: 'software-engineer', name: 'Ingénieur logiciel' },
  { id: 'data-scientist', name: 'Data Scientist' },
  { id: 'product-manager', name: 'Chef de produit' },
  { id: 'designer', name: 'Designer' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'sales', name: 'Ventes' },
  { id: 'customer-support', name: 'Support client' }
];

const seniorityFilters: Filter[] = [
  { id: 'all', name: 'Tous les niveaux' },
  { id: 'entry-level', name: 'Débutant' },
  { id: 'mid-level', name: 'Intermédiaire' },
  { id: 'senior', name: 'Senior' },
  { id: 'management', name: 'Management' },
  { id: 'executive', name: 'Exécutif' }
];

// Carte pour afficher un modèle d'assistant
const AssistantTemplateCard: React.FC<AssistantTemplateCardProps> = ({ template, onSelect }) => (
  <div className="relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
            <CpuChipIcon className="h-6 w-6 text-primary-600" />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{template.description}</p>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {template.industry === 'technology' ? 'Technologie' : 
             template.industry === 'finance' ? 'Finance' : 
             template.industry === 'healthcare' ? 'Santé' : 
             template.industry === 'education' ? 'Éducation' : 
             template.industry === 'retail' ? 'Commerce' : 
             template.industry === 'manufacturing' ? 'Industrie' : 
             template.industry}
          </span>
          
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {template.jobRole === 'software-engineer' ? 'Ing. logiciel' : 
             template.jobRole === 'data-scientist' ? 'Data Scientist' : 
             template.jobRole === 'product-manager' ? 'Chef de produit' : 
             template.jobRole === 'designer' ? 'Designer' : 
             template.jobRole === 'marketing' ? 'Marketing' : 
             template.jobRole === 'sales' ? 'Ventes' : 
             template.jobRole === 'customer-support' ? 'Support client' : 
             template.jobRole}
          </span>
          
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {template.seniority === 'entry-level' ? 'Débutant' : 
             template.seniority === 'mid-level' ? 'Intermédiaire' : 
             template.seniority === 'senior' ? 'Senior' : 
             template.seniority === 'management' ? 'Management' : 
             template.seniority === 'executive' ? 'Exécutif' : 
             template.seniority}
          </span>
          
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {template.interviewMode === 'autonomous' ? 'Mode autonome' : 
             template.interviewMode === 'collaborative' ? 'Mode collaboratif' : 
             template.interviewMode === 'hybrid' ? 'Mode hybride' : 
             template.interviewMode}
          </span>
        </div>
      </div>
      
      <div className="mt-5">
        <h4 className="text-sm font-medium text-gray-900">Points forts:</h4>
        <ul className="mt-2 space-y-1 text-sm text-gray-500 list-disc pl-5">
          {template.highlights && template.highlights.map((highlight, idx) => (
            <li key={idx}>{highlight}</li>
          ))}
        </ul>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => onSelect(template)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Utiliser ce modèle
        </button>
      </div>
    </div>
  </div>
);

const AIAssistantGallery: React.FC = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<AssistantTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [seniorityFilter, setSeniorityFilter] = useState<string>('all');
  
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const data = await aiAssistantService.getAssistantTemplates();
        setTemplates(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
        setError('Erreur lors du chargement des modèles: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  const handleSelectTemplate = async (template: AssistantTemplate) => {
    try {
      // Rediriger vers le formulaire de création avec les données du modèle pré-remplies
      router.push({
        pathname: '/ai-assistants/create',
        query: { templateId: template.id }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
      setError('Erreur lors de la sélection du modèle: ' + errorMessage);
    }
  };
  
  // Filtrer les templates en fonction des critères sélectionnés
  const filteredTemplates = templates.filter(template => {
    // Filtrer par terme de recherche
    if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !template.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtrer par secteur d'activité
    if (industryFilter !== 'all' && template.industry !== industryFilter) {
      return false;
    }
    
    // Filtrer par poste
    if (roleFilter !== 'all' && template.jobRole !== roleFilter) {
      return false;
    }
    
    // Filtrer par niveau d'expérience
    if (seniorityFilter !== 'all' && template.seniority !== seniorityFilter) {
      return false;
    }
    
    return true;
  });
  
  return (
    <div title="Galerie de modèles d'assistants IA">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:leading-9">
          Galerie de modèles d'assistants IA
        </h1>
        <div className="mt-3 flex sm:ml-4 sm:mt-0">
          <a href="/ai-assistants">
            <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer">
              <UserCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Mes assistants
            </span>
          </a>
          <a href="/ai-assistants/new">
            <span className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer">
              <CpuChipIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Créer un assistant personnalisé
            </span>
          </a>
        </div>
      </div>
      
      <div className="mt-6">
        <p className="text-sm text-gray-700 mb-6">
          Sélectionnez un modèle d'assistant IA prédéfini pour démarrer rapidement. Vous pourrez personnaliser et ajuster les capacités de votre assistant après sa création.
        </p>
        
        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <div className="sm:col-span-4">
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  placeholder="Rechercher un modèle d'assistant IA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="industry-filter" className="block text-sm font-medium text-gray-700">
                Secteur d'activité
              </label>
              <select
                id="industry-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                {industryFilters.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
                Poste cible
              </label>
              <select
                id="role-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                {roleFilters.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="seniority-filter" className="block text-sm font-medium text-gray-700">
                Niveau d'expérience
              </label>
              <select
                id="seniority-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={seniorityFilter}
                onChange={(e) => setSeniorityFilter(e.target.value)}
              >
                {seniorityFilters.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setIndustryFilter('all');
                  setRoleFilter('all');
                  setSeniorityFilter('all');
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
              >
                <ArrowPathIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        </div>
        
        {/* Liste des modèles */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Chargement des modèles d'assistants...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredTemplates.map((template) => (
              <AssistantTemplateCard
                key={template.id}
                template={template}
                onSelect={handleSelectTemplate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg border">
            <MagnifyingGlassIcon className="h-10 w-10 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun modèle trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Essayez de modifier vos filtres ou créez un assistant personnalisé.
            </p>
            <div className="mt-6">
              <a href="/ai-assistants/create">
                <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer">
                  Créer un assistant personnalisé
                </span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AIAssistantGallery.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
export default AIAssistantGallery;