// frontend/components/interview/RequestAIAnalysis.jsx
import React, { useState, useEffect } from 'react';
import AIAssistantService from '../../services/aiAssistantService';
import { Brain, Zap, AlertCircle, Check, X } from 'lucide-react';

const RequestAIAnalysis = ({ interviewId, teamId }) => {
  const [teamAssistants, setTeamAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState(null);
  const [availableAnalysisTypes, setAvailableAnalysisTypes] = useState([]);
  const [parameters, setParameters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchTeamAssistants = async () => {
      try {
        setLoading(true);
        const assistants = await AIAssistantService.getTeamAssistants(teamId);
        // Filtrer les assistants qui peuvent faire des analyses
        const analysisAssistants = assistants.filter(assistant => 
          assistant.capabilities && 
          assistant.capabilities.analysis_types && 
          assistant.capabilities.analysis_types.length > 0
        );
        setTeamAssistants(analysisAssistants);
      } catch (err) {
        setError('Impossible de charger les assistants IA');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamAssistants();
  }, [teamId]);

  useEffect(() => {
    if (selectedAssistant) {
      const assistant = teamAssistants.find(a => a.id === selectedAssistant);
      if (assistant && assistant.capabilities && assistant.capabilities.analysis_types) {
        setAvailableAnalysisTypes(assistant.capabilities.analysis_types);
        setSelectedAnalysisType(assistant.capabilities.analysis_types[0] || null);
      } else {
        setAvailableAnalysisTypes([]);
        setSelectedAnalysisType(null);
      }
    }
  }, [selectedAssistant, teamAssistants]);

  const handleRequestAnalysis = async () => {
    if (!selectedAssistant || !selectedAnalysisType) return;
    
    try {
      setProcessing(true);
      const response = await AIAssistantService.requestAnalysis(
        teamId,
        interviewId,
        selectedAssistant,
        selectedAnalysisType,
        parameters
      );
      
      setResult({
        success: true,
        data: response
      });
    } catch (err) {
      setResult({
        success: false,
        error: err.response?.data?.message || 'Erreur lors de la demande d\'analyse'
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedAssistant(null);
    setSelectedAnalysisType(null);
    setParameters({});
    setResult(null);
  };

  const getAnalysisTypeLabel = (type) => {
    switch (type) {
      case 'general': return 'Analyse générale';
      case 'technical': return 'Évaluation technique';
      case 'behavioral': return 'Analyse comportementale';
      case 'bias': return 'Détection de biais';
      case 'language': return 'Analyse linguistique';
      default: return type;
    }
  };

  const getAnalysisTypeDescription = (type) => {
    switch (type) {
      case 'general':
        return 'Une analyse générale de l\'entretien couvrant les points clés et impressions globales.';
      case 'technical':
        return 'Évaluation des compétences techniques du candidat, de sa maîtrise des technologies et de sa résolution de problèmes.';
      case 'behavioral':
        return 'Analyse du comportement, des soft skills et de la compatibilité culturelle du candidat.';
      case 'bias':
        return 'Détection des biais potentiels dans l\'entretien pour assurer un processus équitable.';
      case 'language':
        return 'Analyse de la communication, du vocabulaire et des compétences linguistiques.';
      default:
        return 'Analyse spécialisée pour ce type d\'entretien.';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-700 text-black font-bold py-2 px-4 rounded"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (teamAssistants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <Brain className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun assistant IA capable d'analyse</h3>
          <p className="mt-1 text-sm text-gray-500">
            Cette équipe n'a pas d'assistants IA pouvant réaliser des analyses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-2">
            <Zap className="h-6 w-6 text-indigo-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-800">
              Demander une analyse IA
            </h3>
          </div>
          <p className="text-gray-600 mb-6">
            Utilisez l'intelligence artificielle pour analyser cet entretien et obtenir des insights détaillés.
          </p>
          
          <button 
            onClick={() => setShowModal(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-black font-medium py-2.5 px-4 rounded-lg flex items-center justify-center"
          >
            <Brain className="mr-2 h-5 w-5" />
            Lancer une analyse IA
          </button>
        </div>
      </div>

      {/* Modal de demande d'analyse */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-indigo-500" />
                  Demander une analyse IA
                </h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {result ? (
              <div className="p-6">
                {result.success ? (
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Analyse demandée avec succès</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      L'analyse a été lancée et sera disponible dans quelques instants.
                    </p>
                    
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-1">Type d'analyse :</div>
                      <div className="text-sm text-gray-900 mb-3">{getAnalysisTypeLabel(result.data.analysis_type)}</div>
                      
                      <div className="text-sm font-medium text-gray-700 mb-1">Statut :</div>
                      <div className="text-sm">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {result.data.status === 'completed' ? 'Terminée' : 'En cours'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Erreur</h3>
                    <p className="mt-2 text-sm text-red-500">
                      {result.error}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                  {result.success && (
                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-black hover:bg-indigo-700"
                    >
                      Nouvelle analyse
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    1. Choisir un assistant IA
                  </label>
                  <div className="space-y-3 max-h-32 overflow-y-auto mb-1">
                    {teamAssistants.map((assistant) => (
                      <div 
                        key={assistant.id} 
                        className={`border rounded-lg p-3 cursor-pointer ${
                          selectedAssistant === assistant.id 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAssistant(assistant.id)}
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-black">
                            <Brain size={14} />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium">{assistant.name}</div>
                            <div className="text-xs text-gray-500 flex items-center">
                              {assistant.team_role && (
                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded mr-2">
                                  {assistant.team_role}
                                </span>
                              )}
                              <span>{assistant.model_version}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedAssistant && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        2. Type d'analyse
                      </label>
                      {availableAnalysisTypes.length > 0 ? (
                        <div className="space-y-2">
                          {availableAnalysisTypes.map((type) => (
                            <div 
                              key={type}
                              className={`border rounded-lg p-3 cursor-pointer ${
                                selectedAnalysisType === type
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedAnalysisType(type)}
                            >
                              <div className="font-medium text-gray-900">
                                {getAnalysisTypeLabel(type)}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {getAnalysisTypeDescription(type)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Cet assistant ne peut pas effectuer d'analyses. Veuillez en choisir un autre.
                        </div>
                      )}
                    </div>
                    
                    {selectedAnalysisType && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          3. Paramètres optionnels
                        </label>
                        <div className="border border-gray-200 rounded-lg p-3">
                          <div className="mb-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Focus particulier
                            </label>
                            <input
                              type="text"
                              placeholder="ex: compétences techniques, soft skills..."
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              value={parameters.focus || ''}
                              onChange={(e) => setParameters({...parameters, focus: e.target.value})}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Niveau de détail
                            </label>
                            <select
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              value={parameters.detail_level || 'standard'}
                              onChange={(e) => setParameters({...parameters, detail_level: e.target.value})}
                            >
                              <option value="brief">Bref</option>
                              <option value="standard">Standard</option>
                              <option value="detailed">Détaillé</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {!result && (
              <div className="bg-gray-50 p-4 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleRequestAnalysis}
                  disabled={!selectedAssistant || !selectedAnalysisType || processing}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    !selectedAssistant || !selectedAnalysisType || processing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-black hover:bg-indigo-700'
                  }`}
                >
                  {processing ? 'Traitement en cours...' : 'Lancer l\'analyse'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RequestAIAnalysis;