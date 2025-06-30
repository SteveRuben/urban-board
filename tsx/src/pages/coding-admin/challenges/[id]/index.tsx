"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash,
  Eye,
  EyeOff,
  Play,
  TestTube,
  Clock,
  Target,
  Code,
  Layers,
  CheckCircle,
  Monitor,
  Zap,
  Shield,
  Activity,
  Lightbulb,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
  BookOpen,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
  ChevronRight,
  Timer,
} from "lucide-react"
import { CodingPlatformService } from "@/services/coding-platform-service"
import type { Challenge, ChallengeStep, ExecutionResult, Exercise } from "@/types/coding-plateform"

// Monaco Editor avec chargement dynamique amélioré
let MonacoEditor: any = null
if (typeof window !== "undefined") {
  import("@monaco-editor/react").then((module) => {
    MonacoEditor = module.default
  })
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "draft":
        return {
          bg: "bg-orange-50",
          text: "text-orange-700",
          border: "border-orange-200",
          dot: "bg-orange-500",
          label: "Brouillon",
        }
      case "published":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          dot: "bg-emerald-500",
          label: "Publié",
        }
      case "archived":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          dot: "bg-red-500",
          label: "Archivé",
        }
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
          dot: "bg-gray-500",
          label: status,
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}
    >
      <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  )
}

