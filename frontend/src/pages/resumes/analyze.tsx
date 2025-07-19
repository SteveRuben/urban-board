"use client"

import { useState, useEffect, useRef } from "react"
import Head from "next/head"
import ResumeAnalysisResult from "@/components/resume/resume-analysis-result"
import type { ResumeAnalysis } from "@/types/resume"
import FileUpload from "@/components/FileUpload"
import { ResumeService } from "@/services/resume-service"
import { ArrowRight, CheckCircle, FileText, Briefcase, BarChart2, AlertCircle, X } from "lucide-react"

export default function ResumeAnalyzePage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobFile, setJobFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [showResults, setShowResults] = useState<boolean>(false)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [showTips, setShowTips] = useState<boolean>(true)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Réinitialiser l'erreur lorsque les fichiers changent
  useEffect(() => {
    if (error) setError(null)
  }, [resumeFile, jobFile])

  // Effet pour l'animation de la barre de progression
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${progress}%`
    }
  }, [progress])

  const handleAnalyze = async () => {
    if (!resumeFile || !jobFile) {
      setError("Veuillez sélectionner un CV et une description de poste.")
      return
    }

    try {
      setError(null)
      setIsAnalyzing(true)
      setProgress(0)
      setCurrentStep(3)

      // Animation de progression plus réaliste
      const progressSteps = [
        { target: 15, time: 800 },
        { target: 35, time: 1500 },
        { target: 60, time: 2000 },
        { target: 85, time: 2500 },
      ]

      let currentStepIndex = 0
      const animateProgressStep = () => {
        if (currentStepIndex < progressSteps.length) {
          const { target, time } = progressSteps[currentStepIndex]
          const startValue = currentStepIndex > 0 ? progressSteps[currentStepIndex - 1].target : 0
          const valueToAdd = target - startValue
          const startTime = Date.now()
          const endTime = startTime + time

          const updateProgress = () => {
            const now = Date.now()
            if (now < endTime) {
              const elapsedRatio = (now - startTime) / time
              // Fonction d'accélération pour une animation plus naturelle
              const easedRatio = 1 - Math.pow(1 - elapsedRatio, 3) // Cubic ease-out
              setProgress(Math.floor(startValue + valueToAdd * easedRatio))
              requestAnimationFrame(updateProgress)
            } else {
              setProgress(target)
              currentStepIndex++
              animateProgressStep()
            }
          }

          requestAnimationFrame(updateProgress)
        }
      }

      animateProgressStep()

      // Effectuer l'analyse
      console.log("Début de l'analyse avec:", resumeFile.name, jobFile.name)
      const result = await ResumeService.analyzeResume(resumeFile, jobFile)
      console.log("Analyse terminée, résultat:", result)

      setProgress(100)
      setAnalysis(result)
      setShowResults(true)
      setCurrentStep(4)

      // Faire défiler vers les résultats
      setTimeout(() => {
        const resultsSection = document.getElementById("results-section")
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 500)
    } catch (err) {
      console.error("Erreur lors de l'analyse:", err)
      setError(err instanceof Error ? err.message : "Une erreur s'est produite pendant l'analyse")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setShowResults(false)
    setAnalysis(null)
    setProgress(0)
    setCurrentStep(resumeFile && jobFile ? 2 : 1)
  }

  const renderStepIcon = (step: number, isActive: boolean, isCompleted: boolean) => {
    const baseClasses = "w-6 h-6"
    const activeClasses = isActive ? "text-primary" : isCompleted ? "text-success" : "text-gray-400"

    switch (step) {
      case 1:
        return <Briefcase className={`${baseClasses} ${activeClasses}`} />
      case 2:
        return <FileText className={`${baseClasses} ${activeClasses}`} />
      case 3:
        return <BarChart2 className={`${baseClasses} ${activeClasses}`} />
      case 4:
        return <CheckCircle className={`${baseClasses} ${activeClasses}`} />
      default:
        return null
    }
  }

  return (
    <>
      <Head>
        <title>Analyse de CV - RecruteIA</title>
        <meta name="description" content="Analyser un CV avec l'intelligence artificielle" />
      </Head>

      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="text-center mb-12 fade-in">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Analyse de CV</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Notre IA analyse votre CV et la description du poste pour vous fournir des recommandations
                personnalisées.
              </p>
            </div>

            {/* Barre de progression des étapes */}
            <div className="mb-12 px-4">
              <div className="relative">
                {/* Ligne de progression */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full"></div>
                <div
                  className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(0, (currentStep - 1) * 33.33)}%` }}
                ></div>

                {/* Étapes */}
                <div className="relative flex justify-between">
                  {[1, 2, 3, 4].map((step) => {
                    const isActive = currentStep === step
                    const isCompleted = currentStep > step
                    return (
                      <div
                        key={step}
                        className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
                          isActive ? "scale-110" : ""
                        }`}
                        onClick={() => {
                          if (!isAnalyzing && (step < currentStep || (step === 2 && jobFile) || step === 1)) {
                            setCurrentStep(step)
                          }
                        }}
                      >
                        <div
                          className={`
                            w-12 h-12 rounded-full flex items-center justify-center z-10
                            transition-all duration-300 ease-in-out
                            ${
                              isActive
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : isCompleted
                                  ? "bg-success text-white"
                                  : "bg-white text-gray-400 border-2 border-gray-200"
                            }
                          `}
                        >
                          {renderStepIcon(step, isActive, isCompleted)}
                        </div>
                        <div
                          className={`
                            mt-2 font-medium text-sm transition-all duration-300
                            ${isActive ? "text-primary" : isCompleted ? "text-success" : "text-gray-500"}
                          `}
                        >
                          {step === 1 && "Description du poste"}
                          {step === 2 && "CV"}
                          {step === 3 && "Analyse"}
                          {step === 4 && "Résultats"}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Conseils (collapsible) */}
            {showTips && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md mb-8 fade-in">
                <div className="flex justify-between items-start">
                  <div className="flex">
                    <div className="flex-shrink-0 text-blue-500 mt-1">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Conseils pour de meilleurs résultats</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Utilisez un CV au format PDF pour une meilleure analyse</li>
                          <li>Assurez-vous que la description du poste est détaillée</li>
                          <li>L'analyse prend généralement entre 30 secondes et 1 minute</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowTips(false)} className="text-blue-500 hover:text-blue-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Contenu principal basé sur l'étape actuelle */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-8 transition-all duration-500 fade-in">
              {/* Étape 1: Description du poste */}
              <div className={`transition-all duration-500 ${currentStep === 1 ? "block" : "hidden"}`}>
                <div className="bg-gradient-to-r from-primary-50 to-white p-6 border-b">
                  <div className="flex items-center">
                    <div className="bg-primary-100 rounded-full p-3 mr-4">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Description du poste</h2>
                      <p className="text-gray-600">
                        Téléchargez la description du poste pour lequel vous analysez le CV
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="max-w-lg mx-auto">
                    <FileUpload
                      id="job-file"
                      label="Sélectionner une description de poste"
                      acceptedFormats=".pdf,.docx,.txt"
                      onFileSelected={setJobFile}
                      disabled={isAnalyzing}
                      // selectedFile={jobFile}
                    />

                    {jobFile && (
                      <div className="mt-8 flex justify-end">
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="flex items-center bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          Continuer
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Étape 2: CV */}
              <div className={`transition-all duration-500 ${currentStep === 2 ? "block" : "hidden"}`}>
                <div className="bg-gradient-to-r from-primary-50 to-white p-6 border-b">
                  <div className="flex items-center">
                    <div className="bg-primary-100 rounded-full p-3 mr-4">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Téléchargement du CV</h2>
                      <p className="text-gray-600">Téléchargez le CV que vous souhaitez analyser</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="max-w-lg mx-auto">
                    <FileUpload
                      id="resume-file"
                      label="Sélectionner un CV"
                      acceptedFormats=".pdf,.docx,.txt"
                      onFileSelected={setResumeFile}
                      disabled={isAnalyzing}
                      // selectedFile={resumeFile}
                    />

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                      >
                        Retour
                      </button>

                      {resumeFile && jobFile && (
                        <button
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                          className="flex items-center bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Lancer l'analyse
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Étape 3: Analyse en cours */}
              <div className={`transition-all duration-500 ${currentStep === 3 ? "block" : "hidden"}`}>
                <div className="bg-gradient-to-r from-primary-50 to-white p-6 border-b">
                  <div className="flex items-center">
                    <div className="bg-primary-100 rounded-full p-3 mr-4">
                      <BarChart2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Analyse en cours</h2>
                      <p className="text-gray-600">Notre IA analyse votre CV et la description du poste</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="max-w-lg mx-auto">
                    {error ? (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6 animate-pulse">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-8">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Progression</span>
                            <span className="text-sm font-medium text-gray-700">{progress}%</span>
                          </div>
                          <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              ref={progressBarRef}
                              className="h-full bg-primary rounded-full transition-all duration-700 ease-out progress-bar-animation"
                              style={{ width: "0%" }}
                            ></div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${progress >= 20 ? "bg-success-100 text-success" : "bg-gray-100 text-gray-400"}`}
                            >
                              {progress >= 20 ? <CheckCircle className="w-5 h-5" /> : "1"}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="font-medium">Extraction du texte</span>
                                {progress >= 20 && <span className="text-success">Terminé</span>}
                              </div>
                              <div
                                className={`h-1 w-full bg-gray-200 rounded-full mt-2 ${progress < 20 ? "animate-pulse" : ""}`}
                              >
                                <div
                                  className="h-full bg-success rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, progress < 20 ? progress * 5 : 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${progress >= 50 ? "bg-success-100 text-success" : "bg-gray-100 text-gray-400"}`}
                            >
                              {progress >= 50 ? <CheckCircle className="w-5 h-5" /> : "2"}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="font-medium">Analyse des compétences</span>
                                {progress >= 50 && <span className="text-success">Terminé</span>}
                              </div>
                              <div
                                className={`h-1 w-full bg-gray-200 rounded-full mt-2 ${progress >= 20 && progress < 50 ? "animate-pulse" : ""}`}
                              >
                                <div
                                  className="h-full bg-success rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, progress >= 20 ? ((progress - 20) * 100) / 30 : 0)}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${progress >= 80 ? "bg-success-100 text-success" : "bg-gray-100 text-gray-400"}`}
                            >
                              {progress >= 80 ? <CheckCircle className="w-5 h-5" /> : "3"}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="font-medium">Évaluation de la correspondance</span>
                                {progress >= 80 && <span className="text-success">Terminé</span>}
                              </div>
                              <div
                                className={`h-1 w-full bg-gray-200 rounded-full mt-2 ${progress >= 50 && progress < 80 ? "animate-pulse" : ""}`}
                              >
                                <div
                                  className="h-full bg-success rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, progress >= 50 ? ((progress - 50) * 100) / 30 : 0)}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${progress >= 100 ? "bg-success-100 text-success" : "bg-gray-100 text-gray-400"}`}
                            >
                              {progress >= 100 ? <CheckCircle className="w-5 h-5" /> : "4"}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="font-medium">Génération des recommandations</span>
                                {progress >= 100 && <span className="text-success">Terminé</span>}
                              </div>
                              <div
                                className={`h-1 w-full bg-gray-200 rounded-full mt-2 ${progress >= 80 && progress < 100 ? "animate-pulse" : ""}`}
                              >
                                <div
                                  className="h-full bg-success rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, progress >= 80 ? ((progress - 80) * 100) / 20 : 0)}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 text-center">
                          <p className="text-gray-600 italic">
                            {progress < 20 && "Extraction des informations du CV et de la description du poste..."}
                            {progress >= 20 &&
                              progress < 50 &&
                              "Identification des compétences techniques et personnelles..."}
                            {progress >= 50 && progress < 80 && "Évaluation de la correspondance avec le poste..."}
                            {progress >= 80 && progress < 100 && "Génération des recommandations personnalisées..."}
                            {progress >= 100 && "Analyse terminée ! Affichage des résultats..."}
                          </p>
                        </div>
                      </>
                    )}

                    {error && (
                      <div className="mt-8 flex justify-center">
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="flex items-center bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                        >
                          Réessayer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Étape 4: Résultats */}
              <div
                id="results-section"
                className={`transition-all duration-500 ${currentStep === 4 && showResults ? "block" : "hidden"}`}
              >
                <div className="bg-gradient-to-r from-success-50 to-white p-6 border-b">
                  <div className="flex items-center">
                    <div className="bg-success-100 rounded-full p-3 mr-4">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Résultats de l'analyse</h2>
                      <p className="text-gray-600">
                        Analyse complète du CV pour {jobFile?.name.replace(/\.[^/.]+$/, "") || "le poste sélectionné"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {analysis && (
                    <div className="fade-in-up">
                      <ResumeAnalysisResult analysis={analysis} jobTitle={jobFile?.name || ""} />

                      <div className="mt-8 flex justify-center">
                        <button
                          onClick={resetAnalysis}
                          className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200 mr-4"
                        >
                          Nouvelle analyse
                        </button>


                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informations sur les fichiers sélectionnés */}
            {(currentStep === 1 || currentStep === 2) && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8 fade-in">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Fichiers sélectionnés</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-300
                      ${jobFile ? "border-success-200 bg-success-50" : "border-gray-200 bg-gray-50"}
                      ${currentStep === 1 ? "hover:scale-105 cursor-pointer" : ""}
                    `}
                    onClick={() => currentStep !== 1 && !isAnalyzing && setCurrentStep(1)}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${jobFile ? "bg-success-100" : "bg-gray-200"}`}>
                        <Briefcase className={`w-5 h-5 ${jobFile ? "text-success" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Description du poste</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {jobFile ? (
                            <span className="text-success flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span className="truncate max-w-[200px]">{jobFile.name}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">Aucun fichier sélectionné</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-300
                      ${resumeFile ? "border-success-200 bg-success-50" : "border-gray-200 bg-gray-50"}
                      ${currentStep === 2 ? "hover:scale-105 cursor-pointer" : ""}
                    `}
                    onClick={() => currentStep !== 2 && !isAnalyzing && jobFile && setCurrentStep(2)}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${resumeFile ? "bg-success-100" : "bg-gray-200"}`}>
                        <FileText className={`w-5 h-5 ${resumeFile ? "text-success" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">CV</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {resumeFile ? (
                            <span className="text-success flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span className="truncate max-w-[200px]">{resumeFile.name}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">Aucun fichier sélectionné</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
