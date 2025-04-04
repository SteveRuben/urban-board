// frontend/components/interview/AIContentsPanel.jsx
import React, { useState, useEffect } from 'react';
import AIAssistantService from '../../services/aiAssistantService';
import { Brain, ChevronDown, ChevronUp, Lightbulb, FileText, PieChart, MessageSquare, Filter } from 'lucide-react';

const AIContentsPanel = ({ interviewId, teamId }) => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedContent, setExpandedContent] = useState(null);
  const [filter, setFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoading(true);
        const data = await AIAssistantService.getAIContents(interviewId, {
          teamId: teamId,
          contentType: filter
        });
        setContents(data);
      } catch (err) {
        setError('Impossible de charger le contenu IA');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, [interviewId, teamId, filter]);

  const toggleExpand = (contentId) => {
    if (expandedContent === contentId) {
      setExpandedContent(null);
    } else {
      setExpandedContent(contentId);
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'comment':
        return <MessageSquare size={16} className="text-blue-500" />;
      case 'analysis':
        return <PieChart size={16} className="text-purple-500" />;
      case 'summary':
        return <FileText size={16} className="text-green-500" />;
      case 'evaluation':
        return <Lightbulb size={16} className="text-yellow-500" />;
      default:
        return <Brain size={16} className="text-gray-500" />;
    }
  };

  const getContentTypeLabel = (type) => {
    switch (type) {
      case 'comment':
        return 'Commentaire';
      case 'analysis':
        return 'Analyse';
      case 'summary':
        return 'Résumé';
      case 'question':
        return 'Question';
      case 'evaluation':
        return 'Évaluation';
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
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
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Brain className="mr-2 h-5 w-5 text-blue-500" />
            Contenu généré par IA
          </h3>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
            >
              <Filter size={16} className="mr-1" />
              <span className="text-sm">Filtrer</span>
              {filter && <span className="ml-1 bg-blue-500 text-black text-xs px-1.5 py-0.5 rounded-full">{filter}</span>}
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="p-2">
                  <button 
                    onClick={() => {
                      setFilter(null);
                      setShowFilters(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Tous les types
                  </button>
                  <button 
                    onClick={() => {
                      setFilter('comment');
                      setShowFilters(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Commentaires
                  </button>
                  <button 
                    onClick={() => {
                      setFilter('analysis');
                      setShowFilters(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Analyses
                  </button>
                  <button 
                    onClick={() => {
                      setFilter('summary');
                      setShowFilters(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Résumés
                  </button>
                  <button 
                    onClick={() => {
                      setFilter('evaluation');
                      setShowFilters(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Évaluations
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {contents.length === 0 ? (
        <div className="p-6 text-center">
          <div className="bg-gray-50 rounded-lg p-8">
            <Brain size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun contenu IA</h3>
            <p className="text-gray-600">
              {filter 
                ? `Aucun contenu de type "${filter}" n'a été généré par l'IA pour cet entretien.`
                : "Aucun contenu n'a été généré par l'IA pour cet entretien."}
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {contents.map((content) => (
            <div key={content.id} className="p-6 hover:bg-gray-50">
              <div 
                className="flex justify-between items-start cursor-pointer"
                onClick={() => toggleExpand(content.id)}
              >
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    {getContentTypeIcon(content.content_type)}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{content.ai_assistant_name}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{formatDate(content.created_at)}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
                        {getContentTypeLabel(content.content_type)}
                      </span>
                      {content.metadata?.analysis_type && (
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {content.metadata.analysis_type}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-gray-700 line-clamp-2">
                      {content.content.split('\n')[0]}
                    </div>
                  </div>
                </div>
                {expandedContent === content.id ? (
                  <ChevronUp className="text-gray-400 mt-1" />
                ) : (
                  <ChevronDown className="text-gray-400 mt-1" />
                )}
              </div>
              
              {expandedContent === content.id && (
                <div className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="whitespace-pre-line text-gray-700">
                      {content.content}
                    </div>
                    
                    {content.metadata && Object.keys(content.metadata).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-500 mb-2">Métadonnées :</div>
                        <div className="text-sm text-gray-700">
                          {Object.entries(content.metadata).map(([key, value]) => (
                            <div key={key} className="flex mb-1">
                              <span className="font-medium w-32">{key} :</span>
                              <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIContentsPanel;