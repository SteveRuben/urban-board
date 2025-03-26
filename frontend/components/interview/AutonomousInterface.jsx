// frontend/components/interview/AutonomousInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useInterview } from '../../contexts/InterviewContext';
import AIInterviewer from './AIInterviewer';
import EnhancedAudioRecorder from './EnhancedAudioRecorder';
import VideoStream from './VideoStream';
import BiometricDashboard from './BiometricDashboard';
import Question from './Question';
import ResponseInput from './ResponseInput';
import EvaluationCard from './EvaluationCard';
import { Play, Pause, FastForward, ArrowRight, HelpCircle } from 'lucide-react';

/**
 * Interface pour le mode autonome où l'IA mène l'entretien seule
 */
const AutonomousInterface = ({ videoRef }) => {
  const { 
    questions,
    currentQuestionIndex,
    responses,
    evaluations,
    transcript,
    biometricData,
    isLoading,
    isEvaluating,
    error,
    updateTranscript,
    submitResponse,
    goToNextQuestion
  } = useInterview();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interviewPaused, setInterviewPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [stepDelay, setStepDelay] = useState(null);
  const stepTimerRef = useRef(null);
  
  // Gérer les transitions automatiques entre les questions
  useEffect(() => {
    // Si une évaluation vient d'être reçue et que l'interview n'est pas en pause,
    // programmer le passage à la question suivante
    if (
      evaluations[currentQuestionIndex] && 
      !isEvaluating && 
      !interviewPaused && 
      !responses[currentQuestionIndex + 1]
    ) {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
      }
      
      stepTimerRef.current = setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          goToNextQuestion();
        }
      }, 5000); // 5 secondes avant de passer à la question suivante
      
      setStepDelay(5);
      
      // Décrémenter le compteur chaque seconde
      const intervalId = setInterval(() => {
        setStepDelay(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(intervalId);
        if (stepTimerRef.current) {
          clearTimeout(stepTimerRef.current);
        }
      };
    }
  }, [evaluations, currentQuestionIndex, isEvaluating, interviewPaused]);
  
  // Nettoyer à la destruction du composant
  useEffect(() => {
    return () => {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
      }
    };
  }, []);
  
  // Mettre en pause ou reprendre l'interview
  const toggleInterviewPause = () => {
    if (interviewPaused) {
      // Reprendre
      setInterviewPaused(false);
    } else {
      // Mettre en pause
      setInterviewPaused(true);
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      setStepDelay(null);
    }
  };
  
  // Passer directement à la question suivante (ignorer le délai)
  const skipToNextQuestion = () => {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      goToNextQuestion();
    }
    
    setStepDelay(null);
  };
  
  // Gérer le changement d'état de l'enregistrement
  const handleRecordingStateChange = (isActive) => {
    setIsRecording(isActive);
  };
  
  // Gérer la fin de la transcription
  const handleTranscriptionComplete = (text) => {
    updateTranscript(text);
  };
  
  // Soumettre la réponse pour évaluation
  const handleResponseSubmit = async (response) => {
    await submitResponse(response);
  };
  
  // Gérer le début de la parole de l'IA
  const handleAISpeakStart = () => {
    setIsSpeaking(true);
  };
  
  // Gérer la fin de la parole de l'IA
  const handleAISpeakEnd = () => {
    setIsSpeaking(false);
  };
  
  // Obtenir la question actuelle à prononcer
  const getCurrentQuestion = () => {
    if (!questions || questions.length === 0 || currentQuestionIndex >= questions.length) {
      return '';
    }
    
    return questions[currentQuestionIndex]?.original_text || '';
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne gauche - Vidéo, analyse biométrique et aide */}
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
            <h3 className="font-medium text-gray-900">Aide</h3>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-gray-500 hover:text-gray-700"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          
          {showHelp ? (
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <b>Mode autonome :</b> Dans ce mode, l'IA mène l'entretien de manière autonome.
              </p>
              <p>
                <b>Déroulement :</b> L'IA posera une série de questions. Vous pouvez répondre oralement ou par écrit.
              </p>
              <p>
                <b>Contrôles :</b> Vous pouvez mettre en pause l'entretien à tout moment, ou passer directement à la question suivante.
              </p>
              <p>
                <b>Évaluation :</b> Après chaque réponse, l'IA fournira une évaluation détaillée.
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Cliquez sur le bouton d'aide pour afficher les instructions.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Colonne centrale et droite - Questions, réponses et IA */}
      <div className="lg:col-span-2">
        {/* Assistant IA */}
        <div className="mb-6">
          <AIInterviewer
            question={getCurrentQuestion()}
            onSpeakStart={handleAISpeakStart}
            onSpeakEnd={handleAISpeakEnd}
            autoSpeak={true}
          />
        </div>
        
        {/* Contrôles de l'entretien */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">
                Progression : {currentQuestionIndex + 1} / {questions.length}
              </span>
              
              {stepDelay !== null && (
                <span className="ml-4 text-sm text-gray-500">
                  Prochaine question dans {stepDelay}s...
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={toggleInterviewPause}
                className={`flex items-center px-3 py-1 rounded-md text-sm ${
                  interviewPaused
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                {interviewPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Reprendre
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </>
                )}
              </button>
              
              {stepDelay !== null && (
                <button
                  onClick={skipToNextQuestion}
                  className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                >
                  <FastForward className="h-4 w-4 mr-1" />
                  Question suivante
                </button>
              )}
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Question en cours */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">
              Question {currentQuestionIndex + 1} /{questions.length}
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
                question={questions[currentQuestionIndex]?.original_text} 
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
          <h3 className="font-medium text-gray-900 mb-4">Votre réponse</h3>
          <EnhancedAudioRecorder 
            onTranscriptionComplete={handleTranscriptionComplete}
            isRecordingEnabled={!isEvaluating && !isSpeaking}
            onRecordingStateChange={handleRecordingStateChange}
            maxRecordingTime={180}
            autoTranscribe={true}
          />
          
          <div className="mt-4">
            <ResponseInput 
              initialValue={transcript}
              onSubmit={handleResponseSubmit}
              disabled={isEvaluating || isRecording || isSpeaking}
            />
          </div>
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
            
            {currentQuestionIndex === questions.length - 1 && evaluations[currentQuestionIndex] && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={goToNextQuestion}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Terminer l'entretien
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Affichage pendant l'évaluation */}
        {isEvaluating && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col items-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Évaluation de votre réponse par l'IA...</p>
              <p className="text-xs text-gray-500 mt-2">Cela peut prendre quelques secondes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutonomousInterface;