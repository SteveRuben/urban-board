// frontend/components/interview/RequestAIAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { Brain, AlertCircle, RefreshCw, Search, Filter, ChevronDown } from 'lucide-react';
import AIAssistantService from '../../services/aiAssistantService';

/**
 * Composant permettant de demander une analyse IA spécifique
 */
const RequestAIAnalysis = ({ interviewId, teamId, onRequestAnalysis }) => {
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [analysisType, setAnalysisType] = useState('');
  const [parameters, setParameters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingAssistants, setLoadingAssistants] = useState(true);
  const [showAssistantDropdown, setShowAssistantDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  // Charger les assistants IA disponibles
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setLoadingAssistants(true);
        
        // En environnement de développement, utiliser des données fictives
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 800));
          const mockAssistants = [
            {
              id: 'ai-001',
              name: 'TechEvaluator',
              assistant_type: 'evaluator',
              model_version: 'claude-3.7-sonnet',
              capabilities: {
                analysis_types: ['technical', 'general', 'bias']
              }
            },
            {
              id: 'ai-002',
              name: 'HR Assistant',
              assistant_type: 'recruiter',
              model_version: 'gpt-4o',
              capabilities: {
                analysis_types: ['behavioral', 'cultural-fit']
              }
            },
            {
              id: 'ai-003',
              name: 'Language Analyst',
              assistant_type: 'analyzer',
              model_version: 'claude-3-opus',
              capabilities: {
                analysis_types: ['language', 'communication']
              }
            }
          ];
          setAssistants(mockAssistants);
        } else {
          const userAssistants = await AIAssistantService.getUserAssistants();
          setAssistants(userAssistants);
        }
        
        setLoadingAssistants(false);
      } catch (error) {
        console.error('Erreur lors du chargement des assistants:', error);
        setError('Impossible de charger les assistants IA. Veuillez réessayer.');
        setLoadingAssistants(false);
      }
    };
    
    fetchAssistants();
  }, [interviewId]);
  
  // Mettre à jour les options d'analyse lors du changement d'assistant
  useEffect(() => {
    if (selectedAssistant) {
      // Réinitialiser le type d'analyse
      setAnalysisType('');
      setParameters({});
    }
  }, [selectedAssistant]);
  
  // Gérer le changement de paramètre
  const handleParameterChange = (key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Gérer la soumission de la demande d'analyse
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAssistant || !analysisType) {
      setError('Veuillez sélectionner un assistant et un type d\'analyse.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Appeler la fonction de demande d'analyse
      await onRequestAnalysis(selectedAssistant.id, analysisType, parameters);
      
      // Réinitialiser après succès
      setIsLoading(false);
      setParameters({});
      
    } catch (err) {
      console.error('Erreur lors de la demande d\'analyse:', err);
      setError('La demande d\'analyse a échoué. Veuillez réessayer.');
      setIsLoading(false);
    }
  };
  
  // Obtenir les types d'analyse disponibles pour l'assistant sélectionné
  const getAvailableAnalysisTypes = () => {
    if (!selectedAssistant || !selectedAssistant.capabilities || !selectedAssistant.capabilities.analysis_types) {
      return [];
    }
    
    return selectedAssistant.capabilities.analysis_types;
  };
  
  // Obtenir le libellé d'un type d'analyse
  const getAnalysisTypeLabel = (type) => {
    switch (type) {
      case 'technical':
        return 'Technique';
      case 'behavioral':
        return 'Comportemental';
      case 'general':
        return 'Général';
      case 'bias':
        return 'Biais';
      case 'cultural-fit':
        return 'Compatibilité culturelle';
      case 'language':
        return 'Langage';
      case 'communication':
        return 'Communication';
      default:
        return type;
    }
  };
  
  // Obtenir les paramètres pour un type d'analyse
  const getParametersForAnalysisType = () => {
    switch (analysisType) {
      case 'technical':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domaine technique
            </label>
            <select
              value={parameters.domain || ''}
              onChange={(e) => handleParameterChange('domain', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="">Sélectionner un domaine</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="database">Base de données</option>
              <option value="devops">DevOps</option>
              <option value="mobile">Mobile</option>
              <option value="ai">Intelligence artificielle</option>
            </select>
          </div>
        );
        
      case 'behavioral':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aspect comportemental
            </label>
            <select
              value={parameters.aspect || ''}
              onChange={(e) => handleParameterChange('aspect', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="">Sélectionner un aspect</option>
              <option value="teamwork">Travail d'équipe</option>
              <option value="leadership">Leadership</option>
              <option value="communication">Communication</option>
              <option value="problem_solving">Résolution de problèmes</option>
              <option value="stress_management">Gestion du stress</option>
            </select>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Demander une analyse IA</h2>
        <p className="mt-1 text-sm text-gray-500">
          Utilisez les assistants IA pour analyser l'entretien
        </p>
      </div>
      
      {loadingAssistants ? (
        <div className="p-6 flex justify-center items-center">
          <RefreshCw className="h-6 w-6 text-primary-600 animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des assistants...</span>
        </div>
      ) : assistants.length === 0 ? (
        <div className="p-6 text-center">
          <Brain className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-3">Aucun assistant IA disponible.</p>
          <p className="text-sm text-gray-500">
            Vous devez configurer des assistants IA pour utiliser cette fonctionnalité.
          </p>
          <a
            href="/ai-assistants/create"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Brain className="h-4 w-4 mr-2" />
            Créer un assistant IA
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Sélection de l'assistant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assistant IA
            </label>
            <div className="relative">
              <button
                type="button"
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onClick={() => setShowAssistantDropdown(!showAssistantDropdown)}
              >
                {selectedAssistant ? (
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-indigo-600 flex items-center justify-center mr-2">
                      <Brain className="h-4 w-4 text-black" />
                    </div>
                    <div>
                      <span className="block text-sm font-medium">{selectedAssistant.name}</span>
                      <span className="block text-xs text-gray-500">{selectedAssistant.model_version}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">Sélectionner un assistant</span>
                )}
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </button>
              
              {showAssistantDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 border border-gray-200 max-h-72 overflow-y-auto">
                  {assistants.map((assistant) => (
                    <button
                      key={assistant.id}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        setSelectedAssistant(assistant);
                        setShowAssistantDropdown(false);
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-indigo-600 flex items-center justify-center mr-2">
                        <Brain className="h-4 w-4 text-black" />
                      </div>
                      <div>
                        <span className="block text-sm font-medium">{assistant.name}</span>
                        <span className="block text-xs text-gray-500">{assistant.model_version}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Type d'analyse (si un assistant est sélectionné) */}
          {selectedAssistant && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'analyse
              </label>
              <div className="relative">
                <button
                  type="button"
                  className="w-full p-2 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  disabled={getAvailableAnalysisTypes().length === 0}
                >
                  {analysisType ? (
                    <span>{getAnalysisTypeLabel(analysisType)}</span>
                  ) : (
                    <span className="text-gray-500">Sélectionner un type d'analyse</span>
                  )}
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>
                
                {showTypeDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 border border-gray-200">
                    {getAvailableAnalysisTypes().map((type) => (
                      <button
                        key={type}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-100"
                        onClick={() => {
                          setAnalysisType(type);
                          setShowTypeDropdown(false);
                        }}
                      >
                        {getAnalysisTypeLabel(type)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Paramètres spécifiques au type d'analyse */}
          {selectedAssistant && analysisType && getParametersForAnalysisType()}
          
          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              <div className="flex">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {/* Bouton de soumission */}
          <div>
            <button
              type="submit"
              disabled={!selectedAssistant || !analysisType || isLoading}
              className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black ${
                !selectedAssistant || !analysisType || isLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Demander l'analyse
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RequestAIAnalysis;