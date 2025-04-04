// frontend/components/ai/CreateAssistant.jsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import AIAssistantService from '../../services/aiAssistantService';

const assistantTypes = [
  { id: 'general', name: 'Assistant général', description: 'IA polyvalente pour des tâches variées' },
  { id: 'recruiter', name: 'Recruteur', description: 'Spécialisé dans l\'évaluation des candidats' },
  { id: 'evaluator', name: 'Évaluateur technique', description: 'Analyse les compétences techniques' },
  { id: 'analyzer', name: 'Analyseur comportemental', description: 'Évalue le comportement et soft skills' }
];

const CreateAssistant = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    assistant_type: 'general',
    capabilities: {
      analysis_types: ['general', 'technical', 'behavioral'],
      can_comment: true,
      can_evaluate: true,
      can_summarize: true
    },
    model_version: 'claude-3.7-sonnet'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCapabilityChange = (capability, value) => {
    setFormData(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [capability]: value
      }
    }));
  };
  
  const handleAnalysisTypeChange = (type) => {
    setFormData(prev => {
      const currentTypes = prev.capabilities.analysis_types || [];
      const updatedTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
        
      return {
        ...prev,
        capabilities: {
          ...prev.capabilities,
          analysis_types: updatedTypes
        }
      };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await AIAssistantService.createAssistant(formData);
      router.push('/ai-assistants');
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la création de l\'assistant IA');
    } finally {
      setLoading(false);
    }
  };
  
  const analysisTypes = [
    { id: 'general', name: 'Analyse générale' },
    { id: 'technical', name: 'Évaluation technique' },
    { id: 'behavioral', name: 'Analyse comportementale' },
    { id: 'bias', name: 'Détection de biais' },
    { id: 'language', name: 'Analyse linguistique' }
  ];
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Créer un nouvel assistant IA</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Nom de l'assistant
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Type d'assistant
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assistantTypes.map((type) => (
              <div 
                key={type.id}
                className={`border rounded-lg p-4 cursor-pointer ${formData.assistant_type === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                onClick={() => setFormData(prev => ({ ...prev, assistant_type: type.id }))}
              >
                <div className="font-semibold">{type.name}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Capacités
          </label>
          <div className="flex flex-wrap gap-3 mb-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="can_comment"
                checked={formData.capabilities.can_comment}
                onChange={(e) => handleCapabilityChange('can_comment', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="can_comment">Peut commenter</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="can_evaluate"
                checked={formData.capabilities.can_evaluate}
                onChange={(e) => handleCapabilityChange('can_evaluate', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="can_evaluate">Peut évaluer</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="can_summarize"
                checked={formData.capabilities.can_summarize}
                onChange={(e) => handleCapabilityChange('can_summarize', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="can_summarize">Peut résumer</label>
            </div>
          </div>
          
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Types d'analyses disponibles
          </label>
          <div className="flex flex-wrap gap-3">
            {analysisTypes.map((type) => (
              <div 
                key={type.id}
                className={`px-3 py-1 rounded-full cursor-pointer text-sm ${
                  formData.capabilities.analysis_types.includes(type.id) 
                    ? 'bg-blue-500 text-black' 
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => handleAnalysisTypeChange(type.id)}
              >
                {type.name}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="model_version">
            Version du modèle
          </label>
          <select
            id="model_version"
            name="model_version"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.model_version}
            onChange={handleChange}
          >
            <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="custom">Modèle personnalisé</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => router.back()}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Création en cours...' : 'Créer l\'assistant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssistant;