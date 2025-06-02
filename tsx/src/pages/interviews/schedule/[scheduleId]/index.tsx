"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { InterviewSchedulingService } from "@/services/interview-scheduling-service"
import AIAssistantService from "@/services/ai-assistant-service"
import type { InterviewSchedule } from "@/types/interview-scheduling"
import { AIAssistant, normalizeAssistant } from "@/types/assistant"
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Briefcase,
  ChevronRight,
  Trash2,
  Plus,
  Info,
  Star,
  Video,
  MessageSquare,
  Users,
  Check,
  CheckCircle,
  XCircle,
  Edit3,
  Play,
  UserX,
  Phone,
  Mail,
  MapPin,
  FileText,
  Settings,
  ExternalLink,
  Copy,
  Eye
} from "lucide-react"

const InterviewScheduleDetailPage = () => {
  const router = useRouter()
  const { scheduleId, created } = router.query

  const [schedule, setSchedule] = useState<InterviewSchedule | null>(null)
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

        // Récupérer la planification
        const scheduleData = await InterviewSchedulingService.getSchedule(scheduleId)
        setSchedule(scheduleData)

        // Récupérer les assistants IA pour afficher leurs détails
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
      // Masquer le message après 5 secondes
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
    if (reason === null) return // Utilisateur a annulé

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
      // Ici vous devriez probablement créer un nouvel entretien et récupérer son ID
      // Pour l'exemple, je génère un ID temporaire
      const interviewId = `interview_${Date.now()}`
      const updatedSchedule = await InterviewSchedulingService.startInterview(schedule.id, interviewId)
      setSchedule(updatedSchedule)
      
      // Rediriger vers la page d'entretien
      router.push(`/interviews/${interviewId}`)
    } catch (err: any) {
      setError(err.message || "Erreur lors du démarrage de l'entretien")
    } finally {
      setActionLoading(null)
    }
  }

  const copyAccessLink = () => {
    if (!schedule?.access_token) return

    const accessLink = `${window.location.origin}/interview/access/${schedule.access_token}`
    navigator.clipboard.writeText(accessLink)
    alert("Lien d'accès copié dans le presse-papier")
  }

  // Obtenir les détails d'un assistant IA
  const getAssistantDetails = (assistantId: string) => {
    return assistants.find(a => a.id === assistantId)
  }

  // Obtenir l'icône du statut
  const getStatusIcon = (status: InterviewSchedule['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Play className="h-5 w-5 text-orange-600" />
      case 'completed':
        return <Check className="h-5 w-5 text-green-700" />
      case 'canceled':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'no_show':
        return <UserX className="h-5 w-5 text-gray-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  // Obtenir la couleur de badge du statut
  const getStatusBadgeColor = (status: InterviewSchedule['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-green-200 text-green-900'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-center items-center p-20">
                <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mr-3" />
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
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
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

  return (
    <>
      <Head>
        <title>Entretien {schedule.candidate_name} - RecruteIA</title>
        <meta name="description" content={`Détails de l'entretien avec ${schedule.candidate_name}`} />
      </Head>

      <div className="bg-gray-50 py-8 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Message de succès */}
            {showSuccessMessage && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md animate-fade-in">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      L'entretien a été programmé avec succès ! Le candidat recevra une notification par email.
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={() => setShowSuccessMessage(false)}
                      className="text-green-400 hover:text-green-600"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* En-tête */}
            <div className="mb-8">
              <Link
                href="/interviews"
                className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 bg-white px-3 py-1.5 rounded-full shadow-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux entretiens
              </Link>
              
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Entretien programmé</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="font-medium">{schedule.candidate_name}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="font-medium">{schedule.position}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(schedule.status)}`}>
                      {getStatusIcon(schedule.status)}
                      <span className="ml-1">{InterviewSchedulingService.getScheduleStatusLabel(schedule.status)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {InterviewSchedulingService.canBeModified(schedule) && (
                    <Link
                      href={`/interviews/schedule/${schedule.id}/edit`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Modifier
                    </Link>
                  )}
                  
                  {InterviewSchedulingService.canBeStarted(schedule) && timeInfo.canStart && (
                    <button
                      onClick={handleStartInterview}
                      disabled={actionLoading === "start"}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {actionLoading === "start" ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Démarrer l'entretien
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Affichage des erreurs d'action */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informations de l'entretien */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                    Détails de l'entretien
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Date et heure</h3>
                        <p className="font-medium text-gray-900">
                          {InterviewSchedulingService.formatScheduledDateTime(schedule.scheduled_at, schedule.timezone)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {!timeInfo.isPast ? `Dans ${timeInfo.timeUntil}` : 'Passé'}
                          {timeInfo.canStart && (
                            <span className="ml-2 text-green-600 font-medium">• Peut être démarré</span>
                          )}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Durée prévue</h3>
                        <p className="font-medium text-gray-900">
                          {InterviewSchedulingService.formatDuration(schedule.duration_minutes)}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Mode d'entretien</h3>
                        <div className="flex items-center">
                          {schedule.mode === 'autonomous' ? (
                            <Brain className="h-4 w-4 mr-2 text-blue-600" />
                          ) : (
                            <Users className="h-4 w-4 mr-2 text-green-600" />
                          )}
                          <span className="font-medium text-gray-900">
                            {InterviewSchedulingService.getInterviewModeLabel(schedule.mode)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {InterviewSchedulingService.getInterviewModeDescription(schedule.mode)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Fuseau horaire</h3>
                        <p className="font-medium text-gray-900">{schedule.timezone}</p>
                      </div>

                      {schedule.description && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                          <p className="text-gray-900">{schedule.description}</p>
                        </div>
                      )}

                      {schedule.access_token && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Lien d'accès candidat</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={copyAccessLink}
                              className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copier le lien
                            </button>
                            <Link
                              href={`/interview/access/${schedule.access_token}`}
                              target="_blank"
                              className="flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm transition-colors"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Aperçu
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations du candidat */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary-600" />
                    Informations du candidat
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-500 mr-3">Nom :</span>
                        <span className="font-medium">{schedule.candidate_name}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-500 mr-3">Email :</span>
                        <a 
                          href={`mailto:${schedule.candidate_email}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {schedule.candidate_email}
                        </a>
                      </div>

                      {schedule.candidate_phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-500 mr-3">Téléphone :</span>
                          <a 
                            href={`tel:${schedule.candidate_phone}`}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {schedule.candidate_phone}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-500 mr-3">Poste :</span>
                        <span className="font-medium">{schedule.position}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assistants IA */}
                {schedule.ai_assistant_id && (
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Brain className="h-5 w-5 mr-2 text-primary-600" />
                      Assistant IA assigné
                    </h2>

                    {(() => {
                      const assistant = getAssistantDetails(schedule.ai_assistant_id)
                      if (!assistant) {
                        return (
                          <div className="text-gray-500">
                            Assistant IA non trouvé (ID: {schedule.ai_assistant_id})
                          </div>
                        )
                      }
                      
                      const normalizedAssistant = normalizeAssistant(assistant)
                      return (
                        <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                              <Brain className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="font-medium text-gray-900">{assistant.name}</div>
                            <div className="text-sm text-gray-500">
                              Modèle: {assistant.model}
                            </div>
                            {normalizedAssistant.capabilities && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {Object.entries(normalizedAssistant.capabilities)
                                  .filter(([_, value]) => value === true)
                                  .map(([key, _]) => (
                                    <span
                                      key={key}
                                      className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                                    >
                                      {key}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Questions personnalisées */}
                {schedule.predefined_questions && schedule.predefined_questions.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-primary-600" />
                      Questions personnalisées ({schedule.predefined_questions.length})
                    </h2>

                    <div className="space-y-3">
                      {schedule.predefined_questions.map((question, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center mb-2">
                            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              Question {index + 1}
                            </span>
                          </div>
                          <p className="text-gray-900">{question}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                {/* Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
                  
                  <div className="space-y-3">
                    {schedule.status === 'scheduled' && (
                      <button
                        onClick={handleConfirmSchedule}
                        disabled={actionLoading === "confirm"}
                        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === "confirm" ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Confirmer l'entretien
                      </button>
                    )}

                    {InterviewSchedulingService.canBeStarted(schedule) && timeInfo.canStart && (
                      <button
                        onClick={handleStartInterview}
                        disabled={actionLoading === "start"}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === "start" ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Démarrer maintenant
                      </button>
                    )}

                    {InterviewSchedulingService.canBeModified(schedule) && (
                      <>
                        <Link
                          href={`/interviews/scheduled/${schedule.id}/edit`}
                          className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Modifier
                        </Link>

                        <button
                          onClick={handleMarkAsNoShow}
                          disabled={actionLoading === "no_show"}
                          className="w-full flex items-center justify-center px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors disabled:opacity-50"
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
                          className="w-full flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
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
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">ID de planification:</span>
                      <p className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">{schedule.id}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Créé le:</span>
                      <p className="font-medium">
                        {new Date(schedule.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>

                    {schedule.updated_at && schedule.updated_at !== schedule.created_at && (
                      <div>
                        <span className="text-gray-500">Modifié le:</span>
                        <p className="font-medium">
                          {new Date(schedule.updated_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statut d'avancement */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Statut d'avancement</h3>
                  
                  <div className="space-y-3">
                    <div className={`flex items-center ${schedule.status === 'scheduled' ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-3 h-3 rounded-full mr-3 ${schedule.status === 'scheduled' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                      <span className="text-sm">Planifié</span>
                    </div>
                    
                    <div className={`flex items-center ${['confirmed', 'in_progress', 'completed'].includes(schedule.status) ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-3 h-3 rounded-full mr-3 ${['confirmed', 'in_progress', 'completed'].includes(schedule.status) ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                      <span className="text-sm">Confirmé</span>
                    </div>
                    
                    <div className={`flex items-center ${['in_progress', 'completed'].includes(schedule.status) ? 'text-orange-600' : 'text-gray-400'}`}>
                      <div className={`w-3 h-3 rounded-full mr-3 ${['in_progress', 'completed'].includes(schedule.status) ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
                      <span className="text-sm">En cours</span>
                    </div>
                    
                    <div className={`flex items-center ${schedule.status === 'completed' ? 'text-green-700' : 'text-gray-400'}`}>
                      <div className={`w-3 h-3 rounded-full mr-3 ${schedule.status === 'completed' ? 'bg-green-700' : 'bg-gray-300'}`}></div>
                      <span className="text-sm">Terminé</span>
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

InterviewScheduleDetailPage.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>
export default InterviewScheduleDetailPage