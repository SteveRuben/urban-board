import React, { useState, useEffect } from 'react';
import { Award, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';
import { ApplicationCVAnalysisService } from '@/services/application-cv-analysis-service';

interface SimpleCVScoreProps {
  applicationId: string;
  hasResume: boolean;
  compact?: boolean; 
}

export const SimpleCVScore: React.FC<SimpleCVScoreProps> = ({
  applicationId,
  hasResume,
  compact = false
}) => {
  const [score, setScore] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);

  useEffect(() => {
    // Vérifier si l'analyse existe déjà en cache
    const existingAnalysis = ApplicationCVAnalysisService.getApplicationAnalysis(applicationId);
    if (existingAnalysis) {
      setScore(existingAnalysis.match_score);
      setHasAnalysis(true);
    }
  }, [applicationId]);

  const handleAnalyze = async () => {
    if (!hasResume || analyzing) return;

    try {
      setAnalyzing(true);
      const analysis = await ApplicationCVAnalysisService.analyzeApplicationCV(applicationId);
      setScore(analysis.match_score);
      setHasAnalysis(true);
    } catch (error) {
      console.error('Erreur analyse:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!hasResume) {
    return (
      <div className={`flex items-center text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
        <AlertCircle className="h-4 w-4 mr-1" />
        Pas de CV
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className={`flex items-center text-blue-600 ${compact ? 'text-xs' : 'text-sm'}`}>
        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
        Analyse...
      </div>
    );
  }

  if (!hasAnalysis || score === null) {
    return (
      <button
        onClick={handleAnalyze}
        className={`flex items-center bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
        }`}
      >
        <BarChart3 className="h-4 w-4 mr-1" />
        Analyser CV
      </button>
    );
  }

  // Déterminer la couleur selon le score
  const getScoreStyle = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 65) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 35) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 65) return '👍';
    if (score >= 50) return '👌';
    if (score >= 35) return '⚠️';
    return '❌';
  };

  return (
    <div className={`flex items-center border rounded-md font-medium ${getScoreStyle(score)} ${
      compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
    }`}>
      <Award className="h-4 w-4 mr-1" />
      {score}% {getScoreIcon(score)}
    </div>
  );
};

export default SimpleCVScore;