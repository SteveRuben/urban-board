"use client"

import type React from "react"

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import DashboardLayout from "@/components/layout/dashboard-layout"
import AIAssistantService from "@/services/ai-assistant-service"
import { InterviewSchedulingService } from "@/services/interview-scheduling-service"
import type { ErrorDetails, ExerciseSuggestion, InterviewScheduleFormData, InterviewScheduleFormDataWithExercises } from "@/types/interview-scheduling"
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
  ChevronLeft,
  Trash2,
  Plus,
  Info,
  Star,
  Video,
  MessageSquare,
  Users,
  Check,
  X,
  Code,
  CheckCircle,
} from "lucide-react"
import { AIAssistant, AIAssistantCapabilities, normalizeAssistant } from "@/types/assistant"
import { CodingPlatformService } from '@/services/coding-platform-service';

// Types
interface FormDataType {
  job_role: string
  experience_level: "debutant" | "intermediaire" | "experimente" | "expert"
  job_description: string
  candidate_name: string
  candidate_email: string
  candidate_phone: string
  scheduled_time: string
  interview_mode: "autonomous" | "collaborative"
  interview_duration: number
  custom_questions: string[]
  cv_file_path: string | null
  team_id: string
  ai_assistants: string[]
  application_id: string
  job_id: string
  timezone: string
  mode: "autonomous" | "collaborative",
  exercise_ids: string[];
  auto_select_exercises: boolean;
  coding_difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  coding_time_limit: number;
  exercise_count: number;
}

const getAssistantCapabilities = (assistant: AIAssistant): string[] => {
  const normalizedAssistant = normalizeAssistant(assistant);
  
  const capabilities: AIAssistantCapabilities = normalizedAssistant.capabilities || {};
  const capabilityLabels: string[] = [];
  
  // Mapper les capabilities du modèle vers des labels affichables avec vérifications de type
  if (capabilities.generateQuestions === true) capabilityLabels.push('Questions');
  if (capabilities.evaluateResponses === true) capabilityLabels.push('Évaluation');
  if (capabilities.provideFeedback === true) capabilityLabels.push('Feedback');
  if (capabilities.suggestFollowUps === true) capabilityLabels.push('Suivi');
  if (capabilities.realTimeCoaching === true) capabilityLabels.push('Coaching');
  if (capabilities.biometricIntegration === true) capabilityLabels.push('Biométrie');
  
  // Si aucune capability spécifique n'est trouvée, retourner un label générique
  if (capabilityLabels.length === 0) {
    capabilityLabels.push('Assistant général');
  }
  
  return capabilityLabels;
};

