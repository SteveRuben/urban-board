// frontend/components/interview/BiometricAnalysis.jsx
import React, { useState, useEffect } from 'react';
import aiInterviewService from '../../services/ai-interview-service';

const EmotionIndicator = ({ emotion, value }) => {
  // Mapper l'émotion à une couleur
  const emotionColors = {
    neutral: 'bg-gray-200',
    happy: 'bg-green-200',
    sad: 'bg-blue-200',
    angry: 'bg-red-200',
    surprised: 'bg-yellow-200',
    fearful: 'bg-purple-200',
    disgusted: 'bg-emerald-200'
  };

  const color = emotionColors[emotion.toLowerCase()] || 'bg-gray-200';
  
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 capitalize">{emotion}</span>
        <span className="text-sm font-medium text-gray-700">{Math.round(value * 100)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`${color} h-2.5 rounded-full`} 
          style={{ width: `${Math.round(value * 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

const BiometricAnalysis = ({ videoRef, isRecording }) => {
  const [biometricData, setBiometricData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(null);

  // Analyser périodiquement les expressions faciales pendant l'enregistrement
  useEffect(() => {
    if (isRecording && videoRef && videoRef.current) {
      // Démarrer l'analyse périodique
      const interval = setInterval(async () => {
        try {
          setIsAnalyzing(true);
          // Capturer une image de la vidéo
          const imageData = videoRef.current.captureFrame();
          if (imageData) {
            // Envoyer l'image pour analyse
            const analysis = await aiInterviewService.analyzeBiometrics(imageData);
            setBiometricData(analysis);
          }
          setIsAnalyzing(false);
        } catch (err) {
          console.error('Erreur lors de l\'analyse biométrique:', err);
          setIsAnalyzing(false);
        }
      }, 3000); // Analyser toutes les 3 secondes
      
      setAnalysisInterval(interval);
      
      // Nettoyer lors de l'arrêt de l'enregistrement
      return () => {
        clearInterval(interval);
        setAnalysisInterval(null);
      };
    } else if (!isRecording && analysisInterval) {
      clearInterval(analysisInterval);
      setAnalysisInterval(null);
    }
  }, [isRecording, videoRef]);

  // Obtenir les émotions dominantes
  const getDominantEmotion = () => {
    if (!biometricData || !biometricData.emotions) return 'Neutre';
    
    const emotions = biometricData.emotions;
    let maxEmotion = 'neutral';
    let maxValue = 0;
    
    Object.entries(emotions).forEach(([emotion, value]) => {
      if (value > maxValue && emotion !== 'neutral') {
        maxValue = value;
        maxEmotion = emotion;
      }
    });
    
    return maxValue > 0.1 ? maxEmotion : 'Neutral'; // Seuil de 10%
  };

  // Si pas de données biométriques
  if (!biometricData) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-center text-gray-500 italic">
          {isRecording 
            ? "Analyse biométrique en cours..."
            : "Activez l'enregistrement pour commencer l'analyse biométrique"
          }
        </p>
        {isAnalyzing && (
          <div className="flex justify-center mt-2">
            <div className="animate-pulse h-2 w-24 bg-gray-300 rounded"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      {/* Émotion dominante */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Émotion dominante</h3>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-green-500' : 'bg-gray-400'} mr-2`}></div>
          <span className="font-medium capitalize">{getDominantEmotion()}</span>
        </div>
      </div>
      
      {/* Graphiques des émotions */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Émotions détectées</h3>
        {biometricData.emotions && Object.entries(biometricData.emotions).map(([emotion, value]) => (
          <EmotionIndicator key={emotion} emotion={emotion} value={value} />
        ))}
      </div>
      
      {/* Indicateurs d'engagement */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Indicateurs d'engagement</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-xs text-gray-500">Contact visuel</span>
            <p className="font-medium">{biometricData.engagement?.eyeContact || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-xs text-gray-500">Posture</span>
            <p className="font-medium">{biometricData.engagement?.posture || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-xs text-gray-500">Gestuelle</span>
            <p className="font-medium">{biometricData.engagement?.gestures || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-xs text-gray-500">Attention</span>
            <p className="font-medium">{biometricData.engagement?.attention || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricAnalysis;