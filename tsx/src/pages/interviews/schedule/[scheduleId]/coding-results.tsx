// frontend/pages/interviews/[id]/coding-results.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Code, 
  Trophy, 
  User,
  Calendar,
  Target,
  BarChart3,
  Download,
  Eye,
  AlertTriangle,
  FileText,
  TrendingUp,
  Activity,
  Timer,
  Award
} from 'lucide-react';
import { InterviewSchedulingService } from '@/services/interview-scheduling-service';
import { CandidateExerciseService } from '@/services/candidate-exercise';

// Types inspirés de candidateCodingPage
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

interface ChallengeProgressInfo {
  attempted: boolean;
  completed: boolean;
  totalSteps: number;
  completedSteps: number;
  totalTests: number;
  passedTests: number;
  stepsProgress: any[];
}

const ProgressBar: React.FC<{ value: number; max: number; color?: string }> = ({ 
  value, 
  max, 
  color = 'bg-blue-600' 
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const ScoreCard: React.FC<{ 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, subtitle, icon, color = 'text-blue-600' }) => {
  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${color} opacity-80`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const CodeViewer: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <span className="text-gray-400 text-xs font-medium">{language.toUpperCase()}</span>
        <button
          onClick={copyToClipboard}
          className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded"
        >
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto max-h-96">
        <pre className="text-sm text-gray-100 whitespace-pre-wrap">
          <code>{code || '// Aucun code soumis'}</code>
        </pre>
      </div>
    </div>
  );
};

const StepProgressDetail: React.FC<{
  stepProgress: any;
  stepIndex: number;
  onViewCode: (stepProgress: any) => void;
}> = ({ stepProgress, stepIndex, onViewCode }) => {
  const getStepStatus = () => {
    if (stepProgress.is_completed) return 'completed';
    if (stepProgress.tests_passed > 0 || (stepProgress.code && stepProgress.code.trim().length > 0)) return 'attempted';
    return 'not_started';
  };

  const status = getStepStatus();

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600 text-white border-green-600';
      case 'attempted': return 'bg-yellow-500 text-white border-yellow-500';
      default: return 'bg-gray-300 text-gray-600 border-gray-300';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 ${getStepColor(status)}`}>
          {status === 'completed' ? '✓' : stepIndex + 1}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">
            Étape {stepIndex + 1}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-4">
            <span className={`font-medium ${
              stepProgress.is_completed ? 'text-green-600' : 
              stepProgress.tests_passed > 0 ? 'text-yellow-600' : 'text-gray-500'
            }`}>
              {stepProgress.tests_passed || 0}/{stepProgress.tests_total || 0} tests
            </span>
            {stepProgress.last_submission && (
              <span className="text-gray-400">
                {new Date(stepProgress.last_submission).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {status === 'completed' && (
          <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle className="h-3 w-3" />
            <span className="text-xs font-medium">OK</span>
          </div>
        )}
        {status === 'attempted' && !stepProgress.is_completed && (
          <div className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
            <Clock className="h-3 w-3" />
            <span className="text-xs font-medium">En cours</span>
          </div>
        )}
        {stepProgress.code && stepProgress.code.trim().length > 0 && (
          <button
            onClick={() => onViewCode(stepProgress)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            <Eye className="h-3 w-3" />
            Code
          </button>
        )}
      </div>
    </div>
  );
};

const ChallengeResultCard: React.FC<{ 
  challenge: any;
  challengeProgress: ChallengeProgressInfo;
  onViewCode: (stepProgress: any) => void;
}> = ({ challenge, challengeProgress, onViewCode }) => {
  
  const getStatusColor = (attempted: boolean, completed: boolean) => {
    if (completed) return 'text-green-600';
    if (attempted) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getStatusIcon = (attempted: boolean, completed: boolean) => {
    if (completed) return <CheckCircle className="h-4 w-4" />;
    if (attempted) return <Clock className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  const getStatusLabel = (attempted: boolean, completed: boolean) => {
    if (completed) return 'Terminé';
    if (attempted) return 'En cours';
    return 'Non commencé';
  };

  return (
    <div className="ml-6 relative">
      {/* Ligne de connexion */}
      <div className="absolute -left-3 top-0 bottom-0 w-px bg-blue-300"></div>
      
      {/* Carte du challenge */}
      <div className="bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg border-l-4 border-blue-400 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h4 className="text-base font-semibold text-gray-900">{challenge.title}</h4>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  challengeProgress.completed ? 'bg-green-100 text-green-700' :
                  challengeProgress.attempted ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {getStatusIcon(challengeProgress.attempted, challengeProgress.completed)}
                  <span>{getStatusLabel(challengeProgress.attempted, challengeProgress.completed)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
              
              <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-md">
                <div className="text-center">
                  <div className="text-sm font-bold text-green-600">{challengeProgress.completedSteps}</div>
                  <div className="text-xs text-gray-600">Complétées</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-600">{challengeProgress.totalSteps}</div>
                  <div className="text-xs text-gray-600">Total étapes</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-purple-600">{challengeProgress.passedTests}/{challengeProgress.totalTests}</div>
                  <div className="text-xs text-gray-600">Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-orange-600">
                    {challengeProgress.totalTests > 0 ? Math.round((challengeProgress.passedTests / challengeProgress.totalTests) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Réussite</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="text-center p-2 bg-gray-50 border rounded">
              <div className="text-xs text-gray-600 mb-1">Progression des étapes</div>
              <div className="text-sm font-bold text-gray-900 mb-1">{challengeProgress.completedSteps}/{challengeProgress.totalSteps}</div>
              <ProgressBar 
                value={challengeProgress.completedSteps} 
                max={challengeProgress.totalSteps} 
                color="bg-green-600" 
              />
            </div>
            <div className="text-center p-2 bg-gray-50 border rounded">
              <div className="text-xs text-gray-600 mb-1">Réussite aux tests</div>
              <div className="text-sm font-bold text-gray-900 mb-1">{challengeProgress.passedTests}/{challengeProgress.totalTests}</div>
              <ProgressBar 
                value={challengeProgress.passedTests} 
                max={challengeProgress.totalTests} 
                color="bg-blue-600" 
              />
            </div>
          </div>

          {challengeProgress.stepsProgress.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Activity className="h-3 w-3" />
                Détail des étapes ({challengeProgress.stepsProgress.length})
              </h5>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {challengeProgress.stepsProgress.map((stepProgress: any, index: number) => (
                  <StepProgressDetail
                    key={stepProgress.step_id || index}
                    stepProgress={stepProgress}
                    stepIndex={index}
                    onViewCode={onViewCode}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ExerciseResultCard: React.FC<{
  exercise: any;
  exerciseProgress: ExerciseProgressInfo;
  challengesProgress: {[challengeId: string]: ChallengeProgressInfo};
  challenges: any[];
  onViewCode: (stepProgress: any) => void;
}> = ({ exercise, exerciseProgress, challengesProgress, challenges, onViewCode }) => {

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg">
      {/* En-tête de l'exercice - Plus proéminent */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Code className="h-6 w-6" />
              <h3 className="text-xl font-bold">{exercise.title}</h3>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  {exercise.language}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)} text-gray-800`}>
                  {exercise.difficulty}
                </span>
                {exerciseProgress.completed && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Terminé
                  </span>
                )}
              </div>
            </div>
            <p className="text-blue-100 mb-4">{exercise.description}</p>
          </div>
        </div>

        {/* Statistiques globales de l'exercice */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{exerciseProgress.totalChallenges}</div>
            <div className="text-xs text-blue-100">Challenge{exerciseProgress.totalChallenges > 1 ? 's' : ''}</div>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className={`text-2xl font-bold ${exerciseProgress.attempted ? 'text-green-300' : 'text-red-300'}`}>
              {exerciseProgress.attempted ? 'Oui' : 'Non'}
            </div>
            <div className="text-xs text-blue-100">Tenté</div>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className={`text-2xl font-bold ${exerciseProgress.completed ? 'text-green-300' : 'text-yellow-300'}`}>
              {exerciseProgress.completed ? 'Oui' : 'Non'}
            </div>
            <div className="text-xs text-blue-100">Complété</div>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{exerciseProgress.completedSteps}/{exerciseProgress.totalSteps}</div>
            <div className="text-xs text-blue-100">Étapes</div>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-300">{exerciseProgress.completionRate}%</div>
            <div className="text-xs text-blue-100">Progression</div>
          </div>
        </div>
      </div>

      {/* Section des challenges */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
          <h4 className="text-lg font-semibold text-gray-900">
            Challenges de cet exercice ({challenges.length})
          </h4>
        </div>
        
        {challenges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Aucun challenge disponible pour cet exercice</p>
          </div>
        ) : (
          <div className="space-y-6">
            {challenges.map((challenge: any, index: number) => {
              const challengeProgress = challengesProgress[challenge.id];
              if (!challengeProgress) return null;

              return (
                <div key={challenge.id} className="relative">
                  {/* Indicateur visuel de numérotation */}
                  <div className="absolute -left-2 top-6 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">
                    {index + 1}
                  </div>
                  <ChallengeResultCard
                    challenge={challenge}
                    challengeProgress={challengeProgress}
                    onViewCode={onViewCode}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const InterviewCodingResultsPage = () => {
  const router = useRouter();
  const { scheduleId, token } = router.query;
  const id = scheduleId;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [selectedCode, setSelectedCode] = useState<any>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  
  // États pour la progression détaillée
  const [exercisesProgress, setExercisesProgress] = useState<{[exerciseId: string]: ExerciseProgressInfo}>({});
  const [challengesProgress, setChallengesProgress] = useState<{[challengeId: string]: ChallengeProgressInfo}>({});
  const [exercisesChallenges, setExercisesChallenges] = useState<{[exerciseId: string]: any[]}>({});

  // Fonction pour calculer la progression détaillée à partir des results.detailed_results
  const calculateDetailedProgress = async (detailedResults: any[], candidateToken: string) => {
    console.log('🔍 DEBUG: Calcul progression détaillée pour:', detailedResults);
    
    const exercisesProgressMap: {[exerciseId: string]: ExerciseProgressInfo} = {};
    const challengesProgressMap: {[challengeId: string]: ChallengeProgressInfo} = {};
    const exercisesChallengesMap: {[exerciseId: string]: any[]} = {};

    for (const exerciseResult of detailedResults) {
      const exercise = exerciseResult.exercise;
      console.log('🔍 DEBUG: Traitement exercice:', exercise);

      let totalSteps = 0;
      let completedSteps = 0;
      let totalChallenges = 0;
      let completedChallenges = 0;
      let attempted = false;
      const stepsProgress: {[stepId: string]: any} = {};
      const challenges: any[] = [];

      try {
        // Récupérer tous les challenges de l'exercice
        const exerciseDetails = await CandidateExerciseService.getCandidateExercises(candidateToken);
        console.log('🔍 DEBUG: Détails exercice depuis candidate service:', exerciseDetails);
        
        // Trouver l'exercice correspondant
        const matchingExercise = exerciseDetails.exercises?.find((ex: any) => ex.id === exercise.id);
        if (matchingExercise && matchingExercise.challenges) {
          challenges.push(...matchingExercise.challenges);
          totalChallenges = matchingExercise.challenges.length;

          // Pour chaque challenge
          for (const challenge of matchingExercise.challenges) {
            try {
              const challengeDetails = await CandidateExerciseService.getChallenge(candidateToken, challenge.id);
              console.log('🔍 DEBUG: Détails challenge:', challengeDetails);
              
              if (challengeDetails && challengeDetails.steps) {
                let challengeCompletedSteps = 0;
                let challengeTotalTests = 0;
                let challengePassedTests = 0;
                const challengeStepsProgress: any[] = [];

                // Pour chaque step du challenge
                for (const step of challengeDetails.steps) {
                  totalSteps++;
                  try {
                    const progressData = await CandidateExerciseService.loadProgress(candidateToken, challenge.id, step.id);
                    console.log('🔍 DEBUG: Progression step:', progressData);
                    
                    const stepProgressInfo = {
                      step_id: step.id,
                      challenge_id: challenge.id,
                      is_completed: progressData?.is_completed || false,
                      tests_passed: progressData?.tests_passed || 0,
                      tests_total: progressData?.tests_total || 0,
                      last_submission: progressData?.last_edited || null,
                      code: progressData?.code || ''
                    };

                    challengeTotalTests += stepProgressInfo.tests_total;
                    challengePassedTests += stepProgressInfo.tests_passed;
                    challengeStepsProgress.push(stepProgressInfo);

                    if (progressData && (progressData.tests_passed > 0 || progressData.code?.trim().length > 0)) {
                      attempted = true;
                    }

                    if (progressData?.is_completed) {
                      completedSteps++;
                      challengeCompletedSteps++;
                    }

                    stepsProgress[step.id] = stepProgressInfo;
                  } catch (stepError) {
                    console.log(`Step ${step.id} sans progression:`, stepError);
                    // Step sans progression
                    const stepProgressInfo = {
                      step_id: step.id,
                      challenge_id: challenge.id,
                      is_completed: false,
                      tests_passed: 0,
                      tests_total: 0,
                      last_submission: null,
                      code: ''
                    };
                    challengeStepsProgress.push(stepProgressInfo);
                    stepsProgress[step.id] = stepProgressInfo;
                  }
                }

                // Challenge complété si tous ses steps sont complétés
                if (challengeCompletedSteps === challengeDetails.steps.length && challengeDetails.steps.length > 0) {
                  completedChallenges++;
                }

                // Stocker la progression du challenge
                challengesProgressMap[challenge.id] = {
                  attempted: challengeStepsProgress.some(step => step.tests_passed > 0 || step.code.trim().length > 0),
                  completed: challengeCompletedSteps === challengeDetails.steps.length && challengeDetails.steps.length > 0,
                  totalSteps: challengeDetails.steps.length,
                  completedSteps: challengeCompletedSteps,
                  totalTests: challengeTotalTests,
                  passedTests: challengePassedTests,
                  stepsProgress: challengeStepsProgress
                };
              }
            } catch (challengeError) {
              console.log(`Challenge ${challenge.id} non accessible:`, challengeError);
              // Challenge sans progression
              challengesProgressMap[challenge.id] = {
                attempted: false,
                completed: false,
                totalSteps: challenge.step_count || 0,
                completedSteps: 0,
                totalTests: 0,
                passedTests: 0,
                stepsProgress: []
              };
            }
          }
        }
      } catch (exerciseError) {
        console.error(`Erreur lors du traitement de l'exercice ${exercise.id}:`, exerciseError);
      }

      const completionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      const completed = completedChallenges === totalChallenges && totalChallenges > 0;

      exercisesProgressMap[exercise.id] = {
        attempted,
        completed,
        completionRate,
        totalSteps,
        completedSteps,
        totalChallenges,
        completedChallenges,
        stepsProgress
      };

      exercisesChallengesMap[exercise.id] = challenges;
    }

    setExercisesProgress(exercisesProgressMap);
    setChallengesProgress(challengesProgressMap);
    setExercisesChallenges(exercisesChallengesMap);
    console.log('🔍 DEBUG: Progression calculée:', { exercisesProgressMap, challengesProgressMap, exercisesChallengesMap });
  };

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const loadResults = async () => {
      try {
        setLoading(true);
        console.log('🔍 DEBUG: Chargement des résultats pour:', id);
        
        // Charger les résultats de base
        const data = await InterviewSchedulingService.getCandidateExerciseResults(id);
        console.log('🔍 DEBUG: Résultats reçus:', data);
        
        setResults(data);

        // Si on a un token candidat, calculer la progression détaillée
        if (token && typeof token === 'string') {
          console.log('🔍 DEBUG: Token candidat trouvé, calcul progression détaillée...', token);
          await calculateDetailedProgress(data.detailed_results || [], token);
        } else {
          console.log('🔍 DEBUG: Pas de token candidat, utilisation des données basiques');
        }
        
      } catch (err: any) {
        console.error('❌ Erreur chargement résultats:', err);
        setError(err.message || 'Erreur lors du chargement des résultats');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [id, token]);

  const handleViewCode = (stepProgress: any) => {
    setSelectedCode(stepProgress);
    setShowCodeModal(true);
  };

  const handleDownloadResults = () => {
    if (!results) return;
    
    // Calcul des vraies statistiques depuis les données détaillées
    let globalTotalSteps = 0;
    let globalCompletedSteps = 0;
    let globalTotalTests = 0;
    let globalPassedTests = 0;

    Object.values(exercisesProgress).forEach((exercise: ExerciseProgressInfo) => {
      globalTotalSteps += exercise.totalSteps;
      globalCompletedSteps += exercise.completedSteps;
    });

    Object.values(challengesProgress).forEach((challenge: ChallengeProgressInfo) => {
      globalTotalTests += challenge.totalTests;
      globalPassedTests += challenge.passedTests;
    });

    const report = {
      metadata: {
        generated_at: new Date().toISOString(),
        candidate: results.user_exercise.candidate_name,
        position: results.user_exercise.position,
        interview_date: results.user_exercise.interview_info?.scheduled_at
      },
      summary: {
        real_total_score: globalTotalSteps > 0 ? Math.round((globalCompletedSteps / globalTotalSteps) * 100) : 0,
        exercises_completed: Object.values(exercisesProgress).filter(e => e.completed).length,
        total_exercises: Object.values(exercisesProgress).length,
        total_steps: globalTotalSteps,
        completed_steps: globalCompletedSteps,
        total_tests: globalTotalTests,
        passed_tests: globalPassedTests,
        time_limit: results.user_exercise.time_limit_minutes,
        session_status: results.user_exercise.status
      },
      detailed_progress: {
        exercises: exercisesProgress,
        challenges: challengesProgress
      },
      original_results: results
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coding-results-${results.user_exercise.candidate_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des résultats...</p>
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
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucun résultat</h2>
          <p className="text-gray-600">Aucun exercice de coding n'a été assigné à cet entretien.</p>
        </div>
      </div>
    );
  }

  // Calcul des statistiques globales à partir des données détaillées
  let globalTotalSteps = 0;
  let globalCompletedSteps = 0;
  let globalTotalTests = 0;
  let globalPassedTests = 0;

  Object.values(exercisesProgress).forEach((exercise: ExerciseProgressInfo) => {
    globalTotalSteps += exercise.totalSteps;
    globalCompletedSteps += exercise.completedSteps;
  });

  Object.values(challengesProgress).forEach((challenge: ChallengeProgressInfo) => {
    globalTotalTests += challenge.totalTests;
    globalPassedTests += challenge.passedTests;
  });

  const realOverallScore = globalTotalSteps > 0 ? Math.round((globalCompletedSteps / globalTotalSteps) * 100) : 0;

  return (
    <>
      <Head>
        <title>Résultats coding - {results.user_exercise.candidate_name}</title>
        <meta name="description" content="Résultats des exercices de coding du candidat" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Retour à l'entretien</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Résultats des exercices de coding</h1>
                  <p className="text-sm text-gray-600">{results.user_exercise.candidate_name}</p>
                </div>
              </div>
              <button
                onClick={handleDownloadResults}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Télécharger le rapport
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Informations du candidat */}
          <div className="bg-white rounded-lg border p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Candidat</p>
                  <p className="font-semibold text-gray-900">{results.user_exercise.candidate_name}</p>
                  <p className="text-sm text-gray-500">{results.user_exercise.candidate_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Poste</p>
                  <p className="font-semibold text-gray-900">{results.user_exercise.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Entretien</p>
                  <p className="font-semibold text-gray-900">{results.user_exercise.interview_info?.title || 'Entretien coding'}</p>
                  {results.user_exercise.interview_info?.scheduled_at && (
                    <p className="text-sm text-gray-500">
                      {new Date(results.user_exercise.interview_info.scheduled_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <p className={`font-semibold capitalize ${
                    results.user_exercise.status === 'completed' ? 'text-green-600' : 
                    results.user_exercise.status === 'in_progress' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {results.user_exercise.status.replace('_', ' ')}
                  </p>
                  {results.user_exercise.completed_at && (
                    <p className="text-sm text-gray-500">
                      Terminé le {new Date(results.user_exercise.completed_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Métriques globales avec vraies données */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <ScoreCard
              title="Score global réel"
              value={`${realOverallScore}%`}
              subtitle={`${globalCompletedSteps}/${globalTotalSteps} étapes`}
              icon={<Trophy className="h-6 w-6" />}
              color={realOverallScore >= 80 ? 'text-green-600' : realOverallScore >= 60 ? 'text-yellow-600' : 'text-red-600'}
            />
            <ScoreCard
              title="Tests réussis"
              value={`${globalPassedTests}/${globalTotalTests}`}
              subtitle={`${globalTotalTests > 0 ? Math.round((globalPassedTests / globalTotalTests) * 100) : 0}% de réussite`}
              icon={<BarChart3 className="h-6 w-6" />}
              color="text-blue-600"
            />
            <ScoreCard
              title="Temps alloué"
              value={`${results.user_exercise.time_limit_minutes}min`}
              subtitle="Limite de temps"
              icon={<Timer className="h-4 w-4" />}
              color="text-purple-600"
            />
            <ScoreCard
              title="Exercices"
              value={results.detailed_results?.length || 0}
              subtitle="Exercices assignés"
              icon={<Code className="h-6 w-6" />}
              color="text-orange-600"
            />
          </div>

          {/* Résultats détaillés par exercice */}
          <div className="space-y-12">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Résultats détaillés par exercice</h2>
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {results.detailed_results?.length || 0} exercice{(results.detailed_results?.length || 0) > 1 ? 's' : ''}
              </span>
            </div>
            
            {results.detailed_results?.map((exerciseResult: any, exerciseIndex: number) => {
              const exercise = exerciseResult.exercise;
              const exerciseProgress = exercisesProgress[exercise.id];
              const challenges = exercisesChallenges[exercise.id] || [];
              
              if (!exerciseProgress) return null;

              return (
                <div key={exercise.id} className="relative">
                  {/* Numéro d'exercice */}
                  <div className="absolute -left-6 top-6 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg z-10">
                    {exerciseIndex + 1}
                  </div>
                  
                  <ExerciseResultCard
                    exercise={exercise}
                    exerciseProgress={exerciseProgress}
                    challengesProgress={challengesProgress}
                    challenges={challenges}
                    onViewCode={handleViewCode}
                  />
                </div>
              );
            })}
            
            {(!results.detailed_results || results.detailed_results.length === 0) && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun exercice trouvé</h3>
                <p className="text-gray-600">Il n'y a aucun exercice de coding assigné à cet entretien.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de visualisation du code */}
      {showCodeModal && selectedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Code soumis - Étape {selectedCode.step_id}
              </h3>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Tests réussis: {selectedCode.tests_passed}/{selectedCode.tests_total}</span>
                  <span>
                    Dernière modification: {
                      selectedCode.last_submission ? 
                      new Date(selectedCode.last_submission).toLocaleString('fr-FR') : 
                      'Non modifié'
                    }
                  </span>
                </div>
                <ProgressBar 
                  value={selectedCode.tests_passed} 
                  max={selectedCode.tests_total} 
                  color={selectedCode.is_completed ? 'bg-green-600' : 'bg-yellow-600'}
                />
              </div>
              <CodeViewer code={selectedCode.code} language="javascript" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

InterviewCodingResultsPage.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
export default InterviewCodingResultsPage;