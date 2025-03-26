// components/interview/InterviewController.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Contrôleur principal pour la gestion des entretiens.
 * Ce composant gère l'état global de l'entretien et fournit les données et fonctions
 * nécessaires aux composants enfants.
 */
const InterviewController = ({
  interviewId,
  jobRole,
  experienceLevel,
  onInterviewComplete,
  onError,
  children
}) => {
  // États de l'entretien
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [biometricData, setBiometricData] = useState({
    confidence: 0,
    engagement: 0,
    emotions: {
      joy: 0,
      sorrow: 0,
      anger: 0,
      surprise: 0,
    }
  });
  const [biometricHistory, setBiometricHistory] = useState([]);
  
  // Charger les questions de l'entretien
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        
        // En environnement de développement, utiliser des questions fictives
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 800)); // Simuler un délai réseau
          
          const mockQuestions = [
            {
              id: 'q1',
              question: 'Pouvez-vous décrire votre expérience avec React et les différentes architectures frontend que vous avez utilisées ?',
              category: 'Technique',
              difficulty: 'moyenne',
              expectedDuration: 180, // secondes
            },
            {
              id: 'q2',
              question: 'Comment gérez-vous les performances dans une application web complexe ? Citez des exemples concrets de problèmes que vous avez résolus.',
              category: 'Technique',
              difficulty: 'difficile',
              expectedDuration: 240,
            },
            {
              id: 'q3',
              question: 'Parlez-moi d\'une situation où vous avez dû travailler sous pression avec des délais serrés. Comment avez-vous géré cette situation ?',
              category: 'Comportemental',
              difficulty: 'facile',
              expectedDuration: 180,
            },
            {
              id: 'q4',
              question: 'Quelles sont vos connaissances en matière de tests automatisés ? Quels frameworks avez-vous utilisés et pourquoi ?',
              category: 'Technique',
              difficulty: 'moyenne',
              expectedDuration: 210,
            },
            {
              id: 'q5',
              question: 'Comment restez-vous à jour avec les nouvelles technologies et les bonnes pratiques dans votre domaine ?',
              category: 'Général',
              difficulty: 'facile',
              expectedDuration: 150,
            },
          ];
          
          setQuestions(mockQuestions);
        } else {
          // En production, appeler l'API
          const response = await axios.get(`/api/interviews/${interviewId}/questions`);
          setQuestions(response.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des questions:', err);
        setLoading(false);
        if (onError) {
          onError('Impossible de charger les questions de l\'entretien. Veuillez réessayer.');
        }
      }
    };
    
    if (interviewId) {
      fetchQuestions();
    }
  }, [interviewId, onError]);
  
  // Gérer l'état de l'enregistrement
  const handleRecordingStateChange = useCallback((isActive) => {
    setIsRecording(isActive);
    
    // Si on commence à enregistrer, réinitialiser la transcription
    if (isActive) {
      setTranscript('');
    }
  }, []);
  
  // Gérer la fin de la transcription
  const handleTranscriptionComplete = useCallback((text) => {
    setTranscript(text);
  }, []);
  
  // Simuler la mise à jour des données biométriques (en développement)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isRecording) {
      const interval = setInterval(() => {
        // Générer des données biométriques aléatoires pour la démo
        const newBiometricData = {
          confidence: Math.min(0.3 + Math.random() * 0.7, 1),
          engagement: Math.min(0.4 + Math.random() * 0.6, 1),
          emotions: {
            joy: Math.random() * 0.8,
            sorrow: Math.random() * 0.3,
            anger: Math.random() * 0.2,
            surprise: Math.random() * 0.4,
          }
        };
        
        setBiometricData(newBiometricData);
        setBiometricHistory(prev => [...prev, {
          timestamp: new Date().toISOString(),
          questionIndex: currentQuestionIndex,
          ...newBiometricData
        }]);
      }, 2000); // Mettre à jour toutes les 2 secondes
      
      return () => clearInterval(interval);
    }
  }, [isRecording, currentQuestionIndex]);
  
  // Soumettre une réponse pour évaluation
  const handleResponseSubmit = useCallback(async (text) => {
    try {
      setIsEvaluating(true);
      
      // Stocker la réponse dans l'état local
      const responseText = text || transcript;
      setResponses(prev => ({
        ...prev,
        [currentQuestionIndex]: responseText
      }));
      
      // En environnement de développement, simuler l'évaluation
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simuler un délai d'évaluation
        
        // Générer une évaluation fictive
        const mockEvaluation = {
          score: 3 + Math.random() * 2, // Score entre 3 et 5
          feedback: [
            'Bonne compréhension des concepts fondamentaux.',
            'Explication claire et structurée.',
            'Pourrait approfondir davantage certains aspects techniques.',
          ],
          strengths: [
            'Connaissance technique solide',
            'Communication claire',
          ],
          areas_for_improvement: [
            'Approfondir les explications sur les aspects de performance',
            'Fournir plus d\'exemples concrets',
          ],
          keywords_used: ['React', 'performance', 'architecture', 'composants'],
          overall_comment: 'Réponse satisfaisante qui démontre une bonne maîtrise du sujet. Des exemples plus concrets auraient renforcé la réponse.'
        };
        
        setEvaluation(mockEvaluation);
      } else {
        // En production, appeler l'API pour évaluer la réponse
        const response = await axios.post(`/api/interviews/${interviewId}/evaluate`, {
          questionId: questions[currentQuestionIndex].id,
          responseText: responseText,
          questionIndex: currentQuestionIndex,
          biometricData: biometricData,
        });
        
        setEvaluation(response.data);
      }
      
      setIsEvaluating(false);
    } catch (err) {
      console.error('Erreur lors de l\'évaluation de la réponse:', err);
      setIsEvaluating(false);
      if (onError) {
        onError('Impossible d\'évaluer votre réponse. Veuillez réessayer.');
      }
    }
  }, [biometricData, currentQuestionIndex, interviewId, onError, questions, transcript]);
  
  // Passer à la question suivante ou terminer l'entretien
  const handleNextQuestion = useCallback(async () => {
    // Enregistrer l'évaluation de la question actuelle
    try {
      // En environnement de production, enregistrer les résultats via l'API
      if (process.env.NODE_ENV !== 'development') {
        await axios.post(`/api/interviews/${interviewId}/responses`, {
          questionId: questions[currentQuestionIndex].id,
          responseText: responses[currentQuestionIndex],
          evaluation: evaluation,
          biometricData: biometricData,
        });
      }
      
      // Réinitialiser l'état pour la prochaine question
      setEvaluation(null);
      setTranscript('');
      
      // Vérifier si c'était la dernière question
      if (currentQuestionIndex < questions.length - 1) {
        // Passer à la question suivante
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Terminer l'entretien
        if (onInterviewComplete) {
          onInterviewComplete({
            responses,
            biometricHistory
          });
        }
      }
    } catch (err) {
      console.error('Erreur lors du passage à la question suivante:', err);
      if (onError) {
        onError('Impossible d\'enregistrer votre réponse. Veuillez réessayer.');
      }
    }
  }, [biometricData, currentQuestionIndex, evaluation, interviewId, onError, onInterviewComplete, questions, responses]);
  
  // Injection des props dans les composants enfants
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        loading,
        error: null,
        questions,
        currentQuestionIndex,
        responses,
        evaluation,
        isEvaluating,
        transcript,
        isRecording,
        biometricData,
        biometricHistory,
        jobRole,
        experienceLevel,
        handleRecordingStateChange,
        handleTranscriptionComplete,
        handleResponseSubmit,
        handleNextQuestion
      });
    }
    return child;
  });
  
  return (
    <>
      {childrenWithProps}
    </>
  );
};

InterviewController.propTypes = {
  interviewId: PropTypes.string.isRequired,
  jobRole: PropTypes.string,
  experienceLevel: PropTypes.string,
  onInterviewComplete: PropTypes.func,
  onError: PropTypes.func,
  children: PropTypes.node.isRequired
};

export default InterviewController;