const TestResultCard: React.FC<{ result: ExecutionResult; index: number }> = ({ result, index }) => {
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
        result.passed
          ? "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
          : "border-red-200 bg-red-50/50 hover:bg-red-50"
      }`}
    >
      {/* Status indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full ${result.passed ? "bg-emerald-500" : "bg-red-500"}`}></div>

      <div className="p-6 pl-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                result.passed ? "bg-emerald-500" : "bg-red-500"
              }`}
            >
              {result.passed ? (
                <CheckCircle className="h-6 w-6 text-white" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Test #{index + 1}</h4>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    result.is_hidden ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {result.is_hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {result.is_hidden ? "Caché" : "Public"}
                </span>
                {result.execution_time && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700">
                    <Timer className="h-3 w-3" />
                    {result.execution_time}ms
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-all duration-200 font-medium shadow-sm"
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDetails ? "Masquer" : "Voir détails"}
          </button>
        </div>

        {showDetails && (
          <div className="space-y-6 pt-6 border-t border-gray-200/60">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">Entrée</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.input)}
                    className="p-1.5 rounded-md hover:bg-white/60 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <pre className="bg-gray-900 text-emerald-400 p-4 rounded-lg text-sm overflow-x-auto font-mono border">
                  {result.input}
                </pre>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">Attendu</span>
                </div>
                <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg text-sm overflow-x-auto font-mono border">
                  {result.expected_output}
                </pre>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">Obtenu</span>
                </div>
                <pre
                  className={`p-4 rounded-lg text-sm overflow-x-auto font-mono border ${
                    result.passed ? "bg-gray-900 text-emerald-400" : "bg-gray-900 text-red-400"
                  }`}
                >
                  {result.actual_output}
                </pre>
              </div>
            </div>

            {result.error && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-900">Erreur d'exécution</span>
                </div>
                <pre className="bg-red-900 text-red-200 p-4 rounded-lg text-sm overflow-x-auto font-mono border border-red-700">
                  {result.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChallengeDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const challengeId = id?.toString()

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [steps, setSteps] = useState<ChallengeStep[]>([])
  const [activeStep, setActiveStep] = useState<ChallengeStep | null>(null)
  const [code, setCode] = useState<string>("")
  const [testResults, setTestResults] = useState<ExecutionResult[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [testing, setTesting] = useState<boolean>(false)
  const [validating, setValidating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showTestResults, setShowTestResults] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  useEffect(() => {
    if (challengeId) {
      loadChallengeAndSteps()
    }
  }, [challengeId])

  const loadChallengeAndSteps = async () => {
    try {
      setLoading(true)
      setError(null)

      const challengeData = await CodingPlatformService.getChallenge(challengeId!)
      setChallenge(challengeData)

      const exerciseData = await CodingPlatformService.getExercise(challengeData.exercise_id)
      setExercise(exerciseData)

      const stepsData = await CodingPlatformService.getChallengeSteps(challengeId!)
      setSteps(stepsData.sort((a, b) => a.order_index - b.order_index))

      if (stepsData.length > 0) {
        const firstStep = stepsData.sort((a, b) => a.order_index - b.order_index)[0]
        setActiveStep(firstStep)
        setCode(firstStep.solution_code || firstStep.starter_code || "")
      }
    } catch (err) {
      console.error("Erreur lors du chargement:", err)
      setError("Impossible de charger le challenge. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const handleStepChange = (step: ChallengeStep) => {
    setActiveStep(step)
    setCode(step.solution_code || step.starter_code || "")
    setTestResults([])
    setShowTestResults(false)
  }

  const handleTestCode = async () => {
    if (!activeStep || !challenge || !exercise) return

    try {
      setTesting(true)
      setError(null)

      if (!code.trim()) {
        setError("Le code ne peut pas être vide")
        return
      }

      if (!exercise.language) {
        setError("Le langage de l'exercice n'est pas défini")
        return
      }

      const response = await CodingPlatformService.adminTestCode(activeStep.id, {
        code: code,
        language: exercise.language,
      })

      setTestResults(response.execution_results)
      setShowTestResults(true)
    } catch (err) {
      console.error("Erreur lors du test:", err)
      setError(err instanceof Error ? err.message : "Erreur lors de l'exécution du test")
    } finally {
      setTesting(false)
    }
  }

  const handleValidateCode = async () => {
    if (!activeStep || !challenge || !exercise) return

    try {
      setValidating(true)
      setError(null)

      if (!code.trim()) {
        setError("Le code ne peut pas être vide")
        return
      }

      if (!exercise.language) {
        setError("Le langage de l'exercice n'est pas défini")
        return
      }

      const response = await CodingPlatformService.adminValidateCode(activeStep.id, {
        code: code,
        language: exercise.language,
      })

      setTestResults(response.execution_results)
      setShowTestResults(true)

      if (response.summary.all_passed) {
        setError(null)
      }
    } catch (err) {
      console.error("Erreur lors de la validation:", err)
      setError(err instanceof Error ? err.message : "Erreur lors de la validation du code")
    } finally {
      setValidating(false)
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cette étape ? Cette action supprimera également tous les cas de test associés.",
      )
    ) {
      return
    }

    try {
      await CodingPlatformService.deleteStep(stepId)
      setSteps((prev) => prev.filter((step) => step.id !== stepId))

      if (activeStep?.id === stepId) {
        const remainingSteps = steps.filter((step) => step.id !== stepId)
        if (remainingSteps.length > 0) {
          handleStepChange(remainingSteps[0])
        } else {
          setActiveStep(null)
          setCode("")
        }
      }
    } catch (err) {
      console.error("Erreur lors de la suppression:", err)
      setError("Impossible de supprimer l'étape. Veuillez réessayer.")
    }
  }

  const resetCode = () => {
    if (activeStep) {
      setCode(activeStep.solution_code || activeStep.starter_code || "")
      setTestResults([])
      setShowTestResults(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border max-w-md">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chargement en cours</h3>
          <p className="text-gray-600">Préparation de l'environnement d'administration...</p>
        </div>
      </div>
    )
  }

  if (error && !challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-lg border p-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Erreur de chargement</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            href="/coding-admin/exercises"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux exercices
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{challenge?.title} - Administration des étapes</title>
        <meta name="description" content={`Gérer les étapes du challenge: ${challenge?.title}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header moderne */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Navigation */}
              <div className="flex items-center gap-4">
                <Link
                  href={`/coding-admin/exercises/${challenge?.exercise_id}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="font-medium">Exercice</span>
                </Link>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Administration Challenge</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm font-medium">Mode Admin</span>
                </div>
                <Link
                  href={`/coding-admin/challenges/${challenge?.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Paramètres</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          {/* Challenge Overview - Redesigné */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1">{challenge?.title}</h1>
                      <div className="flex items-center gap-4 text-blue-100">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{challenge?.estimated_time_minutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-4 w-4" />
                          <span className="text-sm">
                            {steps.length} étape{steps.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Code className="h-4 w-4" />
                          <span className="text-sm font-medium">{exercise?.language}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">{challenge && <StatusBadge status={challenge.status} />}</div>
              </div>
            </div>

            <div className="p-8">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">{challenge?.description}</p>

              {challenge?.constraints && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-amber-900">Contraintes importantes</h3>
                  </div>
                  <p className="text-amber-800 leading-relaxed">{challenge.constraints}</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">Erreur</h4>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Main Content Layout - Complètement repensé */}
          <div className={`transition-all duration-300 ${isFullscreen ? "fixed inset-0 z-50 bg-gray-50 p-6" : ""}`}>
            <div className={`grid gap-8 h-full ${isFullscreen ? "grid-cols-1" : "grid-cols-12"}`}>
              {/* Sidebar Steps - Redesigné */}
              {!isFullscreen && (
                <div className="col-span-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                    <div className="bg-gray-900 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                            <Layers className="h-4 w-4 text-white" />
                          </div>
                          <h2 className="text-lg font-semibold text-white">Étapes du challenge</h2>
                        </div>
                        <Link
                          href={`/coding-admin/challenges/${challenge?.id}/steps/new`}
                          className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                          title="Ajouter une étape"
                        >
                          <Plus className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
                        </Link>
                      </div>
                    </div>

                    <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                      {steps.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Layers className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune étape</h3>
                          <p className="text-gray-600 mb-6">Commencez par créer la première étape de ce challenge.</p>
                          <Link
                            href={`/coding-admin/challenges/${challenge?.id}/steps/new`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                          >
                            <Plus className="h-4 w-4" />
                            Créer la première étape
                          </Link>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {steps.map((step, index) => (
                            <div
                              key={step.id}
                              className={`relative p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                                activeStep?.id === step.id ? "bg-blue-50 border-r-4 border-blue-500" : ""
                              }`}
                              onClick={() => handleStepChange(step)}
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                                    activeStep?.id === step.id ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {index + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-900 truncate">{step.title}</h3>
                                    {step.is_final_step && (
                                      <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="h-3 w-3 text-white" />
                                      </div>
                                    )}
                                  </div>

                                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                    {step.instructions.substring(0, 100)}...
                                  </p>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <TestTube className="h-3 w-3" />
                                      <span>
                                        {step.testcases?.length || 0} test{(step.testcases?.length || 0) > 1 ? "s" : ""}
                                      </span>
                                    </div>

                                    <div className="flex gap-1">
                                      <Link
                                        href={`/coding-admin/steps/${step.id}/edit`}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Modifier"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Link>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteStep(step.id)
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Supprimer"
                                      >
                                        <Trash className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content Area - Redesigné */}
              <div className={`space-y-8 ${isFullscreen ? "col-span-1" : "col-span-8"}`}>
                {activeStep ? (
                  <>
                    {/* Step Instructions - Redesigné */}
                    {!isFullscreen && (
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">{activeStep.title}</h2>
                          </div>
                        </div>

                        <div className="p-8">
                          <div className="prose prose-gray max-w-none">
                            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                              {activeStep.instructions}
                            </div>
                          </div>

                          {activeStep.hint && (
                            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Lightbulb className="h-4 w-4 text-blue-600" />
                                </div>
                                <h4 className="font-semibold text-blue-900">Indice</h4>
                              </div>
                              <p className="text-blue-800 leading-relaxed">{activeStep.hint}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Code Editor - Redesigné */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gray-900 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                              <Code className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Éditeur de code</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="px-2.5 py-1 bg-white/20 rounded-lg text-sm font-medium text-white">
                                  {exercise?.language}
                                </span>
                                <span className="text-sm text-gray-300">Mode Administration</span>
                              </div>
                            </div>
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
                              onClick={handleTestCode}
                              disabled={testing || !code.trim()}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 text-sm transition-colors font-medium"
                            >
                              {testing ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                              {testing ? "Test en cours..." : "Tester le code"}
                            </button>
                            <button
                              onClick={handleValidateCode}
                              disabled={validating || !code.trim()}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 text-sm transition-colors font-medium"
                            >
                              {validating ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                              {validating ? "Validation..." : "Valider"}
                            </button>
                            <button
                              onClick={() => setIsFullscreen(!isFullscreen)}
                              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                            >
                              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className={`${isFullscreen ? "h-[calc(100vh-200px)]" : "h-[500px]"}`}>
                        {MonacoEditor && (
                          <MonacoEditor
                            height="100%"
                            language={getMonacoLanguage(exercise?.language || "python")}
                            value={code}
                            onChange={(value: string) => setCode(value || "")}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: !isFullscreen },
                              fontSize: 15,
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
                        )}
                      </div>
                    </div>

                    {/* Test Results - Redesigné */}
                    {showTestResults && testResults.length > 0 && (
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <Activity className="h-4 w-4 text-white" />
                              </div>
                              <h2 className="text-xl font-semibold text-white">Résultats des tests</h2>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">
                                  {testResults.filter((r) => r.passed).length}
                                </span>
                                <span className="text-white/80">/</span>
                                <span className="text-lg font-semibold text-white/90">{testResults.length}</span>
                                <span className="text-sm text-white/80 ml-1">réussis</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-8 space-y-6">
                          {testResults.map((result, index) => (
                            <TestResultCard key={index} result={result} index={index} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Layers className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">Sélectionnez une étape</h3>
                    <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                      Choisissez une étape dans la liste de gauche pour commencer à coder et tester votre solution.
                    </p>
                    {steps.length === 0 && (
                      <Link
                        href={`/coding-admin/challenges/${challenge?.id}/steps/new`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-lg"
                      >
                        <Plus className="h-5 w-5" />
                        Créer la première étape
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
