// frontend/components/interview/ResponseTimer.jsx
import React, { useState, useEffect, useRef } from 'react';

/**
 * Composant qui surveille le temps de réponse et déclenche des actions après un certain délai
 */
const ResponseTimer = ({ 
  isActive, 
  onTimeThreshold, 
  timeThreshold = 20, // Seuil en secondes avant de déclencher l'action
  warningThreshold = 15, // Seuil pour l'avertissement visuel  
  onReset
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef(null);
  const thresholdReachedRef = useRef(false);
  
  // Gestion du timer
  useEffect(() => {
    if (isActive) {
      // Réinitialiser l'état
      setElapsed(0);
      setShowWarning(false);
      thresholdReachedRef.current = false;
      
      // Démarrer le timer
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const newValue = prev + 1;
          
          // Déclencher l'avertissement visuel
          if (newValue >= warningThreshold && !showWarning) {
            setShowWarning(true);
          }
          
          // Déclencher l'action au seuil de temps
          if (newValue >= timeThreshold && !thresholdReachedRef.current) {
            thresholdReachedRef.current = true;
            if (onTimeThreshold) {
              onTimeThreshold(newValue);
            }
          }
          
          return newValue;
        });
      }, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      // Arrêter le timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Réinitialiser si demandé
      if (onReset) {
        setElapsed(0);
        setShowWarning(false);
        thresholdReachedRef.current = false;
      }
    }
  }, [isActive, timeThreshold, warningThreshold, onTimeThreshold, onReset, showWarning]);
  
  // Formatage du temps (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Calculer le pourcentage pour la barre de progression
  const progressPercentage = Math.min((elapsed / timeThreshold) * 100, 100);
  
  // Déterminer la couleur selon le temps écoulé
  const getProgressColor = () => {
    if (elapsed >= timeThreshold) return 'bg-red-500';
    if (elapsed >= warningThreshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="response-timer">
      {/* Barre de progression */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
        <div 
          className={`h-full ${getProgressColor()} transition-all duration-200`} 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Affichage du temps */}
      <div className="flex justify-between text-xs">
        <span className={`${showWarning ? 'text-yellow-600 font-medium' : 'text-gray-500'}`}>
          Temps écoulé: {formatTime(elapsed)}
        </span>
        <span className="text-gray-500">
          Seuil: {formatTime(timeThreshold)}
        </span>
      </div>
      
      {/* Message d'avertissement */}
      {showWarning && (
        <div className={`mt-2 text-sm ${elapsed >= timeThreshold ? 'text-red-600' : 'text-yellow-600'}`}>
          {elapsed >= timeThreshold 
            ? "Suggestion de reformulation disponible" 
            : "N'hésitez pas à prendre votre temps pour réfléchir"}
        </div>
      )}
    </div>
  );
};

export default ResponseTimer;