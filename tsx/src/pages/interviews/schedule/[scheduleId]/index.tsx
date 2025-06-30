"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { InterviewSchedulingService } from "@/services/interview-scheduling-service"
import AIAssistantService from "@/services/ai-assistant-service"
import type { InterviewSchedule, InterviewScheduleWithExercises } from "@/types/interview-scheduling"
import type { AIAssistant } from "@/types/assistant"
import {
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Briefcase,
  CheckCircle,
  XCircle,
  Edit3,
  Play,
  UserX,
  Phone,
  Mail,
  FileText,
  ExternalLink,
  Copy,
  Bot,
  Users,
  Check,
  Timer,
  Code,
  BookOpen,
  Target,
  Activity,
  Globe,
  Building,
  UserCheck,
} from "lucide-react"

const InterviewScheduleDetailPage = () => {
  const router = useRouter()
  const { scheduleId, created } = router.query

  const [schedule, setSchedule] = useState<InterviewScheduleWithExercises | null>(null)
  const [assistants, setAssistants] = useState<AIAssistant[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false)

  // Charger les données de la planification
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!scheduleId || typeof scheduleId !== "string") return

      try {
        setLoading(true)
        setError(null)

        const scheduleData = await InterviewSchedulingService.getSchedule(scheduleId)
        setSchedule(scheduleData)

        const allAssistants = await AIAssistantService.getAllAssistants()
        setAssistants(allAssistants)
      } catch (err: any) {
        console.error("Erreur lors du chargement de la planification:", err)
        setError(err.message || "Impossible de charger la planification")
      } finally {
        setLoading(false)
      }
    }

    fetchScheduleData()
  }, [scheduleId])

  // Afficher le message de succès si created=true
  useEffect(() => {
    if (created === "true") {
      setShowSuccessMessage(true)
      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [created])

  // Actions sur la planification
  const handleConfirmSchedule = async () => {
    if (!schedule) return

    try {
      setActionLoading("confirm")
      const updatedSchedule = await InterviewSchedulingService.confirmSchedule(schedule.id)
      setSchedule(updatedSchedule)
    } catch (err: any) {
      setError(err.message || "Erreur lors de la confirmation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelSchedule = async () => {
    if (!schedule) return

    const reason = prompt("Raison de l'annulation (optionnel):")
    if (reason === null) return

    try {
      setActionLoading("cancel")
      const updatedSchedule = await InterviewSchedulingService.cancelSchedule(schedule.id, reason)
      setSchedule(updatedSchedule)
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'annulation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAsNoShow = async () => {
    if (!schedule) return

    if (!confirm("Êtes-vous sûr de vouloir marquer ce candidat comme absent ?")) return

    try {
      setActionLoading("no_show")
      const updatedSchedule = await InterviewSchedulingService.markAsNoShow(schedule.id)
      setSchedule(updatedSchedule)
    } catch (err: any) {
      setError(err.message || "Erreur lors du marquage comme absent")
    } finally {
      setActionLoading(null)
    }
  }

  const handleStartInterview = async () => {
    if (!schedule) return

    try {
      setActionLoading("start")
      const interviewId = `interview_${Date.now()}`
      const updatedSchedule = await InterviewSchedulingService.startInterview(schedule.id, interviewId)
      setSchedule(updatedSchedule)
      console.log(schedule.meet_link)
      // router.push(`/interviews/${interviewId}`)
    } catch (err: any) {
      setError(err.message || "Erreur lors du démarrage de l'entretien")
    } finally {
      setActionLoading(null)
    }
  }

  const copyAccessLink = () => {
    if (!schedule?.access_token) return

    const accessLink = `${window.location.origin}/candidate/coding/${schedule.coding_exercises!.access_token}`
    navigator.clipboard.writeText(accessLink)
    alert("Lien d'accès copié dans le presse-papier")
  }

  const getAssistantDetails = (assistantId: string) => {
    return assistants.find((a) => a.id === assistantId)
  }

  const getStatusIcon = (status: InterviewSchedule["status"]) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-5 w-5 text-blue-600" />
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "in_progress":
        return <Play className="h-5 w-5 text-orange-600" />
      case "completed":
        return <Check className="h-5 w-5 text-green-700" />
      case "canceled":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "no_show":
        return <UserX className="h-5 w-5 text-gray-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadgeColor = (status: InterviewSchedule["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "completed":
        return "bg-green-200 text-green-900 border-green-300"
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      case "no_show":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Chargement... - RecruteIA</title>
        </Head>
        <div className="bg-gray-50 py-8 min-h-screen">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-center items-center p-20">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                <span className="text-lg text-gray-600">Chargement de la planification...</span>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error || !schedule) {
    return (
      <>
        <Head>
          <title>Erreur - RecruteIA</title>
        </Head>
        <div className="bg-gray-50 py-8 min-h-screen">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <div className="flex">
                  <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800">Erreur</h3>
                    <p className="text-red-700">{error || "Planification introuvable"}</p>
                    <div className="mt-4">
                      <Link
                        href="/interviews"
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Retour aux entretiens
                      </Link>
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

  const timeInfo = InterviewSchedulingService.getTimeUntilInterview(schedule.scheduled_at)
  const assistantDetails = schedule.ai_assistant_id ? getAssistantDetails(schedule.ai_assistant_id) : null

  return (
    <>
      <Head>
        <title>Entretien {schedule.candidate_name} - RecruteIA</title>
        <meta name="description" content={`Détails de l'entretien avec ${schedule.candidate_name}`} />
      </Head>

      <div className="bg-gray-50 py-8 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Message de succès */}
            {showSuccessMessage && (
              <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      L'entretien a été programmé avec succès ! Le candidat recevra une notification par email.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSuccessMessage(false)}
                    className="ml-auto text-green-400 hover:text-green-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <Link
                href="/interviews"
                className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 bg-white px-3 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux entretiens
              </Link>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">{schedule.title}</h1>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeColor(
                              schedule.status,
                            )}`}
                          >
                            {getStatusIcon(schedule.status)}
                            <span className="ml-1">
                              {InterviewSchedulingService.getScheduleStatusLabel(schedule.status)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Candidat</p>
                          <p className="font-medium text-gray-900">{schedule.candidate_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Poste</p>
                          <p className="font-medium text-gray-900">{schedule.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Durée</p>
                          <p className="font-medium text-gray-900">
                            {InterviewSchedulingService.formatDuration(schedule.duration_minutes)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {InterviewSchedulingService.canBeModified(schedule) && (
                      <Link
                        href={`/interviews/schedule/${schedule.id}/edit`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Modifier
                      </Link>
                    )}

                    

                    {(schedule.status === "completed" ||
                      (schedule.coding_exercises &&
                        schedule.coding_exercises.assigned &&
                        schedule.coding_exercises.progress &&
                        schedule.coding_exercises.progress.completed > 0)) && (
                      <Link
                        href={`/interviews/schedule/${schedule.id}/coding-results`}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Résultats
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Erreur d'action */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-8">
                {/* Informations de l'entretien */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                    Planification de l'entretien
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Date et heure</h3>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {InterviewSchedulingService.formatScheduledDateTime(
                                schedule.scheduled_at,
                                schedule.timezone,
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              {!timeInfo.isPast ? `Dans ${timeInfo.timeUntil}` : "Passé"}
                              {timeInfo.canStart && (
                                <span className="ml-2 text-green-600 font-medium">• Peut être démarré</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Fuseau horaire</h3>
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-gray-400" />
                          <p className="font-medium text-gray-900">{schedule.timezone}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Mode d'entretien</h3>
                        <div className="flex items-center gap-3">
                          {schedule.mode === "autonomous" ? (
                            <Bot className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Users className="h-5 w-5 text-blue-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {InterviewSchedulingService.getInterviewModeLabel(schedule.mode)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {InterviewSchedulingService.getInterviewModeDescription(schedule.mode)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {schedule.description && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <p className="text-gray-900">{schedule.description}</p>
                          </div>
                        </div>
                      )}

                      {schedule.access_token && schedule.status == 'scheduled' && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Accès candidat</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={copyAccessLink}
                              className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copier le lien
                            </button>
                            <Link
                              href={`/candidate/coding/${schedule.coding_exercises!.access_token}`}
                              target="_blank"
                              className="flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition-colors"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Aperçu
                            </Link>
                          </div>
                        </div>
                      )}

                      {schedule.organization && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Organisation</h3>
                          <div className="flex items-center gap-3">
                            <Building className="h-5 w-5 text-gray-400" />
                            <p className="font-medium text-gray-900">{schedule.organization.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations du candidat */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <User className="h-5 w-5 mr-3 text-green-600" />
                    Informations du candidat
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Nom complet</p>
                          <p className="font-medium text-gray-900">{schedule.candidate_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{schedule.candidate_email}</p>
                        </div>
                      </div>

                      {schedule.candidate_phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Téléphone</p>
                            <p className="font-medium text-gray-900">{schedule.candidate_phone}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Poste visé</p>
                          <p className="font-medium text-gray-900">{schedule.position}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <UserCheck className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Statut de réponse</p>
                          <p className="font-medium text-gray-900">
                            {schedule.was_confirmed_by_candidate
                              ? "Confirmé par le candidat"
                              : schedule.was_canceled_by_candidate
                                ? "Annulé par le candidat"
                                : "En attente de réponse"}
                          </p>
                        </div>
                      </div>

                      {schedule.candidate_response_date && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Date de réponse</p>
                            <p className="font-medium text-gray-900">
                              {new Date(schedule.candidate_response_date).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assistant IA */}
                {assistantDetails && (
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <Bot className="h-5 w-5 mr-3 text-purple-600" />
                      Assistant IA assigné
                    </h2>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Bot className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{assistantDetails.name}</h3>
                        {assistantDetails.description && (
                          <p className="text-gray-600 mb-4">{assistantDetails.description}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Spécialisation</p>
                            <p className="font-medium text-gray-900">{assistantDetails.assistantType || "Général"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Modèle</p>
                            <p className="font-medium text-gray-900">{assistantDetails.model || "Non spécifié"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions prédéfinies */}
                {schedule.predefined_questions && schedule.predefined_questions.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <BookOpen className="h-5 w-5 mr-3 text-orange-600" />
                      Questions prédéfinies
                    </h2>

                    <div className="space-y-3">
                      {schedule.predefined_questions.map((question, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                            {index + 1}
                          </span>
                          <p className="text-gray-900">{question}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exercices de codage */}
                {schedule.coding_exercises && schedule.coding_exercises.assigned && (
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <Code className="h-5 w-5 mr-3 text-indigo-600" />
                      Exercices de codage
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Nombre d'exercices</p>
                            <p className="font-medium text-gray-900">{schedule.coding_exercises.exercise_count}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Timer className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Temps limite</p>
                            <p className="font-medium text-gray-900">
                              {schedule.coding_exercises.time_limit_minutes} minutes
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Activity className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Statut</p>
                            <p className="font-medium text-gray-900">{schedule.coding_exercises.status}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {schedule.coding_exercises.progress && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-gray-500">Progression</p>
                              <p className="text-sm font-medium text-gray-900">
                                {schedule.coding_exercises.progress.percentage}%
                              </p>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${schedule.coding_exercises.progress.percentage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {schedule.coding_exercises.progress.completed} sur{" "}
                              {schedule.coding_exercises.progress.total} exercices complétés
                            </p>
                          </div>
                        )}

                        {schedule.coding_exercises.access_token && (
                          <div>
                            <Link
                              href={`/candidate/coding/${schedule.coding_exercises.access_token}`}
                              target="_blank"
                              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Accéder aux exercices
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                {/* Actions */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

                  <div className="space-y-3">
                    {schedule.status === "scheduled" && (
                      <button
                        onClick={handleConfirmSchedule}
                        disabled={actionLoading === "confirm"}
                        className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === "confirm" ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Confirmer l'entretien
                      </button>
                    )}

                    {
                    InterviewSchedulingService.canBeStarted(schedule) && timeInfo.canStart && 
                    (
                      <button
                        onClick={()=>{handleStartInterview(),(window.location.href = `${schedule.meet_link}`)}}
                        disabled={actionLoading === "start"}
                        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === "start" ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Démarrer maintenant
                      </button>
                    )}

                    {schedule.status === "completed" && (
                      <Link
                        href={`/interviews/scheduled/${schedule.id}/coding-results`}
                        className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Voir les résultats
                      </Link>
                    )}

                    {schedule.coding_exercises &&
                      schedule.coding_exercises.assigned &&
                      schedule.coding_exercises.progress  && (
                        <Link
                          href={`/interviews/schedule/${schedule.id}/coding-results`}
                          className="w-full flex items-center justify-center px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          <Code className="h-4 w-4 mr-2" />
                          Résultats de codage
                        </Link>
                      )}

                    {InterviewSchedulingService.canBeModified(schedule) && (
                      <>
                        <Link
                          href={`/interviews/schedule/${schedule.id}/edit`}
                          className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Modifier
                        </Link>

                        <button
                          onClick={handleMarkAsNoShow}
                          disabled={actionLoading === "no_show"}
                          className="w-full flex items-center justify-center px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === "no_show" ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <UserX className="h-4 w-4 mr-2" />
                          )}
                          Marquer absent
                        </button>

                        <button
                          onClick={handleCancelSchedule}
                          disabled={actionLoading === "cancel"}
                          className="w-full flex items-center justify-center px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === "cancel" ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Annuler l'entretien
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Informations système */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations système</h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">ID de planification</p>
                      <p className="font-mono text-sm text-gray-900">{schedule.id}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Créé le</p>
                      <p className="text-sm text-gray-900">
                        {new Date(schedule.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Dernière modification</p>
                      <p className="text-sm text-gray-900">
                        {new Date(schedule.updated_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {schedule.recruiter && (
                      <div>
                        <p className="text-sm text-gray-500">Recruteur</p>
                        <p className="text-sm text-gray-900">{schedule.recruiter.name}</p>
                        <p className="text-xs text-gray-600">{schedule.recruiter.email}</p>
                      </div>
                    )}
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

InterviewScheduleDetailPage.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>
export default InterviewScheduleDetailPage
