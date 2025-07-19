"use client"

import type React from "react"
import { useState, useEffect, useCallback, ReactElement } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import {
  ArrowLeft,
  Play,
  Send,
  Save,
  CheckCircle,
  XCircle,
  Clock,
  Code,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  BookOpen,
  Target,
  Zap,
  Trophy,
  Info,
  Lightbulb,
  Terminal,
  Copy,
  Check,
  Award,
} from "lucide-react"
import { CandidateExerciseService } from "@/services/candidate-exercise"
import type { Challenge, Exercise, ExerciseWithChallenges } from "@/types/coding-plateform"
import CodingPlatformService from "@/services/coding-platform-service"
import dynamic from "next/dynamic"
import type { NextPageWithLayout } from "@/types/page"

const getMonacoLanguage = (platformLanguage: string): string => {
  const languageMap: { [key: string]: string } = {
    python: "python",
    javascript: "javascript",
    java: "java",
    cpp: "cpp",
    c: "c",
  }

  return languageMap[platformLanguage?.toLowerCase()] || "python"
}

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Chargement de l'éditeur...</p>
      </div>
    </div>
  ),
})

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const getStyle = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "beginner":
      case "facile":
        return "bg-green-100 text-green-700 border-green-200"
      case "intermediate":
      case "moyen":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "advanced":
      case "difficile":
        return "bg-red-100 text-red-700 border-red-200"
      case "expert":
        return "bg-purple-100 text-purple-700 border-purple-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStyle(difficulty)}`}
    >
      {difficulty}
    </span>
  )
}

