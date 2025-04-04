// frontend/components/ai/AssistantsList.jsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AIAssistantService from '../../services/aiAssistantService';
import { ChevronRight, Plus, Users, Brain, Zap, Settings } from 'lucide-react';

const AssistantsList = () => {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const data = await AIAssistantService.getUserAssistants();
        setAssistants(data);
      } catch (err) {
        setError('Impossible de charger les assistants IA');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssistants();
  }, []);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'recruiter':
        return <Users size={20} className="text-blue-500" />;
      case 'evaluator':
        return <Brain size={20} className="text-purple-500" />;
      case 'analyzer':
        return <Zap size={20} className="text-orange-500" />;
      default:
        return <Settings size={20} className="text-gray-500" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'recruiter':
        return 'Recruteur';
      case 'evaluator':
        return 'Évaluateur technique';
      case 'analyzer':
        return 'Analyseur comportemental';
      default:
        return 'Assistant général';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
        </div>
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

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Mes assistants IA</h2>
          <Link 
            href="/ai-assistants/create" 
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-black font-medium py-2 px-4 rounded-lg"
          >
            <Plus size={18} className="mr-1" />
            Créer un assistant
          </Link>
        </div>
      </div>

      {assistants.length === 0 ? (
        <div className="p-6 text-center">
          <div className="bg-gray-50 rounded-lg p-8">
            <Brain size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun assistant IA</h3>
            <p className="text-gray-600 mb-4">Vous n'avez pas encore créé d'assistant IA. Créez-en un pour améliorer votre processus de recrutement.</p>
            <Link 
              href="/ai-assistants/create" 
              className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-black font-medium py-2 px-4 rounded-lg"
            >
              <Plus size={18} className="mr-1" />
              Créer mon premier assistant
            </Link>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {assistants.map((assistant) => (
            <Link 
              key={assistant.id} 
              href={`/ai-assistants/${assistant.id}`}
              className="block hover:bg-gray-50 transition-colors"
            >
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-black">
                      {getTypeIcon(assistant.assistant_type)}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-800">{assistant.name}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{getTypeLabel(assistant.assistant_type)}</span>
                        <span className="mx-2">•</span>
                        <span>{assistant.model_version}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="text-right mr-4">
                      <div className="text-sm font-medium text-gray-900">{assistant.teams_count || 0} équipes</div>
                      <div className="text-sm text-gray-500">Utilisé dans</div>
                    </div>
                    <ChevronRight className="text-gray-400" />
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {assistant.capabilities?.analysis_types?.map((type) => (
                    <span key={type} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {type === 'general' && 'Analyse générale'}
                      {type === 'technical' && 'Évaluation technique'}
                      {type === 'behavioral' && 'Analyse comportementale'}
                      {type === 'bias' && 'Détection de biais'}
                      {type === 'language' && 'Analyse linguistique'}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssistantsList;