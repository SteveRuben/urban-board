// frontend/components/interview/InterviewSetupForm.jsx
import React, { useState, useEffect } from 'react';
import CVUpload from './CVUpload';
import aiInterviewService from '../../services/ai-interview-service';
import AIAssistantService from '../../services/aiAssistantService';
import { 
  ArrowLeft, 
  ArrowRight, 
  Trash2, 
  Plus, 
  Bot, 
  UserPlus, 
  Brain, 
  Loader, 
  RefreshCw 
} from 'lucide-react';

const InterviewSetupForm = ({ onSetupComplete, initialJobDescription = '', onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [assistants, setAssistants] = useState([]);
  
  // Données du formulaire
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [experienceLevel, setExperienceLevel] = useState('intermédiaire');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [cvFile, setCVFile] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [interviewMode, setInterviewMode] = useState('autonomous');
  const [selectedAssistants, setSelectedAssistants] = useState([]);
  
  // Questions générées
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  
  // Charger les assistants IA disponibles à l'étape 2
  useEffect(() => {
    if (step !== 2) return;
    
    const fetchAssistants = async () => {
      try {
        setLoadingAssistants(true);
        
        // Utiliser des données mockées en développement
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
      } catch (error) {
        console.error('Erreur lors du chargement des assistants:', error);
      } finally {
        setLoadingAssistants(false);
      }
    };
    
    fetchAssistants();
  }, [step]);
  
  // Gérer le téléchargement du CV
  const handleCVUploaded = (file) => {
    setCVFile(file);
  };
  
  // Passer à l'étape suivante
  const goToNextStep = () => {
    // Validation selon l'étape actuelle
    if (step === 1) {
      if (!jobTitle.trim()) {
        setError("Veuillez saisir l'intitulé du poste");
        return;
      }
      if (!jobDescription.trim()) {
        setError("Veuillez saisir la description du poste");
        return;
      }
    } else if (step === 2) {
      if (!cvFile) {
        setError("Veuillez télécharger le CV du candidat");
        return;
      }
      if (!candidateName.trim()) {
        setError("Veuillez saisir le nom du candidat");
        return;
      }
      
      // Générer les questions à la fin de l'étape 2
      generateQuestions();
      return;
    }
    
    setError(null);
    setStep(step + 1);
  };
  
  // Revenir à l'étape précédente
  const goToPreviousStep = () => {
    setError(null);
    setStep(step - 1);
  };

  // Gérer la sélection/désélection des assistants IA
  const toggleAIAssistant = (assistantId) => {
    setSelectedAssistants(prev => {
      if (prev.includes(assistantId)) {
        return prev.filter(id => id !== assistantId);
      } else {
        return [...prev, assistantId];
      }
    });
  };
  
  // Obtenir un label pour le type d'assistant
  const getAssistantTypeLabel = (type) => {
    switch (type) {
      case 'recruiter': return 'Recruteur';
      case 'evaluator': return 'Évaluateur';
      case 'analyzer': return 'Analyseur';
      default: return 'Assistant général';
    }
  };
  
  // Générer des questions basées sur le CV et la description du poste
  const generateQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const questions = await aiInterviewService.generateQuestionsFromCVFile(
        cvFile,
        jobDescription,
        {
          numberOfQuestions,
          experienceLevel,
          selectedAssistants,
          interviewMode
        }
      );
      
      setGeneratedQuestions(questions);
      setLoading(false);
      setStep(3);
    } catch (err) {
      console.error('Erreur lors de la génération des questions:', err);
      setError('Impossible de générer les questions. Veuillez réessayer.');
      setLoading(false);
    }
  };
  
  // Finaliser la configuration de l'entretien
  const finalizeSetup = () => {
    if (generatedQuestions.length === 0) {
      setError("Aucune question n'a été générée");
      return;
    }
    
    // Préparer les données de l'entretien
    const interviewData = {
      candidateName,
      jobTitle,
      jobDescription,
      experienceLevel,
      questions: generatedQuestions,
      interviewMode,
      cvFile,
      aiAssistants: selectedAssistants
    };
    
    // Notifier le composant parent
    if (onSetupComplete) {
      onSetupComplete(interviewData);
    }
  };
  
  // Suppression d'une question
  const removeQuestion = (index) => {
    setGeneratedQuestions(questions => questions.filter((_, i) => i !== index));
  };
  
  // Édition manuelle d'une question
  const editQuestion = (index, field, value) => {
    setGeneratedQuestions(questions => {
      const newQuestions = [...questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return newQuestions;
    });
  };
  
  // Ajout manuel d'une question
  const addCustomQuestion = () => {
    const newQuestion = {
      question: "Nouvelle question personnalisée",
      difficulty: "moyenne",
      category: "personnalisée",
      reasoning: "Question ajoutée manuellement"
    };
    
    setGeneratedQuestions([...generatedQuestions, newQuestion]);
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Indicateur d'étape */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
            <div className={`step-circle ${step >= 1 ? 'bg-primary-600' : 'bg-gray-300'}`}>1</div>
            <div className="step-title">Poste</div>
          </div>
          <div className="step-separator"></div>
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
            <div className={`step-circle ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}>2</div>
            <div className="step-title">Candidat</div>
          </div>
          <div className="step-separator"></div>
          <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
            <div className={`step-circle ${step >= 3 ? 'bg-primary-600' : 'bg-gray-300'}`}>3</div>
            <div className="step-title">Questions</div>
          </div>
        </div>
      </div>
      
      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      {/* Étape 1: Informations sur le poste */}
      {step === 1 && (
        <div className="step-content">
          <h2 className="text-xl font-semibold mb-6">Informations sur le poste</h2>
          
          <div className="mb-4">
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Intitulé du poste *
            </label>
            <input
              type="text"
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="ex: Développeur Frontend React"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Niveau d'expérience requis
            </label>
            <select
              id="experienceLevel"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="débutant">Débutant (0-2 ans)</option>
              <option value="intermédiaire">Intermédiaire (2-5 ans)</option>
              <option value="senior">Senior (5-8 ans)</option>
              <option value="expert">Expert (8+ ans)</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description du poste *
            </label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Collez ici la description complète du poste..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Plus la description est détaillée, plus les questions générées seront pertinentes.
            </p>
          </div>
        </div>
      )}
      
      {/* Étape 2: Informations sur le candidat */}
      {step === 2 && (
        <div className="step-content">
          <h2 className="text-xl font-semibold mb-6">Informations sur le candidat</h2>
          
          <div className="mb-4">
            <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du candidat *
            </label>
            <input
              type="text"
              id="candidateName"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="ex: Jean Dupont"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="cvUpload" className="block text-sm font-medium text-gray-700 mb-1">
              CV du candidat *
            </label>
            <CVUpload onCVUploaded={handleCVUploaded} />
            <p className="text-sm text-gray-500 mt-1">
              Le CV sera analysé pour générer des questions personnalisées.
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="numberOfQuestions" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de questions
            </label>
            <select
              id="numberOfQuestions"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="3">3 questions</option>
              <option value="5">5 questions</option>
              <option value="7">7 questions</option>
              <option value="10">10 questions</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Mode d'entretien
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  interviewMode === 'autonomous' 
                    ? 'border-primary-600 bg-primary-50' 
                    : 'border-gray-300 hover:border-primary-300'
                }`}
                onClick={() => setInterviewMode('autonomous')}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="modeAutonomous"
                    name="interviewMode"
                    value="autonomous"
                    checked={interviewMode === 'autonomous'}
                    onChange={() => setInterviewMode('autonomous')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="modeAutonomous" className="ml-3 font-medium text-gray-800 flex items-center">
                    <Bot className="h-4 w-4 mr-2 text-primary-600" />
                    Mode autonome
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-600 ml-7">
                  L'IA mène l'entretien de manière autonome, pose des questions et évalue les réponses
                </p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  interviewMode === 'collaborative' 
                    ? 'border-primary-600 bg-primary-50' 
                    : 'border-gray-300 hover:border-primary-300'
                }`}
                onClick={() => setInterviewMode('collaborative')}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="modeCollaborative"
                    name="interviewMode"
                    value="collaborative"
                    checked={interviewMode === 'collaborative'}
                    onChange={() => setInterviewMode('collaborative')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="modeCollaborative" className="ml-3 font-medium text-gray-800 flex items-center">
                    <UserPlus className="h-4 w-4 mr-2 text-green-600" />
                    Mode collaboratif
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-600 ml-7">
                  Vous menez l'entretien avec l'assistance de l'IA qui suggère des questions et analyse les réponses
                </p>
              </div>
            </div>
          </div>
          
          {/* Section d'assistants IA */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Assistants IA
              </label>
              <a 
                href="/ai-assistants/create"
                target="_blank"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Créer un assistant
              </a>
            </div>
            
            {loadingAssistants ? (
              <div className="flex justify-center items-center p-8 border border-dashed border-gray-300 rounded-md">
                <RefreshCw className="h-6 w-6 animate-spin text-primary-600 mr-2" />
                <span className="text-gray-500">Chargement des assistants IA...</span>
              </div>
            ) : assistants.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-gray-300 rounded-md">
                <Brain className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 mb-3">Vous n'avez pas encore d'assistants IA.</p>
                <a 
                  href="/ai-assistants/create"
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Créer un assistant IA
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto p-3 border border-gray-200 rounded-md">
                {assistants.map((assistant) => (
                  <div 
                    key={assistant.id}
                    className={`flex items-center rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedAssistants.includes(assistant.id) 
                        ? 'bg-primary-50 border border-primary-300' 
                        : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleAIAssistant(assistant.id)}
                  >
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">{assistant.name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                          {getAssistantTypeLabel(assistant.assistant_type)}
                        </span>
                        <span className="mx-1">•</span>
                        <span>{assistant.model_version}</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      {selectedAssistants.includes(assistant.id) ? (
                        <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Les assistants IA sélectionnés participeront à l'entretien en analysant les réponses en temps réel
            </p>
          </div>
        </div>
      )}
      
      {/* Étape 3: Révision des questions */}
      {step === 3 && (
        <div className="step-content">
          <h2 className="text-xl font-semibold mb-6">Révision des questions</h2>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Génération des questions en cours...</p>
              <p className="text-sm text-gray-500 mt-1">
                L'analyse du CV et de la description du poste peut prendre jusqu'à une minute.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-gray-600">
                Passez en revue les questions générées par l'IA. Vous pouvez les modifier, en supprimer ou en ajouter de nouvelles.
              </p>
              
              <div className="space-y-4 mb-6">
                {generatedQuestions.map((question, index) => (
                  <div key={index} className="border rounded-md p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex space-x-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          question.difficulty === 'difficile' ? 'bg-red-100 text-red-800' :
                          question.difficulty === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {question.difficulty}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {question.category}
                        </span>
                      </div>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="text-gray-400 hover:text-red-500"
                        title="Supprimer la question"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="mb-2">
                      <textarea
                        value={question.question}
                        onChange={(e) => editQuestion(index, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={2}
                      />
                    </div>
                    
                    {question.reasoning && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Raisonnement: </span>
                        {question.reasoning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={addCustomQuestion}
                className="flex items-center text-primary-600 hover:text-primary-700 mb-6"
              >
                <Plus className="h-5 w-5 mr-1" />
                Ajouter une question personnalisée
              </button>
              
              {/* Informations sur le mode d'entretien */}
              <div className={`p-4 rounded-lg mb-6 ${
                interviewMode === 'autonomous' ? 'bg-blue-50 border-blue-200 border' : 'bg-green-50 border-green-200 border'
              }`}>
                <div className="flex items-start">
                  {interviewMode === 'autonomous' ? (
                    <Bot className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {interviewMode === 'autonomous' ? 'Mode d\'entretien autonome' : 'Mode d\'entretien collaboratif'}
                    </h3>
                    <p className="text-sm mt-1 text-gray-600">
                      {interviewMode === 'autonomous' 
                        ? "L'IA mènera cet entretien de manière autonome avec le candidat en utilisant les questions ci-dessus. Vous pourrez consulter les résultats une fois l'entretien terminé."
                        : "Vous mènerez l'entretien avec l'assistance de l'IA, qui vous suggérera des questions et analysera les réponses en temps réel."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Boutons de navigation */}
      <div className="flex justify-between mt-8">
        {step === 1 ? (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Annuler
          </button>
        ) : (
          <button
            onClick={goToPreviousStep}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
            disabled={loading}
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Précédent
          </button>
        )}
        
        {step < 3 ? (
          <button
            onClick={goToNextStep}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
            disabled={loading}
          >
            Suivant
            <ArrowRight className="h-5 w-5 ml-1" />
          </button>
        ) : (
          <button
            onClick={finalizeSetup}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                Démarrer l'entretien
                <ArrowRight className="h-5 w-5 ml-1" />
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Styles pour les étapes */}
      <style jsx>{`
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100px;
        }
        
        .step-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .step-title {
          font-size: 14px;
          color: #4b5563;
        }
        
        .step-item.active .step-title {
          color: #111827;
          font-weight: 500;
        }
        
        .step-separator {
          flex-grow: 1;
          height: 2px;
          background-color: #e5e7eb;
          margin: 0 10px;
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
};

export default InterviewSetupForm;