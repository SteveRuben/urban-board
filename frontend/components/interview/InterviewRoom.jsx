// frontend/components/interview/InterviewRoom.jsx (version avec questions adaptatives)
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import VideoStream from './VideoStream';
import EnhancedAudioRecorder from './EnhancedAudioRecorder';
import BiometricDashboard from './BiometricDashboard';
import Question from './Question';
import ResponseInput from './ResponseInput';
import EvaluationCard from './EvaluationCard';
import ResponseTimer from './ResponseTimer';
import FollowUpQuestion from './FollowUpQuestion';
import aiInterviewService from '../../services/ai-interview-service';
import axios from 'axios';

/**
 * Composant principal de la salle d'entretien avec questions adaptatives
 */
const InterviewRoom = ({ 
  interviewId, 
  jobRole, 
  experienceLevel, 
  questions: initialQuestions,
  candidateName,
  interviewMode = 'autonomous',
  onInterviewComplete 
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [biometricData, setBiometricData] = useState(null);
  const [biometricHistory, setBiometricHistory] = useState([]);
  const [interviewStatus, setInterviewStatus] = useState('in_progress');
  const [activeTab, setActiveTab] = useState('interview');
  
  // États pour les fonctionnalités adaptatives
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState(null);
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isQuestionChanged, setIsQuestionChanged] = useState(false);
  const [currentDisplayedQuestion, setCurrentDisplayedQuestion] = useState(null);
  const [originalQuestion, setOriginalQuestion] = useState(null);
  
  // Référence pour le flux vidéo
  const videoRef = useRef(null);
  
  // Référence pour l'intervalle de capture biométrique
  const biometricIntervalRef = useRef(null);
  
  // Charger ou utiliser les questions d'entretien
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        
        let loadedQuestions = [];
        
        if (initialQuestions && initialQuestions.length > 0) {
          loadedQuestions = initialQuestions;
        } else if (interviewId) {
          const response = await axios.get(`/api/interviews/${interviewId}/questions`);
          loadedQuestions = response.data.questions;
        } else {
          const defaultQuestions = await aiInterviewService.generateQuestions(
            jobRole || 'Développeur Frontend',
            experienceLevel || 'Intermédiaire'
          );
          loadedQuestions = defaultQuestions;
        }
        
        setQuestions(loadedQuestions);
        setLoading(false);
        
        // Définir la question initiale
        if (loadedQuestions.length > 0) {
          setCurrentDisplayedQuestion(loadedQuestions[0].question);
          setOriginalQuestion(loadedQuestions[0].question);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des questions:', err);
        setError('Impossible de charger les questions de l\'entretien.');
        
        // Questions de secours
        setQuestions([
          {
            question: "Pouvez-vous décrire votre expérience professionnelle en lien avec ce poste?",
            difficulty: "facile",
            category: "expérience"
          },
          {
            question: "Quels sont vos principaux atouts pour ce poste?",
            difficulty: "facile",
            category: "compétences"
          },
          {
            question: "Décrivez un défi technique que vous avez rencontré et comment vous l'avez surmonté.",
            difficulty: "moyenne",
            category: "résolution de problèmes"
          },
          {
            question: "Comment travaillez-vous en équipe?",
            difficulty: "facile",
            category: "soft skills"
          },
          {
            question: "Où vous voyez-vous dans 5 ans?",
            difficulty: "moyenne",
            category: "motivation"
          }
        ]);
        
        setLoading(false);
      }
    };

    loadQuestions();
  }, [interviewId, jobRole, experienceLevel, initialQuestions]);

  // Mettre à jour la question affichée lorsque la question actuelle change
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      setCurrentDisplayedQuestion(questions[currentQuestionIndex].question);
      setOriginalQuestion(questions[currentQuestionIndex].question);
      setIsQuestionChanged(false);
      
      // Réinitialiser les états
      setFollowUpQuestion(null);
      setIsLoadingFollowUp(false);
      
      // Activer le timer lorsqu'une nouvelle question est affichée
      setIsTimerActive(true);
    }
  }, [currentQuestionIndex, questions]);

  // Démarrer/arrêter l'analyse biométrique pendant l'enregistrement
  useEffect(() => {
    if (isRecording && videoRef.current) {
      captureAndAnalyzeBiometrics();
      
      biometricIntervalRef.current = setInterval(() => {
        captureAndAnalyzeBiometrics();
      }, 5000);
      
      return () => {
        if (biometricIntervalRef.current) {
          clearInterval(biometricIntervalRef.current);
        }
      };
    } else if (biometricIntervalRef.current) {
      clearInterval(biometricIntervalRef.current);
    }
  }, [isRecording]);

  // Gérer l'état de l'enregistrement
  const handleRecordingStateChange = (isActive) => {
    setIsRecording(isActive);
    
    // Désactiver le timer lorsque l'enregistrement commence
    if (isActive) {
      setIsTimerActive(false);
    }
  };
  
  // Capturer et analyser les données biométriques
  const captureAndAnalyzeBiometrics = async () => {
    if (videoRef.current) {
      try {
        const imageData = videoRef.current.captureFrame();
        if (imageData) {
          const analysis = await aiInterviewService.analyzeBiometrics(imageData);
          setBiometricData(analysis);
          
          const biometricEntry = {
            timestamp: new Date(),
            questionIndex: currentQuestionIndex,
            ...analysis
          };
          
          setBiometricHistory(prev => [...prev, biometricEntry]);
          
          if (interviewId) {
            await axios.post(`/api/interviews/${interviewId}/biometrics`, {
              question_index: currentQuestionIndex,
              biometric_data: analysis,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.error('Erreur lors de l\'analyse biométrique:', err);
      }
    }
  };
  
  // Gérer la réception de la transcription
  const handleTranscriptionComplete = (transcriptionText) => {
    setTranscript(transcriptionText);
    
    // Analyser la clarté de la réponse
    if (transcriptionText.trim().length > 0) {
      analyzeResponseClarity(transcriptionText);
    }
  };
  
  // Analyser la clarté de la réponse
  const analyzeResponseClarity = async (responseText) => {
    try {
      const analysis = await aiInterviewService.analyzeResponseClarity(
        originalQuestion,
        responseText
      );
      
      // Si la réponse n'est pas claire, générer une question de suivi
      if (!analysis.is_clear && analysis.recommendation === 'follow_up') {
        generateFollowUpQuestion(responseText, analysis.reason);
      }
    } catch (err) {
      console.error('Erreur lors de l\'analyse de la clarté:', err);
    }
  };
  
  // Générer une question de suivi
  const generateFollowUpQuestion = async (responseText, reason) => {
    try {
      setIsLoadingFollowUp(true);
      
      const followUp = await aiInterviewService.generateFollowUpQuestion({
        originalQuestion: originalQuestion,
        candidateResponse: responseText,
        reason: reason
      });
      
      setFollowUpQuestion(followUp);
      setIsLoadingFollowUp(false);
    } catch (err) {
      console.error('Erreur lors de la génération de la question de suivi:', err);
      setIsLoadingFollowUp(false);
    }
  };
  
  // Générer une question de suivi en cas de timeout
  const handleTimeThreshold = async (duration) => {
    try {
      setIsLoadingFollowUp(true);
      
      // Si l'utilisateur n'a pas commencé à taper ou n'a pas répondu
      if (!isUserTyping && !transcript) {
        const followUp = await aiInterviewService.generateFollowUpQuestion({
          originalQuestion: originalQuestion,
          candidateResponse: "",
          reason: "timeout",
          timeoutDuration: duration
        });
        
        setFollowUpQuestion(followUp);
      }
      
      setIsLoadingFollowUp(false);
    } catch (err) {
      console.error('Erreur lors de la génération de la question de suivi après timeout:', err);
      setIsLoadingFollowUp(false);
    }
  };
  
  // Accepter la question de suivi
  const acceptFollowUpQuestion = () => {
    if (followUpQuestion) {
      // Changer la question affichée mais garder l'originale pour l'évaluation
      setCurrentDisplayedQuestion(followUpQuestion.question);
      setIsQuestionChanged(true);
      setFollowUpQuestion(null);
    }
  };
  
  // Refuser la question de suivi
  const declineFollowUpQuestion = () => {
    setFollowUpQuestion(null);
  };
  
  // Détecter quand l'utilisateur commence à taper
  const handleResponseChange = (text) => {
    if (text.trim().length > 0 && !isUserTyping) {
      setIsUserTyping(true);
      setIsTimerActive(false); // Désactiver le timer
    } else if (text.trim().length === 0) {
      setIsUserTyping(false);
    }
  };
  
  // Gérer la soumission d'une réponse
  const handleResponseSubmit = async (response) => {
    try {
      // Sauvegarder la réponse localement
      const updatedResponses = {
        ...responses,
        [currentQuestionIndex]: response
      };
      setResponses(updatedResponses);

      // Lancer l'évaluation par l'IA
      setIsEvaluating(true);
      
      let evaluationResult;
      
      // Toujours utiliser la question originale pour l'évaluation
      const questionForEvaluation = originalQuestion || questions[currentQuestionIndex]?.question || '';
      
      if (interviewId) {
        const evaluationResponse = await axios.post(`/api/interviews/${interviewId}/evaluate`, {
          question: questionForEvaluation,
          response: response,
          job_role: jobRole,
          experience_level: experienceLevel,
          // Indiquer si la question a été modifiée
          question_changed: isQuestionChanged
        });
        
        evaluationResult = evaluationResponse.data.evaluation;
      } else {
        evaluationResult = await aiInterviewService.evaluateResponse(
          questionForEvaluation,
          response,
          jobRole || 'Développeur Frontend',
          experienceLevel || 'Intermédiaire'
        );
      }
      
      setEvaluation(evaluationResult);
      setIsEvaluating(false);
      
      // Sauvegarder l'évaluation dans l'entretien
      if (interviewId) {
        await axios.post(`/api/interviews/${interviewId}/responses`, {
          question_index: currentQuestionIndex,
          response: response,
          evaluation: evaluationResult,
          original_question: originalQuestion,
          displayed_question: currentDisplayedQuestion,
          question_changed: isQuestionChanged
        });
      }
      
      // Réinitialiser les états
      setIsUserTyping(false);
      setIsTimerActive(false);
    } catch (err) {
      console.error('Erreur lors de l\'évaluation de la réponse:', err);
      setError('Impossible d\'évaluer votre réponse. Veuillez réessayer.');
      setIsEvaluating(false);
    }
  };

  // Passer à la question suivante
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setEvaluation(null);
      setTranscript('');
      setIsUserTyping(false);
      setIsTimerActive(true);
    } else {
      // Fin de l'entretien
      finishInterview();
    }
  };

  // Terminer l'entretien
  const finishInterview = async () => {
    try {
      setInterviewStatus('completed');
      
      if (interviewId) {
        await axios.put(`/api/interviews/${interviewId}`, {
          status: 'completed',
          responses: responses
        });
        
        const interviewData = {
          interviewId: interviewId,
          jobRole: jobRole,
          experienceLevel: experienceLevel,
          questions: questions,
          responses: responses,
          biometricHistory: biometricHistory,
          candidateName: candidateName
        };
        
        await aiInterviewService.generateInterviewSummary(interviewData);
        
        if (onInterviewComplete) {
          onInterviewComplete({
            interviewId,
            status: 'completed'
          });
        } else {
          router.push(`/interviews/${interviewId}/summary`);
        }
      } else {
        alert("Entretien terminé ! Dans une implémentation réelle, vous seriez redirigé vers un récapitulatif.");
        
        if (onInterviewComplete) {
          onInterviewComplete({
            status: 'completed',
            questions,
            responses,
            biometricHistory
          });
        }
      }
    } catch (err) {
      console.error('Erreur lors de la finalisation de l\'entretien:', err);
      setError('Impossible de finaliser l\'entretien. Veuillez réessayer.');
    }
  };

  // Contenus conditionnels selon l'onglet actif
  const renderContent = () => {
    if (activeTab === 'interview') {
      return renderInterviewTab();
    } else {
      return renderAnalyticsTab();
    }
  };
  
  // Onglet d'entretien
  const renderInterviewTab = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Vidéo et analyse biométrique */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-4 bg-gray-100 border-b border-gray-200">
              <h2 className="font-semibold">Vidéo du candidat</h2>
              {candidateName && (
                <p className="text-sm text-gray-600">{candidateName}</p>
              )}
            </div>
            <div className="p-4">
              <VideoStream ref={videoRef} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold">Analyse biométrique</h2>
              <div className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded-full">IA</div>
            </div>
            <div className="p-4">
              <BiometricDashboard 
                biometricData={biometricData} 
                recordingHistory={biometricHistory}
              />
            </div>
          </div>
        </div>
        
        {/* Colonne centrale et droite - Questions et réponses */}
        <div className="lg:col-span-2">
          {/* Question en cours */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold">Question {currentQuestionIndex + 1}/{questions.length}</h2>
              {questions[currentQuestionIndex]?.category && (
                <div className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {questions[currentQuestionIndex].category}
                </div>
              )}
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-gray-600">Chargement de la question...</p>
                </div>
              ) : (
                <>
                  {/* Afficher la question dynamique */}
                  <div className={isQuestionChanged ? "text-blue-800 font-medium" : ""}>
                    {currentDisplayedQuestion || questions[currentQuestionIndex]?.question}
                  </div>
                  
                  {isQuestionChanged && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
                      Cette question a été adaptée pour faciliter votre réponse.
                    </div>
                  )}
                  
                  {questions[currentQuestionIndex]?.reasoning && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-800">
                        <span className="font-medium">Contexte: </span>
                        {questions[currentQuestionIndex].reasoning}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      questions[currentQuestionIndex]?.difficulty === 'difficile' ? 'bg-red-100 text-red-800' :
                      questions[currentQuestionIndex]?.difficulty === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Difficulté: {questions[currentQuestionIndex]?.difficulty || 'moyenne'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Timer pour détecter les questions difficiles */}
          {isTimerActive && !isRecording && !evaluation && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-4">
                <ResponseTimer 
                  isActive={isTimerActive}
                  onTimeThreshold={handleTimeThreshold}
                  timeThreshold={30} // 30 secondes avant de suggérer une reformulation
                  warningThreshold={20} // 20 secondes avant l'avertissement
                  onReset={() => {}}
                />
              </div>
            </div>
          )}
          
          {/* Question de suivi (affichée seulement si disponible) */}
          {(followUpQuestion || isLoadingFollowUp) && !evaluation && (
            <FollowUpQuestion 
              followUpData={followUpQuestion}
              onAccept={acceptFollowUpQuestion}
              onDecline={declineFollowUpQuestion}
              isLoading={isLoadingFollowUp}
            />
          )}
          
          {/* Enregistrement audio et transcription */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-4 bg-gray-100 border-b border-gray-200">
              <h2 className="font-semibold">Enregistrement et transcription</h2>
            </div>
            <div className="p-6">
              <EnhancedAudioRecorder 
                onTranscriptionComplete={handleTranscriptionComplete}
                isRecordingEnabled={true}
                onRecordingStateChange={handleRecordingStateChange}
                maxRecordingTime={180}
                autoTranscribe={true}
              />
            </div>
          </div>
          
          {/* Réponse écrite */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-4 bg-gray-100 border-b border-gray-200">
              <h2 className="font-semibold">Votre réponse</h2>
            </div>
            <div className="p-6">
              <ResponseInput 
                initialValue={transcript}
                onSubmit={handleResponseSubmit}
                onChange={handleResponseChange}
                disabled={isEvaluating}
              />
            </div>
          </div>
          
          {/* Évaluation */}
          {evaluation && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold">Évaluation de la réponse</h2>
                <div className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">IA</div>
              </div>
              <div className="p-6">
                <EvaluationCard evaluation={evaluation} />
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="bg-primary-600 hover:bg-primary-700 text-black px-6 py-2 rounded-md"
                  >
                    {currentQuestionIndex < questions.length - 1 ? 'Question suivante' : 'Terminer l\'entretien'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Affichage pendant l'évaluation */}
          {isEvaluating && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 p-6">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600">Évaluation de votre réponse par l'IA...</p>
                <p className="text-xs text-gray-500 mt-2">Cela peut prendre quelques secondes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Onglet d'analyse (laissé intact par simplicité)
  const renderAnalyticsTab = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 bg-gray-100 border-b border-gray-200">
          <h2 className="font-semibold">Analyse en temps réel</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Cette section affiche des analyses en temps réel de l'entretien en cours.
          </p>
          
          {/* Statistiques de l'entretien */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Questions</p>
              <p className="text-2xl font-bold">{currentQuestionIndex + 1} / {questions.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Taux de réponse</p>
              <p className="text-2xl font-bold">{
                questions.length > 0 ? 
                Math.round((Object.keys(responses).length / questions.length) * 100) : 0
              }%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Temps moyen</p>
              <p className="text-2xl font-bold">2:34</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-amber-600 font-medium">Score moyen</p>
              <p className="text-2xl font-bold">4.2/5</p>
            </div>
          </div>
          
          {/* Émotions pendant l'entretien */}
          <h3 className="text-lg font-medium mb-3">Tendances émotionnelles</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            {biometricHistory.length > 0 ? (
              <div className="h-64">
                <BiometricDashboard 
                  biometricData={biometricData} 
                  recordingHistory={biometricHistory}
                />
              </div>
            ) : (
              <p className="text-center text-gray-400 py-12">
                Pas encore assez de données pour afficher les tendances
              </p>
            )}
          </div>
          
          {/* Résumé des réponses */}
          <h3 className="text-lg font-medium mb-3">Résumé des réponses</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-600 text-sm">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Question</th>
                  <th className="pb-2">Score</th>
                  <th className="pb-2">Émotions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {questions.map((question, index) => {
                  const hasResponse = responses[index] !== undefined;
                  
                  return (
                    <tr key={index} className={`${hasResponse ? '' : 'text-gray-400'}`}>
                      <td className="py-3 pr-4">{index + 1}</td>
                      <td className="py-3 pr-4 truncate max-w-xs">{question.question}</td>
                      <td className="py-3 pr-4">
                        {hasResponse ? '4.0/5' : '-'}
                      </td>
                      <td className="py-3">
                        {hasResponse ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Confiant
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Chargement de l'entretien...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête de l'entretien */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Entretien pour {jobRole || 'Développeur'}</h1>
            <p className="text-gray-600">
              Niveau: {experienceLevel || 'Intermédiaire'} | 
              Question {currentQuestionIndex + 1} sur {questions.length} | 
              Mode: {interviewMode === 'autonomous' ? 'Autonome' : 'Collaboratif'}
              {candidateName ? ` | Candidat: ${candidateName}` : ''}
            </p>
          </div>
          
          {/* Onglets */}
          <div className="mt-4 md:mt-0 flex border-b border-gray-200">
            <button
              className={`mr-4 py-2 ${activeTab === 'interview' ? 'border-b-2 border-primary-600 text-primary-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('interview')}
            >
              Entretien
            </button>
            <button
              className={`mr-4 py-2 ${activeTab === 'analytics' ? 'border-b-2 border-primary-600 text-primary-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analyse
            </button>
          </div>
        </div>
        
        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <p className="font-medium">Une erreur est survenue</p>
            <p>{error}</p>
            <button 
              className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded"
              onClick={() => setError(null)}
            >
              Fermer
            </button>
          </div>
        )}
        
        {/* Contenu principal */}
        {renderContent()}
      </div>
    </div>
  );
};

export default InterviewRoom;