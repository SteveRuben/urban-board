// frontend/components/team/TeamAIAssistants.jsx
import React, { useState, useEffect } from 'react';
import AIAssistantService from '../../services/aiAssistantService';
import { Brain, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';

const TeamAIAssistants = ({ teamId }) => {
  const [teamAssistants, setTeamAssistants] = useState([]);
  const [userAssistants, setUserAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [selectedRole, setSelectedRole] = useState('assistant');
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamAssistantsData, userAssistantsData] = await Promise.all([
          AIAssistantService.getTeamAssistants(teamId),
          AIAssistantService.getUserAssistants()
        ]);
        
        // Filtrer les assistants de l'utilisateur qui ne sont pas déjà dans l'équipe
        const teamAssistantIds = teamAssistantsData.map(a => a.id);
        const availableUserAssistants = userAssistantsData.filter(
          a => !teamAssistantIds.includes(a.id)
        );
        
        setTeamAssistants(teamAssistantsData);
        setUserAssistants(availableUserAssistants);
      } catch (err) {
        setError('Impossible de charger les assistants IA');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);

  const handleAddAssistant = async () => {
    if (!selectedAssistant) return;
    
    try {
      setProcessing(true);
      const result = await AIAssistantService.addAssistantToTeam(
        teamId, 
        selectedAssistant, 
        selectedRole
      );
      
      // Mettre à jour l'état local
      const addedAssistant = userAssistants.find(a => a.id === selectedAssistant);
      if (addedAssistant) {
        addedAssistant.team_role = selectedRole;
        setTeamAssistants(prev => [...prev, addedAssistant]);
        setUserAssistants(prev => prev.filter(a => a.id !== selectedAssistant));
      }
      
      setNotification({
        type: 'success',
        message: 'Assistant IA ajouté à l\'équipe avec succès!'
      });
      setShowAddModal(false);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Erreur lors de l\'ajout de l\'assistant IA'
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleRemoveAssistant = async (assistantId) => {
    try {
      setProcessing(true);
      await AIAssistantService.removeAssistantFromTeam(teamId, assistantId);
      
      // Mettre à jour l'état local
      const removedAssistant = teamAssistants.find(a => a.id === assistantId);
      if (removedAssistant) {
        delete removedAssistant.team_role;
        setUserAssistants(prev => [...prev, removedAssistant]);
        setTeamAssistants(prev => prev.filter(a => a.id !== assistantId));
      }
      
      setNotification({
        type: 'success',
        message: 'Assistant IA retiré de l\'équipe avec succès!'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Erreur lors du retrait de l\'assistant IA'
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'assistant': return 'Assistant';
      case 'evaluator': return 'Évaluateur';
      case 'analyzer': return 'Analyseur';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {notification && (
        <div className={`p-4 ${notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'} flex items-center`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          )}
          <span className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {notification.message}
          </span>
        </div>
      )}
      
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            Assistants IA de l'équipe
          </h3>
          <button 
            onClick={() => setShowAddModal(true)}
            disabled={userAssistants.length === 0}
            className={`flex items-center ${
              userAssistants.length > 0
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } font-medium py-2 px-4 rounded-lg`}
          >
            <Plus size={16} className="mr-1" />
            Ajouter un assistant
          </button>
        </div>
      </div>

      <div className="p-6">
        {teamAssistants.length === 0 ? (
          <div className="text-center py-6">
            <Brain className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun assistant IA</h3>
            <p className="mt-1 text-sm text-gray-500">
              Cette équipe n'a pas encore d'assistants IA.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                disabled={userAssistants.length === 0}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                  userAssistants.length > 0
                    ? 'text-white bg-blue-600 hover:bg-blue-700'
                    : 'text-gray-500 bg-gray-300 cursor-not-allowed'
                }`}
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Ajouter un assistant IA
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {teamAssistants.map((assistant) => (
              <div key={assistant.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white">
                      <Brain size={18} />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-base font-medium text-gray-900">{assistant.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                          {getRoleLabel(assistant.team_role)}
                        </span>
                        <span>•</span>
                        <span>{assistant.model_version}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveAssistant(assistant.id)}
                    disabled={processing}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {assistant.capabilities?.analysis_types && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assistant.capabilities.analysis_types.map((type) => (
                      <span key={type} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {type === 'general' && 'Analyse générale'}
                        {type === 'technical' && 'Évaluation technique'}
                        {type === 'behavioral' && 'Analyse comportementale'}
                        {type === 'bias' && 'Détection de biais'}
                        {type === 'language' && 'Analyse linguistique'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'ajout d'assistant IA */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                  Ajouter un assistant IA
                </h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowAddModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {userAssistants.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    Vous n'avez pas d'assistants IA disponibles à ajouter.{' '}
                    <a href="/ai-assistants/create" className="text-blue-500 hover:text-blue-700 font-medium">
                      Créez un nouvel assistant IA
                    </a>
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choisir un assistant IA
                    </label>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {userAssistants.map((assistant) => (
                        <div 
                          key={assistant.id} 
                          className={`border rounded-lg p-3 cursor-pointer ${
                            selectedAssistant === assistant.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedAssistant(assistant.id)}
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white">
                              <Brain size={14} />
                            </div>
                            <div className="ml-3">
                              <div className="font-medium">{assistant.name}</div>
                              <div className="text-xs text-gray-500">{assistant.assistant_type}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle dans l'équipe
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="assistant">Assistant</option>
                      <option value="evaluator">Évaluateur</option>
                      <option value="analyzer">Analyseur</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedRole === 'assistant' && "Participe à toutes les discussions et peut commenter les entretiens."}
                      {selectedRole === 'evaluator' && "Évalue les compétences techniques et professionnelles des candidats."}
                      {selectedRole === 'analyzer' && "Analyse le comportement et les réponses des candidats en profondeur."}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 flex justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAddAssistant}
                disabled={!selectedAssistant || processing}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  !selectedAssistant || processing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {processing ? 'Ajout en cours...' : 'Ajouter à l\'équipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamAIAssistants;