// frontend/pages/candidate/coding/[token]/exercise/[exerciseId].tsx
"use client"
import React, { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Clock, 
  Code, 
  FileText, 
  Trophy,
  AlertTriangle,
  ChevronRight,
  Target,
  Layout
} from 'lucide-react';
import CandidateExerciseService from '@/services/candidate-exercise';
import { NextPage } from 'next';
import { NextPageWithLayout } from '@/types/page';

interface Challenge {
  id: string;
  title: string;
  description: string;
  step_count: number;
  status?: 'not_started' | 'in_progress' | 'completed';
}

interface Exercise {
  id: string;
  title: string;
  description?: string;
  language: string;
  difficulty: string;
  challenges: Challenge[];
}

interface ChallengeCardProps {
  challenge: Challenge;
  exerciseId: string;
  accessToken: string;
  onStartChallenge: (challengeId: string) => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
  challenge, 
  exerciseId, 
  accessToken, 
  onStartChallenge 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'in_progress': return 'bg-blue-50 border-blue-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />;
      default: return <Play className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      default: return 'Commencer';
    }
  };

  return (
    <div className={`rounded-lg border-2 p-6 transition-all duration-300 hover:shadow-lg ${getStatusColor(challenge.status || 'not_started')}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{challenge.title}</h3>
            {getStatusIcon(challenge.status || 'not_started')}
          </div>
          <p className="text-gray-600 text-sm mb-3">{challenge.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText className="h-4 w-4" />
          <span>{challenge.step_count} étape{challenge.step_count > 1 ? 's' : ''}</span>
        </div>
        <div className="text-sm font-medium text-gray-600">
          {getStatusText(challenge.status || 'not_started')}
        </div>
      </div>

      <button
        onClick={() => onStartChallenge(challenge.id)}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors ${
          challenge.status === 'completed'
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : challenge.status === 'in_progress'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-600 text-white hover:bg-gray-700'
        }`}
      >
        {challenge.status === 'completed' ? (
          <>
            <CheckCircle className="h-4 w-4" />
            Revoir ma solution
          </>
        ) : challenge.status === 'in_progress' ? (
          <>
            <Clock className="h-4 w-4" />
            Continuer
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Commencer le challenge
          </>
        )}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

const CandidateExerciseDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { token, exerciseId } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Charger les données de l'exercice
  useEffect(() => {
    
    if (!token || !exerciseId || typeof token !== 'string' || typeof exerciseId !== 'string') return;

    const loadExerciseDetails = async () => {
      try {
        setLoading(true);
        
        // Charger les informations de session pour vérifier l'accès
        const sessionData = await CandidateExerciseService.getCandidateExercises(token);
        setSessionInfo(sessionData.session);
        setTimeRemaining(sessionData.access_info.time_remaining_minutes);
        
        // Vérifier que l'exercice est bien assigné
        if (!sessionData.session.exercise_ids.includes(exerciseId)) {
          throw new Error('Cet exercice n\'est pas assigné à votre session');
        }
        
        // Trouver l'exercice dans les données de session
        const exerciseData = sessionData.exercises.find(ex => ex.id === exerciseId);
        if (!exerciseData) {
          throw new Error('Exercice non trouvé');
        }
        
        setExercise(exerciseData);
        
        // Charger les challenges de cet exercice
        const challengesData = await CandidateExerciseService.getExerciseChallenges(token, exerciseId.toString()!);
        setChallenges(challengesData);
        
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement de l\'exercice');
      } finally {
        setLoading(false);
      }
    };

    loadExerciseDetails();
  }, [token, exerciseId]);

  // Timer pour le temps restant
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/candidate/coding/${token}`);
          return 0;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [timeRemaining, token, router]);

  const handleStartChallenge = async (challengeId: string) => {
    if (!token || typeof token !== 'string') return;

    try {
      // Démarrer le challenge
      await CandidateExerciseService.startChallenge(token, challengeId);
      
      // Rediriger vers la page du challenge
      router.push(`/candidate/coding/${token}/challenge/${challengeId}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du démarrage du challenge');
    }
  };

  const handleGoBack = () => {
    router.push(`/candidate/coding/${token}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'exercice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleGoBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retour aux exercices
          </button>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Exercice non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{exercise.title} - Exercices de coding</title>
        <meta name="description" content={exercise.description} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Retour aux exercices</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{exercise.title}</h1>
                  <p className="text-sm text-gray-600">{exercise.language} • {exercise.difficulty}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Temps restant: {CandidateExerciseService.formatTimeRemaining(timeRemaining)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Informations de l'exercice */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Code className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{exercise.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                        {exercise.difficulty}
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-mono">
                        {exercise.language.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{exercise.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>{challenges.length} challenge{challenges.length > 1 ? 's' : ''} disponible{challenges.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>Progressif par étapes</span>
              </div>
            </div>
          </div>

          {/* Avertissement temps restant */}
          {timeRemaining < 60 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  Attention ! Il vous reste moins d'une heure ({CandidateExerciseService.formatTimeRemaining(timeRemaining)})
                </span>
              </div>
            </div>
          )}

          {/* Liste des challenges */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Challenges de cet exercice
            </h3>
            
            {challenges.length === 0 ? (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun challenge disponible</h4>
                <p className="text-gray-600">
                  Cet exercice ne contient pas encore de challenges. 
                  Veuillez contacter l'équipe technique.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {challenges.map((challenge, index) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    exerciseId={exercise.id}
                    accessToken={token as string}
                    onStartChallenge={handleStartChallenge}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Conseils */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">💡 Conseils pour réussir cet exercice</h4>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Lisez attentivement chaque énoncé avant de commencer à coder</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Testez votre code avec les exemples fournis avant de soumettre</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>N'hésitez pas à commenter votre code pour expliquer votre raisonnement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Une solution qui fonctionne vaut mieux qu'une solution parfaite inachevée</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};
CandidateExerciseDetailPage.getLayout = (page: ReactElement) => page;
export default CandidateExerciseDetailPage;