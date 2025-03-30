// components/interview/AIAssistantSelector.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  CpuChipIcon, 
  CheckCircleIcon,
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import aiAssistantService from '../../services/aiAssistantService';

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

// Carte d'assistant IA pour la sélection
const AssistantCard = ({ assistant, selected, onSelect }) => {
  return (
    <div 
      className={`relative bg-white border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${
        selected ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300'
      }`}
      onClick={() => onSelect(assistant)}
    >
      {selected && (
        <div className="absolute top-2 right-2">
          <CheckCircleIcon className="h-6 w-6 text-primary-600" />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
              <CpuChipIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 pr-6">{assistant.name}</h3>
            <InterviewModeBadge mode={assistant.interviewMode} />
          </div>
        </div>
        
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
          {assistant.description || 'Aucune description'}
        </p>
        
        <div className="mt-3 flex flex-wrap gap-2">
          {assistant.industry && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
        </div>
      </div>
    </div>
  );
};

// Composant principal pour sélectionner un assistant
const AIAssistantSelector = ({ value, onChange, required = false, label = "Assistant IA" }) => {
  const router = useRouter();
  const { assistantId } = router.query;
  
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setLoading(true);
        const data = await aiAssistantService.getAllAssistants();
        setAssistants(data);
        
        // Si un assistantId est passé dans l'URL et qu'aucun assistant n'est sélectionné,
        // sélectionner cet assistant
        if (assistantId && !value) {
          const assistant = data.find(a => a.id === assistantId);
          if (assistant) {
            onChange(assistant);
          }
        }
      } catch (err) {
        setError('Erreur lors du chargement des assistants: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssistants();
  }, [assistantId]);
  
  const handleCreateAssistant = () => {
    router.push('/ai-assistants/create');
  };
  
  const filteredAssistants = assistants.filter(assistant => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      assistant.name.toLowerCase().includes(searchLower) ||
      (assistant.description && assistant.description.toLowerCase().includes(searchLower)) ||
      (assistant.industry && assistant.industry.toLowerCase().includes(searchLower)) ||
      (assistant.jobRole && assistant.jobRole.toLowerCase().includes(searchLower))
    );
  });
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Rechercher un assistant IA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      )}

      <div>
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Chargement des assistants IA...</p>
          </div>
        ) : filteredAssistants.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredAssistants.map((assistant) => (
              <AssistantCard
                key={assistant.id}
                assistant={assistant}
                selected={value && value.id === assistant.id}
                onSelect={onChange}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg border">
            <CpuChipIcon className="h-10 w-10 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? "Aucun assistant correspondant" : "Aucun assistant disponible"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? "Essayez une autre recherche ou créez un nouvel assistant." 
                : "Commencez par créer un assistant IA pour vos entretiens."}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleCreateAssistant}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Créer un assistant IA
              </button>
            </div>
          </div>
        )}
      </div>
      
      {value && (
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Désélectionner
          </button>
        </div>
      )}
    </div>
  );
};

export default AIAssistantSelector;