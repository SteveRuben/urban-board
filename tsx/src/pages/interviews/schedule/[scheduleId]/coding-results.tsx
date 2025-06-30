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

// ✅ CORRECTION: Composant inspiré de StepProgressIndicator de la page challenge
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
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-sm transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${getStepColor(status)}`}>
          {status === 'completed' ? '✓' : stepIndex + 1}
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Étape {stepIndex + 1}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <span className={`font-medium ${
              stepProgress.is_completed ? 'text-green-600' : 
              stepProgress.tests_passed > 0 ? 'text-yellow-600' : 'text-gray-500'
            }`}>
              {stepProgress.tests_passed}/{stepProgress.tests_total} tests réussis
            </span>
            {stepProgress.tests_total > 0 && (
              <span className="ml-2 text-gray-400">
                ({Math.round((stepProgress.tests_passed / stepProgress.tests_total) * 100)}%)
              </span>
            )}
          </div>
          {stepProgress.last_edited && (
            <div className="text-xs text-gray-400 mt-1">
              Dernière modification: {new Date(stepProgress.last_edited).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {status === 'completed' && (
          <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle className="h-3 w-3" />
            <span className="text-xs font-medium">Complète</span>
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
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            <Eye className="h-3 w-3" />
            Voir le code
          </button>
        )}
      </div>
    </div>
  );
};

const ChallengeResultCard: React.FC<{ 
  challengeResult: any;
  onViewCode: (stepProgress: any) => void;
}> = ({ challengeResult, onViewCode }) => {
  const { challenge, user_challenge, steps_progress } = challengeResult;
  
  // ✅ CORRECTION: Calculs précis basés sur les vraies données
  const completedSteps = steps_progress.filter((step: any) => step.is_completed).length;
  const attemptedSteps = steps_progress.filter((step: any) => 
    step.is_completed || step.tests_passed > 0 || (step.code && step.code.trim().length > 0)
  ).length;
  const totalTests = steps_progress.reduce((sum: number, step: any) => sum + (step.tests_total || 0), 0);
  const passedTests = steps_progress.reduce((sum: number, step: any) => sum + (step.tests_passed || 0), 0);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'not_started': return 'Non commencé';
      default: return status;
    }
  };

  // ✅ CORRECTION: Déterminer le vrai statut basé sur la progression des steps
  const actualStatus = completedSteps === steps_progress.length && steps_progress.length > 0 ? 'completed' :
                      attemptedSteps > 0 ? 'in_progress' : 'not_started';

  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h4 className="text-lg font-semibold text-gray-900">{challenge.title}</h4>
            <div className={`flex items-center gap-1 text-sm font-medium ${getStatusColor(actualStatus)}`}>
              {getStatusIcon(actualStatus)}
              <span>{getStatusLabel(actualStatus)}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
          
          {/* ✅ CORRECTION: Affichage des statistiques réelles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{completedSteps}</div>
              <div className="text-xs text-gray-600">Étapes terminées</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{attemptedSteps}</div>
              <div className="text-xs text-gray-600">Étapes tentées</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{passedTests}/{totalTests}</div>
              <div className="text-xs text-gray-600">Tests réussis</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-600">Taux de réussite</div>
            </div>
          </div>
        </div>
        
        <div className="text-right text-sm text-gray-500 ml-4">
          <div className="mb-2">
            <span className="font-medium">{user_challenge.attempt_count || 0}</span> tentative{(user_challenge.attempt_count || 0) > 1 ? 's' : ''}
          </div>
          {user_challenge.started_at && (
            <div className="text-xs mb-1">
              Commencé: {new Date(user_challenge.started_at).toLocaleDateString('fr-FR')}
            </div>
          )}
          {user_challenge.completed_at && (
            <div className="text-xs">
              Terminé: {new Date(user_challenge.completed_at).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
      </div>

      {/* ✅ CORRECTION: Barres de progression réelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-white border rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Progression des étapes</div>
          <div className="text-lg font-bold text-gray-900 mb-2">{completedSteps}/{steps_progress.length}</div>
          <ProgressBar 
            value={completedSteps} 
            max={steps_progress.length} 
            color="bg-green-600" 
          />
        </div>
        <div className="text-center p-3 bg-white border rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Réussite aux tests</div>
          <div className="text-lg font-bold text-gray-900 mb-2">{passedTests}/{totalTests}</div>
          <ProgressBar 
            value={passedTests} 
            max={totalTests} 
            color="bg-blue-600" 
          />
        </div>
      </div>

      {/* ✅ CORRECTION: Détail des étapes inspiré de la page challenge */}
      {steps_progress.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Progression détaillée ({steps_progress.length} étapes)
          </h5>
          <div className="space-y-3">
            {steps_progress.map((stepProgress: any, index: number) => (
              <StepProgressDetail
                key={stepProgress.id || index}
                stepProgress={stepProgress}
                stepIndex={index}
                onViewCode={onViewCode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ExerciseResultCard: React.FC<{
  exerciseResult: any;
  onViewCode: (stepProgress: any) => void;
}> = ({ exerciseResult, onViewCode }) => {
  const { exercise, challenges_results } = exerciseResult;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ✅ CORRECTION: Calculs précis depuis les vraies données
  const totalChallenges = challenges_results.length;
  let totalSteps = 0;
  let completedSteps = 0;
  let attemptedSteps = 0;
  let completedChallenges = 0;

  challenges_results.forEach((challengeResult: any) => {
    const { steps_progress } = challengeResult;
    totalSteps += steps_progress.length;
    
    const challengeCompletedSteps = steps_progress.filter((step: any) => step.is_completed).length;
    const challengeAttemptedSteps = steps_progress.filter((step: any) => 
      step.is_completed || step.tests_passed > 0 || (step.code && step.code.trim().length > 0)
    ).length;
    
    completedSteps += challengeCompletedSteps;
    attemptedSteps += challengeAttemptedSteps;
    
    // Challenge complété si toutes ses étapes sont complétées
    if (challengeCompletedSteps === steps_progress.length && steps_progress.length > 0) {
      completedChallenges++;
    }
  });

  const exerciseCompleted = completedChallenges === totalChallenges && totalChallenges > 0;
  const exerciseAttempted = attemptedSteps > 0;
  const completionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* En-tête de l'exercice */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-semibold text-gray-900">{exercise.title}</h3>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {exercise.language}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                  {exercise.difficulty}
                </span>
                {exerciseCompleted && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Terminé
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-600 mb-4">{exercise.description}</p>
          </div>
        </div>

        {/* ✅ CORRECTION: Statistiques de l'exercice basées sur les vraies données */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{totalChallenges}</div>
            <div className="text-xs text-gray-600">Challenge{totalChallenges > 1 ? 's' : ''}</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${exerciseAttempted ? 'text-blue-600' : 'text-gray-400'}`}>
              {exerciseAttempted ? 'Oui' : 'Non'}
            </div>
            <div className="text-xs text-gray-600">Tenté</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${exerciseCompleted ? 'text-green-600' : 'text-gray-400'}`}>
              {exerciseCompleted ? 'Oui' : 'Non'}
            </div>
            <div className="text-xs text-gray-600">Complété</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{completedSteps}/{totalSteps}</div>
            <div className="text-xs text-gray-600">Étapes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{completionRate}%</div>
            <div className="text-xs text-gray-600">Progression</div>
          </div>
        </div>
      </div>

      {/* Challenges de l'exercice */}
      <div className="space-y-4">
        {challenges_results.map((challengeResult: any) => (
          <ChallengeResultCard
            key={challengeResult.challenge.id}
            challengeResult={challengeResult}
            onViewCode={onViewCode}
          />
        ))}
      </div>
    </div>
  );
};

const InterviewCodingResultsPage = () => {
  const router = useRouter();
  const { scheduleId } = router.query;
  const id = scheduleId;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [selectedCode, setSelectedCode] = useState<any>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const loadResults = async () => {
      try {
        setLoading(true);
        console.log('🔍 DEBUG: Chargement des résultats pour:', id);
        
        const data = await InterviewSchedulingService.getCandidateExerciseResults(id);
        console.log('🔍 DEBUG: Résultats reçus:', data);
        
        setResults(data);
      } catch (err: any) {
        console.error('❌ Erreur chargement résultats:', err);
        setError(err.message || 'Erreur lors du chargement des résultats');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [id]);

  const handleViewCode = (stepProgress: any) => {
    setSelectedCode(stepProgress);
    setShowCodeModal(true);
  };

  const handleDownloadResults = () => {
    if (!results) return;
    
    // ✅ CORRECTION: Rapport avec vraies statistiques
    const report = {
      metadata: {
        generated_at: new Date().toISOString(),
        candidate: results.user_exercise.candidate_name,
        position: results.user_exercise.position,
        interview_date: results.user_exercise.interview_info?.scheduled_at
      },
      summary: {
        total_score: results.user_exercise.total_score,
        exercises_completed: results.user_exercise.exercises_completed,
        total_exercises: results.user_exercise.total_exercises,
        completion_rate: Math.round((results.user_exercise.exercises_completed / results.user_exercise.total_exercises) * 100),
        time_limit: results.user_exercise.time_limit_minutes,
        session_status: results.user_exercise.status
      },
      detailed_statistics: results.detailed_results.map((exerciseResult: any) => {
        let totalSteps = 0;
        let completedSteps = 0;
        let totalTests = 0;
        let passedTests = 0;

        exerciseResult.challenges_results.forEach((challengeResult: any) => {
          totalSteps += challengeResult.steps_progress.length;
          completedSteps += challengeResult.steps_progress.filter((step: any) => step.is_completed).length;
          totalTests += challengeResult.steps_progress.reduce((sum: number, step: any) => sum + (step.tests_total || 0), 0);
          passedTests += challengeResult.steps_progress.reduce((sum: number, step: any) => sum + (step.tests_passed || 0), 0);
        });

        return {
          exercise: exerciseResult.exercise.title,
          completed_steps: completedSteps,
          total_steps: totalSteps,
          passed_tests: passedTests,
          total_tests: totalTests,
          completion_rate: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
          test_success_rate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
        };
      }),
      detailed_results: results.detailed_results
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

  // ✅ CORRECTION: Calcul du score global basé sur les vraies données
  let globalTotalSteps = 0;
  let globalCompletedSteps = 0;
  let globalTotalTests = 0;
  let globalPassedTests = 0;

  results.detailed_results?.forEach((exerciseResult: any) => {
    exerciseResult.challenges_results.forEach((challengeResult: any) => {
      globalTotalSteps += challengeResult.steps_progress.length;
      globalCompletedSteps += challengeResult.steps_progress.filter((step: any) => step.is_completed).length;
      globalTotalTests += challengeResult.steps_progress.reduce((sum: number, step: any) => sum + (step.tests_total || 0), 0);
      globalPassedTests += challengeResult.steps_progress.reduce((sum: number, step: any) => sum + (step.tests_passed || 0), 0);
    });
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

          {/* ✅ CORRECTION: Métriques globales avec vraies données */}
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
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Résultats détaillés</h2>
            
            {results.detailed_results && results.detailed_results.map((exerciseResult: any, index: number) => (
              <ExerciseResultCard
                key={exerciseResult.exercise.id}
                exerciseResult={exerciseResult}
                onViewCode={handleViewCode}
              />
            ))}
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
                      selectedCode.last_edited ? 
                      new Date(selectedCode.last_edited).toLocaleString('fr-FR') : 
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
              <CodeViewer code={selectedCode.code} language={selectedCode.language} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

InterviewCodingResultsPage.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
export default InterviewCodingResultsPage;