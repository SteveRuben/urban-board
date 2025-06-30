// frontend/pages/candidate/coding/[token].tsx
import React, { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Code, 
  FileText, 
  Calendar,
  User,
  Timer,
  Trophy,
  ArrowRight,
  ExternalLink,
  Target,
  BarChart3
} from 'lucide-react';
import { CandidateExerciseService } from '@/services/candidate-exercise';
import { CandidateExerciseData, CandidateProgress } from '@/types/candidate-exercise';
import { NextPageWithLayout } from '@/types/page';
import Layout from '@/components/layout/layout';

interface ExerciseCardProps {
  exercise: any;
  exerciseProgress: ExerciseProgressInfo | null;
  onStartExercise: (exerciseId: string) => void;
}

interface ExerciseProgressInfo {
  attempted: boolean;
  completed: boolean;
  completionRate: number;
  totalSteps: number;
  completedSteps: number;
  totalChallenges: number;
  completedChallenges: number;
  stepsProgress: {[stepId: string]: any};
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
  exercise, 
  exerciseProgress, 
  onStartExercise 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLanguageIcon = (language: string) => {
    return language.toUpperCase();
  };

  const getProgressStatus = () => {
    if (!exerciseProgress) return 'not_started';
    if (exerciseProgress.completed) return 'completed';
    if (exerciseProgress.attempted) return 'in_progress';
    return 'not_started';
  };

  const status = getProgressStatus();

