// frontend/components/interview/CollaborativeInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useInterview } from '../../contexts/InterviewContext';
import AIInterviewer from './AIInterviewer';
import EnhancedAudioRecorder from './EnhancedAudioRecorder';
import VideoStream from './VideoStream';
import BiometricDashboard from './BiometricDashboard';
import Question from './Question';
import ResponseInput from './ResponseInput';
import EvaluationCard from './EvaluationCard';
import SuggestedQuestions from './SuggestedQuestions';
import AIAssistantChat from './AIAssistantChat';
import speechService from '../../services/speechService';
import { Mic, MicOff, MessageCircle, X, Bot, ArrowRight } from 'lucide-react';

/**
 * Interface pour le mode collaboratif où le recruteur et l'IA collaborent
 */
const CollaborativeInterface = ({ videoRef }) => {
  const { 
    interviewId,
    interviewData,
    questions,
    currentQuestionIndex,
    responses,
    evaluations,
    transcript,
    biometricData,
    isLoading,
    isEvaluating,
    error,
    suggestedQuestions,
    useQuestion,
    loadSuggestedQuestions,
    submitResponse,
    updateTranscript,
    goToNextQuestion,
    sendChatMessage
  } = useInterview();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [aiSpeakingState, setAiSpeakingState] = useState('idle'); // 'idle', 'suggestion', 'evaluation'
  const chatPanelRef = useRef(null);
  
  // Gérer les clics en dehors du chat pour le fermer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatPanelRef.current && !chatPanelRef.current.contains(event.target)) {
        setShowChat(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Mettre à jour les informations biométriques pendant l'enregistrement
  const handleRecordingStateChange = (isActive) => {
    setIsRecording(isActive);
  };
  
  // Gérer la fin de la transcription
  const handleTranscriptionComplete = (text) => {
    updateTranscript(text);
  };
  
  // Soumettre la réponse pour évaluation
  const handleResponseSubmit = async (response) => {
    const evaluation = await submitResponse(response);
    if (evaluation) {
      setAiSpeakingState('evaluation');
    }
  };
  
  // Utiliser une question suggérée
  const handleUseQuestion = (question) => {
    setActiveSuggestion(question);
    const usedQuestion = useQuestion(question);
    
    // Faire lire la question par l'IA
    setTimeout(() => {
      setAiSpeakingState('suggestion');
    }, 500);
    
    return usedQuestion;
  };
  
  // Gérer le début de la parole de l'IA
  const handleAISpeakStart = () => {
    setIsSpeaking(true);
  };
  
  // Gérer la fin de la parole de l'IA
  const handleAISpeakEnd = () => {
    setIsSpeaking(false);
    setAiSpeakingState('idle');
    setActiveSuggestion(null);
  };
  
  // Obtenir le texte à prononcer en fonction de l'état
  const getAISpeechText = () => {
    if (aiSpeakingState === 'suggestion' && activeSuggestion) {
      return activeSuggestion.question;
    }
    
    if (aiSpeakingState === 'evaluation' && evaluations[currentQuestionIndex]) {
      const evaluation = evaluations[currentQuestionIndex];
      return `Analyse de la réponse : ${evaluation.feedback}`;
    }
    
    return null;
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne gauche - Vidéo, analyse biométrique et questions suggérées */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Vidéo du candidat</h3>
          <VideoStream ref={videoRef} />
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Analyse biométrique</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
              IA
            </span>
          </div>
          <BiometricDashboard biometricData={biometricData} />
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Questions suggérées</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              IA
            </span>
          </div>
          <SuggestedQuestions 
            questions={suggestedQuestions}
            onUseQuestion={handleUseQuestion}
            onRequestNewSuggestion={loadSuggestedQuestions}
          />
        </div>
      </div>
      
      {/* Colonne centrale et droite - Questions, réponses et IA */}
      <div className="lg:col-span-2">
        {/* Assistant IA */}
        <div className="mb-6">
          <AIInterviewer
            question={getAISpeechText()}
            onSpeakStart={handleAISpeakStart}
            onSpeakEnd={handleAISpeakEnd}
            autoSpeak={false}
          />
        </div>
        
        {/* Question en cours */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">
              Question {currentQuestionIndex + 1}/{questions.length}
            </h3>
            {questions[currentQuestionIndex]?.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {questions[currentQuestionIndex].category}
              </span>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <Question 
                question={activeSuggestion ? 
                  activeSuggestion.question : 
                  questions[currentQuestionIndex]?.original_text
                } 
                index={currentQuestionIndex}
              />
              
              {questions[currentQuestionIndex]?.difficulty && (
                <div className="mt-4 text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    questions[currentQuestionIndex].difficulty === 'difficile' 
                      ? 'bg-red-100 text-red-800' 
                      : questions[currentQuestionIndex].difficulty === 'moyenne'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }`}>
                    Difficulté: {questions[currentQuestionIndex].difficulty}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Enregistrement audio et transcription */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Enregistrement et transcription</h3>
          <EnhancedAudioRecorder 
            onTranscriptionComplete={handleTranscriptionComplete}
            isRecordingEnabled={true}
            onRecordingStateChange={handleRecordingStateChange}
            maxRecordingTime={180}
            autoTranscribe={true}
          />
        </div>
        
        {/* Réponse écrite */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Réponse du candidat</h3>
          <ResponseInput 
            initialValue={transcript}
            onSubmit={handleResponseSubmit}
            disabled={isEvaluating}
          />
        </div>
        
        {/* Évaluation */}
        {evaluations[currentQuestionIndex] && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Évaluation de la réponse</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                IA
              </span>
            </div>
            
            <EvaluationCard evaluation={evaluations[currentQuestionIndex]} />
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={goToNextQuestion}
                className="flex items-center px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700"
              >
                {currentQuestionIndex < questions.length - 1 
                  ? 'Question suivante' 
                  : 'Terminer l\'entretien'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}
        
        {/* Affichage pendant l'évaluation */}
        {isEvaluating && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col items-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Évaluation de la réponse par l'IA...</p>
              <p className="text-xs text-gray-500 mt-2">Cela peut prendre quelques secondes</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Bouton flottant pour discuter avec l'IA */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 bg-primary-600 text-black rounded-full p-3 shadow-lg hover:bg-primary-700 flex items-center"
        >
          <MessageCircle className="h-6 w-6 mr-2" />
          <span>Consulter l'IA</span>
        </button>
      )}
      
      {/* Panel de chat avec l'IA */}
      {showChat && (
        <div 
          ref={chatPanelRef}
          className="fixed bottom-6 right-6 w-96 h-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 flex flex-col"
        >
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center">
              <Bot className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="font-medium">Assistant IA</h3>
            </div>
            <button 
              onClick={() => setShowChat(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <AIAssistantChat 
              interviewId={interviewId} 
              sendMessage={sendChatMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeInterface;