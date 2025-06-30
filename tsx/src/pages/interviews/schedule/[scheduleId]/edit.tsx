"use client"

import type React from "react"
import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import DashboardLayout from "@/components/layout/dashboard-layout"
import AIAssistantService from "@/services/ai-assistant-service"
import { InterviewSchedulingService } from "@/services/interview-scheduling-service"
import type { InterviewSchedule } from "@/types/interview-scheduling"
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Briefcase,
  Plus,
  Info,
  Star,
  MessageSquare,
  Users,
  Check,
  Save,
  X,
  Settings,
  Lock,
} from "lucide-react"
import { AIAssistant, AIAssistantCapabilities, normalizeAssistant } from "@/types/assistant"

// Types pour les données modifiables uniquement
interface LimitedFormData {
  scheduled_at: string
  duration_minutes: number
  timezone: string
  mode: "autonomous" | "collaborative"
  ai_assistant_id: string
  predefined_questions: string[]
}

const getAssistantCapabilities = (assistant: AIAssistant): string[] => {
  const normalizedAssistant = normalizeAssistant(assistant);
  
  const capabilities: AIAssistantCapabilities = normalizedAssistant.capabilities || {};
  const capabilityLabels: string[] = [];
  
  if (capabilities.generateQuestions === true) capabilityLabels.push('Questions');
  if (capabilities.evaluateResponses === true) capabilityLabels.push('Évaluation');
  if (capabilities.provideFeedback === true) capabilityLabels.push('Feedback');
  if (capabilities.suggestFollowUps === true) capabilityLabels.push('Suivi');
  if (capabilities.realTimeCoaching === true) capabilityLabels.push('Coaching');
  if (capabilities.biometricIntegration === true) capabilityLabels.push('Biométrie');
  
  if (capabilityLabels.length === 0) {
    capabilityLabels.push('Assistant général');
  }
  
  return capabilityLabels;
};

const EditInterviewSchedulePage = () => {
  const router = useRouter()
  const { scheduleId } = router.query

  const [schedule, setSchedule] = useState<InterviewSchedule | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [assistants, setAssistants] = useState<AIAssistant[]>([])
  const [loadingAssistants, setLoadingAssistants] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState<boolean>(false)
  const [formData, setFormData] = useState<LimitedFormData>({
    scheduled_at: "",
    duration_minutes: 30,
    timezone: "Europe/Paris",
    mode: "autonomous",
    ai_assistant_id: "",
    predefined_questions: [],
  })

  // Charger les données de la planification
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!scheduleId || typeof scheduleId !== "string") return

      try {
        setLoading(true)
        setSubmitError(null)

        // Récupérer la planification
        const scheduleData = await InterviewSchedulingService.getSchedule(scheduleId)
        setSchedule(scheduleData)

        // Vérifier si la planification peut être modifiée
        if (!InterviewSchedulingService.canBeModified(scheduleData)) {
          setSubmitError("Cette planification ne peut plus être modifiée.")
          return
        }

        // Pré-remplir le formulaire avec SEULEMENT les données modifiables
        setFormData({
          scheduled_at: scheduleData.scheduled_at ? new Date(scheduleData.scheduled_at).toISOString().slice(0, 16) : "",
          duration_minutes: scheduleData.duration_minutes || 30,
          timezone: scheduleData.timezone || "Europe/Paris",
          mode: scheduleData.mode || "autonomous",
          ai_assistant_id: scheduleData.ai_assistant_id || "",
          predefined_questions: scheduleData.predefined_questions || [],
        })

      } catch (err: any) {
        console.error("Erreur lors du chargement de la planification:", err)
        setSubmitError(err.message || "Impossible de charger la planification")
      } finally {
        setLoading(false)
      }
    }

    fetchScheduleData()
  }, [scheduleId])

  // Charger les assistants IA disponibles
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setLoadingAssistants(true)
        const userAssistants = await AIAssistantService.getAllAssistants()
        setAssistants(userAssistants)
      } catch (error) {
        console.error("Erreur lors du chargement des assistants:", error)
      } finally {
        setLoadingAssistants(false)
      }
    }

    fetchAssistants()
  }, [])

  // Gérer les changements de champs du formulaire
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setHasChanges(true)
  }

  // Ajouter une question personnalisée
  const addCustomQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      predefined_questions: [...prev.predefined_questions, ""],
    }))
    setHasChanges(true)
  }

  // Mettre à jour une question personnalisée
  const updateCustomQuestion = (index: number, value: string) => {
    const updatedQuestions = [...formData.predefined_questions]
    updatedQuestions[index] = value
    setFormData((prev) => ({
      ...prev,
      predefined_questions: updatedQuestions,
    }))
    setHasChanges(true)
  }

  // Supprimer une question personnalisée
  const removeCustomQuestion = (index: number) => {
    const updatedQuestions = formData.predefined_questions.filter((_, i) => i !== index)
    setFormData((prev) => ({
      ...prev,
      predefined_questions: updatedQuestions,
    }))
    setHasChanges(true)
  }

  // Gérer la sélection d'assistant IA
  const handleAssistantChange = (assistantId: string) => {
    setFormData((prev) => ({
      ...prev,
      ai_assistant_id: assistantId,
    }))
    setHasChanges(true)
  }

  // Soumettre le formulaire pour modifier l'entretien
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)

    if (!schedule) return

    try {
      setIsSubmitting(true)

      console.log("Modification limitée de la planification d'entretien avec les données:", formData)

      // Appeler le service pour modifier la planification (version limitée)
      const updatedSchedule = await InterviewSchedulingService.updateSchedule(schedule.id, formData)
      
      console.log("Planification modifiée avec succès:", updatedSchedule)

      // Rediriger vers la page de la planification modifiée
      router.push(`/interviews/schedule/${schedule.id}?updated=true`)
      
    } catch (error: any) {
      console.error("Erreur lors de la modification de la planification:", error)
      setSubmitError(error.message || "Impossible de modifier la planification. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Annuler les modifications
  const handleCancel = () => {
    if (hasChanges && !confirm("Êtes-vous sûr de vouloir annuler les modifications ?")) {
      return
    }
    router.push(`/interviews/schedule/${scheduleId}`)
  }

  // Obtenir un label pour le type d'assistant
  const getAssistantTypeLabel = (type: string): string => {
    switch (type) {
      case "recruiter":
        return "Recruteur"
      case "evaluator":
        return "Évaluateur"
      case "analyzer":
        return "Analyseur"
      default:
        return "Assistant général"
    }
  }

  // Obtenir une couleur pour le type d'assistant
  const getAssistantTypeColor = (type: string): string => {
    switch (type) {
      case "recruiter":
        return "bg-blue-100 text-blue-800"
      case "evaluator":
        return "bg-purple-100 text-purple-800"
      case "analyzer":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Obtenir une icône pour le type d'assistant
  const getAssistantTypeIcon = (type: string) => {
    switch (type) {
      case "recruiter":
        return <Users className="h-4 w-4" />
      case "evaluator":
        return <Star className="h-4 w-4" />
      case "analyzer":
        return <Brain className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getAssistantTypeSafe = (assistant: AIAssistant): string => {
    return assistant.assistantType || assistant.assistant_type || 'general';
  };

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

  if (submitError && !schedule) {
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
                    <p className="text-red-700">{submitError}</p>
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

  return (
    <>
      <Head>
        <title>Reprogrammer l'entretien - {schedule?.candidate_name} - RecruteIA</title>
        <meta name="description" content="Reprogrammer l'entretien" />
      </Head>

      <div className="bg-gray-50 py-8 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="mb-8">
              <Link
                href={`/interviews/schedule/${scheduleId}`}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 bg-white px-3 py-1.5 rounded-full shadow-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux détails
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reprogrammer l'entretien</h1>
              <div className="flex flex-wrap items-center gap-2 text-gray-600 mb-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="font-medium">{schedule?.candidate_name}</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="font-medium">{schedule?.position}</span>
                </div>
                {hasChanges && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center text-orange-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Modifications non sauvegardées</span>
                    </div>
                  </>
                )}
              </div>

              {/* Information sur les champs modifiables */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Settings className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Mode reprogrammation :</strong> Seuls la date, l'heure, la durée, le fuseau horaire, le mode d'entretien, l'assistant IA et les questions personnalisées peuvent être modifiés.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations non modifiables */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-gray-500" />
                Informations de l'entretien (non modifiables)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="text-gray-600 block">Candidat :</span>
                  <span className="font-medium">{schedule?.candidate_name}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="text-gray-600 block">Email :</span>
                  <span className="font-medium">{schedule?.candidate_email}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="text-gray-600 block">Poste :</span>
                  <span className="font-medium">{schedule?.position}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="text-gray-600 block">Titre :</span>
                  <span className="font-medium">{schedule?.title}</span>
                </div>
                {schedule?.candidate_phone && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="text-gray-600 block">Téléphone :</span>
                    <span className="font-medium">{schedule.candidate_phone}</span>
                  </div>
                )}
                {schedule?.description && (
                  <div className="bg-gray-50 p-3 rounded-md md:col-span-2">
                    <span className="text-gray-600 block">Description :</span>
                    <span className="font-medium">{schedule.description}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Affichage des erreurs */}
            {submitError && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Formulaire de reprogrammation */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section: Planification */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                  Nouvelle planification
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 mb-1">
                      Date et heure <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <input
                        type="datetime-local"
                        id="scheduled_at"
                        name="scheduled_at"
                        value={formData.scheduled_at}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">
                      Durée <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="duration_minutes"
                      name="duration_minutes"
                      value={formData.duration_minutes}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                      Fuseau horaire
                    </label>
                    <select
                      id="timezone"
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    >
                      <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                      <option value="Europe/London">Europe/London (UTC+0)</option>
                      <option value="America/New_York">America/New_York (UTC-5)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-1">
                      Mode d'entretien <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="mode"
                      name="mode"
                      value={formData.mode}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    >
                      <option value="autonomous">Mode autonome</option>
                      <option value="collaborative">Mode collaboratif</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.mode === "autonomous" 
                        ? "L'IA mène l'entretien de manière autonome"
                        : "Vous menez l'entretien avec l'assistance de l'IA"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Assistant IA */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-primary-600" />
                    Assistant IA
                  </h2>
                  <Link
                    href="/ai-assistants/create"
                    target="_blank"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center bg-primary-50 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Créer un assistant
                  </Link>
                </div>

                {loadingAssistants ? (
                  <div className="flex justify-center items-center p-10 border border-dashed border-gray-300 rounded-md bg-gray-50">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary-600 mr-2" />
                    <span className="text-gray-500">Chargement des assistants IA...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Option "Aucun assistant" */}
                    <div
                      className={`flex items-center rounded-lg p-4 cursor-pointer transition-all border ${
                        formData.ai_assistant_id === ""
                          ? "bg-white border-2 border-primary-300 shadow-md"
                          : "bg-gray-50 border border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleAssistantChange("")}
                    >
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gray-400 flex items-center justify-center">
                          <X className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="font-medium text-gray-900">Aucun assistant spécifique</div>
                        <div className="text-sm text-gray-500">Utiliser l'assistant IA générique du système</div>
                      </div>
                      <div className="ml-2">
                        <div
                          className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                            formData.ai_assistant_id === ""
                              ? "border-primary-600 bg-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          {formData.ai_assistant_id === "" && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Liste des assistants */}
                    {assistants.map((assistant) => (
                      <div
                        key={assistant.id}
                        className={`flex items-center rounded-lg p-4 cursor-pointer transition-all border ${
                          formData.ai_assistant_id === assistant.id
                            ? "bg-white border-2 border-primary-300 shadow-md"
                            : "bg-white border border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleAssistantChange(assistant.id)}
                      >
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Brain className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="font-medium text-gray-900">{assistant.name}</div>
                          <div className="text-sm text-gray-500 flex items-center flex-wrap gap-2 mt-1">
                            <span
                              className={`${getAssistantTypeColor(
                                getAssistantTypeSafe(assistant)
                              )} text-xs px-2 py-0.5 rounded-full flex items-center`}
                            >
                              {getAssistantTypeIcon(getAssistantTypeSafe(assistant))}
                              <span className="ml-1">{getAssistantTypeLabel(getAssistantTypeSafe(assistant))}</span>
                            </span>
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                              {assistant.model}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {getAssistantCapabilities(assistant).map((capability, index) => (
                              <span
                                key={index}
                                className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                              >
                                {capability}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="ml-2">
                          <div
                            className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                              formData.ai_assistant_id === assistant.id
                                ? "border-primary-600 bg-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {formData.ai_assistant_id === assistant.id && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section: Questions personnalisées */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-primary-600" />
                    Questions personnalisées
                  </h2>
                  <button
                    type="button"
                    onClick={addCustomQuestion}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center bg-primary-50 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter une question
                  </button>
                </div>

                {formData.predefined_questions.length > 0 ? (
                  <div className="space-y-4 mt-3">
                    {formData.predefined_questions.map((question, index) => (
                      <div
                        key={index}
                        className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              Question {index + 1}
                            </span>
                          </div>
                          <textarea
                            value={question}
                            onChange={(e) => updateCustomQuestion(index, e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                            placeholder="Saisissez votre question ici..."
                            rows={2}
                          ></textarea>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomQuestion(index)}
                          className="ml-3 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                          aria-label="Supprimer cette question"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                    <MessageSquare className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 mb-2">Aucune question personnalisée.</p>
                    <button
                      type="button"
                      onClick={addCustomQuestion}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une question
                    </button>
                  </div>
                )}

                <p className="mt-3 text-sm text-gray-600 flex items-center">
                  <Info className="h-4 w-4 mr-1 text-gray-400" />
                  Ces questions seront posées en complément des questions générées automatiquement par l'IA
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="group px-6 py-3 bg-white border-2 border-gray-400 rounded-lg text-gray-800 hover:border-gray-600 hover:bg-gray-100 transition-all duration-200 flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                  >
                    <X className="h-5 w-5 mr-2 text-gray-600" />
                    <span>Annuler</span>
                  </button>

                  <div className="flex items-center space-x-3">
                    {hasChanges && (
                      <div className="flex items-center text-orange-600">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Modifications non sauvegardées</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !hasChanges}
                    className={`group px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium border border-blue-600 ${
                      isSubmitting || !hasChanges ? "opacity-70 cursor-not-allowed transform-none" : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="animate-spin h-5 w-5 mr-2 text-white" />
                        <span>Reprogrammation en cours...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2 text-white group-hover:scale-110 transition-transform duration-200" />
                        <span>Reprogrammer l'entretien</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

EditInterviewSchedulePage.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>
export default EditInterviewSchedulePage