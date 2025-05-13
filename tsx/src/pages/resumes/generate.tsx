"use client"

import { useState, useEffect, useRef } from "react"
import Head from "next/head"
import { ExerciseService, type EvaluationExercise } from "@/services/exercise-service"
import FileUpload from "@/components/FileUpload"
import {
  ArrowDown,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Code,
  Copy,
  Download,
  FileText,
  Filter,
  Flame,
  Lightbulb,
  Loader2,
  Maximize,
  Minimize,
  PenTool,
  Search,
  Send,
  Sparkles,
  Terminal,
  TestTube,
  X,
  Zap,
} from "lucide-react"

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "es", label: "Espagnol" },
]

const DIFFICULTY_COLORS = {
  easy: {
    bg: "bg-success-50",
    text: "text-success",
    border: "border-success-100",
    label: "Facile",
    icon: <Sparkles className="h-3.5 w-3.5 mr-1" />,
  },
  medium: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200",
    label: "Moyen",
    icon: <Flame className="h-3.5 w-3.5 mr-1" />,
  },
  hard: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    label: "Difficile",
    icon: <Zap className="h-3.5 w-3.5 mr-1" />,
  },
}

export default function GenerateExercisesPage() {
  const [jobFile, setJobFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState<string>("")
  const [language, setLanguage] = useState<string>("fr")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [exercises, setExercises] = useState<EvaluationExercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<EvaluationExercise[]>([])
  const [jobTitle, setJobTitle] = useState<string>("")
  const [keySkills, setKeySkills] = useState<string[]>([])
  const [useFile, setUseFile] = useState<boolean>(true)
  const [expandedExercises, setExpandedExercises] = useState<Record<number, boolean>>({})
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [generationProgress, setGenerationProgress] = useState<number>(0)
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all")
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [expandAll, setExpandAll] = useState<boolean>(false)
  const formRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + Math.floor(Math.random() * 10)
        })
      }, 500)

      return () => {
        clearInterval(interval)
        setGenerationProgress(0)
      }
    }
  }, [isGenerating])

  // Filtrer les exercices en fonction des critères de recherche et de filtre
  useEffect(() => {
    if (!exercises.length) {
      setFilteredExercises([])
      return
    }

    let filtered = [...exercises]

    // Filtrer par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (ex) =>
          ex.title.toLowerCase().includes(term) ||
          ex.description.toLowerCase().includes(term) ||
          (ex.skills_evaluated && ex.skills_evaluated.some((skill) => skill.toLowerCase().includes(term))),
      )
    }

    // Filtrer par difficulté
    if (filterDifficulty !== "all") {
      filtered = filtered.filter((ex) => ex.difficulty === filterDifficulty)
    }

    // Filtrer par compétences sélectionnées
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((ex) =>
        ex.skills_evaluated?.some((skill) => selectedSkills.includes(skill.toLowerCase())),
      )
    }

    setFilteredExercises(filtered)
  }, [exercises, searchTerm, filterDifficulty, selectedSkills])

  // Gérer l'expansion/réduction de tous les exercices
  useEffect(() => {
    if (!filteredExercises.length) return

    const newExpandState: Record<number, boolean> = {}
    filteredExercises.forEach((_, index) => {
      newExpandState[index] = expandAll
    })
    setExpandedExercises(newExpandState)
  }, [expandAll, filteredExercises.length])

  const toggleExercise = (index: number) => {
    setExpandedExercises((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleCopyExercise = (index: number, exercise: EvaluationExercise) => {
    // Fonction pour copier l'exercice avec la nouvelle structure
    const exerciseText = `
# ${exercise.title}
                
## Description
${exercise.description}
                
## Difficulté
${exercise.difficulty}
                
## Temps estimé
${exercise.estimated_time}
                
${exercise.language ? `## Langage\n${exercise.language}` : ""}

## Compétences évaluées
${(exercise.skills_evaluated || []).join(", ")}

${
  exercise.evaluation_criteria && exercise.evaluation_criteria.length > 0
    ? `## Critères d'évaluation\n${exercise.evaluation_criteria.map((c) => `- ${c}`).join("\n")}`
    : ""
}

${
  exercise.starter_code
    ? `## Code de départ\n\`\`\`${Object.keys(exercise.starter_code)[0] || ""}\n${Object.values(exercise.starter_code)[0] || ""}\n\`\`\``
    : ""
}

${
  exercise.test_cases && exercise.test_cases.length > 0
    ? `## Cas de test\n${exercise.test_cases
        .map((tc) => `- Entrée: ${tc.input}, Sortie attendue: ${tc.expected_output}${tc.is_hidden ? " (caché)" : ""}`)
        .join("\n")}`
    : ""
}
    `

    navigator.clipboard.writeText(exerciseText.trim())
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleSkillToggle = (skill: string) => {
    const skillLower = skill.toLowerCase()
    setSelectedSkills((prev) =>
      prev.includes(skillLower) ? prev.filter((s) => s !== skillLower) : [...prev, skillLower],
    )
  }

  const handleGenerate = async () => {
    if (useFile && !jobFile) {
      setError("Veuillez sélectionner un fichier de description de poste.")
      return
    }

    if (!useFile && !jobDescription.trim()) {
      setError("Veuillez saisir une description de poste.")
      return
    }

    try {
      setError(null)
      setIsGenerating(true)
      setExercises([])
      setFilteredExercises([])
      setGenerationProgress(0)
      setExpandedExercises({})
      setSearchTerm("")
      setFilterDifficulty("all")
      setSelectedSkills([])
      setShowFilters(false)
      setExpandAll(false)

      // Obtenir les exercices
      const result = await ExerciseService.generateExercises(
        useFile ? jobFile : null,
        !useFile ? jobDescription : null,
        language,
      )

      console.log("Page: Résultat brut reçu", result)

      // Extraire les exercices selon la structure reçue
      let extractedExercises: EvaluationExercise[] = []
      if (result.evaluation_exercises && Array.isArray(result.evaluation_exercises)) {
        extractedExercises = result.evaluation_exercises
      } else if (result.exercises && Array.isArray(result.exercises)) {
        extractedExercises = result.exercises
      }

      // Adapter les exercices pour correspondre au format attendu par l'UI
      const adaptedExercises = extractedExercises.map((ex) => ({
        ...ex,
        // Convertir les durées en un format plus lisible
        estimated_time: ex.estimated_time || (ex.duration_minutes ? `${ex.duration_minutes} min` : "Non spécifié"),

        // Unifier les champs de compétences
        skills_evaluated: ex.skills_evaluated || ex.skills || ex.targeted_skills || [],

        // Ajouter des critères d'évaluation s'ils n'existent pas
        evaluation_criteria:
          ex.evaluation_criteria ||
          (ex.test_cases
            ? ex.test_cases.map((tc) => `Vérifier que l'entrée ${tc.input} produit la sortie ${tc.expected_output}`)
            : []),
      }))

      // Extraire les compétences clés
      const keySkills =
        result.key_skills ||
        result.required_skills ||
        (result.job_requirements
          ? [...(result.job_requirements.tech_stacks || []), ...(result.job_requirements.technical_skills || [])]
          : [])

      // Définir un titre de poste par défaut si non spécifié
      const extractedJobTitle =
        result.job_title ||
        (result.job_requirements?.experience_level
          ? `${result.job_requirements.experience_level} Developer`
          : "Développeur")

      // Initialiser tous les exercices comme fermés
      const initialExpandState: Record<number, boolean> = {}
      adaptedExercises.forEach((_, index) => {
        initialExpandState[index] = false
      })

      setGenerationProgress(100)
      setShowSuccessMessage(true)

      setTimeout(() => {
        setExercises(adaptedExercises)
        setFilteredExercises(adaptedExercises)
        setJobTitle(extractedJobTitle)
        setKeySkills(keySkills)
        setExpandedExercises(initialExpandState)
        setShowSuccessMessage(false)

        // Faire défiler vers les résultats
        setTimeout(() => {
          if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: "smooth" })
          }
        }, 100)

        
      }, 1000)
    } catch (err) {
      console.error("Erreur lors de la génération d'exercices:", err)
      setError(err instanceof Error ? err.message : "Une erreur s'est produite pendant la génération")
      setShowSuccessMessage(false)
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
      }, 1000)
    }
  }

  const handleDownloadAll = () => {
    // Créer un texte avec tous les exercices
    const allExercisesText = exercises
      .map(
        (exercise) => `
# ${exercise.title}
            
## Description
${exercise.description}
            
## Difficulté
${exercise.difficulty}
            
## Temps estimé
${exercise.estimated_time}
            
${exercise.language ? `## Langage\n${exercise.language}` : ""}

## Compétences évaluées
${(exercise.skills_evaluated || []).join(", ")}

${
  exercise.evaluation_criteria && exercise.evaluation_criteria.length > 0
    ? `## Critères d'évaluation\n${exercise.evaluation_criteria.map((c) => `- ${c}`).join("\n")}`
    : ""
}

${
  exercise.starter_code
    ? `## Code de départ\n\`\`\`${Object.keys(exercise.starter_code)[0] || ""}\n${Object.values(exercise.starter_code)[0] || ""}\n\`\`\``
    : ""
}

${
  exercise.test_cases && exercise.test_cases.length > 0
    ? `## Cas de test\n${exercise.test_cases
        .map((tc) => `- Entrée: ${tc.input}, Sortie attendue: ${tc.expected_output}${tc.is_hidden ? " (caché)" : ""}`)
        .join("\n")}`
    : ""
}
            `,
      )
      .join("\n\n---\n\n")

    // Créer un fichier blob
    const blob = new Blob([allExercisesText.trim()], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)

    // Créer un lien de téléchargement
    const a = document.createElement("a")
    a.href = url
    a.download = `exercices-evaluation-${jobTitle ? jobTitle.replace(/\s+/g, "-").toLowerCase() : "poste"}.md`
    a.click()

    // Nettoyer
    URL.revokeObjectURL(url)
  }

  // Extraire toutes les compétences uniques de tous les exercices
  const allSkills = exercises.reduce((skills, exercise) => {
    if (exercise.skills_evaluated) {
      exercise.skills_evaluated.forEach((skill) => {
        if (!skills.includes(skill.toLowerCase())) {
          skills.push(skill.toLowerCase())
        }
      })
    }
    return skills
  }, [] as string[])

 
  return (
    <>

      <div
        className={'min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 transition-all duration-500 '}
      >
   
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            {/* En-tête de la page */}
            <div className="mb-12 text-center fade-in">
              <div className="inline-block p-2 bg-primary-50 rounded-full mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <PenTool className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Exercices d'évaluation</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Générez des exercices d'évaluation pertinents basés sur une description de poste pour tester les
                compétences des candidats.
              </p>
            </div>

            {/* Options d'entrée */}
            <div ref={formRef} className="bg-white rounded-2xl shadow-xl p-8 mb-12 fade-in-up relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mt-20 -mr-20 opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-50 rounded-full -mb-10 -ml-10 opacity-50"></div>

              <div className="relative">
                <h2 className="text-2xl font-semibold text-gray-800 mb-8 flex items-center">
                  <BookOpen className="mr-3 h-6 w-6 text-primary" />
                  Méthode d'entrée
                </h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <button
                    type="button"
                    onClick={() => setUseFile(true)}
                    className={`flex-1 py-5 px-6 rounded-xl transition-all duration-300 ${
                      useFile
                        ? "bg-primary-50 text-primary border-2 border-primary-100 shadow-md pulse-shadow"
                        : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-8 w-8 mb-2" />
                      <span className="font-medium text-lg">Fichier</span>
                      <span className="text-sm mt-1 opacity-80">Télécharger un document</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUseFile(false)}
                    className={`flex-1 py-5 px-6 rounded-xl transition-all duration-300 ${
                      !useFile
                        ? "bg-primary-50 text-primary border-2 border-primary-100 shadow-md pulse-shadow"
                        : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Terminal className="h-8 w-8 mb-2" />
                      <span className="font-medium text-lg">Texte</span>
                      <span className="text-sm mt-1 opacity-80">Saisir manuellement</span>
                    </div>
                  </button>
                </div>

                {/* Upload de fichier */}
                {useFile && (
                  <div className="mb-8 slide-in-right">
                    <FileUpload
                      id="job-file"
                      label="Sélectionner une description de poste"
                      acceptedFormats=".pdf,.docx,.txt"
                      onFileSelected={setJobFile}
                      disabled={isGenerating}
                    />
                    {jobFile && (
                      <div className="mt-4 p-4 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-white p-2 rounded-lg mr-3">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <span className="text-sm text-primary font-medium block">{jobFile.name}</span>
                            <span className="text-xs text-gray-500">
                              {(jobFile.size / 1024).toFixed(1)} KB · {jobFile.type || "Document"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setJobFile(null)}
                          className="text-gray-500 hover:text-primary transition-colors p-2 hover:bg-white rounded-full"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Saisie de texte */}
                {!useFile && (
                  <div className="mb-8 slide-in-right">
                    <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description du poste
                    </label>
                    <div className="relative">
                      <textarea
                        id="job-description"
                        rows={8}
                        className="w-full p-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-700"
                        placeholder="Collez ici la description complète du poste..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        disabled={isGenerating}
                      ></textarea>
                      {jobDescription && (
                        <button
                          onClick={() => setJobDescription("")}
                          className="absolute top-4 right-4 text-gray-400 hover:text-primary transition-colors p-1 hover:bg-gray-100 rounded-full"
                          title="Effacer le texte"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>{jobDescription.length} caractères</span>
                      <span>
                        {jobDescription.split(/\s+/).filter(Boolean).length} mots ·{" "}
                        {jobDescription.split(/\n/).filter(Boolean).length} lignes
                      </span>
                    </div>
                  </div>
                )}

                {/* Sélection de langue */}
                <div className="mb-8">
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                    Langue des exercices
                  </label>
                  <div className="relative">
                    <select
                      id="language"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 appearance-none text-gray-700"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      disabled={isGenerating}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none h-5 w-5" />
                  </div>
                </div>

                {/* Erreur */}
                {error && (
                  <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg fade-in">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bouton de génération */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (useFile && !jobFile) || (!useFile && !jobDescription.trim())}
                  className={`w-full font-bold py-5 px-6 rounded-xl text-lg shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center ${
                    isGenerating || (useFile && !jobFile) || (!useFile && !jobDescription.trim())
                      ? "bg-gray-400 text-white cursor-not-allowed opacity-70"
                      : "bg-primary text-white hover:bg-primary-dark transform hover:-translate-y-1 hover:shadow-2xl"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin mr-3 h-6 w-6 text-white" />
                      <span>Génération en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="mr-3 h-6 w-6" />
                      <span>Générer les exercices</span>
                    </>
                  )}
                </button>

                {/* Barre de progression */}
                {isGenerating && (
                  <div className="mt-6">
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                      <div
                        className="bg-primary h-3 rounded-full progress-bar-animation"
                        style={{ width: `${generationProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Analyse en cours...</span>
                      <span>{generationProgress}%</span>
                    </div>
                  </div>
                )}

                {/* Message de succès */}
                {showSuccessMessage && (
                  <div className="mt-6 p-4 bg-success-50 border border-success-100 rounded-xl flex items-center fade-in">
                    <div className="bg-success p-1.5 rounded-full mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-success font-medium">Exercices générés avec succès!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Résultats - Exercices générés */}
            {exercises.length > 0 && (
              <div id="results-section" ref={resultsRef} className="mt-16 fade-in">
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 border-b border-gray-100 pb-6">
                    <div className="mb-4 md:mb-0">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                        <Award className="mr-3 h-6 w-6 text-primary" />
                        Exercices d'évaluation
                      </h2>
                      <p className="text-gray-600">
                        {filteredExercises.length} exercice{filteredExercises.length !== 1 ? "s" : ""} généré
                        {filteredExercises.length !== 1 ? "s" : ""} pour{" "}
                        <span className="font-medium text-gray-700">{jobTitle}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                          showFilters ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filtres{" "}
                        {selectedSkills.length > 0 || filterDifficulty !== "all"
                          ? `(${selectedSkills.length + (filterDifficulty !== "all" ? 1 : 0)})`
                          : ""}
                      </button>

                      <button
                        onClick={() => setExpandAll(!expandAll)}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        {expandAll ? (
                          <>
                            <Minimize className="h-4 w-4 mr-2" />
                            Réduire tout
                          </>
                        ) : (
                          <>
                            <Maximize className="h-4 w-4 mr-2" />
                            Développer tout
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleDownloadAll}
                        className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary rounded-lg hover:bg-primary-100 transition-colors duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </button>
                    </div>
                  </div>

                  {/* Barre de recherche et filtres */}
                  <div className="mb-8">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Rechercher par titre, description ou compétence..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-4 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      />
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    {/* Filtres avancés */}
                    {showFilters && (
                      <div className="mt-4 p-5 bg-gray-50 rounded-xl border border-gray-200 fade-in">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Difficulté</h4>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setFilterDifficulty("all")}
                                className={`px-3 py-1.5 rounded-full text-sm ${
                                  filterDifficulty === "all"
                                    ? "bg-gray-700 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                Toutes
                              </button>
                              {Object.entries(DIFFICULTY_COLORS).map(([key, value]) => (
                                <button
                                  key={key}
                                  onClick={() => setFilterDifficulty(key)}
                                  className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                                    filterDifficulty === key
                                      ? `${value.bg} ${value.text} ${value.border} font-medium`
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  }`}
                                >
                                  {filterDifficulty === key && value.icon}
                                  {value.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {allSkills.length > 0 && (
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Compétences</h4>
                              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                                {allSkills.map((skill, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleSkillToggle(skill)}
                                    className={`px-3 py-1.5 rounded-full text-sm ${
                                      selectedSkills.includes(skill)
                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                                  >
                                    {skill}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {(selectedSkills.length > 0 || filterDifficulty !== "all") && (
                          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                            <button
                              onClick={() => {
                                setSelectedSkills([])
                                setFilterDifficulty("all")
                              }}
                              className="text-sm text-primary hover:text-primary-dark flex items-center"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Réinitialiser les filtres
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {jobTitle && keySkills.length > 0 && (
                    <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Code className="mr-2 h-5 w-5 text-primary" />
                        Compétences clés identifiées
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {keySkills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-primary-50 text-primary px-3 py-1.5 rounded-full text-sm border border-primary-100 transition-all duration-200 hover:bg-primary-100 cursor-pointer"
                            onClick={() => {
                              setSearchTerm(skill)
                              setShowFilters(false)
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message si aucun exercice ne correspond aux filtres */}
                  {exercises.length > 0 && filteredExercises.length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun exercice trouvé</h3>
                      <p className="text-gray-600 mb-6">
                        Aucun exercice ne correspond à vos critères de recherche ou filtres.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm("")
                          setFilterDifficulty("all")
                          setSelectedSkills([])
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
                      >
                        Réinitialiser la recherche
                      </button>
                    </div>
                  )}

                  {/* Liste des exercices */}
                  {filteredExercises.length > 0 && (
                    <div className="space-y-6">
                      {filteredExercises.map((exercise, index) => {
                        const isExpanded = expandedExercises[index]
                        const difficultyStyle =
                          DIFFICULTY_COLORS[exercise.difficulty as keyof typeof DIFFICULTY_COLORS] ||
                          DIFFICULTY_COLORS.medium

                        return (
                          <div
                            key={index}
                            className={`bg-white rounded-xl border overflow-hidden fade-in-up transition-all duration-300 ${
                              isExpanded ? "shadow-lg border-primary-100" : "shadow-md hover:shadow-lg border-gray-200"
                            }`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div
                              className={`p-6 cursor-pointer transition-all duration-300 ${
                                isExpanded ? "bg-primary text-white" : "bg-white hover:bg-gray-50"
                              }`}
                              onClick={() => toggleExercise(index)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div
                                    className={`p-2 rounded-lg mr-4 ${isExpanded ? "bg-white/20" : "bg-primary-50"}`}
                                  >
                                    <TestTube className={`h-6 w-6 ${isExpanded ? "text-white" : "text-primary"}`} />
                                  </div>
                                  <div>
                                    <h3 className={`text-lg font-bold ${isExpanded ? "text-white" : "text-gray-800"}`}>
                                      {exercise.title}
                                    </h3>
                                    {exercise.language && !isExpanded && (
                                      <div className="text-sm text-gray-600 mt-1">
                                        Langage: <span className="font-medium">{exercise.language}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center">
                                    <Clock
                                      className={`h-4 w-4 mr-1 ${isExpanded ? "text-white/70" : "text-gray-500"}`}
                                    />
                                    <span className={`text-sm ${isExpanded ? "text-white/90" : "text-gray-600"}`}>
                                      {exercise.estimated_time}
                                    </span>
                                  </div>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                                      isExpanded
                                        ? "bg-white/20 text-white"
                                        : `${difficultyStyle.bg} ${difficultyStyle.text} ${difficultyStyle.border}`
                                    }`}
                                  >
                                    {difficultyStyle.icon}
                                    {difficultyStyle.label}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-white" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-6 border-t border-gray-100">
                                {exercise.language && (
                                  <div className="mb-6 inline-block px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                                    Langage: <span className="font-semibold">{exercise.language}</span>
                                  </div>
                                )}

                                <div className="prose max-w-none mb-8">
                                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                    <PenTool className="mr-2 h-4 w-4 text-primary" />
                                    Description
                                  </h4>
                                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                    <p className="text-gray-700 whitespace-pre-line">{exercise.description}</p>
                                  </div>
                                </div>

                                <div className="mb-8">
                                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                    <Code className="mr-2 h-4 w-4 text-primary" />
                                    Compétences évaluées
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {(exercise.skills_evaluated || []).map((skill, skillIndex) => (
                                      <span
                                        key={skillIndex}
                                        className="bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-100 transition-all duration-200"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {exercise.starter_code && (
                                  <div className="mb-8">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                      <Terminal className="mr-2 h-4 w-4 text-primary" />
                                      Code de départ
                                    </h4>
                                    <div className="bg-gray-800 rounded-xl text-white p-5 overflow-auto max-h-80">
                                      <div className="flex justify-between items-center mb-3">
                                        <div className="flex space-x-2">
                                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        </div>
                                        <div className="flex items-center">
                                          <p className="text-xs text-gray-400 mr-3">
                                            {Object.keys(exercise.starter_code)[0] || "code"}
                                          </p>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              const code = exercise.starter_code && Object.values(exercise.starter_code).length > 0
                                              ? Object.values(exercise.starter_code)[0] || ""
                                              : ""
                                              navigator.clipboard.writeText(code)
                                              // Feedback visuel
                                              const button = e.currentTarget
                                              button.classList.add("text-green-400")
                                              setTimeout(() => {
                                                button.classList.remove("text-green-400")
                                              }, 1000)
                                            }}
                                            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
                                            title="Copier le code"
                                          >
                                            <Copy className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                      <pre className="whitespace-pre-wrap text-sm">
                                        <code>{Object.values(exercise.starter_code)[0] || ""}</code>
                                      </pre>
                                    </div>
                                  </div>
                                )}

                                {exercise.evaluation_criteria && exercise.evaluation_criteria.length > 0 && (
                                  <div className="mb-8">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                      <Award className="mr-2 h-4 w-4 text-primary" />
                                      Critères d'évaluation
                                    </h4>
                                    <ul className="space-y-3 text-gray-700 bg-gray-50 p-5 rounded-xl border border-gray-100">
                                      {exercise.evaluation_criteria.map((criteria, criteriaIndex) => (
                                        <li key={criteriaIndex} className="flex items-start">
                                          <div className="bg-success p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                                            <Check className="h-3 w-3 text-white" />
                                          </div>
                                          <span>{criteria}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {exercise.test_cases && exercise.test_cases.length > 0 && (
                                  <div className="mb-8">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                      <TestTube className="mr-2 h-4 w-4 text-primary" />
                                      Cas de test
                                    </h4>
                                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                                      <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                          <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                              Entrée
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                              Sortie attendue
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                              Type
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {exercise.test_cases.map((testCase, testIndex) => (
                                            <tr
                                              key={testIndex}
                                              className={`${
                                                testIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                                              } hover:bg-gray-100 transition-colors duration-150`}
                                            >
                                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">
                                                  {testCase.input}
                                                </code>
                                              </td>
                                              <td className="px-6 py-4 text-sm text-gray-700">
                                                <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">
                                                  {testCase.expected_output}
                                                </code>
                                              </td>
                                              <td className="px-6 py-4">
                                                <span
                                                  className={`px-2 py-1 rounded-full text-xs ${
                                                    testCase.is_hidden
                                                      ? "bg-gray-100 text-gray-700 border border-gray-200"
                                                      : "bg-success-50 text-success border border-success-100"
                                                  }`}
                                                >
                                                  {testCase.is_hidden ? "Caché" : "Visible"}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCopyExercise(index, exercise)
                                    }}
                                    className={`action-button ${
                                      copiedIndex === index ? "success" : ""
                                    } transition-all duration-200 py-2 px-4`}
                                  >
                                    {copiedIndex === index ? (
                                      <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Copié !
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copier l'exercice
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Bouton pour télécharger tous les exercices */}
                {filteredExercises.length > 0 && (
                  <div className="mt-12 text-center">
                    <button
                      type="button"
                      onClick={handleDownloadAll}
                      className="bg-primary hover:bg-primary-dark text-white font-medium py-4 px-8 rounded-xl inline-flex items-center shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <Download className="h-5 w-5 mr-3" />
                      Télécharger tous les exercices
                    </button>
                  </div>
                )}

              
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
