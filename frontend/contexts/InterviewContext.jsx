// frontend/contexts/InterviewContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import interviewService from '../services/interviewService';
import aiAssistantService from '../services/aiAssistantService';

// Créer le contexte
const InterviewContext = createContext(null);

/**
 * Fournisseur de contexte pour les entretiens
 * Gère l'état global d'un entretien et les méthodes associées
 */
export const InterviewProvider = ({ children }) => {
  // Informations de base sur l'entretien
  const [interviewId, setInterviewId] = useState(null);
  const [interviewData, setInterviewData] = useState(null);
  const [interviewMode, setInterviewMode] = useState('autonomous'); // 'autonomous' ou 'collaborative'
  
  // État de l'entretien
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  
  // Données biométriques et transcription
  const [transcript, setTranscript] = useState('');
  const [biometricData, setBiometricData] = useState(null);
  const [biometricHistory, setBiometricHistory] = useState([]);
  const biometricBatchRef = useRef([]);
  const biometricTimerRef = useRef(null);
  
  // Données pour le mode collaboratif
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Nettoyer les timers à la déconnexion
  useEffect(() => {
    return () => {
      if (biometricTimerRef.current) {
        clearInterval(biometricTimerRef.current);
      }
    };
  }, []);
  
  /**
   * Initialise un entretien avec les données et les questions
   * @param {string} id ID de l'entretien
   * @param {string} mode Mode d'entretien ('autonomous' ou 'collaborative')
   */
  const initializeInterview = async (id, mode = 'autonomous') => {
    try {
      setIsLoading(true);
      setError(null);
      setInterviewId(id);
      setInterviewMode(mode);
      
      // Récupérer les détails de l'entretien
      const details = await interviewService.getInterviewDetails(id);
      setInterviewData(details);
      
      // Récupérer les questions pour l'entretien
      const questionsList = await interviewService.getInterviewQuestions(id, {
        job_role: details.job_role,
        experience_level: details.experience_level
      });
      
      setQuestions(questionsList);
      setCurrentQuestionIndex(0);
      setResponses({});
      setEvaluations({});
      setInterviewComplete(false);
      
      // Si en mode collaboratif, récupérer des suggestions de questions
      if (mode === 'collaborative') {
        loadSuggestedQuestions();
      }
      
      // Démarrer l'enregistrement biométrique si nécessaire
      startBiometricRecording();
      
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de l\'entretien:', err);
      setError('Impossible d\'initialiser l\'entretien. Veuillez réessayer.');
      setIsLoading(false);
    }
  };
  
  /**
   * Démarre l'enregistrement biométrique périodique
   */
  const startBiometricRecording = () => {
    // Arrêter tout enregistrement existant
    if (biometricTimerRef.current) {
      clearInterval(biometricTimerRef.current);
    }
    
    // Vider le lot d'analyses
    biometricBatchRef.current = [];
    
    // Démarrer un nouvel intervalle d'enregistrement (toutes les 10 secondes)
    biometricTimerRef.current = setInterval(() => {
      // Envoyer les analyses accumulées si le lot n'est pas vide
      if (biometricBatchRef.current.length > 0) {
        sendBiometricBatch();
      }
    }, 10000);
  };
  
  /**
   * Enregistre une analyse biométrique
   * @param {Object} analysis Données d'analyse biométrique
   */
  const recordBiometricAnalysis = (analysis) => {
    // Ajouter l'horodatage si non présent
    const timestampedAnalysis = {
      ...analysis,
      timestamp: analysis.timestamp || Date.now()
    };
    
    // Ajouter à l'historique local
    setBiometricData(timestampedAnalysis);
    setBiometricHistory(prev => [...prev, timestampedAnalysis]);
    
    // Ajouter au lot pour envoi groupé
    biometricBatchRef.current.push(timestampedAnalysis);
  };
  
  /**
   * Envoie le lot d'analyses biométriques accumulées
   */
  const sendBiometricBatch = async () => {
    if (!interviewId || biometricBatchRef.current.length === 0) return;
    
    try {
      // Copier le lot actuel et vider la référence
      const batch = [...biometricBatchRef.current];
      biometricBatchRef.current = [];
      
      // Envoyer le lot au serveur
      await interviewService.batchSaveFacialAnalyses(interviewId, batch);
    } catch (err) {
      console.error('Erreur lors de l\'envoi des analyses biométriques:', err);
      // En cas d'erreur, remettre les analyses dans le lot pour réessayer plus tard
      biometricBatchRef.current = [...biometricBatchRef.current, ...batch];
    }
  };
  
  /**
   * Arrête l'enregistrement biométrique
   */
  const stopBiometricRecording = () => {
    if (biometricTimerRef.current) {
      clearInterval(biometricTimerRef.current);
      biometricTimerRef.current = null;
    }
    
    // Envoyer les dernières analyses
    if (biometricBatchRef.current.length > 0) {
      sendBiometricBatch();
    }
  };
  
  /**
   * Met à jour la transcription
   * @param {string} text Texte transcrit
   */
  const updateTranscript = (text) => {
    setTranscript(text);
  };
  
  /**
   * Soumet une réponse pour évaluation
   * @param {string} response Réponse à évaluer
   */
  const submitResponse = async (response) => {
    if (!interviewId || !questions[currentQuestionIndex]) return;
    
    try {
      setIsEvaluating(true);
      
      // Enregistrer la réponse
      setResponses(prev => ({
        ...prev,
        [currentQuestionIndex]: response
      }));
      
      // Évaluer la réponse en fonction du mode d'entretien
      let evaluation;
      if (process.env.NODE_ENV === 'development') {
        // En développement, simuler une évaluation
        evaluation = await aiAssistantService.simulateAIResponse('evaluation');
      } else {
        // En production, appeler l'API réelle
        evaluation = await interviewService.evaluateResponse(
          interviewId,
          {
            question: questions[currentQuestionIndex].question,
            response: response,
            question_index: currentQuestionIndex
          },
          interviewMode
        );
      }
      
      // Enregistrer l'évaluation
      setEvaluations(prev => ({
        ...prev,
        [currentQuestionIndex]: evaluation
      }));
      
      setIsEvaluating(false);
      
      // En mode collaboratif, charger de nouvelles suggestions après une réponse
      if (interviewMode === 'collaborative') {
        loadSuggestedQuestions();
      }
      
      return evaluation;
    } catch (err) {
      console.error('Erreur lors de l\'évaluation de la réponse:', err);
      setError('Impossible d\'évaluer la réponse. Veuillez réessayer.');
      setIsEvaluating(false);
      return null;
    }
  };
  
  /**
   * Passe à la question suivante
   */
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTranscript('');
    } else {
      // Toutes les questions ont été posées
      completeInterview();
    }
  };
  
  /**
   * Termine l'entretien et calcule les résultats
   */
  const completeInterview = async () => {
    if (!interviewId) return;
    
    try {
      setIsLoading(true);
      
      // Calculer le score moyen
      const scores = Object.values(evaluations).map(eval => eval.score || 0);
      const averageScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + Number(score), 0) / scores.length
        : 0;
      
      // Enregistrer les résultats finaux
      const completeData = {
        status: 'completed',
        score: averageScore.toFixed(1),
        responses: responses,
        evaluations: evaluations,
        completed_at: new Date().toISOString()
      };
      
      // Arrêter l'enregistrement biométrique
      stopBiometricRecording();
      
      // Marquer l'entretien comme terminé
      await interviewService.completeInterview(interviewId, completeData);
      
      setInterviewComplete(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur lors de la complétion de l\'entretien:', err);
      setError('Impossible de terminer l\'entretien. Veuillez réessayer.');
      setIsLoading(false);
    }
  };
  
  /* Méthodes pour le mode collaboratif */
  
  /**
   * Charge des suggestions de questions
   */
  const loadSuggestedQuestions = async () => {
    if (!interviewId || interviewMode !== 'collaborative') return;
    
    try {
      setIsLoadingSuggestions(true);
      
      // Déterminer le contexte en fonction de la question actuelle
      const currentQuestion = questions[currentQuestionIndex];
      const context = currentQuestion?.category || 'general';
      
      let suggestions;
      if (process.env.NODE_ENV === 'development') {
        // En développement, simuler des suggestions
        suggestions = await aiAssistantService.simulateAIResponse('suggestions');
      } else {
        // En production, appeler l'API réelle
        suggestions = await interviewService.getSuggestedQuestions(interviewId, context);
      }
      
      setSuggestedQuestions(suggestions);
      setIsLoadingSuggestions(false);
    } catch (err) {
      console.error('Erreur lors du chargement des suggestions:', err);
      setIsLoadingSuggestions(false);
    }
  };
  
  /**
   * Envoie un message à l'assistant IA et reçoit une réponse
   * @param {string} message Message à envoyer
   * @returns {Promise<Object>} Réponse de l'assistant
   */
  const sendChatMessage = async (message) => {
    if (!interviewId || interviewMode !== 'collaborative') return;
    
    try {
      // Ajouter le message de l'utilisateur à l'historique
      const userMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      
      // Récupérer la réponse de l'assistant
      let response;
      if (process.env.NODE_ENV === 'development') {
        // En développement, simuler une réponse
        response = await aiAssistantService.simulateAIResponse('chat');
      } else {
        // En production, appeler l'API réelle
        response = await interviewService.getChatResponse(
          interviewId,
          message,
          chatMessages
        );
      }
      
      // Ajouter la réponse de l'assistant à l'historique
      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: response.response,
        suggestions: response.suggestions || [],
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
      
      return aiMessage;
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message au chat IA:', err);
      setError('Erreur de communication avec l\'assistant IA.');
      return null;
    }
  };
  
  /**
   * Utilise une question suggérée
   * @param {Object} question Question suggérée à utiliser
   */
  const useQuestion = (question) => {
    // Retirer la question des suggestions
    setSuggestedQuestions(prev => prev.filter(q => q.id !== question.id));
    
    // Demander de nouvelles suggestions
    loadSuggestedQuestions();
    
    return question;
  };
  
  // Valeur du contexte
  const contextValue = {
    // Propriétés de base
    interviewId,
    interviewData,
    interviewMode,
    questions,
    currentQuestionIndex,
    responses,
    evaluations,
    isLoading,
    isEvaluating,
    error,
    transcript,
    biometricData,
    biometricHistory,
    interviewComplete,
    
    // Propriétés pour le mode collaboratif
    suggestedQuestions,
    chatMessages,
    isLoadingSuggestions,
    
    // Méthodes
    initializeInterview,
    updateTranscript,
    submitResponse,
    goToNextQuestion,
    completeInterview,
    recordBiometricAnalysis,
    sendChatMessage,
    useQuestion,
    loadSuggestedQuestions,
    
    // Méthode pour gérer les erreurs
    setError: (message) => setError(message)
  };
  
  return (
    <InterviewContext.Provider value={contextValue}>
      {children}
    </InterviewContext.Provider>
  );
};

/**
 * Hook pour accéder au contexte d'entretien
 */
export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview doit être utilisé à l\'intérieur d\'un InterviewProvider');
  }
  return context;
};

export default InterviewContext;