const ScheduleInterviewPage = () => {
  const router = useRouter()
  const { applicationId, jobId, candidateName, candidateEmail, jobTitle, jobDesc, cv_file_path, candidateTel } = router.query

  const [step, setStep] = useState<number>(2) // Commencer à l'étape 2
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [assistants, setAssistants] = useState<AIAssistant[]>([])
  const [loadingAssistants, setLoadingAssistants] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [exerciseSuggestions, setExerciseSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [loadingExercises, setLoadingExercises] = useState<boolean>(false);
  const [exerciseKeywords, setExerciseKeywords] = useState<string[]>([]);
  const [showExerciseSelection, setShowExerciseSelection] = useState<boolean>(false);

  const analyzeError = (error: any): ErrorDetails => {
    console.error('Analyse de l\'erreur:', error);
  
    // Erreur de réseau
    if (!error.response) {
      return {
        type: 'network',
        message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
        actionable: true,
        suggestions: [
          'Vérifiez votre connexion internet',
          'Réessayez dans quelques instants',
          'Contactez le support si le problème persiste'
        ]
      };
    }
  
    const { status, data } = error.response;
    
    // Erreur 409 - Conflit (doublon)
    if (status === 409) {
      const errorType = data.error_type || 'duplicate';
      let message = data.message || 'Un entretien existe déjà pour ce candidat';
      let suggestions: string[] = [];
  
      switch (errorType) {
        case 'already_scheduled':
          suggestions = [
            'Consultez l\'entretien existant',
            'Annulez l\'ancien entretien si nécessaire',
            'Choisissez un autre candidat'
          ];
          break;
        case 'already_completed':
          suggestions = [
            'Consultez les résultats de l\'entretien précédent',
            'Attendez la période de grâce (30 jours)',
            'Contactez l\'administrateur pour une exception'
          ];
          break;
        case 'previous_no_show':
          suggestions = [
            'Attendez la période de grâce (7 jours)',
            'Contactez le candidat pour clarifier',
            'Envisagez un autre mode de contact'
          ];
          break;
      }
  
      return {
        type: 'duplicate',
        message,
        details: { errorType, status },
        actionable: true,
        suggestions
      };
    }
  
    // Erreur 400 - Validation
    if (status === 400) {
      const errors = data.errors || [];
      return {
        type: 'validation',
        message: data.message || 'Données invalides',
        details: errors,
        actionable: true,
        suggestions: [
          'Vérifiez tous les champs requis',
          'Corrigez les erreurs indiquées',
          'Contactez le support si nécessaire'
        ]
      };
    }
  
    // Erreur 500 - Serveur
    if (status >= 500) {
      return {
        type: 'server',
        message: 'Erreur interne du serveur. Veuillez réessayer plus tard.',
        actionable: true,
        suggestions: [
          'Réessayez dans quelques minutes',
          'Sauvegardez vos données localement',
          'Contactez le support technique'
        ]
      };
    }
  
    // Autres erreurs
    return {
      type: 'unknown',
      message: data.message || error.message || 'Une erreur inattendue est survenue',
      details: { status, data },
      actionable: false,
      suggestions: ['Contactez le support technique avec les détails de cette erreur']
    };
  };
  
  const [formData, setFormData] = useState<FormDataType>({
    job_role: "",
    job_description: "",
    experience_level: "intermediaire",
    candidate_name: "",
    candidate_email: "",
    candidate_phone: "",
    scheduled_time: "",
    interview_mode: "autonomous",
    interview_duration: 30,
    custom_questions: [],
    cv_file_path: null,
    team_id: "",
    ai_assistants: [],
    application_id: "",
    job_id: "",
    timezone: "Europe/Paris",
    mode: "autonomous",
    exercise_ids: [],
    auto_select_exercises: true,
    coding_difficulty: 'intermediate',
    coding_time_limit: 120,
    exercise_count: 4
  })

  // Pré-remplir le formulaire avec les paramètres d'URL
  useEffect(() => {
    if (candidateName && typeof candidateName === "string") {
      setFormData((prev) => ({ ...prev, candidate_name: decodeURIComponent(candidateName) }))
    }
    if (candidateEmail && typeof candidateEmail === "string") {
      setFormData((prev) => ({ ...prev, candidate_email: decodeURIComponent(candidateEmail) }))
    }
    if (jobTitle && typeof jobTitle === "string") {
      setFormData((prev) => ({ ...prev, job_role: decodeURIComponent(jobTitle) }))
    }
    if (applicationId && typeof applicationId === "string") {
      setFormData((prev) => ({ ...prev, application_id: applicationId }))
    }
    if (jobId && typeof jobId === "string") {
      setFormData((prev) => ({ ...prev, job_id: jobId }))
    }
    if (jobDesc && typeof jobDesc === "string") {
      setFormData((prev) => ({ ...prev, job_description: jobDesc }))
    }
    if (cv_file_path && typeof cv_file_path === "string") {
      setFormData((prev) => ({ ...prev, cv_file_path: cv_file_path }))
    }
    if (candidateTel && typeof candidateTel === "string") {
      setFormData((prev) => ({ ...prev, candidate_phone: candidateTel }))
    }
  }, [candidateName, candidateEmail, jobTitle, applicationId, jobId, jobDesc, cv_file_path, candidateTel])

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

  useEffect(() => {
    if (formData.job_role && step >= 2) {
      loadExerciseSuggestions();
    }
  }, [formData.job_role, step]);

  // NOUVELLE FONCTION: Charger les suggestions d'exercices
  const loadExerciseSuggestions = async () => {
    if (!formData.job_role.trim()) return;

    try {
      setLoadingExercises(true);
      const suggestions = await InterviewSchedulingService.getExerciseSuggestions({
        position: formData.job_role,
        description: formData.job_description, 
        difficulty: formData.coding_difficulty
      });
      
      setExerciseSuggestions(suggestions.exercises);
      setExerciseKeywords(suggestions.keywords_extracted);
      
      // Sélectionner automatiquement les meilleurs exercices si l'auto-sélection est activée
      if (formData.auto_select_exercises && suggestions.exercises.length > 0) {
        const topExercises = suggestions.exercises
          .slice(0, formData.exercise_count)
          .map(ex => ex.id);
        setFormData(prev => ({ ...prev, exercise_ids: topExercises }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des exercices:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    setFormData(prev => {
      const currentIds = prev.exercise_ids || [];
      if (currentIds.includes(exerciseId)) {
        return {
          ...prev,
          exercise_ids: currentIds.filter(id => id !== exerciseId)
        };
      } else {
        return {
          ...prev,
          exercise_ids: [...currentIds, exerciseId]
        };
      }
    });
  };

  const handleExerciseSelectionModeChange = (autoSelect: boolean) => {
    setFormData(prev => ({ ...prev, auto_select_exercises: autoSelect }));
    
    if (autoSelect && exerciseSuggestions.length > 0) {
      const topExercises = exerciseSuggestions
        .slice(0, formData.exercise_count)
        .map(ex => ex.id);
      setFormData(prev => ({ ...prev, exercise_ids: topExercises }));
    }
  };

  // Gérer les changements de champs du formulaire
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleChangeExperience = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if(value=='debutant'){
      setFormData((prev) => ({ ...prev, coding_difficulty: "beginner" }))}
    else if(value=='intermediaire') {
      setFormData((prev) => ({ ...prev, coding_difficulty: "intermediate" }))
    } else if(value=='experimente') {
      setFormData((prev) => ({ ...prev, coding_difficulty: "expert" }))
    } else {setFormData((prev) => ({ ...prev, coding_difficulty: "expert" }))}
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }


  // Ajouter une question personnalisée
  const addCustomQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      custom_questions: [...prev.custom_questions, ""],
    }))
  }

  // Mettre à jour une question personnalisée
  const updateCustomQuestion = (index: number, value: string) => {
    const updatedQuestions = [...formData.custom_questions]
    updatedQuestions[index] = value
    setFormData((prev) => ({
      ...prev,
      custom_questions: updatedQuestions,
    }))
  }

  // Supprimer une question personnalisée
  const removeCustomQuestion = (index: number) => {
    const updatedQuestions = formData.custom_questions.filter((_, i) => i !== index)
    setFormData((prev) => ({
      ...prev,
      custom_questions: updatedQuestions,
    }))
  }

  // Gérer la sélection/désélection des assistants IA
  const toggleAIAssistant = (assistantId: string) => {
    setFormData((prev) => {
      const currentAssistants = prev.ai_assistants || []
      if (currentAssistants.includes(assistantId)) {
        return {
          ...prev,
          ai_assistants: currentAssistants.filter((id) => id !== assistantId),
        }
      } else {
        return {
          ...prev,
          ai_assistants: [...currentAssistants, assistantId],
        }
      }
    })
  }

  // Mapper les données du formulaire vers le format du service
  const mapFormDataToServiceData = (data: FormDataType): InterviewScheduleFormDataWithExercises => {
    return {
      candidate_name: data.candidate_name,
      candidate_email: data.candidate_email,
      candidate_phone: data.candidate_phone || undefined,
      title: `Entretien ${data.job_role} - ${data.candidate_name}`,
      description: data.job_description || undefined,
      position: data.job_role,
      scheduled_at: data.scheduled_time,
      duration_minutes: data.interview_duration,
      timezone: data.timezone,
      mode: data.mode,
      ai_assistant_id: data.ai_assistants.length > 0 ? data.ai_assistants[0] : undefined,
      predefined_questions: data.custom_questions.filter(q => q.trim() !== ''),
      job_id: data.job_id,
      exercise_ids: formData.auto_select_exercises ? undefined : formData.exercise_ids,
      coding_difficulty: formData.coding_difficulty,
      coding_time_limit: formData.coding_time_limit,
      exercise_count: formData.exercise_count
    }
  }

  // Soumettre le formulaire pour créer l'entretien
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setErrorDetails(null);
  
    try {
      setIsSubmitting(true);
  
      // Valider les données avant soumission
      const serviceData = mapFormDataToServiceData(formData);
      const validationErrors = InterviewSchedulingService.validateScheduleData(serviceData);
      
      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        setErrorDetails({
          type: 'validation',
          message: 'Veuillez corriger les erreurs de validation',
          details: validationErrors,
          actionable: true,
          suggestions: ['Vérifiez tous les champs requis', 'Corrigez les erreurs indiquées']
        });
        setShowErrorModal(true);
        return;
      }
  
      console.log("Création de la planification d'entretien avec les données:", serviceData);
  
      // Appeler le service pour créer la planification
      const schedule = await InterviewSchedulingService.createSchedule(serviceData);
      
      console.log("Planification créée avec succès:", schedule);
  
      // Rediriger vers la page de la planification créée
      router.push(`/interviews/schedule/${schedule.id}?created=true`);
      
    } catch (error: any) {
      console.error("Erreur lors de la création de la planification:", error);
      
      const errorDetails = analyzeError(error);
      setErrorDetails(errorDetails);
      setShowErrorModal(true);
      
      // Afficher aussi l'erreur simple pour compatibilité
      setSubmitError(errorDetails.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Composant Modal d'erreur amélioré
  const ErrorModal = ({ 
    isOpen, 
    onClose, 
    errorDetails 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    errorDetails: ErrorDetails | null; 
  }) => {
    if (!isOpen || !errorDetails) return null;
  
    const getErrorIcon = () => {
      switch (errorDetails.type) {
        case 'duplicate':
          return <AlertTriangle className="h-8 w-8 text-amber-500" />;
        case 'validation':
          return <AlertTriangle className="h-8 w-8 text-red-500" />;
        case 'network':
          return <RefreshCw className="h-8 w-8 text-blue-500" />;
        case 'server':
          return <AlertTriangle className="h-8 w-8 text-red-500" />;
        default:
          return <AlertTriangle className="h-8 w-8 text-gray-500" />;
      }
    };
  
    const getErrorColor = () => {
      switch (errorDetails.type) {
        case 'duplicate':
          return 'border-amber-200 bg-amber-50';
        case 'validation':
          return 'border-red-200 bg-red-50';
        case 'network':
          return 'border-blue-200 bg-blue-50';
        case 'server':
          return 'border-red-200 bg-red-50';
        default:
          return 'border-gray-200 bg-gray-50';
      }
    };
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className={`p-6 border-l-4 ${getErrorColor()}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getErrorIcon()}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {errorDetails.type === 'duplicate' && 'Entretien existant détecté'}
                  {errorDetails.type === 'validation' && 'Erreur de validation'}
                  {errorDetails.type === 'network' && 'Problème de connexion'}
                  {errorDetails.type === 'server' && 'Erreur du serveur'}
                  {errorDetails.type === 'unknown' && 'Erreur inattendue'}
                </h3>
                
                <p className="text-gray-700 mb-4">
                  {errorDetails.message}
                </p>
  
                {/* Détails spécifiques pour les erreurs de validation */}
                {errorDetails.type === 'validation' && errorDetails.details && (
                  <div className="mb-4 p-3 bg-red-100 rounded-md">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Erreurs détectées:</h4>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                      {Object.entries(errorDetails.details).map(([field, error]) => (
                        <li key={field}>{error as string}</li>
                      ))}
                    </ul>
                  </div>
                )}
  
                {/* Suggestions d'actions */}
                {errorDetails.suggestions && errorDetails.suggestions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Que pouvez-vous faire ?</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {errorDetails.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
  
                
              </div>
            </div>
          </div>
  
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
            {errorDetails.type === 'network' && (
              <button
                onClick={() => {
                  onClose();
                  // Relancer la soumission
                  document.querySelector('form')?.requestSubmit();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Valider le formulaire avant de passer à l'étape suivante
  const validateAndProceed = () => {
    setSubmitError(null)
    
    if (step === 2) {
      // Valider les paramètres d'entretien
      if (!formData.interview_duration) {
        setSubmitError("Veuillez spécifier une durée d'entretien.")
        return
      }
      if (!formData.candidate_name.trim()) {
        setSubmitError("Le nom du candidat est requis.")
        return
      }
      if (!formData.candidate_email.trim()) {
        setSubmitError("L'email du candidat est requis.")
        return
      }
      if (!formData.job_role.trim()) {
        setSubmitError("Le poste est requis.")
        return
      }
      setStep(3)
    } else if (step === 3) {
      // Valider les exercices si nécessaire
      if (exerciseSuggestions.length === 0) {
        setSubmitError("Aucun exercice disponible pour ce poste. Veuillez créer des exercices avec le niveau de difficulté spécifié pour l'offre avant de continuer.");
        return;
      }
      
      // Valider les exercices si nécessaire
      if (!formData.auto_select_exercises && formData.exercise_ids.length === 0) {
        setSubmitError('Veuillez sélectionner au moins un exercice ou activer la sélection automatique.');
        return;
      }
      setStep(4);
    }
  }

  // Revenir à l'étape précédente
  const goBack = () => {
    setSubmitError(null)
    if (step > 2) {
      setStep(step - 1)
    } else {
      // Retourner à la liste des candidatures
      router.push(`/jobs/${jobId}/applications`)
    }
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
  return (
    <>
      <Head>
        <title>Programmer un entretien - {formData.candidate_name} - RecruteIA</title>
        <meta name="description" content="Programmer un entretien assisté par IA pour ce candidat" />
      </Head>

      <div className="bg-gray-50 py-8 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="mb-8">
              <Link
                href={`/jobs/${jobId}/applications`}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 bg-white px-3 py-1.5 rounded-full shadow-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux candidatures
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Programmer un entretien</h1>
              <div className="flex flex-wrap items-center gap-2 text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="font-medium">{formData.candidate_name}</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="font-medium">{formData.job_role}</span>
                </div>
              </div>
            </div>

            {/* Affichage des erreurs */}
            {submitError && !showErrorModal && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex justify-between items-start">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{submitError}</p>
                      {errorDetails?.type === 'duplicate' && (
                        <button
                          onClick={() => setShowErrorModal(true)}
                          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Voir les options disponibles
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSubmitError(null);
                      setErrorDetails(null);
                    }}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}  

            {/* Modal d'erreur */}
            <ErrorModal 
              isOpen={showErrorModal}
              onClose={() => setShowErrorModal(false)}
              errorDetails={errorDetails}
            />

            {/* Étapes */}
            <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white">
                    <Check className="h-5 w-5" />
                  </div>
                  <div className="ml-2 text-sm font-medium text-gray-500">Candidat sélectionné</div>
                </div>
                <div className="h-0.5 flex-1 mx-4 bg-primary-600"></div>
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step >= 2 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    2
                  </div>
                  <div className="ml-2 text-sm font-medium">Paramètres d'entretien</div>
                </div>
                <div className={`h-0.5 flex-1 mx-4 ${step > 2 ? "bg-primary-600" : "bg-gray-200"}`}></div>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= 3 ? 'bg-primary-600 text-black' : 'bg-gray-200 text-gray-500'
                  }`}>3</div>
                  <div className="ml-2 text-sm font-medium">Exercices de coding</div>
                </div>
                <div className={`h-0.5 flex-1 mx-4 ${step > 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= 4 ? 'bg-primary-600 text-black' : 'bg-gray-200 text-gray-500'
                  }`}>4</div>
                  <div className="ml-2 text-sm font-medium">Confirmation</div>
                </div>
              </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit}>
              {/* Étape 2 : Paramètres d'entretien */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Section: Mode d'entretien */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Video className="h-5 w-5 mr-2 text-primary-600" />
                      Mode d'entretien
                    </h2>

                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className={`border rounded-lg p-5 cursor-pointer transition-all ${
                          formData.mode === "autonomous"
                            ? "border-primary-600 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                        }`}
                        onClick={() => setFormData((prev) => ({ ...prev, mode: "autonomous" }))}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              formData.mode === "autonomous"
                                ? "border-primary-600 bg-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {formData.mode === "autonomous" && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <label className="ml-3 font-medium text-gray-800">
                            Mode autonome
                          </label>
                        </div>
                        <p className="mt-3 text-sm text-gray-600 ml-8">
                          L'IA mène l'entretien de manière autonome, pose des questions et évalue les réponses
                        </p>
                        <div className="mt-3 ml-8 flex items-center">
                          <Brain className="h-4 w-4 text-primary-600 mr-1" />
                          <span className="text-xs text-primary-700">Entièrement automatisé</span>
                        </div>
                      </div>
                      <div
                        className={`border rounded-lg p-5 cursor-pointer transition-all ${
                          formData.mode === "collaborative"
                            ? "border-gray-600 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                        }`}
                        onClick={() => setFormData((prev) => ({ ...prev, mode: "collaborative" }))}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              formData.mode === "collaborative"
                                ? "border-gray-600 bg-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {formData.mode === "collaborative" && <Check className="h-3 w-3 text-white " />}
                          </div>
                          <label className="ml-3 font-medium text-gray-800">
                            Mode collaboratif
                          </label>
                        </div>
                        <p className="mt-3 text-sm text-gray-600 ml-8">
                          Vous menez l'entretien avec l'assistance de l'IA qui suggère des questions et analyse les
                          réponses
                        </p>
                        <div className="mt-3 ml-8 flex items-center">
                          <Users className="h-4 w-4 text-gray-600 mr-1" />
                          <span className="text-xs text-gray-700">Collaboration humain-IA</span>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Section: Paramètres généraux */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-primary-600" />
                      Paramètres généraux
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 mb-1">
                          Niveau d'expérience requis <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="experience_level"
                          name="experience_level"
                          value={formData.experience_level}
                          onChange={handleChangeExperience}
                          required
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                        >
                          <option value="debutant">Débutant (0-2 ans)</option>
                          <option value="intermediaire">Intermédiaire (2-5 ans)</option>
                          <option value="experimente">Expérimenté (5-8 ans)</option>
                          <option value="expert">Expert (8+ ans)</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="interview_duration" className="block text-sm font-medium text-gray-700 mb-1">
                          Durée de l'entretien <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="interview_duration"
                          name="interview_duration"
                          value={formData.interview_duration}
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

                      <div className="md:col-span-2">
                        <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700 mb-1">
                          Date et heure planifiées
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <input
                            type="datetime-local"
                            id="scheduled_time"
                            name="scheduled_time"
                            value={formData.scheduled_time}
                            onChange={handleChange}
                            className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500 flex items-center">
                          <Info className="h-3 w-3 mr-1" />
                          Optionnel - si vous souhaitez planifier l'entretien pour plus tard
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section: Assistants IA */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-primary-600" />
                        Assistants IA
                      </h2>
                      <Link
                        href="/ai-assistants/new"
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
                    ) : assistants.length === 0 ? (
                      <div className="text-center p-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                        <Brain className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600 mb-4">Vous n'avez pas encore d'assistants IA.</p>
                        <Link
                          href="/ai-assistants/new"
                          target="_blank"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <Plus className="h-4 w-4 mr-2 bg-blue-500" />
                          Créer un assistant IA
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto p-3 border border-gray-200 rounded-md bg-gray-50">
                        {assistants.map((assistant) => (
                        <div
                          key={assistant.id}
                          className={`flex items-center rounded-lg p-4 cursor-pointer transition-all ${
                            formData.ai_assistants.includes(assistant.id)
                              ? "bg-white border-2 border-primary-300 shadow-md"
                              : "bg-white border border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => toggleAIAssistant(assistant.id)}
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
                                formData.ai_assistants.includes(assistant.id)
                                  ? "border-primary-600 bg-blue-600"
                                  : "border-gray-300"
                              }`}
                            >
                              {formData.ai_assistants.includes(assistant.id) && (
                                <Check className="h-4 w-4 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      </div>
                    )}
                    <p className="mt-3 text-sm text-gray-600 flex items-center">
                      <Info className="h-4 w-4 mr-1 text-gray-400" />
                      Les assistants IA sélectionnés participeront à l'entretien en analysant les réponses en temps réel
                    </p>
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

                    {formData.custom_questions.length > 0 ? (
                      <div className="space-y-4 mt-3">
                        {formData.custom_questions.map((question, index) => (
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
                              <Trash2 className="h-5 w-5" />
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
                </div>
              )}

              {step === 3 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">Exercices de coding</h2>
                  
                  <div className="space-y-6">
                    {/* Mode de sélection des exercices */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Mode de sélection des exercices
                      </label>
                      <div className="space-y-4">
                        <div 
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            formData.auto_select_exercises 
                              ? 'border-primary-600 bg-primary-50' 
                              : 'border-gray-300 hover:border-primary-300'
                          }`}
                          onClick={() => handleExerciseSelectionModeChange(true)}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="auto_select"
                              name="exercise_selection_mode"
                              value="auto"
                              checked={formData.auto_select_exercises}
                              onChange={() => handleExerciseSelectionModeChange(true)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <label htmlFor="auto_select" className="ml-3 font-medium text-gray-800">
                              Sélection automatique
                            </label>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 ml-7">
                            L'IA sélectionne automatiquement les exercices les plus pertinents selon le poste
                          </p>
                        </div>
                        
                        <div 
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            !formData.auto_select_exercises 
                              ? 'border-primary-600 bg-primary-50' 
                              : 'border-gray-300 hover:border-primary-300'
                          }`}
                          onClick={() => handleExerciseSelectionModeChange(false)}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="manual_select"
                              name="exercise_selection_mode"
                              value="manual"
                              checked={!formData.auto_select_exercises}
                              onChange={() => handleExerciseSelectionModeChange(false)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <label htmlFor="manual_select" className="ml-3 font-medium text-gray-800">
                              Sélection manuelle
                            </label>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 ml-7">
                            Choisissez manuellement les exercices spécifiques que vous souhaitez assigner
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Paramètres de sélection automatique */}
                    {formData.auto_select_exercises && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label htmlFor="exercise_count" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre d'exercices
                          </label>
                          <select
                            id="exercise_count"
                            name="exercise_count"
                            value={formData.exercise_count}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              exercise_count: parseInt(e.target.value) 
                            }))}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="2">2 exercices</option>
                            <option value="3">3 exercices</option>
                            <option value="4">4 exercices</option>
                            <option value="5">5 exercices</option>
                          </select>
                        </div>
                        
                        {/* <div>
                          <label htmlFor="coding_difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                            Niveau de difficulté
                          </label>
                          <select
                            id="coding_difficulty"
                            name="coding_difficulty"
                            value={formData.coding_difficulty}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              coding_difficulty: e.target.value as any 
                            }))}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="beginner">Débutant</option>
                            <option value="intermediate">Intermédiaire</option>
                            <option value="advanced">Avancé</option>
                            <option value="expert">Expert</option>
                          </select>
                        </div> */}
                        
                        <div>
                          <label htmlFor="coding_time_limit" className="block text-sm font-medium text-gray-700 mb-1">
                            Temps limite (minutes)
                          </label>
                          <select
                            id="coding_time_limit"
                            name="coding_time_limit"
                            value={formData.coding_time_limit}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              coding_time_limit: parseInt(e.target.value) 
                            }))}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="60">1 heure</option>
                            <option value="90">1h30</option>
                            <option value="120">2 heures</option>
                            <option value="180">3 heures</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Affichage des mots-clés détectés */}
                    {exerciseKeywords.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">
                          Compétences détectées pour "{formData.job_role}"
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {exerciseKeywords.map((keyword, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Liste des exercices suggérés */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          {formData.auto_select_exercises ? 'Exercices sélectionnés automatiquement' : 'Exercices disponibles'}
                        </label>
                        <button
                          type="button"
                          onClick={loadExerciseSuggestions}
                          disabled={loadingExercises}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          {loadingExercises ? 'Chargement...' : 'Actualiser'}
                        </button>
                      </div>
                      
                      {loadingExercises ? (
                        <div className="flex justify-center items-center p-8 border border-dashed border-gray-300 rounded-md">
                          <RefreshCw className="h-6 w-6 animate-spin text-primary-600 mr-2" />
                          <span className="text-gray-500">Recherche d'exercices pertinents...</span>
                        </div>
                      ) : exerciseSuggestions.length === 0 ? (
                        <div className="text-center p-6 border border-dashed border-red-300 rounded-md bg-red-50">
                          <Code className="h-10 w-10 mx-auto text-red-400 mb-3" />
                          <p className="text-red-700 font-medium mb-2">Aucun exercice disponible pour ce poste</p>
                          <p className="text-sm text-red-600 mb-4">
                            Il faut créer des exercices correspondant aux compétences requises avant de pouvoir programmer l'entretien.
                          </p>
                          
                          {/* Affichage des mots-clés détectés pour guider la création */}
                          {exerciseKeywords.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm text-red-600 mb-2">Compétences à couvrir :</p>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {exerciseKeywords.map((keyword, index) => (
                                  <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <Link
                            href="/coding-admin/exercises/new"
                            target="_blank"
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Créer des exercices
                          </Link>
                          
                          <p className="text-xs text-red-500 mt-3">
                            Après avoir créé les exercices, revenez et actualisez cette page.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-3">
                          {exerciseSuggestions.map((exercise) => (
                            <div 
                              key={exercise.id}
                              className={`rounded-lg p-4 cursor-pointer transition-colors ${
                                formData.exercise_ids.includes(exercise.id) 
                                  ? 'bg-primary-50 border-2 border-primary-300' 
                                  : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                              } ${formData.auto_select_exercises ? 'pointer-events-none opacity-75' : ''}`}
                              onClick={() => !formData.auto_select_exercises && toggleExerciseSelection(exercise.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900">{exercise.title}</h4>
                                    {exercise.relevance_score && (
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                                        {Math.round(exercise.relevance_score * 10)}% pertinent
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="bg-gray-100 px-2 py-1 rounded">{exercise.language}</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">{exercise.difficulty}</span>
                                    <span>{exercise.challenge_count} challenge{exercise.challenge_count > 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                                {!formData.auto_select_exercises && (
                                  <div className="ml-2">
                                    {formData.exercise_ids.includes(exercise.id) ? (
                                      <CheckCircle className="h-5 w-5 text-primary-600" />
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {!formData.auto_select_exercises && exerciseSuggestions.length > 0 && (
                        <p className="mt-2 text-xs text-gray-500">
                          {formData.exercise_ids.length} exercice{formData.exercise_ids.length > 1 ? 's' : ''} sélectionné{formData.exercise_ids.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Étape 3 : Confirmation */}
              {step === 4 && (
                <div className="space-y-6">
                  {/* Section: Résumé des informations */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary-600" />
                      Récapitulatif de l'entretien
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Candidat</h3>
                          <p className="font-medium text-gray-900">{formData.candidate_name}</p>
                          {formData.candidate_email && (
                            <p className="text-gray-600 text-sm">{formData.candidate_email}</p>
                          )}
                          {formData.candidate_phone && (
                            <p className="text-gray-600 text-sm">{formData.candidate_phone}</p>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Poste recherché</h3>
                          <p className="font-medium text-gray-900">{formData.job_role}</p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Niveau d'expérience</h3>
                          <p className="font-medium text-gray-900">
                            {formData.experience_level === "debutant"
                              ? "Débutant (0-2 ans)"
                              : formData.experience_level === "intermediaire"
                                ? "Intermédiaire (2-5 ans)"
                                : formData.experience_level === "experimente"
                                  ? "Expérimenté (5-8 ans)"
                                  : "Expert (8+ ans)"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Mode d'entretien</h3>
                          <p className="font-medium text-gray-900">
                            {formData.mode === "autonomous" ? "Mode autonome" : "Mode collaboratif"}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Durée prévue</h3>
                          <p className="font-medium text-gray-900">
                            {InterviewSchedulingService.formatDuration(formData.interview_duration)}
                          </p>
                        </div>

                        {formData.scheduled_time && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Date et heure</h3>
                            <p className="font-medium text-gray-900">
                              {InterviewSchedulingService.formatScheduledDateTime(formData.scheduled_time, formData.timezone)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-sm text-gray-500 mb-3">Exercices de coding</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-gray-600">Mode de sélection:</span>
                            <p className="font-medium">
                              {formData.auto_select_exercises ? 'Automatique' : 'Manuel'}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Nombre d'exercices:</span>
                            <p className="font-medium">
                              {formData.auto_select_exercises 
                                ? formData.exercise_count 
                                : formData.exercise_ids.length
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Temps limite:</span>
                            <p className="font-medium">{formData.coding_time_limit} minutes</p>
                          </div>
                        </div>
                        
                        {!formData.auto_select_exercises && formData.exercise_ids.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600 block mb-2">Exercices sélectionnés:</span>
                            <div className="space-y-1">
                              {formData.exercise_ids.map(exerciseId => {
                                const exercise = exerciseSuggestions.find(ex => ex.id === exerciseId);
                                return exercise ? (
                                  <div key={exerciseId} className="text-sm bg-white rounded px-3 py-2 border">
                                    <span className="font-medium">{exercise.title}</span>
                                    <span className="text-gray-500 ml-2">({exercise.language}, {exercise.difficulty})</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                        
                        {exerciseKeywords.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm text-gray-600 block mb-2">Compétences ciblées:</span>
                            <div className="flex flex-wrap gap-1">
                              {exerciseKeywords.map((keyword, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Affichage des assistants IA sélectionnés */}
                    {formData.ai_assistants.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">
                          Assistants IA sélectionnés ({formData.ai_assistants.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {formData.ai_assistants.map((assistantId) => {
                            const assistant = assistants.find((a) => a.id === assistantId)
                            return assistant ? (
                              <div
                                key={assistantId}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                <Brain className="h-3 w-3 mr-1" />
                                {assistant.name}
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {formData.custom_questions.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">
                          Questions personnalisées ({formData.custom_questions.filter(q => q.trim()).length})
                        </h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {formData.custom_questions.filter(q => q.trim()).map((question, index) => (
                            <li key={index} className="text-gray-600 text-sm">
                              {question}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {formData.ai_assistants.length === 0 && (
                      <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-700">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm">
                              Aucun assistant IA n'a été sélectionné. L'entretien sera mené uniquement avec l'IA
                              générique du système.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Info className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm">
                            {formData.interview_mode === "autonomous"
                              ? "L'IA mènera cet entretien de manière autonome. Vous pourrez consulter les résultats une fois terminé."
                              : "Vous mènerez l'entretien avec l'assistance de l'IA, qui vous suggérera des questions et évaluera les réponses."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons de navigation  */}
              <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button
                    type="button"
                    onClick={goBack}
                    className="group px-6 py-3 bg-white border-2 border-gray-400 rounded-lg text-gray-800 hover:border-gray-600 hover:bg-gray-100 transition-all duration-200 flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2 text-gray-600 group-hover:-translate-x-1 transition-transform duration-200" />
                    <span>{step === 3 ? "Retour aux candidatures" : "Étape précédente"}</span>
                  </button>

                  {/* Indicateur de progression */}
                  <div className="flex items-center space-x-3 bg-gray-100 px-4 py-2 rounded-full">
                    <div className="text-sm font-medium text-gray-700">Étape {step} sur 4</div>
                    <div className="flex space-x-1">
                      {[2, 4].map((stepNumber) => (
                        <div
                          key={stepNumber}
                          className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                            step >= stepNumber ? "bg-blue-600" : "bg-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {step < 4 ? (
                    <button
                    type="button"
                    onClick={validateAndProceed}
                    disabled={step === 3 && exerciseSuggestions.length === 0}
                    className={`group px-8 py-3 rounded-lg transition-all duration-200 flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium border ${
                      step === 3 && exerciseSuggestions.length === 0
                        ? 'bg-gray-400 text-gray-600 border-gray-400 cursor-not-allowed transform-none'
                        : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <span>Continuer</span>
                    <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`group px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium border border-green-600 ${
                        isSubmitting ? "opacity-70 cursor-not-allowed transform-none" : ""
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="animate-spin h-5 w-5 mr-2 text-white" />
                          <span>Programmation en cours...</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="h-5 w-5 mr-2 text-white group-hover:scale-110 transition-transform duration-200" />
                          <span>Programmer l'entretien</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Barre de progression */}
                <div className="mt-6 w-full bg-gray-300 rounded-full h-3 shadow-inner">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${((step - 1) / 3) * 100}%` }}
                  ></div>
                </div>

                {/* Texte d'aide */}
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    {step === 2
                      ? "Configurez les paramètres de votre entretien"
                      : "Vérifiez les informations avant de programmer l'entretien"}
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

ScheduleInterviewPage.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>
export default ScheduleInterviewPage