// pages/ai-assistants/index.tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  CpuChipIcon,
  ChevronRightIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  KeyIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/dashboard-layout';
import aiAssistantService from '@/services/ai-assistant-service';
import { formatDate } from '@/lib/utils';
import { 
  AIAssistant, 
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
  hasApiKey: 'all' | 'with' | 'without';
  createdByUser: boolean;
  includeTemplates: boolean;
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

// Badge pour le statut de l'API
const APIStatusBadge: React.FC<{ hasApiKey: boolean; provider?: string }> = ({ hasApiKey, provider }) => {
  if (!hasApiKey) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
        Pas d'API
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckBadgeIcon className="h-3 w-3 mr-1" />
      {provider || 'API configurée'}
    </span>
  );
};

// Card d'assistant IA améliorée
interface AIAssistantCardProps {
  assistant: AIAssistant;
  onDelete: (assistant: AIAssistant) => void;
  onDuplicate: (assistant: AIAssistant) => void;
  onMakeTemplate?: (assistant: AIAssistant) => void;
  onViewStats?: (assistant: AIAssistant) => void;
}

const AIAssistantCard: React.FC<AIAssistantCardProps> = ({ 
  assistant, 
  onDelete, 
  onDuplicate, 
  onMakeTemplate,
  onViewStats 
}) => {
  const router = useRouter();
  
  const getLastUsedText = (): string => {
    if (!assistant.lastUsed) return 'Jamais utilisé';
    
    const lastUsed = new Date(assistant.lastUsed);
    const now = new Date();
    const diffMs = now.getTime() - lastUsed.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  };
  
  const handleEdit = (e: React.MouseEvent): void => {
    e.stopPropagation();
    router.push(`/ai-assistants/edit/${assistant.id}`);
  };
  
  const handleDetails = (): void => {
    router.push(`/ai-assistants/${assistant.id}`);
  };
  
  const handleDuplicate = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onDuplicate(assistant);
  };
  
  const handleDelete = (e: React.MouseEvent): void => {
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
              {assistant.isTemplate ? (
                <StarIcon className="h-6 w-6 text-yellow-600" />
              ) : (
                <CpuChipIcon className="h-6 w-6 text-primary-600" />
              )}
            </div>
            <div className="ml-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900">{assistant.name}</h3>
                {assistant.isTemplate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Template
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <InterviewModeBadge mode={assistant.interviewMode} />
                <APIStatusBadge hasApiKey={assistant.hasApiKey || false} provider={assistant.apiProvider} />
              </div>
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
              onClick={handleDuplicate}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500"
              title="Dupliquer"
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleDelete}
              className="p-1 rounded-md text-gray-400 hover:text-red-500"
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {ASSISTANT_TYPE_LABELS[assistant.assistantType] || assistant.assistantType}
          </span>
          
          {assistant.industry && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {INDUSTRY_LABELS[assistant.industry] || assistant.industry}
            </span>
          )}
          
          {assistant.jobRole && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {JOB_ROLE_LABELS[assistant.jobRole] || assistant.jobRole}
            </span>
          )}
          
          {assistant.seniority && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {SENIORITY_LABELS[assistant.seniority] || assistant.seniority}
            </span>
          )}
          
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {MODEL_LABELS[assistant.model] || assistant.model}
          </span>
        </div>
        
        <div className="mt-4 border-t pt-4 flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>Créé le {formatDate(assistant.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-4">
            {assistant.teamsCount !== undefined && assistant.teamsCount > 0 && (
              <span className="text-sm text-gray-500">
                {assistant.teamsCount} équipe{assistant.teamsCount > 1 ? 's' : ''}
              </span>
            )}
            <span className="text-gray-500">
              {(assistant.usageCount ?? 0) > 0 
                ? `Utilisé ${assistant.usageCount} fois` 
                : 'Jamais utilisé'}
            </span>
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
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange, onReset }) => {
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = filters.search || filters.type || filters.hasApiKey !== 'all' || 
    filters.createdByUser || filters.includeTemplates;

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Recherche */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un assistant..."
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

        {/* Statut API */}
        <select
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          value={filters.hasApiKey}
          onChange={(e) => handleFilterChange('hasApiKey', e.target.value)}
        >
          <option value="all">Statut API</option>
          <option value="with">Avec clé d'API</option>
          <option value="without">Sans clé d'API</option>
        </select>

        {/* Checkbox pour créé par utilisateur */}
        <div className="flex items-center">
          <input
            id="createdByUser"
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            checked={filters.createdByUser}
            onChange={(e) => handleFilterChange('createdByUser', e.target.checked)}
          />
          <label htmlFor="createdByUser" className="ml-2 block text-sm text-gray-900">
            Mes assistants uniquement
          </label>
        </div>

        {/* Checkbox pour inclure templates */}
        <div className="flex items-center">
          <input
            id="includeTemplates"
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            checked={filters.includeTemplates}
            onChange={(e) => handleFilterChange('includeTemplates', e.target.checked)}
          />
          <label htmlFor="includeTemplates" className="ml-2 block text-sm text-gray-900">
            Inclure les templates
          </label>
        </div>
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

// Page principale de liste des assistants
const AIAssistantList: React.FC = () => {
  const router = useRouter();
  const [assistants, setAssistants] = useState<AIAssistant[]>([]);
  const [filteredAssistants, setFilteredAssistants] = useState<AIAssistant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AIAssistant | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [duplicatingAssistant, setDuplicatingAssistant] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    hasApiKey: 'all',
    createdByUser: false,
    includeTemplates: false
  });
  
  const fetchAssistants = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await aiAssistantService.getAllAssistants({
        include_templates: filters.includeTemplates,
        created_by_user: filters.createdByUser,
        type: filters.type || undefined
      });
      console.log(response)
      const normalizedAssistants = response.map(normalizeAssistant);
      setAssistants(normalizedAssistants);
      setError(null);
    } catch (err) {
      setError(`Erreur lors du chargement des assistants: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...assistants];
    
    // Filtre de recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(assistant =>
        assistant.name.toLowerCase().includes(searchLower) ||
        assistant.description?.toLowerCase().includes(searchLower) ||
        assistant.assistantType.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtre par type
    if (filters.type) {
      filtered = filtered.filter(assistant => assistant.assistantType === filters.type);
    }
    
    // Filtre par statut API
    if (filters.hasApiKey !== 'all') {
      filtered = filtered.filter(assistant => {
        const hasKey = assistant.hasApiKey || false;
        return filters.hasApiKey === 'with' ? hasKey : !hasKey;
      });
    }
    
    setFilteredAssistants(filtered);
  }, [assistants, filters]);
  
  useEffect(() => {
    fetchAssistants();
  }, [filters.includeTemplates, filters.createdByUser, filters.type]);
  
  const handleDuplicateAssistant = async (assistant: AIAssistant): Promise<void> => {
    try {
      setDuplicatingAssistant(assistant.id);
      await aiAssistantService.duplicateAssistant(assistant.id, { 
        name: `Copie de ${assistant.name}`,
        copyApiKey: false // Ne pas copier la clé d'API par défaut
      });
      await fetchAssistants();
    } catch (err) {
      setError(`Erreur lors de la duplication de l'assistant: ${(err as Error).message}`);
    } finally {
      setDuplicatingAssistant(null);
    }
  };

  const handleMakeTemplate = async (assistant: AIAssistant): Promise<void> => {
    try {
      await aiAssistantService.makeTemplate(assistant.id, {
        templateName: `Template - ${assistant.name}`,
        removeApiKey: true
      });
      await fetchAssistants();
    } catch (err) {
      setError(`Erreur lors de la création du template: ${(err as Error).message}`);
    }
  };

  const handleViewStats = (assistant: AIAssistant): void => {
    router.push(`/ai-assistants/${assistant.id}/stats`);
  };
  
  const handleDeleteAssistant = useCallback((assistant: AIAssistant) => {
    setDeleteConfirm(assistant);
  }, []);
  
  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await aiAssistantService.deleteAssistant(deleteConfirm.id);
      await fetchAssistants();
      setDeleteConfirm(null);
    } catch (err) {
      setError(`Erreur lors de la suppression de l'assistant: ${(err as Error).message}`);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirm, isDeleting]);
  
  const cancelDelete = useCallback(() => {
    if (isDeleting) return;
    setDeleteConfirm(null);
  }, [isDeleting]);

  const resetFilters = (): void => {
    setFilters({
      search: '',
      type: '',
      hasApiKey: 'all',
      createdByUser: false,
      includeTemplates: false
    });
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
          <button
            onClick={() => router.push('/ai-assistants/templates')}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 border border-gray-300"
          >
            <StarIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Templates
          </button>
          <button
            onClick={() => router.push('/ai-assistants/new')}
            className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Nouvel assistant
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        {/* Barre de filtres */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />

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
        ) : filteredAssistants.length > 0 ? (
          <>
            {/* Statistiques */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{assistants.length}</div>
                  <div className="text-sm text-gray-500">Total assistants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {assistants.filter(a => a.hasApiKey).length}
                  </div>
                  <div className="text-sm text-gray-500">Avec clé d'API</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {assistants.filter(a => a.isTemplate).length}
                  </div>
                  <div className="text-sm text-gray-500">Templates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {assistants.reduce((acc, a) => acc + (a.usageCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500">Utilisations totales</div>
                </div>
              </div>
            </div>

            {/* Grille d'assistants */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssistants.map((assistant) => (
                <AIAssistantCard
                  key={assistant.id}
                  assistant={assistant}
                  onDelete={handleDeleteAssistant}
                  onDuplicate={handleDuplicateAssistant}
                  onMakeTemplate={handleMakeTemplate}
                  onViewStats={handleViewStats}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg border">
            <CpuChipIcon className="h-10 w-10 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {assistants.length === 0 ? 'Aucun assistant IA' : 'Aucun résultat'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {assistants.length === 0 
                ? 'Créez votre premier assistant IA pour vous aider dans vos entretiens.'
                : 'Aucun assistant ne correspond à vos critères de recherche.'
              }
            </p>
            <div className="mt-6">
              {assistants.length === 0 ? (
                <>
                  <button
                    onClick={() => router.push('/ai-assistants/templates')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100"
                  >
                    <StarIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    Explorer les templates
                  </button>
                  <button
                    onClick={() => router.push('/ai-assistants/new')}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    Créer un assistant
                  </button>
                </>
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
      
          {/* Modal de confirmation de suppression */}
          {deleteConfirm && (
      <div 
        className="fixed inset-0 z-50 overflow-y-auto"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
          <div 
            className="relative bg-white rounded-lg max-w-lg w-full mx-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Supprimer l'assistant IA
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Êtes-vous sûr de vouloir supprimer l'assistant <strong>{deleteConfirm.name}</strong> ? 
                    {deleteConfirm.teamsCount && deleteConfirm.teamsCount > 0 && (
                      <span className="text-amber-600">
                        {' '}Cet assistant est utilisé dans {deleteConfirm.teamsCount} équipe(s).
                      </span>
                    )}
                    {' '}Cette action est irréversible.
                  </p>
                </div>
              </div>
                  
              <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row sm:gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={cancelDelete}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={confirmDelete}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

// AIAssistantList.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
export default AIAssistantList;