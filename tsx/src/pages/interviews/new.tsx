// frontend/pages/interviews/new.tsx (mise à jour)
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import ResumeUpload from '@/components/resume/resume-upload';
import AIAssistantService from '@/services/ai-assistant-service';
import axios from 'axios';
import { Brain, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { InterviewSchedulingService } from '@/services/interview-scheduling-service';
import { CodingPlatformService } from '@/services/coding-platform-service';
import { ExerciseSuggestion } from '@/types/interview-scheduling';


// Types
interface FormDataType {
  job_role: string;
  experience_level: 'debutant' | 'intermediaire' | 'experimente' | 'expert';
  candidate_name: string;
  candidate_email: string;
  scheduled_time: string;
  interview_mode: 'autonomous' | 'collaborative';
  interview_duration: number;
  custom_questions: string[];
  resume_id: string | null;
  team_id: string;
  ai_assistants: string[];
  exercise_ids: number[];
  auto_select_exercises: boolean;
  coding_difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  coding_time_limit: number;
  exercise_count: number;
}

interface AIAssistantCapabilities {
  analysis_types: string[];
}

interface AIAssistant {
  id: string;
  name: string;
  assistant_type: 'evaluator' | 'recruiter' | 'analyzer' | string;
  model_version: string;
  capabilities: AIAssistantCapabilities;
}

interface Contact {
  email: string;
  phone: string;
  linkedin: string;
}

interface Question {
  question: string;
  rationale: string;
}

interface ResumeAnalysis {
  resume_summary?: string;
  technical_skills?: string[];
  soft_skills?: string[];
  contact_info?: Contact;
  recommended_questions?: Question[];
  error?: string;
  metadata?: {
    filename: string;
    analysis_timestamp: string;
    job_role: string;
  };
}

const NewInterviewPage = () => {
  const router = useRouter();
  const { candidate, job_role } = router.query;
  
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [assistants, setAssistants] = useState<AIAssistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState<boolean>(false);
  const [exerciseSuggestions, setExerciseSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [loadingExercises, setLoadingExercises] = useState<boolean>(false);
  const [exerciseKeywords, setExerciseKeywords] = useState<string[]>([]);
  const [showExerciseSelection, setShowExerciseSelection] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormDataType>({
    job_role: '',
    experience_level: 'intermediaire',
    candidate_name: '',
    candidate_email: '',
    scheduled_time: '',
    interview_mode: 'autonomous',
    interview_duration: 30,
    custom_questions: [],
    resume_id: null,
    team_id: '',
    ai_assistants: [],
    exercise_ids: [],
    auto_select_exercises: true,
    coding_difficulty: 'intermediate',
    coding_time_limit: 120,
    exercise_count: 4
  });

  // Pré-remplir le formulaire avec les paramètres d'URL s'ils existent
  useEffect(() => {
    if (candidate && typeof candidate === 'string') {
      setFormData(prev => ({ ...prev, candidate_email: candidate }));
    }
    if (job_role && typeof job_role === 'string') {
      setFormData(prev => ({ ...prev, job_role }));
    }
  }, [candidate, job_role]);

  // Charger les assistants IA disponibles
  useEffect(() => {
    const fetchAssistants = async () => {
      if (step < 2) return; // Charger uniquement à l'étape 2
      
      try {
        setLoadingAssistants(true);
        // Utiliser des données mockées en développement
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 800));
          const mockAssistants: AIAssistant[] = [
            {
              id: 'ai-001',
              name: 'TechEvaluator',
              assistant_type: 'evaluator',
              model_version: 'claude-3.7-sonnet',
              capabilities: {
                analysis_types: ['technical', 'general', 'bias']
              }
            },
            {
              id: 'ai-002',
              name: 'HR Assistant',
              assistant_type: 'recruiter',
              model_version: 'gpt-4o',
              capabilities: {
                analysis_types: ['behavioral', 'cultural-fit']
              }
            },
            {
              id: 'ai-003',
              name: 'Language Analyst',
              assistant_type: 'analyzer',
              model_version: 'claude-3-opus',
              capabilities: {
                analysis_types: ['language', 'communication']
              }
            }
          ];
          setAssistants(mockAssistants);
        } else {
          const userAssistants = await AIAssistantService.getUserAssistants();
          setAssistants(userAssistants);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des assistants:', error);
      } finally {
        setLoadingAssistants(false);
      }
    };
    
    fetchAssistants();
  }, [step]);

  useEffect(() => {
    if (formData.job_role && step >= 2) {
      loadExerciseSuggestions();
    }
  }, [formData.job_role, step]);

  // Charger les suggestions d'exercices
  const loadExerciseSuggestions = async () => {
    if (!formData.job_role.trim()) return;

    try {
      setLoadingExercises(true);
      const suggestions = await InterviewSchedulingService.getExerciseSuggestions({
        position: formData.job_role,
        description: '', // Pourrait être ajouté plus tard
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

  //  Gérer la sélection/déselection d'exercices
  const toggleExerciseSelection = (exerciseId: number) => {
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

  // Gérer le changement de mode de sélection d'exercices
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
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gérer l'analyse du CV
  const handleResumeAnalysis = (analysis: ResumeAnalysis) => {
    setResumeAnalysis(analysis);
    
    // Pré-remplir les champs avec les données d'analyse
    if (analysis && !analysis.error) {
      // Extraire le nom du candidat à partir de l'email si disponible
      let candidateName = formData.candidate_name;
      if (!candidateName && analysis.contact_info?.email) {
        const emailParts = analysis.contact_info.email.split('@')[0];
        candidateName = emailParts
          .split(/[._-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
      
      setFormData(prev => ({
        ...prev,
        candidate_name: candidateName || prev.candidate_name,
        candidate_email: analysis.contact_info?.email || prev.candidate_email,
        resume_id: `resume-${Date.now()}`, // Simuler un ID de CV pour le développement
        // Ajouter les questions recommandées comme questions personnalisées si disponibles
        custom_questions: analysis.recommended_questions 
          ? analysis.recommended_questions.map(q => q.question) 
          : prev.custom_questions
      }));
    }
  };

  // Ajouter une question personnalisée
  const addCustomQuestion = () => {
    setFormData(prev => ({
      ...prev,
      custom_questions: [...prev.custom_questions, '']
    }));
  };

  // Mettre à jour une question personnalisée
  const updateCustomQuestion = (index: number, value: string) => {
    const updatedQuestions = [...formData.custom_questions];
    updatedQuestions[index] = value;
    setFormData(prev => ({
      ...prev,
      custom_questions: updatedQuestions
    }));
  };

  // Supprimer une question personnalisée
  const removeCustomQuestion = (index: number) => {
    const updatedQuestions = formData.custom_questions.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      custom_questions: updatedQuestions
    }));
  };

  // Gérer la sélection/désélection des assistants IA
  const toggleAIAssistant = (assistantId: string) => {
    setFormData(prev => {
      const currentAssistants = prev.ai_assistants || [];
      if (currentAssistants.includes(assistantId)) {
        return {
          ...prev,
          ai_assistants: currentAssistants.filter(id => id !== assistantId)
        };
      } else {
        return {
          ...prev,
          ai_assistants: [...currentAssistants, assistantId]
        };
      }
    });
  };

  // Soumettre le formulaire pour créer l'entretien
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      const submissionData = {
        ...formData,
        candidate_name: formData.candidate_name,
        candidate_email: formData.candidate_email,
        title: `Entretien ${formData.job_role}`,
        position: formData.job_role,
        scheduled_at: formData.scheduled_time,
        duration_minutes: formData.interview_duration,
        mode: formData.interview_mode,
        
        description: `Entretien pour le poste de ${formData.job_role}`,
        predefined_questions: formData.custom_questions,
        exercise_ids: formData.auto_select_exercises ? undefined : formData.exercise_ids,
        coding_difficulty: formData.coding_difficulty,
        coding_time_limit: formData.coding_time_limit,
        exercise_count: formData.exercise_count
      };
      // En production, appeler l'API pour créer l'entretien
      const response = await InterviewSchedulingService.createSchedule(submissionData);;
      router.push(`/interviews/${response.id}`);
    } catch (err) {
      console.error('Erreur lors de la création de l\'entretien:', err);
      alert('Impossible de créer l\'entretien. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  };

  // Valider le formulaire avant de passer à l'étape suivante
  const validateAndProceed = () => {
    if (step === 1) {
      // Valider les informations de base
      if (!formData.job_role || !formData.candidate_name) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Valider les paramètres d'entretien
      if (!formData.interview_duration) {
        alert('Veuillez spécifier une durée d\'entretien.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Valider les exercices si nécessaire
      if (!formData.auto_select_exercises && formData.exercise_ids.length === 0) {
        alert('Veuillez sélectionner au moins un exercice ou activer la sélection automatique.');
        return;
      }
      setStep(4);
    }
  };

  // Revenir à l'étape précédente
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Obtenir un label pour le type d'assistant
  const getAssistantTypeLabel = (type: string): string => {
    switch (type) {
      case 'recruiter': return 'Recruteur';
      case 'evaluator': return 'Évaluateur';
      case 'analyzer': return 'Analyseur';
      default: return 'Assistant général';
    }
  };

  return (
    <>
      <Head>
        <title>Nouvel entretien - RecruteIA</title>
        <meta name="description" content="Créer un nouvel entretien assisté par IA" />
      </Head>

      <div className="bg-gray-50 py-8 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* En-tête */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Créer un nouvel entretien</h1>
              <p className="text-gray-600">Configurez les paramètres pour démarrer un entretien assisté par IA</p>
            </div>

            {/* Étapes */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= 1 ? 'bg-primary-600 text-black' : 'bg-gray-200 text-gray-500'
                  }`}>
                    1
                  </div>
                  <div className="ml-2 text-sm font-medium">Informations de base</div>
                </div>
                <div className={`h-0.5 flex-1 mx-4 ${step > 1 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= 2 ? 'bg-primary-600 text-black' : 'bg-gray-200 text-gray-500'
                  }`}>
                    2
                  </div>
                  <div className="ml-2 text-sm font-medium">Paramètres d'entretien</div>
                </div>
                <div className={`h-0.5 flex-1 mx-4 ${step > 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
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
              {/* Étape 1 : Informations de base */}
              {step === 1 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">Informations de base</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="job_role" className="block text-sm font-medium text-gray-700 mb-1">
                        Poste recherché *
                      </label>
                      <input
                        type="text"
                        id="job_role"
                        name="job_role"
                        value={formData.job_role}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ex: Développeur Front-end, Data Scientist, DevOps..."
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 mb-1">
                        Niveau d'expérience requis *
                      </label>
                      <select
                        id="experience_level"
                        name="experience_level"
                        value={formData.experience_level}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="debutant">Débutant (0-2 ans)</option>
                        <option value="intermediaire">Intermédiaire (2-5 ans)</option>
                        <option value="experimente">Expérimenté (5-8 ans)</option>
                        <option value="expert">Expert (8+ ans)</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="candidate_name" className="block text-sm font-medium text-gray-700 mb-1">
                          Nom du candidat *
                        </label>
                        <input
                          type="text"
                          id="candidate_name"
                          name="candidate_name"
                          value={formData.candidate_name}
                          onChange={handleChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Prénom et nom du candidat"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="candidate_email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email du candidat
                        </label>
                        <input
                          type="email"
                          id="candidate_email"
                          name="candidate_email"
                          value={formData.candidate_email}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="email@exemple.com"
                        />
                        <p className="mt-1 text-xs text-gray-500">Pour envoyer une invitation au candidat (optionnel)</p>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-3">
                        CV du candidat (optionnel)
                      </label>
                      <ResumeUpload 
                        onAnalysisComplete={handleResumeAnalysis} 
                        jobRole={formData.job_role}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Le téléchargement d'un CV permettra de personnaliser l'entretien en fonction du profil du candidat
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 2 : Paramètres d'entretien */}
              {step === 2 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">Paramètres d'entretien</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="interview_mode" className="block text-sm font-medium text-gray-700 mb-1">
                        Mode d'entretien
                      </label>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            formData.interview_mode === 'autonomous' 
                              ? 'border-primary-600 bg-primary-50' 
                              : 'border-gray-300 hover:border-primary-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, interview_mode: 'autonomous' }))}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="mode_autonomous"
                              name="interview_mode"
                              value="autonomous"
                              checked={formData.interview_mode === 'autonomous'}
                              onChange={handleChange}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <label htmlFor="mode_autonomous" className="ml-3 font-medium text-gray-800">
                              Mode autonome
                            </label>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 ml-7">
                            L'IA mène l'entretien de manière autonome, pose des questions et évalue les réponses
                          </p>
                        </div>
                        
                        <div 
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            formData.interview_mode === 'collaborative' 
                              ? 'border-primary-600 bg-primary-50' 
                              : 'border-gray-300 hover:border-primary-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, interview_mode: 'collaborative' }))}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="mode_collaborative"
                              name="interview_mode"
                              value="collaborative"
                              checked={formData.interview_mode === 'collaborative'}
                              onChange={handleChange}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <label htmlFor="mode_collaborative" className="ml-3 font-medium text-gray-800">
                              Mode collaboratif
                            </label>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 ml-7">
                            Vous menez l'entretien avec l'assistance de l'IA qui suggère des questions et analyse les réponses
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="interview_duration" className="block text-sm font-medium text-gray-700 mb-1">
                          Durée de l'entretien (minutes) *
                        </label>
                        <select
                          id="interview_duration"
                          name="interview_duration"
                          value={formData.interview_duration}
                          onChange={handleChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="45">45 minutes</option>
                          <option value="60">60 minutes</option>
                          <option value="90">90 minutes</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700 mb-1">
                          Date et heure planifiées
                        </label>
                        <input
                          type="datetime-local"
                          id="scheduled_time"
                          name="scheduled_time"
                          value={formData.scheduled_time}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">Optionnel - si vous souhaitez planifier l'entretien</p>
                      </div>
                    </div>
                    
                    {/* Nouvelle section: Assistants IA */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Assistants IA
                        </label>
                        <a 
                          href="/ai-assistants/create"
                          target="_blank"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          + Créer un assistant
                        </a>
                      </div>
                      
                      {loadingAssistants ? (
                        <div className="flex justify-center items-center p-8 border border-dashed border-gray-300 rounded-md">
                          <RefreshCw className="h-6 w-6 animate-spin text-primary-600 mr-2" />
                          <span className="text-gray-500">Chargement des assistants IA...</span>
                        </div>
                      ) : assistants.length === 0 ? (
                        <div className="text-center p-6 border border-dashed border-gray-300 rounded-md">
                          <Brain className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600 mb-3">Vous n'avez pas encore d'assistants IA.</p>
                          <a 
                            href="/ai-assistants/create"
                            target="_blank"
                            className="inline-flex items-center px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700"
                          >
                            Créer un assistant IA
                          </a>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto p-3 border border-gray-200 rounded-md">
                          {assistants.map((assistant) => (
                            <div 
                              key={assistant.id}
                              className={`flex items-center rounded-lg p-3 cursor-pointer transition-colors ${
                                formData.ai_assistants.includes(assistant.id) 
                                  ? 'bg-primary-50 border border-primary-300' 
                                  : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => toggleAIAssistant(assistant.id)}
                            >
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                                  <Brain className="h-5 w-5 text-black" />
                                </div>
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="font-medium text-gray-900">{assistant.name}</div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                                    {getAssistantTypeLabel(assistant.assistant_type)}
                                  </span>
                                  <span className="mx-1">•</span>
                                  <span>{assistant.model_version}</span>
                                </div>
                              </div>
                              <div className="ml-2">
                                {formData.ai_assistants.includes(assistant.id) ? (
                                  <CheckCircle className="h-5 w-5 text-primary-600" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        Les assistants IA sélectionnés participeront à l'entretien en analysant les réponses en temps réel
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Questions personnalisées
                        </label>
                        <button
                          type="button"
                          onClick={addCustomQuestion}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          + Ajouter une question
                        </button>
                      </div>
                      
                      {formData.custom_questions.length > 0 ? (
                        <div className="space-y-3 mt-3">
                          {formData.custom_questions.map((question, index) => (
                            <div key={index} className="flex items-start">
                              <div className="flex-1">
                                <textarea
                                  value={question}
                                  onChange={(e) => updateCustomQuestion(index, e.target.value)}
                                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="Saisissez votre question ici..."
                                  rows={2}
                                ></textarea>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCustomQuestion(index)}
                                className="ml-2 text-red-500 hover:text-red-700 mt-3"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 my-4 p-4 border border-dashed border-gray-300 rounded-md">
                          Aucune question personnalisée. Cliquez sur "Ajouter une question" pour en créer une.
                        </p>
                      )}
                      
                      <p className="mt-2 text-xs text-gray-500">
                        Ces questions seront posées en complément des questions générées automatiquement par l'IA
                      </p>
                    </div>
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
                        
                        <div>
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
                        </div>
                        
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
                        <div className="text-center p-6 border border-dashed border-gray-300 rounded-md">
                          <Code className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600 mb-3">Aucun exercice trouvé pour ce poste.</p>
                          <p className="text-sm text-gray-500">
                            Vous pourrez créer ou assigner des exercices après la création de l'entretien.
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
              {step === 3 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">Récapitulatif de l'entretien</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm text-gray-500">Poste recherché</h3>
                        <p className="font-medium">{formData.job_role}</p>
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500">Niveau d'expérience</h3>
                        <p className="font-medium">{
                          formData.experience_level === 'debutant' ? 'Débutant (0-2 ans)' :
                          formData.experience_level === 'intermediaire' ? 'Intermédiaire (2-5 ans)' :
                          formData.experience_level === 'experimente' ? 'Expérimenté (5-8 ans)' :
                          'Expert (8+ ans)'
                        }</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm text-gray-500">Candidat</h3>
                        <p className="font-medium">{formData.candidate_name}</p>
                        {formData.candidate_email && <p className="text-gray-600">{formData.candidate_email}</p>}
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500">Mode d'entretien</h3>
                        <p className="font-medium">
                          {formData.interview_mode === 'autonomous' ? 'Autonome' : 'Collaboratif'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm text-gray-500">Durée prévue</h3>
                        <p className="font-medium">{formData.interview_duration} minutes</p>
                      </div>
                      {formData.scheduled_time && (
                        <div>
                          <h3 className="text-sm text-gray-500">Date et heure</h3>
                          <p className="font-medium">{new Date(formData.scheduled_time).toLocaleString('fr-FR')}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Affichage des assistants IA sélectionnés */}
                    {formData.ai_assistants.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm text-gray-500 mb-2">Assistants IA sélectionnés ({formData.ai_assistants.length})</h3>
                        <div className="flex flex-wrap gap-2">
                          {formData.ai_assistants.map(assistantId => {
                            const assistant = assistants.find(a => a.id === assistantId);
                            return assistant ? (
                              <div key={assistantId} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                <Brain className="h-3 w-3 mr-1" />
                                {assistant.name}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    
                    {formData.custom_questions.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm text-gray-500 mb-2">Questions personnalisées ({formData.custom_questions.length})</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {formData.custom_questions.map((question, index) => (
                            <li key={index} className="text-gray-600">{question}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {resumeAnalysis && (
                      <div className="mt-4">
                        <h3 className="text-sm text-gray-500 mb-2">CV analysé</h3>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <p className="text-gray-600 text-sm">
                            {resumeAnalysis.metadata?.filename}
                          </p>
                        </div>
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
                              Aucun assistant IA n'a été sélectionné. L'entretien sera mené uniquement avec l'IA générique du système.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm">
                            {formData.interview_mode === 'autonomous' 
                              ? "L'IA mènera cet entretien de manière autonome. Vous pourrez consulter les résultats une fois terminé."
                              : "Vous mènerez l'entretien avec l'assistance de l'IA, qui vous suggérera des questions et évaluera les réponses."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons de navigation */}
              <div className="mt-8 flex justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Précédent
                  </button>
                ) : (
                  <div></div> // Espace vide pour maintenir le layout
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={validateAndProceed}
                    className="px-6 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700"
                  >
                    Suivant
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700 flex items-center ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isSubmitting ? 'Création en cours...' : 'Créer l\'entretien'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

NewInterviewPage.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
export default NewInterviewPage;