  return (
    <div className={`bg-white rounded-lg border-2 transition-all duration-300 hover:shadow-lg ${
      status === 'completed' ? 'border-green-200 bg-green-50' : 
      status === 'in_progress' ? 'border-blue-200 bg-blue-50' :
      'border-gray-200 hover:border-blue-300'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
              {status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {status === 'in_progress' && <Clock className="h-5 w-5 text-blue-600" />}
            </div>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{exercise.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
              {exercise.difficulty}
            </span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-mono">
              {getLanguageIcon(exercise.language)}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {exercise.challenges?.length || 0} challenge{exercise.challenges?.length > 1 ? 's' : ''}
          </div>
        </div>

        {exerciseProgress && exerciseProgress.attempted && (
          <div className="mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Progression</span>
                <span className="text-sm text-gray-600">
                  {exerciseProgress.completionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    exerciseProgress.completed ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${exerciseProgress.completionRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-3">
                <span>
                  Étapes: {exerciseProgress.completedSteps}/{exerciseProgress.totalSteps}
                </span>
                <span>
                  Challenges: {exerciseProgress.completedChallenges}/{exerciseProgress.totalChallenges}
                </span>
              </div>

              <div className="space-y-2">
                {exercise.challenges?.map((challenge: any, chalIndex: number) => {
                  const challengeStepsProgress = Object.values(exerciseProgress.stepsProgress || {}).filter((step: any) => 
                    step.challenge_id === challenge.id
                  );
                  const completedStepsInChallenge = challengeStepsProgress.filter((step: any) => step.is_completed).length;
                  const totalStepsInChallenge = challenge.step_count || 0;
                  
                  return (
                    <div key={challenge.id} className="flex items-center justify-between text-xs p-2 bg-white rounded border">
                      <span className="font-medium text-gray-700">{challenge.title}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          completedStepsInChallenge === totalStepsInChallenge && totalStepsInChallenge > 0
                            ? 'bg-green-100 text-green-700'
                            : completedStepsInChallenge > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {completedStepsInChallenge}/{totalStepsInChallenge}
                        </span>
                        {completedStepsInChallenge === totalStepsInChallenge && totalStepsInChallenge > 0 && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {exercise.challenges?.slice(0, 2).map((challenge: any, index: number) => (
            <div key={challenge.id} className="flex items-center text-sm text-gray-600">
              <FileText className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{challenge.title}</span>
              <span className="ml-auto text-xs text-gray-400">
                {challenge.step_count} étape{challenge.step_count > 1 ? 's' : ''}
              </span>
            </div>
          ))}
          {exercise.challenges?.length > 2 && (
            <div className="text-sm text-gray-500 italic">
              +{exercise.challenges.length - 2} autre{exercise.challenges.length - 2 > 1 ? 's' : ''} challenge{exercise.challenges.length - 2 > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <button
          onClick={() => onStartExercise(exercise.id)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            status === 'completed'
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : status === 'in_progress'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {status === 'completed' ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Revoir l'exercice
            </>
          ) : status === 'in_progress' ? (
            <>
              <ArrowRight className="h-4 w-4" />
              Continuer l'exercice
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Commencer l'exercice
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const CandidateCodingPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { token } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exerciseData, setExerciseData] = useState<CandidateExerciseData | null>(null);
  const [exercisesProgress, setExercisesProgress] = useState<{[exerciseId: string]: ExerciseProgressInfo}>({});
  const [sessionStarted, setSessionStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Timer pour mettre à jour le temps restant
  useEffect(() => {
    if (!exerciseData?.access_info?.time_remaining_minutes) return;

    setTimeRemaining(exerciseData.access_info.time_remaining_minutes);

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [exerciseData?.access_info?.time_remaining_minutes]);

  const calculateExerciseProgress = async (exercise: any): Promise<ExerciseProgressInfo> => {
    if (!token || typeof token !== 'string' || !exercise.challenges) {
      return {
        attempted: false,
        completed: false,
        completionRate: 0,
        totalSteps: 0,
        completedSteps: 0,
        totalChallenges: exercise.challenges?.length || 0,
        completedChallenges: 0,
        stepsProgress: {}
      };
    }

    let totalSteps = 0;
    let completedSteps = 0;
    let totalChallenges = exercise.challenges.length;
    let completedChallenges = 0;
    let attempted = false;
    const stepsProgress: {[stepId: string]: any} = {};

    try {
      console.log(`🔍 DEBUG: Calcul progression pour exercice ${exercise.id}`);
      
      // Pour chaque challenge de l'exercice
      for (const challenge of exercise.challenges) {
        try {
          // Récupérer les détails du challenge avec ses steps
          const challengeDetails = await CandidateExerciseService.getChallenge(token, challenge.id);
          
          if (challengeDetails && challengeDetails.steps) {
            let challengeCompletedSteps = 0;
            let challengeHasProgress = false;
            console.log(token)
            const progressPromises = challengeDetails.steps.map(async (step: any) => {
              try {
                const progressData = await CandidateExerciseService.loadProgress(token, challenge.id, step.id);
                return {
                  stepId: step.id,
                  progress: progressData
                };
              } catch (err) {
                console.log(`Pas de progression pour l'étape ${step.id}`);
                return {
                  stepId: step.id,
                  progress: null
                };
              }
            });

            const allProgress = await Promise.all(progressPromises);
            
            // Construire l'objet de progression comme dans la page challenge
            allProgress.forEach(({ stepId, progress }) => {
              totalSteps++;
              if (progress && progress.data) {
                attempted = true;
                challengeHasProgress = true;
                
                stepsProgress[stepId] = {
                  step_id: stepId,
                  challenge_id: challenge.id,
                  is_completed: progress.data.is_completed || false,
                  tests_passed: progress.data.tests_passed || 0,
                  tests_total: progress.data.tests_total || 0,
                  last_submission: progress.data.last_edited
                };

                if (progress.data.is_completed || (progress.data.code && progress.data.code.trim().length > 0)) {
                  completedSteps++;
                  challengeCompletedSteps++;
                }
              } else {
                stepsProgress[stepId] = {
                  step_id: stepId,
                  challenge_id: challenge.id,
                  is_completed: false,
                  tests_passed: 0,
                  tests_total: 0,
                  last_submission: null
                };
              }
            });
            
            // Challenge complété si tous ses steps sont complétés
            if (challengeCompletedSteps === challengeDetails.steps.length && challengeDetails.steps.length > 0) {
              completedChallenges++;
            }
          }
        } catch (challengeError) {
          console.log(`Challenge ${challenge.id} non accessible:`, challengeError);
          // Challenge non démarré, ajouter ses steps au total
          totalSteps += challenge.step_count || 0;
        }
      }

      console.log(`🔍 DEBUG: Exercice ${exercise.id} - Steps: ${completedSteps}/${totalSteps}, Challenges: ${completedChallenges}/${totalChallenges}`);

      const completionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      const completed = completedChallenges === totalChallenges && totalChallenges > 0;

      return {
        attempted,
        completed,
        completionRate,
        totalSteps,
        completedSteps,
        totalChallenges,
        completedChallenges,
        stepsProgress
      };
    } catch (error) {
      console.error('Erreur lors du calcul de progression:', error);
      return {
        attempted: false,
        completed: false,
        completionRate: 0,
        totalSteps: 0,
        completedSteps: 0,
        totalChallenges,
        completedChallenges: 0,
        stepsProgress: {}
      };
    }
  };

  // Charger la progression de tous les exercices
  const loadExercisesProgress = async () => {
    if (!exerciseData?.exercises || !token || typeof token !== 'string') return;

    console.log('🔍 DEBUG: Chargement progression des exercices...');
    
    const progressMap: {[exerciseId: string]: ExerciseProgressInfo} = {};
    
    // Traiter les exercices un par un
    for (const exercise of exerciseData.exercises) {
      try {
        const progress = await calculateExerciseProgress(exercise);
        progressMap[exercise.id] = progress;
        console.log(`🔍 DEBUG: Progression exercice ${exercise.id}:`, progress);
      } catch (error) {
        console.error(`Erreur progression exercice ${exercise.id}:`, error);
        progressMap[exercise.id] = {
          attempted: false,
          completed: false,
          completionRate: 0,
          totalSteps: 0,
          completedSteps: 0,
          totalChallenges: exercise.challenges?.length || 0,
          completedChallenges: 0,
          stepsProgress: {}
        };
      }
    }

    setExercisesProgress(progressMap);
    console.log('🔍 DEBUG: Progression globale chargée:', progressMap);
  };

  // Charger les données initiales
  useEffect(() => {
    if (!token || typeof token !== 'string') return;

    const loadExerciseData = async () => {
      try {
        setLoading(true);
        const data = await CandidateExerciseService.getCandidateExercises(token);
        setExerciseData(data);
        console.log('🔍 DEBUG: Données exercices chargées:', data);
        
        if (data.session.status === 'in_progress' || data.session.status === 'completed') {
          setSessionStarted(true);
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des exercices');
      } finally {
        setLoading(false);
      }
    };

    loadExerciseData();
  }, [token]);

  // Charger la progression après avoir chargé les données
  useEffect(() => {
    if (exerciseData && sessionStarted) {
      loadExercisesProgress();
    }
  }, [exerciseData, sessionStarted]);

  // Recharger la progression périodiquement
  useEffect(() => {
    if (!sessionStarted || !exerciseData) return;

    const progressTimer = setInterval(() => {
      loadExercisesProgress();
    }, 60000); // Toutes les minutes

    return () => clearInterval(progressTimer);
  }, [sessionStarted, exerciseData]);

  const handleStartSession = async () => {
    if (!token || typeof token !== 'string') return;

    try {
      await CandidateExerciseService.startCandidateSession(token);
      setSessionStarted(true);
      
      const updatedData = await CandidateExerciseService.getCandidateExercises(token);
      setExerciseData(updatedData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du démarrage de la session');
    }
  };

  const handleStartExercise = async (exerciseId: string) => {
    if (!token || typeof token !== 'string') return;

    try {
      router.push(`/candidate/coding/${token}/exercise/${exerciseId}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du démarrage de l\'exercice');
    }
  };

  const handleCompleteSession = async () => {
    if (!token || typeof token !== 'string') return;

    try {
      await CandidateExerciseService.completeSession(token);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la finalisation');
    }
  };

  // Calculer les statistiques globales
  const getGlobalStats = () => {
    const progressValues = Object.values(exercisesProgress);
    if (progressValues.length === 0) return { 
      completedExercises: 0, 
      totalExercises: 0, 
      globalCompletion: 0,
      totalSteps: 0,
      completedSteps: 0
    };

    const completedExercises = progressValues.filter(p => p.completed).length;
    const totalExercises = progressValues.length;
    const totalSteps = progressValues.reduce((sum, p) => sum + p.totalSteps, 0);
    const completedSteps = progressValues.reduce((sum, p) => sum + p.completedSteps, 0);
    
    const globalCompletion = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return { 
      completedExercises, 
      totalExercises, 
      globalCompletion,
      totalSteps,
      completedSteps
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de vos exercices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès impossible</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!exerciseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  const sessionStatus = CandidateExerciseService.getSessionStatus(
    exerciseData.session, 
    timeRemaining
  );

  const globalStats = getGlobalStats();

  return (
    <>
      <Head>
        <title>Exercices de coding - {exerciseData.session.position}</title>
        <meta name="description" content="Exercices de coding pour votre entretien" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Exercices de coding</h1>
                <p className="text-gray-600">{exerciseData.session.position}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Timer className="h-4 w-4" />
                  <span>Temps restant: {CandidateExerciseService.formatTimeRemaining(timeRemaining)}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  sessionStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                  sessionStatus.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  sessionStatus.status === 'expired' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {sessionStatus.message}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Informations de l'entretien */}
          {exerciseData.session.interview_info && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <Calendar className="h-6 w-6 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {exerciseData.session.interview_info.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-800">
                        {new Date(exerciseData.session.interview_info.scheduled_at).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-800">
                        Avec {exerciseData.session.interview_info.recruiter_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-800">
                        {exerciseData.exercises.length} exercice{exerciseData.exercises.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Barre de progression globale */}
          {sessionStarted && Object.keys(exercisesProgress).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Votre progression globale</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Trophy className="h-4 w-4" />
                    <span>{globalStats.completedSteps}/{globalStats.totalSteps} étapes</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {globalStats.globalCompletion}%
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${globalStats.globalCompletion}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Exercices terminés</div>
                    <div className="font-semibold text-gray-900">{globalStats.completedExercises}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Étapes complétées</div>
                    <div className="font-semibold text-gray-900">{globalStats.completedSteps}/{globalStats.totalSteps}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Progression moyenne</div>
                    <div className="font-semibold text-gray-900">{globalStats.globalCompletion}%</div>
                  </div>
                </div>
              </div>
              
              {globalStats.completedExercises === globalStats.totalExercises && globalStats.totalExercises > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Félicitations ! Vous avez terminé tous les exercices.</span>
                  </div>
                  <button
                    onClick={handleCompleteSession}
                    className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Finaliser ma session
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {!sessionStarted && sessionStatus.canStart && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                  <p>Vous disposez de <strong>{exerciseData.session.time_limit_minutes} minutes</strong> pour compléter les exercices.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                  <p>Chaque exercice contient plusieurs challenges avec des étapes progressives.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                  <p>Votre code est sauvegardé automatiquement. Vous pouvez tester votre solution avant de la soumettre.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                  <p>Prenez votre temps pour bien comprendre chaque problème avant de commencer à coder.</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleStartSession}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-lg font-medium"
                >
                  <Play className="h-5 w-5" />
                  Commencer les exercices
                </button>
              </div>
            </div>
          )}

          {/* Liste des exercices avec progression détaillée */}
          {(sessionStarted || exerciseData.session.status !== 'not_started') && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Vos exercices ({exerciseData.exercises.length})
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {exerciseData.exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    exerciseProgress={exercisesProgress[exercise.id] || null}
                    onStartExercise={handleStartExercise}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Messages d'état */}
          {!sessionStatus.canStart && sessionStatus.status !== 'completed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Session expirée</h3>
              <p className="text-red-700">
                Le temps imparti pour ces exercices est écoulé. 
                Veuillez contacter le recruteur si vous pensez qu'il y a une erreur.
              </p>
            </div>
          )}

          {sessionStatus.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">Session terminée</h3>
              <p className="text-green-700 mb-4">
                Merci d'avoir complété les exercices ! Vos résultats ont été enregistrés et seront examinés par le recruteur.
              </p>
              <div className="text-sm text-green-600">
                Score final: {exerciseData.session.total_score} points • 
                Étapes complétées: {globalStats.completedSteps}/{globalStats.totalSteps}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

CandidateCodingPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default CandidateCodingPage;