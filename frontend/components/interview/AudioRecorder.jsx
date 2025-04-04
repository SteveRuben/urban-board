// frontend/components/interview/AudioRecorder.jsx
import React, { useState, useRef, useEffect } from 'react';
import aiInterviewService from '../../services/ai-interview-service';

const AudioRecorder = ({ onTranscriptionComplete, isRecordingEnabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  // Gérer le début de l'enregistrement
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunksRef.current.push(event.data);
      });
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Démarrer le chronomètre
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error("Erreur lors de l'accès au microphone:", err);
      alert("Impossible d'accéder au microphone. Veuillez vérifier les permissions.");
    }
  };
  
  // Gérer l'arrêt de l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      
      // Arrêter toutes les pistes audio
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
      
      // Traiter l'audio enregistré
      mediaRecorderRef.current.addEventListener("stop", async () => {
        try {
          setIsTranscribing(true);
          setTranscriptionProgress(10); // Démarrer la progression
          
          // Simuler une progression pendant la transcription
          const progressInterval = setInterval(() => {
            setTranscriptionProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 500);
          
          // Créer un blob audio à partir des chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Envoyer l'audio pour transcription
          const transcriptResult = await aiInterviewService.transcribeAudio(audioBlob);
          setTranscript(transcriptResult);
          
          // Compléter la progression
          clearInterval(progressInterval);
          setTranscriptionProgress(100);
          
          // Notifier le composant parent que la transcription est terminée
          if (onTranscriptionComplete) {
            onTranscriptionComplete(transcriptResult);
          }
          
          // Réinitialiser après un court délai
          setTimeout(() => {
            setIsTranscribing(false);
            setTranscriptionProgress(0);
          }, 1000);
        } catch (err) {
          console.error("Erreur lors de la transcription:", err);
          setIsTranscribing(false);
          setTranscriptionProgress(0);
          alert("La transcription a échoué. Veuillez réessayer.");
        }
      });
    }
  };
  
  // Formater le temps d'enregistrement (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Gérer le basculement de l'enregistrement
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  return (
    <div className="audio-recorder">
      {/* Affichage de l'état d'enregistrement */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {isRecording && (
            <div className="flex items-center mr-4">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-red-600 font-medium">Enregistrement</span>
            </div>
          )}
          
          {isRecording && (
            <div className="font-mono text-sm">{formatTime(recordingTime)}</div>
          )}
        </div>
        
        {/* Bouton d'enregistrement */}
        <button
          onClick={toggleRecording}
          disabled={!isRecordingEnabled}
          className={`px-4 py-2 rounded-md flex items-center ${
            isRecordingEnabled 
              ? isRecording 
                ? 'bg-red-600 hover:bg-red-700 text-black' 
                : 'bg-primary-600 hover:bg-primary-700 text-black'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isRecording ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Arrêter
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              Enregistrer
            </>
          )}
        </button>
      </div>
      
      {/* Barre de progression de la transcription */}
      {isTranscribing && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Transcription en cours...</span>
            <span>{transcriptionProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${transcriptionProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Affichage de la transcription */}
      {transcript && !isRecording && !isTranscribing && (
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <p className="text-sm">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;