const TestCaseResult: React.FC<{
  testCase: any
  index: number
  showDetails: boolean
  onToggleDetails: () => void
}> = ({ testCase, index, showDetails, onToggleDetails }) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
        testCase.passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              testCase.passed ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {testCase.passed ? (
              <CheckCircle className="h-4 w-4 text-white" />
            ) : (
              <XCircle className="h-4 w-4 text-white" />
            )}
          </div>
          <div>
            <span className="font-medium text-gray-900">Test #{index + 1}</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  testCase.is_hidden ? "bg-gray-200 text-gray-700" : "bg-blue-100 text-blue-700"
                }`}
              >
                {testCase.is_hidden ? "Caché" : "Public"}
              </span>
              {testCase.execution_time && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                  {testCase.execution_time}ms
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onToggleDetails}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-colors text-sm"
        >
          {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showDetails ? "Masquer" : "Détails"}
        </button>
      </div>

      {showDetails && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <div className="grid gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700 flex items-center gap-2 text-sm">
                  <Terminal className="h-4 w-4" />
                  Entrée
                </span>
                <button
                  onClick={() => copyToClipboard(testCase.input)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-gray-500" />}
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto font-mono">
                {testCase.input}
              </pre>
            </div>

            {!testCase.is_hidden && (
              <div>
                <span className="font-medium text-gray-700 flex items-center gap-2 mb-2 text-sm">
                  <Target className="h-4 w-4" />
                  Sortie attendue
                </span>
                <pre className="bg-gray-900 text-blue-400 p-3 rounded text-sm overflow-x-auto font-mono">
                  {testCase.expected_output}
                </pre>
              </div>
            )}

            {testCase.actual_output && (
              <div>
                <span className="font-medium text-gray-700 flex items-center gap-2 mb-2 text-sm">
                  <Zap className="h-4 w-4" />
                  Votre sortie
                </span>
                <pre
                  className={`p-3 rounded text-sm overflow-x-auto font-mono ${
                    testCase.passed ? "bg-gray-900 text-green-400" : "bg-gray-900 text-red-400"
                  }`}
                >
                  {testCase.actual_output}
                </pre>
              </div>
            )}

            {testCase.error && (
              <div>
                <span className="font-medium text-red-700 flex items-center gap-2 mb-2 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Erreur
                </span>
                <pre className="bg-red-900 text-red-200 p-3 rounded text-sm overflow-x-auto font-mono">
                  {testCase.error}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const CandidateChallengePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { token, challengeId } = router.query

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [code, setCode] = useState("")
  const [language] = useState("python")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [executionResults, setExecutionResults] = useState<any>(null)
  const [showTestDetails, setShowTestDetails] = useState<{ [key: number]: boolean }>({})
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [exerciseWithC, setExerciseWithC] = useState<ExerciseWithChallenges | null>(null)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [stepsProgress, setStepsProgress] = useState<{[stepId: string]: any}>({})
  const [userChallenge, setUserChallenge] = useState<any>(null)

  // Keeping all existing useEffect and function logic unchanged
  useEffect(() => {
    if (!token || !challengeId || typeof token !== "string" || typeof challengeId !== "string") return

    const loadChallengeDetails = async () => {
      try {
        setLoading(true)

        const sessionData = await CandidateExerciseService.getCandidateExercises(token)
        setTimeRemaining(sessionData.access_info.time_remaining_minutes)

        const challengeData = await CandidateExerciseService.getChallenge(token, challengeId)
        setChallenge(challengeData)

        const exerciseData = await CodingPlatformService.getExerciseChallenges(challengeData.exercise_id)
        // setExerciseWithC(exerciseData)
        setExercise(exerciseData?.exercise!)
        const userChallenge = await CandidateExerciseService.startChallenge1(token, challengeId)

        let currentIndex = 0
        if (userChallenge.current_step_id) {
          const stepIndex = challengeData.steps.findIndex((s) => s.id === userChallenge.current_step_id)
          if (stepIndex !== -1) {
            currentIndex = stepIndex
          }
        }

        setCurrentStepIndex(currentIndex)

        if (challengeData.steps.length > 0) {
          await loadStepProgressWithChallenge(challengeData, challengeData.steps[currentIndex].id)
        }
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement du challenge")
      } finally {
        setLoading(false)
      }
    }

    loadChallengeDetails()
  }, [token, challengeId])

  const loadStepProgress = async (stepId: string) => {
    if (!token || !challenge || typeof token !== "string") return
    await loadStepProgressWithChallenge(challenge, stepId)
  }

  const loadStepProgressWithChallenge = async (challengeData: Challenge, stepId: string) => {
    if (!token || typeof token !== "string") return

    try {
      const progressData = await CandidateExerciseService.loadProgress(token, challengeData.id, stepId)

      if (progressData && progressData.code) {
        setCode(progressData.code)
      } else {
        const currentStep = challengeData.steps!.find((s) => s.id === stepId)
        if (currentStep) {
          setCode(currentStep.starter_code || "")
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement du progrès:", err)
      const currentStep = challengeData.steps!.find((s) => s.id === stepId)
      if (currentStep) {
        setCode(currentStep.starter_code || "")
      }
    }
  }
  const loadCompleteProgress = async () => {
    if (!token || !challenge || typeof token !== "string") return
  
    try {
      // Charger la progression pour toutes les étapes
      const progressPromises = challenge.steps!.map(async (step) => {
        try {
          const progressData = await CandidateExerciseService.loadProgress(
            token, 
            challenge.id, 
            step.id
          )
          return {
            stepId: step.id,
            progress: progressData
          }
        } catch (err) {
          console.log(`Pas de progression pour l'étape ${step.id}`)
          return {
            stepId: step.id,
            progress: null
          }
        }
      })
  
      const allProgress = await Promise.all(progressPromises)
      
      // Construire l'objet de progression
      const progressMap = {}
      allProgress.forEach(({ stepId, progress }) => {
        if (progress) {
          progressMap[stepId] = {
            step_id: stepId,
            is_completed: progress.is_completed || false,
            tests_passed: progress.tests_passed || 0,
            tests_total: progress.tests_total || 0,
            last_submission: progress.last_edited
          }
        }
      })
  
      setStepsProgress(progressMap)
      console.log('🔍 DEBUG: Progression complète chargée:', progressMap)
  
    } catch (err) {
      console.error('Erreur lors du chargement de la progression complète:', err)
    }
  }
  useEffect(() => {
    if (challenge && token) {
      loadCompleteProgress()
    }
  }, [challenge, token])
  
  const autoSave = useCallback(async () => {
    if (!token || !challenge || typeof token !== "string" || !code.trim()) return

    try {
      setIsSaving(true)
      const currentStep = challenge!.steps![currentStepIndex]
      await CandidateExerciseService.saveProgress(token, challenge.id, currentStep.id, code, language)
      setLastSaved(new Date())
    } catch (err) {
      console.error("Erreur lors de la sauvegarde automatique:", err)
    } finally {
      setIsSaving(false)
    }
  }, [token, challenge, currentStepIndex, code, language])

  useEffect(() => {
    const interval = setInterval(autoSave, 30000)
    return () => clearInterval(interval)
  }, [autoSave])

  useEffect(() => {
    if (timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push(`/candidate/coding/${token}`)
          return 0
        }
        return prev - 1
      })
    }, 60000)

    return () => clearInterval(timer)
  }, [timeRemaining, token, router])

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    setExecutionResults(null)
  }

  const handleTest = async () => {
    if (!token || !challenge || typeof token !== "string") return

    try {
      setIsTesting(true)
      const currentStep = challenge!.steps![currentStepIndex]

      const results = await CandidateExerciseService.testCode(token, challenge.id, currentStep.id, code, language)

      setExecutionResults(results)
    } catch (err: any) {
      setError(err.message || "Erreur lors du test du code")
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async () => {
    if (!token || !challenge || typeof token !== "string") return
  
    try {
      setIsSubmitting(true)
      const currentStep = challenge!.steps![currentStepIndex]
  
      console.log('🔍 DEBUG: Soumission pour step:', currentStep.id, 'challenge:', challenge.id)
  
      // CORRECTION: Appel simplifié sans exercise_id
      const results = await CandidateExerciseService.submitCode(
        token, 
        challenge.id, 
        currentStep.id, 
        code, 
        language
      )
  
      console.log('🔍 DEBUG: Résultats reçus:', results)
  
      setExecutionResults(results)
  
      // CORRECTION: Mettre à jour la progression locale des étapes
      setStepsProgress(prev => ({
        ...prev,
        [currentStep.id]: {
          step_id: currentStep.id,
          is_completed: results.summary.all_passed,
          tests_passed: results.summary.passed,
          tests_total: results.summary.total,
          last_submission: new Date().toISOString()
        }
      }))
  
      // CORRECTION: Mettre à jour les informations du user_challenge
      if (results.user_challenge) {
        setUserChallenge(results.user_challenge)
        console.log('🔍 DEBUG: UserChallenge mis à jour:', results.user_challenge)
      }
  
      // CORRECTION: Gestion intelligente de la progression
      if (results.summary.all_passed) {
        console.log('🔍 DEBUG: Tous les tests passent pour cette étape')
        
        // Si c'est la dernière étape
        if (currentStepIndex >= challenge!.steps!.length - 1) {
          console.log('🔍 DEBUG: Dernière étape complétée - Challenge terminé!')
          // Afficher un message de félicitations
          setTimeout(() => {
            router.push(`/candidate/coding/${token}`)
          }, 3000)
        } else {
          // Vérifier si le backend nous indique qu'on peut passer à l'étape suivante
          if (results.next_step) {
            console.log('🔍 DEBUG: Étape suivante disponible:', results.next_step.id)
            
            setTimeout(() => {
              const nextIndex = currentStepIndex + 1
              setCurrentStepIndex(nextIndex)
              setExecutionResults(null)
              loadStepProgress(challenge.steps![nextIndex].id)
            }, 2000)
          } else {
            console.log('🔍 DEBUG: Pas d\'étape suivante indiquée par le backend')
          }
        }
      } else {
        console.log('🔍 DEBUG: Certains tests ont échoué, pas de progression')
      }
  
    } catch (err: any) {
      console.error('🔍 DEBUG: Erreur lors de la soumission:', err)
      setError(err.message || "Erreur lors de la soumission du code")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStepChange = (newIndex: number) => {
    if (!challenge || newIndex < 0 || newIndex >= challenge.steps!.length) return

    setCurrentStepIndex(newIndex)
    setExecutionResults(null)
    loadStepProgress(challenge.steps![newIndex].id)
  }

  const handleGoBack = () => {
    if (challenge?.exercise_id) {
      router.push(`/candidate/coding/${token}/exercise/${challenge.exercise_id}`)
    } else {
      router.push(`/candidate/coding/${token}`)
    }
  }

  const resetCode = () => {
    if (challenge) {
      const currentStep = challenge.steps![currentStepIndex]
      setCode(currentStep.starter_code || "")
      setExecutionResults(null)
    }
  }

  const toggleTestDetails = (index: number) => {
    setShowTestDetails((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }
  const StepProgressIndicator = ({ steps, currentStepIndex, stepsProgress, userChallenge }) => {
    const getStepStatus = (step, index) => {
      const progress = stepsProgress[step.id]
      
      if (index < currentStepIndex) {
        // Étapes précédentes - vérifier si elles sont complétées
        return progress?.is_completed ? 'completed' : 'attempted'
      } else if (index === currentStepIndex) {
        // Étape courante
        return progress?.is_completed ? 'completed' : 'current'
      } else {
        // Étapes futures
        return 'pending'
      }
    }
  
    const getStepColor = (status) => {
      switch (status) {
        case 'completed': return 'bg-green-600 text-white'
        case 'current': return 'bg-blue-600 text-white'
        case 'attempted': return 'bg-yellow-500 text-white'
        default: return 'bg-gray-300 text-gray-600'
      }
    }
  
    return (
      <div className="flex items-center gap-2 mb-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step, index)
          const progress = stepsProgress[step.id]
          
          return (
            <div key={step.id} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStepColor(status)}`}
                title={`Étape ${index + 1}: ${step.title}`}
              >
                {status === 'completed' ? '✓' : index + 1}
              </div>
              
              {/* Affichage du score pour les étapes avec progression */}
              {progress && (
                <div className="ml-1 text-xs">
                  <span className={`${progress.is_completed ? 'text-green-600' : 'text-yellow-600'}`}>
                    {progress.tests_passed}/{progress.tests_total}
                  </span>
                </div>
              )}
              
              {/* Ligne de connexion */}
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${
                  index < currentStepIndex ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border max-w-md">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chargement du challenge</h3>
          <p className="text-gray-600">Préparation de votre environnement de code...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-lg border p-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Erreur</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-gray-600 text-lg">Challenge non trouvé</p>
        </div>
      </div>
    )
  }

  const currentStep = challenge.steps![currentStepIndex]

  return (
    <>
      <Head>
        <title>
          {challenge.title} - {currentStep.title}
        </title>
        <meta name="description" content={challenge.description} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header moderne et épuré */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-medium">Retour</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Code className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">{challenge.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>
                        Étape {currentStepIndex + 1}/{challenge.steps!.length}: {currentStep.title}
                      </span>
                      {exercise && <DifficultyBadge difficulty={exercise.difficulty} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status et timer */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono font-semibold">
                    {CandidateExerciseService.formatTimeRemaining(timeRemaining)}
                  </span>
                </div>
                {lastSaved && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Sauvé à {lastSaved.toLocaleTimeString()}</span>
                  </div>
                )}
                {isSaving && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span>Sauvegarde...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          {/* Layout principal repensé */}
          <div className={`transition-all duration-300 ${isFullscreen ? "fixed inset-0 z-50 bg-gray-50 p-6" : ""}`}>
            <div className={`grid gap-8 h-full ${isFullscreen ? "grid-cols-1" : "grid-cols-12"}`}>
              {/* Panel gauche - Instructions */}
              {!isFullscreen && (
                <div className="col-span-5 space-y-6">
                  {/* Progression */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-600" />
                        Progression du Challenge
                      </h3>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">{currentStepIndex + 1}</div>
                        <div className="text-sm text-gray-500">sur {challenge.steps!.length}</div>
                      </div>
                    </div>
                                
                    <StepProgressIndicator 
                      steps={challenge.steps!}
                      currentStepIndex={currentStepIndex}
                      stepsProgress={stepsProgress}
                      userChallenge={userChallenge}
                    />
                  
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => handleStepChange(currentStepIndex - 1)}
                        disabled={currentStepIndex === 0}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="flex-1">
                        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${((currentStepIndex + 1) / challenge.steps!.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStepChange(currentStepIndex + 1)}
                        disabled={currentStepIndex === challenge.steps!.length - 1}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                                
                    <div className="text-center text-sm text-gray-600">
                      {Math.round(((currentStepIndex + 1) / challenge.steps!.length) * 100)}% complété
                      {userChallenge?.status === 'completed' && (
                        <div className="mt-2 text-green-600 font-medium">
                          ✨ Challenge terminé avec succès !
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="bg-blue-600 px-6 py-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {currentStep.title}
                      </h2>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="prose prose-gray max-w-none">
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {currentStep.instructions}
                        </div>
                      </div>

                      {/* Contraintes */}
                      {challenge.constraints && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="flex items-center gap-2 font-medium text-yellow-900 mb-2">
                            <Info className="h-4 w-4" />
                            Contraintes
                          </h4>
                          <div className="text-sm text-yellow-800 whitespace-pre-wrap">{challenge.constraints}</div>
                        </div>
                      )}

                      {/* Exemples */}
                      {currentStep.testcases && currentStep.testcases.some((tc) => tc.is_example) && (
                        <div>
                          <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
                            <Target className="h-4 w-4" />
                            Exemples
                          </h4>
                          <div className="space-y-3">
                            {currentStep.testcases
                              .filter((tc) => tc.is_example)
                              .map((testcase, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg border p-4">
                                  <div className="grid gap-3">
                                    <div>
                                      <span className="text-sm font-medium text-gray-700">Entrée:</span>
                                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm mt-1 font-mono overflow-x-auto">
                                        {testcase.input_data}
                                      </pre>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-gray-700">Sortie:</span>
                                      <pre className="bg-gray-900 text-blue-400 p-3 rounded text-sm mt-1 font-mono overflow-x-auto">
                                        {testcase.expected_output}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Indice */}
                      {currentStep.hint && (
                        <div>
                          <button
                            onClick={() => setShowHint(!showHint)}
                            className="flex items-center gap-2 w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Lightbulb className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">
                              {showHint ? "Masquer l'indice" : "Afficher l'indice"}
                            </span>
                            <ChevronRight
                              className={`h-4 w-4 text-blue-600 ml-auto transition-transform ${
                                showHint ? "rotate-90" : ""
                              }`}
                            />
                          </button>
                          {showHint && (
                            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-blue-800">{currentStep.hint}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Résultats des tests */}
                  {executionResults && (
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div
                        className={`px-6 py-4 ${executionResults.summary.all_passed ? "bg-green-600" : "bg-red-600"}`}
                      >
                        <div className="flex items-center justify-between text-white">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {executionResults.summary.all_passed ? (
                              <Trophy className="h-5 w-5" />
                            ) : (
                              <Target className="h-5 w-5" />
                            )}
                            Résultats des tests
                          </h3>
                          <div className="bg-white/20 px-3 py-1 rounded">
                            <span className="font-bold">
                              {executionResults.summary.passed}/{executionResults.summary.total}
                            </span>
                            <span className="text-sm ml-1">réussis</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {executionResults.execution_results.map((result: any, index: number) => (
                          <TestCaseResult
                            key={index}
                            testCase={result}
                            index={index}
                            showDetails={showTestDetails[index] || false}
                            onToggleDetails={() => toggleTestDetails(index)}
                          />
                        ))}
                      </div>

                      {executionResults.summary.all_passed && (
                        <div className="mx-6 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3 text-green-800">
                            <Trophy className="h-5 w-5" />
                            <div>
                              <div className="font-medium">Parfait ! Tous les tests passent.</div>
                              {currentStepIndex < challenge.steps!.length - 1 && (
                                <div className="text-sm text-green-700 mt-1">
                                  Passage automatique à l'étape suivante dans quelques secondes...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Panel droit - Éditeur */}
              <div className={`space-y-6 ${isFullscreen ? "col-span-1" : "col-span-7"}`}>
                {/* Éditeur de code */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="bg-gray-900 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Code className="h-5 w-5 text-white" />
                        <h3 className="text-lg font-semibold text-white">Éditeur de code</h3>
                        <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium text-white">
                          {exercise?.language || "Python"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={resetCode}
                          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reset
                        </button>
                        <button
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                        >
                          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                          {isFullscreen ? "Réduire" : "Plein écran"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`${isFullscreen ? "h-[calc(100vh-200px)]" : "h-[500px]"}`}>
                    <MonacoEditor
                      height="100%"
                      language={getMonacoLanguage(exercise?.language || "python")}
                      value={code}
                      onChange={(value?: string) => handleCodeChange(value || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: !isFullscreen },
                        fontSize: 14,
                        lineNumbers: "on",
                        folding: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: "on",
                        scrollbar: {
                          vertical: "auto",
                          horizontal: "auto",
                        },
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: "on",
                        quickSuggestions: true,
                        parameterHints: { enabled: true },
                        autoIndent: "full",
                        formatOnPaste: true,
                        formatOnType: true,
                        renderLineHighlight: "all",
                        cursorSmoothCaretAnimation: "on",
                        smoothScrolling: true,
                        padding: { top: 16, bottom: 16 },
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <button
                      onClick={handleTest}
                      disabled={isTesting || !code.trim()}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isTesting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {isTesting ? "Test..." : "Tester"}
                    </button>

                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !code.trim()}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {isSubmitting ? "Soumission..." : "Soumettre"}
                    </button>

                    <button
                      onClick={autoSave}
                      disabled={isSaving || !code.trim()}
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <Save className="h-4 w-4" />
                      Sauvegarder
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Testez avant de soumettre</span>
                      </div>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Sauvegarde auto toutes les 30s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
CandidateChallengePage.getLayout = (page: ReactElement) => page;

export default CandidateChallengePage
