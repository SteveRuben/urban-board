// frontend/components/interview/VideoStream.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const VideoStream = forwardRef(({ onVideoReady }, ref) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  // Exposer des méthodes via la ref
  useImperativeHandle(ref, () => ({
    // Méthode pour capturer une image
    captureFrame: () => {
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg');
      }
      return null;
    },
    // Méthode pour arrêter le flux vidéo
    stopStream: () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        setCameraEnabled(false);
      }
    }
  }));

  // Activer/désactiver la caméra
  const toggleCamera = async () => {
    if (cameraEnabled) {
      // Arrêter le flux vidéo
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraEnabled(false);
    } else {
      // Démarrer le flux vidéo
      try {
        setIsLoading(true);
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }, 
          audio: false 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        streamRef.current = stream;
        setCameraEnabled(true);
        setIsLoading(false);
        
        if (onVideoReady) {
          onVideoReady(stream);
        }
      } catch (err) {
        console.error('Erreur lors de l\'accès à la caméra:', err);
        setError('Impossible d\'accéder à votre caméra. Veuillez vérifier les permissions.');
        setIsLoading(false);
      }
    }
  };

  // Nettoyer le flux vidéo lors du démontage du composant
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="video-stream-container relative">
      {/* Flux vidéo ou placeholder */}
      <div className="relative bg-gray-900 rounded-md overflow-hidden aspect-video flex items-center justify-center">
        {cameraEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full"
            onCanPlay={() => setIsLoading(false)}
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-white text-center p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-300">Caméra désactivée</p>
            </div>
          </div>
        )}
        
        {/* Indicateur de chargement */}
        {isLoading && cameraEnabled && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      
      {/* Message d'erreur */}
      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {/* Bouton pour activer/désactiver la caméra */}
      <div className="mt-3">
        <button
          onClick={toggleCamera}
          className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${
            cameraEnabled 
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
          }`}
        >
          {cameraEnabled ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Désactiver la caméra
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                <path fillRule="evenodd" d="M14.5 4.582a1 1 0 00-1.5.845v9.146a1 1 0 001.5.845l3-1.5a1 1 0 00.5-.845v-6.146a1 1 0 00-.5-.845l-3-1.5z" clipRule="evenodd" />
              </svg>
              Activer la caméra
            </>
          )}
        </button>
      </div>
    </div>
  );
});

VideoStream.displayName = 'VideoStream';

export default VideoStream;