// frontend/components/interview/AIInterviewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useInterview } from '../../contexts/InterviewContext';
import speechService from '../../services/speechService';
import { Bot, Volume2, VolumeX, Pause, Play } from 'lucide-react';

/**
 * Composant représentant l'interviewer IA avec capacités vocales
 */
const AIInterviewer = ({ 
  question, 
  onSpeakStart, 
  onSpeakEnd, 
  autoSpeak = true,
  introText = null,
  speechRate = 1,
  avatarUrl = null 
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const textToSpeakRef = useRef('');
  const { interviewMode } = useInterview();
  
  // Effet pour parler automatiquement lorsque la question change
  useEffect(() => {
    if (question && autoSpeak && audioEnabled && !isSpeaking) {
      speakQuestion();
    }
  }, [question]);
  
  // Arrêter de parler si le composant est démonté
  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);
  
  // Formater l'introduction en fonction du mode d'entretien
  const getIntroText = () => {
    if (introText) return introText;
    
    if (interviewMode === 'autonomous') {
      return "Bonjour, je suis l'assistant IA qui va mener cet entretien. Je vais vous poser une série de questions pour évaluer vos compétences. Prenez votre temps pour répondre et n'hésitez pas à demander des clarifications si nécessaire.";
    }
    
    return "Bonjour, je suis l'assistant IA qui va accompagner cet entretien. Je vais assister le recruteur en suggérant des questions et en analysant vos réponses.";
  };
  
  // Prononcer la question courante
  const speakQuestion = async () => {
    if (!audioEnabled || isSpeaking) return;
    
    setIsSpeaking(true);
    if (onSpeakStart) onSpeakStart();
    
    try {
      // Si c'est la première question, dire l'introduction
      if (textToSpeakRef.current === '') {
        const intro = getIntroText();
        textToSpeakRef.current = intro;
        
        await speechService.speak(intro, {
          rate: speechRate,
          onEnd: () => {
            textToSpeakRef.current = '';
            if (question) {
              textToSpeakRef.current = question;
              speechService.speak(question, {
                rate: speechRate,
                onEnd: handleSpeakEnd
              });
            } else {
              handleSpeakEnd();
            }
          }
        });
      } else {
        // Sinon, juste dire la question
        textToSpeakRef.current = question;
        await speechService.speak(question, {
          rate: speechRate,
          onEnd: handleSpeakEnd
        });
      }
    } catch (error) {
      console.error('Erreur lors de la synthèse vocale:', error);
      handleSpeakEnd();
    }
  };
  
  // Gérer la fin de la parole
  const handleSpeakEnd = () => {
    setIsSpeaking(false);
    textToSpeakRef.current = '';
    if (onSpeakEnd) onSpeakEnd();
  };
  
  // Basculer l'activation/désactivation audio
  const toggleAudio = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    }
    setAudioEnabled(!audioEnabled);
  };
  
  // Mettre en pause ou reprendre la parole
  const togglePause = () => {
    if (isSpeaking) {
      if (isPaused) {
        // Reprendre la parole
        speechService.speak(textToSpeakRef.current, {
          rate: speechRate,
          onEnd: handleSpeakEnd
        });
        setIsPaused(false);
      } else {
        // Mettre en pause
        speechService.stop();
        setIsPaused(true);
      }
    }
  };
  
  // Vérifier si la synthèse vocale est disponible
  const isSpeechAvailable = speechService.isSpeechSynthesisAvailable();
  
  return (
    <div className="flex items-center space-x-3 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      {/* Avatar de l'IA */}
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Assistant IA" 
            className="h-12 w-12 rounded-full bg-primary-100"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary-600" />
          </div>
        )}
      </div>
      
      {/* Informations et contrôles */}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            Assistant IA
            {isSpeaking && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                En train de parler...
              </span>
            )}
          </h3>
          
          {/* Contrôles audio */}
          {isSpeechAvailable && (
            <div className="flex space-x-2">
              {isSpeaking && (
                <button
                  type="button"
                  onClick={togglePause}
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                  title={isPaused ? "Reprendre" : "Mettre en pause"}
                >
                  {isPaused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </button>
              )}
              
              <button
                type="button"
                onClick={toggleAudio}
                className={`p-1 rounded-full ${
                  audioEnabled 
                    ? 'text-primary-600 hover:bg-primary-100' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={audioEnabled ? "Désactiver l'audio" : "Activer l'audio"}
              >
                {audioEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Message d'erreur si la synthèse vocale n'est pas disponible */}
        {!isSpeechAvailable && (
          <p className="text-xs text-orange-600 mt-1">
            La synthèse vocale n'est pas disponible dans votre navigateur.
          </p>
        )}
        
        {/* Boutons de contrôle principal */}
        <div className="mt-2">
          {!autoSpeak && !isSpeaking && (
            <button
              type="button"
              onClick={speakQuestion}
              disabled={!audioEnabled || !isSpeechAvailable}
              className={`inline-flex items-center px-3 py-1 text-sm rounded-md ${
                audioEnabled && isSpeechAvailable
                  ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Volume2 className="h-4 w-4 mr-1" />
              Écouter la question
            </button>
          )}
          {isSpeaking && (
            <button
              type="button"
              onClick={() => {
                speechService.stop();
                setIsSpeaking(false);
                if (onSpeakEnd) onSpeakEnd();
              }}
              className="inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              <VolumeX className="h-4 w-4 mr-1" />
              Arrêter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInterviewer;