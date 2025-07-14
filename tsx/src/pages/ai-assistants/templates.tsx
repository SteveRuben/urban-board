// pages/ai-assistants/templates.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  ChevronLeftIcon,
  StarIcon,
  PlusIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
  CalendarIcon,
  UserIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/dashboard-layout';
import aiAssistantService from '@/services/ai-assistant-service';
import { formatDate } from '@/lib/utils';
import { 
  AssistantTemplate,
  AssistantType,
  ASSISTANT_TYPE_LABELS, 
  INDUSTRY_LABELS, 
  JOB_ROLE_LABELS, 
  SENIORITY_LABELS, 
  INTERVIEW_MODE_LABELS,
  MODEL_LABELS,
  normalizeAssistant
} from '@/types/assistant';

// Types pour les filtres
interface FilterState {
  search: string;
  type: AssistantType | '';
  category: string;
}

// Badge de mode d'entretien
const InterviewModeBadge: React.FC<{ mode: string }> = ({ mode }) => {
  const colorClass = 
    mode === 'autonomous' ? 'bg-orange-100 text-orange-800' : 
    mode === 'collaborative' ? 'bg-blue-100 text-blue-800' : 
    'bg-purple-100 text-purple-800';
  
  const label = INTERVIEW_MODE_LABELS[mode as keyof typeof INTERVIEW_MODE_LABELS] || mode;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
};

// Badge de popularité
const PopularityBadge: React.FC<{ popularity?: number }> = ({ popularity }) => {
  if (!popularity || popularity < 50) return null;
  
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <SparklesIcon className="h-3 w-3 mr-1" />
      Populaire
    </span>
  );
};

// Card de template
interface TemplateCardProps {
  template: AssistantTemplate;
  onUseTemplate: (template: AssistantTemplate) => void;
  onViewDetails: (template: AssistantTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUseTemplate, onViewDetails }) => {
  const handleUseTemplate = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onUseTemplate(template);
  };
  
  const handleViewDetails = (): void => {
    onViewDetails(template);
  };
  
  return (
    <div 
      onClick={handleViewDetails}
      className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center flex-1">
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                  {template.name}
                </h3>
                <PopularityBadge popularity={template.popularity} />
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <InterviewModeBadge mode={template.interviewMode} />
                {template.category && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {template.category}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleUseTemplate}
            className="ml-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Utiliser
          </button>
        </div>
        
        <p className="mt-3 text-sm text-gray-500 line-clamp-2">
          {template.description || 'Aucune description'}
        </p>
        
        {/* Highlights */}
        {template.highlights && template.highlights.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {template.highlights.slice(0, 3).map((highlight, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700"
                >
                  ✓ {highlight}
                </span>
              ))}
              {template.highlights.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-700">
                  +{template.highlights.length - 3} autres
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {ASSISTANT_TYPE_LABELS[template.assistantType] || template.assistantType}
          </span>
          
          {template.industry && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {INDUSTRY_LABELS[template.industry] || template.industry}
            </span>
          )}
          
          {template.jobRole && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {JOB_ROLE_LABELS[template.jobRole] || template.jobRole}
            </span>
          )}
          
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {MODEL_LABELS[template.model] || template.model}
          </span>
        </div>
        
        <div className="mt-4 border-t pt-4 flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-500">
            <UserIcon className="h-4 w-4 mr-1" />
            <span>{template.creatorName || 'Système'}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{formatDate(template.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant de filtres
interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  categories: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange, onReset, categories }) => {
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = filters.search || filters.type || filters.category;

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Recherche */}
        <div className="relative lg:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un template..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        {/* Type d'assistant */}
        <select
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          <option value="">Tous les types</option>
          {Object.entries(ASSISTANT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Catégorie */}
        <select
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Filtres actifs
          </span>
          <button
            onClick={onReset}
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
};

// Modal de création depuis template
interface CreateFromTemplateModalProps {
  template: AssistantTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateFromTemplateModal: React.FC<CreateFromTemplateModalProps> = ({ 
  template, 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiProvider, setApiProvider] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template && isOpen) {
      setName(`Mon ${template.name}`);
      setApiKey('');
      setApiProvider('');
    }
  }, [template, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !template) return;

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        apiKey: apiKey.trim() || undefined,
        apiProvider: apiProvider || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error creating from template:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
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
          <form onSubmit={handleSubmit}>
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <StarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Créer depuis le template
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Créez un nouvel assistant basé sur le template <strong>{template.name}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom de l'assistant *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Nom de votre assistant"
                  required
                />
              </div>

              <div>
                <label htmlFor="apiProvider" className="block text-sm font-medium text-gray-700">
                  Fournisseur d'API (optionnel)
                </label>
                <select
                  id="apiProvider"
                  value={apiProvider}
                  onChange={(e) => setApiProvider(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Configurer plus tard...</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google AI</option>
                  <option value="azure_openai">Azure OpenAI</option>
                </select>
              </div>

              {apiProvider && (
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                    Clé d'API
                  </label>
                  <input
                    type="password"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Entrez votre clé d'API"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Vous pourrez configurer la clé d'API plus tard si vous préférez.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer l\'assistant'}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={onClose}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Page principale des templates
const AIAssistantTemplates: React.FC = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<AssistantTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<AssistantTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AssistantTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    category: ''
  });
  
  // Extraire les catégories uniques
  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));
  
  const fetchTemplates = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await aiAssistantService.getTemplates(filters.type || undefined);
      
      const normalizedTemplates = response.map(template => ({
        ...normalizeAssistant(template),
        highlights: template.highlights || [],
        category: template.category || 'Général',
        popularity: template.popularity || 0
      })) as AssistantTemplate[];
      
      setTemplates(normalizedTemplates);
      setError(null);
    } catch (err: any) {
      setError(`Erreur lors du chargement des templates: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...templates];
    
    // Filtre de recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.description?.toLowerCase().includes(searchLower) ||
        template.assistantType.toLowerCase().includes(searchLower) ||
        template.highlights?.some(h => h.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtre par type
    if (filters.type) {
      filtered = filtered.filter(template => template.assistantType === filters.type);
    }
    
    // Filtre par catégorie
    if (filters.category) {
      filtered = filtered.filter(template => template.category === filters.category);
    }
    
    // Trier par popularité
    filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    
    setFilteredTemplates(filtered);
  }, [templates, filters]);
  
  useEffect(() => {
    fetchTemplates();
  }, [filters.type]);
  
  const handleUseTemplate = (template: AssistantTemplate): void => {
    setSelectedTemplate(template);
    setShowCreateModal(true);
  };

  const handleViewDetails = (template: AssistantTemplate): void => {
    router.push(`/ai-assistants/${template.id}`);
  };

  const handleCreateFromTemplate = async (data: any): Promise<void> => {
    if (!selectedTemplate) return;

    try {
      const response = await aiAssistantService.createFromTemplate(selectedTemplate.id, data);
      
      // Rediriger vers la page d'édition du nouvel assistant
      router.push(`/ai-assistants/edit/${response.data.id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la création');
    }
  };

  const resetFilters = (): void => {
    setFilters({
      search: '',
      type: '',
      category: ''
    });
  };
  
  return (
    <>
      <head>
        <title>Templates d'assistants IA</title>
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
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">
              Templates d'assistants IA
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Créez rapidement un assistant à partir de templates préconfigurés
            </p>
          </div>
        </div>
        <div className="mt-3 flex sm:ml-4 sm:mt-0">
          <button
            onClick={() => router.push('/ai-assistants/new')}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Créer depuis zéro
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        {/* Barre de filtres */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
          categories={categories}
        />

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
            <button
              onClick={fetchTemplates}
              className="ml-2 inline-flex items-center text-sm font-medium text-red-700 hover:text-red-900"
            >
              Réessayer
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Chargement des templates...</p>
          </div>
        ) : filteredTemplates.length > 0 ? (
          <>
            {/* Statistiques */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
                  <div className="text-sm text-gray-500">Templates disponibles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{categories.length}</div>
                  <div className="text-sm text-gray-500">Catégories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {templates.filter(t => (t.popularity || 0) >= 50).length}
                  </div>
                  <div className="text-sm text-gray-500">Templates populaires</div>
                </div>
              </div>
            </div>

            {/* Grille de templates */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUseTemplate={handleUseTemplate}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg border">
            <StarIcon className="h-10 w-10 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {templates.length === 0 ? 'Aucun template disponible' : 'Aucun résultat'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {templates.length === 0 
                ? 'Les templates d\'assistants IA seront bientôt disponibles.'
                : 'Aucun template ne correspond à vos critères de recherche.'
              }
            </p>
            <div className="mt-6">
              {templates.length === 0 ? (
                <button
                  onClick={() => router.push('/ai-assistants/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                  Créer un assistant personnalisé
                </button>
              ) : (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de création depuis template */}
      <CreateFromTemplateModal
        template={selectedTemplate}
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedTemplate(null);
        }}
        onSubmit={handleCreateFromTemplate}
      />
    </>
  );
};

AIAssistantTemplates.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
export default AIAssistantTemplates;