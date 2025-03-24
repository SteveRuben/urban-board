// frontend/components/interview/EnhancedAudioRecorder.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import aiInterviewService from '../../services/ai-interview-service';

// Visualisation de la forme d'onde audio
const AudioVisualizer = ({ isRecording }) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  
  // Initialiser l'analyseur audio
  const setupAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 256;
        source.connect(analyser);
        // Ne pas connecter à destination pour éviter l'écho
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
      }
    } catch (err) {
      console.error("Erreur lors de l'initialisation de l'analyseur audio:", err);
    }
  }, []);
  
  // Dessiner la forme d'onde
  const draw = useCallback(() => {
    if (!isRecording || !canvasRef.current || !analyserRef.current || !dataArrayRef.current) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    
    ctx.fillStyle = 'rgb(240, 240, 240)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(34, 197, 94)'; // green-500
    ctx.beginPath();
    
    const sliceWidth = width / dataArrayRef.current.length;
    let x = 0;
    
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const v = dataArrayRef.current[i] / 128.0;
      const y = v * height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    animationRef.current = requestAnimationFrame(draw);
  }, [isRecording]);
  
  // Gérer le démarrage/arrêt de l'animation
  useEffect(() => {
    if (isRecording) {
      setupAudioContext().then(() => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = requestAnimationFrame(draw);
      });
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, setupAudioContext, draw]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-24 bg-gray-100 rounded-md"
      width={600}
      height={100}
    />
  );
};

// Composant principal d'enregistrement audio
const EnhancedAudioRecorder = ({ 
  onTranscriptionComplete, 
  isRecordingEnabled = true,
  onRecordingStateChange = () => {},
  maxRecordingTime = 120, // en secondes
  autoTranscribe = true,
  placeholder = "Votre réponse sera transcrite ici..."
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  
  // Effets de nettoyage et de notification des changements d'état
  useEffect(() => {
    onRecordingStateChange(isRecording);
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isRecording, onRecordingStateChange, audioUrl]);
  
  // Limite de temps d'enregistrement
  useEffect(() => {
    if (isRecording && recordingTime >= maxRecordingTime) {
      stopRecording();
    }
  }, [isRecording, recordingTime, maxRecordingTime]);
  
  // Gérer le début de l'enregistrement
  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      
      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Configurer le MediaRecorder
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      // Collecter les chunks audio
      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunksRef.current.push(event.data);
      });
      
      // Gérer la fin de l'enregistrement
      mediaRecorder.addEventListener("stop", handleRecordingStop);
      
      // Démarrer l'enregistrement
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Démarrer le chronomètre
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error("Erreur lors de l'accès au microphone:", err);
      setError("Impossible d'accéder au microphone. Veuillez vérifier les permissions.");
    }
  };
  
  // Gérer la pause/reprise de l'enregistrement
  const togglePause = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    if (isPaused) {
      // Reprendre l'enregistrement
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      setIsPaused(false);
    } else {
      // Mettre en pause
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };
  
  // Gérer l'arrêt de l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stop();
      // Nettoyé par le gestionnaire d'événement 'stop'
    }
  };
  
  // Traiter l'audio après l'arrêt de l'enregistrement
  const handleRecordingStop = () => {
    // Arrêter toutes les pistes audio
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    setIsPaused(false);
    
    // Créer un blob audio à partir des chunks
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Créer une URL pour la lecture
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const newAudioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(newAudioUrl);
      
      // Transcription automatique si activée
      if (autoTranscribe) {
        transcribeAudio(audioBlob);
      }
    }
  };
  
  // Envoyer l'audio pour transcription
  const transcribeAudio = async (audioBlob) => {
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
          return prev + 5;
        });
      }, 300);
      
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
      setError("La transcription a échoué. Veuillez réessayer.");
    }
  };
  
  // Formatage du temps d'enregistrement (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Transcription manuelle (si auto-transcription désactivée)
  const handleManualTranscribe = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      transcribeAudio(audioBlob);
    } else {
      setError("Aucun enregistrement disponible pour la transcription.");
    }
  };
  
  // Gérer le basculement de l'enregistrement
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Télécharger l'enregistrement audio
  const downloadRecording = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `reponse_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      a.click();
    }
  };
  
  return (
    <div className="audio-recorder bg-white rounded-lg">
      {/* Zone de visualisation */}
      <div className="mb-3">
        <AudioVisualizer isRecording={isRecording} />
      </div>
      
      {/* Contrôles et état */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="flex items-center">
          {/* État d'enregistrement */}
          {isRecording && (
            <div className="flex items-center mr-4">
              <div className={`h-3 w-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'} mr-2`}></div>
              <span className="text-sm font-medium">{isPaused ? 'En pause' : 'Enregistrement'}</span>
            </div>
          )}
          
          {/* Chronomètre */}
          <div className="font-mono text-sm">
            {formatTime(recordingTime)} / {formatTime(maxRecordingTime)}
          </div>
        </div>
        
        {/* Boutons de contrôle */}
        <div className="flex gap-2">
          {/* Bouton d'enregistrement */}
          <button
            onClick={toggleRecording}
            disabled={!isRecordingEnabled}
            title={isRecording ? "Arrêter l'enregistrement" : "Commencer l'enregistrement"}
            className={`p-2 rounded-full ${
              isRecordingEnabled 
                ? isRecording 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isRecording ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          {/* Bouton pause/reprise */}
          {isRecording && (
            <button
              onClick={togglePause}
              title={isPaused ? "Reprendre l'enregistrement" : "Mettre en pause"}
              className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
            >
              {isPaused ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          )}
          
          {/* Bouton de téléchargement (disponible après enregistrement) */}
          {audioUrl && !isRecording && (
            <button
              onClick={downloadRecording}
              title="Télécharger l'enregistrement"
              className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
          
          {/* Bouton de transcription manuelle */}
          {audioUrl && !isRecording && !autoTranscribe && !isTranscribing && (
            <button
              onClick={handleManualTranscribe}
              title="Transcrire l'enregistrement"
              className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Lecteur audio (visible après enregistrement) */}
      {audioUrl && !isRecording && (
        <div className="mb-4 p-2 bg-gray-50 rounded-md">
          <audio 
            ref={audioRef}
            src={audioUrl} 
            controls 
            className="w-full h-10" 
          />
        </div>
      )}
      
      {/* Barre de progression de la transcription */}
      {isTranscribing && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Transcription en cours...</span>
            <span>{transcriptionProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-600 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${transcriptionProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Affichage des erreurs */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
          <button 
            onClick={() => setError(null)} 
            className="mt-2 text-xs text-red-700 hover:text-red-800"
          >
            Fermer
          </button>
        </div>
      )}
      
      {/* Affichage de la transcription */}
      {transcript && !isRecording && !isTranscribing && (
        <div className="mb-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Transcription</h3>
              <span className="text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full">IA</span>
            </div>
            <p className="text-sm text-gray-600">{transcript}</p>
          </div>
        </div>
      )}
      
      {/* Placeholder quand pas de transcription */}
      {!transcript && !isRecording && !isTranscribing && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 text-gray-400 text-sm rounded-md italic">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default EnhancedAudioRecorder;