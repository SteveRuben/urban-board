// frontend/components/interview/FacialAnalysis.jsx
import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { AlertTriangle, AlertCircle, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const FacialAnalysis = ({ 
  interviewId, 
  isRecording, 
  currentTime, 
  onBiometricData,
  disabled = false 
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisFrequency, setAnalysisFrequency] = useState(1); // Analyse toutes les X secondes
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const [faceDetectionInterval, setFaceDetectionInterval] = useState(null);
  const [emotionData, setEmotionData] = useState([]);
  const batchSizeRef = useRef(10); // Taille du lot pour l'envoi groupé
  const apiPendingRef = useRef(false);

  // Initialisation des modèles faceapi
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        
        // Chemin vers les modèles
        const MODEL_URL = '/models';
        
        // Charger les modèles nécessaires
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        
        setIsInitialized(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des modèles:', err);
        setError('Impossible de charger les modèles de détection faciale');
        setIsLoading(false);
      }
    };

    loadModels();
    
    return () => {
      // Nettoyer lors du démontage
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
      }
    };
  }, []);
  
  // Effet pour démarrer la caméra
  useEffect(() => {
    const startCamera = async () => {
      try {
        if (!isInitialized || disabled) return;
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user' 
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error('Erreur d\'accès à la caméra:', err);
        setError('Impossible d\'accéder à la caméra. Veuillez vérifier vos permissions.');
        setHasPermission(false);
      }
    };
    
    if (isInitialized && !disabled) {
      startCamera();
    }
    
    return () => {
      // Nettoyer le flux vidéo
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isInitialized, disabled]);
  
  // Effet pour démarrer la détection faciale
  useEffect(() => {
    if (!hasPermission || !isInitialized || disabled) return;
    
    const detectFace = async () => {
      if (!videoRef.current || !canvasRef.current || !isRecording) return;
      
      // Vérifier si le temps écoulé depuis la dernière analyse est suffisant
      if (currentTime - lastAnalysisTime < analysisFrequency) return;
      
      try {
        // Détecter les visages et les expressions
        const detections = await faceapi.detectAllFaces(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();
        
        // Dessiner les résultats sur le canvas
        const canvas = canvasRef.current;
        const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
        faceapi.matchDimensions(canvas, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Effacer le canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dessiner les boîtes de détection et les expressions
        if (resizedDetections.length > 0) {
          setIsFaceDetected(true);
          
          // Dessiner les boîtes de détection
          faceapi.draw.drawDetections(canvas, resizedDetections);
          
          // Obtenir les émotions du premier visage détecté
          const expressions = resizedDetections[0].expressions;
          const dominantExpression = Object.entries(expressions).reduce(
            (prev, current) => (current[1] > prev[1]) ? current : prev
          );
          
          setCurrentEmotion({
            type: dominantExpression[0],
            confidence: dominantExpression[1]
          });
          
          // Stocker les données d'analyse
          const newEmotionData = {
            timestamp: Math.floor(currentTime),
            emotions: expressions
          };
          
          setEmotionData(prevData => [...prevData, newEmotionData]);
          
          // Mise à jour du temps de la dernière analyse
          setLastAnalysisTime(currentTime);
          
          // Appeler le callback avec les données d'émotions
          if (onBiometricData) {
            onBiometricData(newEmotionData);
          }
        } else {
          setIsFaceDetected(false);
        }
      } catch (err) {
        console.error('Erreur lors de la détection faciale:', err);
      }
    };
    
    // Créer un intervalle pour la détection faciale (environ 30 FPS)
    const interval = setInterval(detectFace, 33);
    setFaceDetectionInterval(interval);
    
    return () => {
      clearInterval(interval);
    };
  }, [hasPermission, isInitialized, isRecording, currentTime, lastAnalysisTime, analysisFrequency, disabled, onBiometricData]);
  
  // Effet pour envoyer les données par lots
  useEffect(() => {
    const sendBatchData = async () => {
      if (emotionData.length < batchSizeRef.current || apiPendingRef.current || !isRecording) return;
      
      try {
        apiPendingRef.current = true;
        
        // Extraire les données à envoyer
        const dataToSend = emotionData.slice(0, batchSizeRef.current);
        
        // Appel API pour envoyer les données
        const response = await fetch(`/api/interviews/${interviewId}/facial-analysis/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(dataToSend)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de l\'envoi des données d\'analyse faciale');
        }
        
        // Supprimer les données envoyées
        setEmotionData(prevData => prevData.slice(batchSizeRef.current));
      } catch (err) {
        console.error('Erreur lors de l\'envoi des données d\'analyse faciale:', err);
        // On garde les données en cas d'erreur pour réessayer plus tard
      } finally {
        apiPendingRef.current = false;
      }
    };
    
    // Envoyer les données toutes les 3 secondes si nécessaire
    const interval = setInterval(sendBatchData, 3000);
    
    return () => {
      clearInterval(interval);
    };
  }, [emotionData, interviewId, isRecording]);
  
  // Effet pour nettoyer les données à la fin de l'enregistrement
  useEffect(() => {
    if (!isRecording && emotionData.length > 0) {
      const sendRemainingData = async () => {
        try {
          apiPendingRef.current = true;
          
          // Appel API pour envoyer les données restantes
          const response = await fetch(`/api/interviews/${interviewId}/facial-analysis/batch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(emotionData)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de l\'envoi des données d\'analyse faciale');
          }
          
          // Réinitialiser les données
          setEmotionData([]);
        } catch (err) {
          console.error('Erreur lors de l\'envoi des données finales d\'analyse faciale:', err);
          showToast('error', 'Erreur lors de l\'enregistrement des données d\'analyse faciale');
        } finally {
          apiPendingRef.current = false;
        }
      };
      
      sendRemainingData();
    }
  }, [isRecording, emotionData, interviewId, showToast]);
  
  // Fonction pour générer une classe CSS basée sur l'émotion
  const getEmotionClass = () => {
    if (!currentEmotion) return '';
    
    switch (currentEmotion.type) {
      case 'happy':
        return 'bg-green-100 text-green-800';
      case 'sad':
        return 'bg-blue-100 text-blue-800';
      case 'angry':
        return 'bg-red-100 text-red-800';
      case 'fearful':
        return 'bg-purple-100 text-purple-800';
      case 'disgusted':
        return 'bg-yellow-100 text-yellow-800';
      case 'surprised':
        return 'bg-pink-100 text-pink-800';
      case 'neutral':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Fonction pour traduire le nom de l'émotion en français
  const translateEmotion = (emotion) => {
    const translations = {
      'happy': 'Heureux',
      'sad': 'Triste',
      'angry': 'En colère',
      'fearful': 'Craintif',
      'disgusted': 'Dégoûté',
      'surprised': 'Surpris',
      'neutral': 'Neutre'
    };
    
    return translations[emotion] || emotion;
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border rounded-md bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-sm text-gray-600">Chargement des modèles d'analyse faciale...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border rounded-md bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    );
  }
  
  if (disabled) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border rounded-md bg-gray-50">
        <Camera className="h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">L'analyse faciale est désactivée</p>
        <p className="text-xs text-gray-500 mt-1">Cette fonctionnalité est disponible dans les plans Pro et Enterprise.</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col border rounded-md overflow-hidden">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          width="640"
          height="480"
          className="w-full h-auto"
          style={{ transform: 'scaleX(-1)' }} // Miroir pour une expérience plus naturelle
        />
        <canvas 
          ref={canvasRef}
          width="640"
          height="480"
          className="absolute top-0 left-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {!isFaceDetected && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-3 rounded-md flex items-center">
              <AlertTriangle className="text-yellow-500 mr-2" />
              <span className="text-sm">Aucun visage détecté. Ajustez votre position.</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">État:</span>
            {isFaceDetected ? (
              <span className="text-sm text-green-600 flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                Visage détecté
              </span>
            ) : (
              <span className="text-sm text-red-600 flex items-center">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-1"></span>
                Aucun visage
              </span>
            )}
          </div>
          
          {currentEmotion && (
            <div 
              className={`px-2 py-1 rounded-full text-xs font-medium ${getEmotionClass()}`}
            >
              {translateEmotion(currentEmotion.type)} ({Math.round(currentEmotion.confidence * 100)}%)
            </div>
          )}
        </div>
        
        {isRecording && (
          <div className="mt-2 flex items-center">
            <span className="h-2 w-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
            <span className="text-xs text-gray-500">Analyse en cours...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacialAnalysis;