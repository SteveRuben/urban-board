"use client"

import { useState } from "react"
import type { ResumeAnalysis } from "@/types/resume"
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Award,
  AlertTriangle,
  Code,
  Heart,
  GraduationCap,
  MessageSquare,
  Download,
  Printer,
  Share2,
  ArrowUpRight,
} from "lucide-react"

interface ResumeAnalysisResultProps {
  analysis: ResumeAnalysis | null
  jobTitle: string
}

export default function ResumeAnalysisResult({ analysis, jobTitle }: ResumeAnalysisResultProps) {
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    strengths: true,
    gaps: true,
    skills: true,
    education: true,
    recommendations: true,
  })

  if (!analysis) return null

  // Extraire les informations pertinentes
  const candidateProfile = analysis.candidate_profile || {}
  const matchScore = candidateProfile.match_score || 0
  const strengths = candidateProfile.strengths || []
  const gaps = candidateProfile.gaps || []
  const technicalSkills = candidateProfile.technical_skills || []
  const softSkills = candidateProfile.soft_skills || []
  const education = candidateProfile.education || []
  const focusAreas = candidateProfile.recommended_focus_areas || []

  // Extraire un nom de poste plus lisible à partir du nom de fichier
  const formatJobTitle = (filename: string) => {
    // Supprimer l'extension de fichier
    let title = filename.replace(/\.[^/.]+$/, "")

    // Remplacer les tirets et underscores par des espaces
    title = title.replace(/[-_]/g, " ")

    // Mettre en majuscule la première lettre de chaque mot
    title = title
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    return title
  }

  const displayJobTitle = formatJobTitle(jobTitle)

  // Fonction pour basculer l'état d'expansion d'une section
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Fonction pour déterminer la couleur du score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "success"
    if (score >= 60) return "good"
    if (score >= 40) return "average"
    return "poor"
  }

  const scoreColor = getScoreColor(matchScore)

  // Fonction pour générer une description du score
  const getScoreDescription = (score: number) => {
    if (score >= 80) return "Excellente correspondance"
    if (score >= 60) return "Bonne correspondance"
    if (score >= 40) return "Correspondance moyenne"
    return "Correspondance faible"
  }

  // Fonction pour obtenir les classes de couleur en fonction du score
  const getScoreTextColor = (score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 60) return "text-primary"
    if (score >= 40) return "text-amber-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-success-100"
    if (score >= 60) return "bg-primary-100"
    if (score >= 40) return "bg-amber-100"
    return "bg-red-100"
  }

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      {/* En-tête avec score de correspondance */}
      <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="fade-in-up">
            <h3 className="text-2xl font-bold text-gray-800 mb-1">Analyse de compatibilité</h3>
            <p className="text-gray-600 font-medium flex items-center">
              {displayJobTitle && (
                <>
                  <span className="text-primary mr-2">Poste :</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">{displayJobTitle}</span>
                </>
              )}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="text-center">
              <div className="relative inline-flex justify-center items-center w-28 h-28">
                <svg className="w-60 h-60 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="50"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className={getScoreTextColor(matchScore)}
                    strokeWidth="10"
                    strokeDasharray={`${matchScore * 2.51}, 251`} // 2.51 = 2π×40 ÷ 100
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="50"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold score-pulse">{Math.round(matchScore)}%</span>
                  <span className={`text-xs font-medium ${getScoreTextColor(matchScore)}`}>
                    {getScoreDescription(matchScore)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex space-x-1 p-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "overview" ? "bg-primary-50 text-primary shadow-sm" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "skills" ? "bg-primary-50 text-primary shadow-sm" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Compétences
          </button>
          <button
            onClick={() => setActiveTab("education")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "education" ? "bg-primary-50 text-primary shadow-sm" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Formation
          </button>
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "recommendations"
                ? "bg-primary-50 text-primary shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Recommandations
          </button>
        </div>
      </div>

      {/* Contenu de l'analyse */}
      <div className="p-6">
        {/* Vue d'ensemble */}
        {activeTab === "overview" && (
          <div className="space-y-8 fade-in">
            {/* Résumé */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getScoreBgColor(matchScore)}`}
                >
                  {scoreColor === "success" || scoreColor === "good" ? (
                    <CheckCircle className={`w-6 h-6 ${getScoreTextColor(matchScore)}`} />
                  ) : (
                    <AlertTriangle className={`w-6 h-6 ${getScoreTextColor(matchScore)}`} />
                  )}
                </div>
                <h4 className="text-lg font-semibold text-gray-800">Résumé de l'analyse</h4>
              </div>
              <p className="text-gray-700">
                {scoreColor === "success" &&
                  "Le profil du candidat correspond très bien aux exigences du poste. Les compétences techniques et l'expérience sont parfaitement alignées avec les besoins."}
                {scoreColor === "good" &&
                  "Le profil du candidat correspond bien aux exigences du poste. La plupart des compétences requises sont présentes, avec quelques points à approfondir."}
                {scoreColor === "average" &&
                  "Le profil du candidat correspond partiellement aux exigences du poste. Certaines compétences clés sont présentes, mais des lacunes importantes ont été identifiées."}
                {scoreColor === "poor" &&
                  "Le profil du candidat ne correspond pas suffisamment aux exigences du poste. Des lacunes importantes ont été identifiées dans plusieurs domaines clés."}
              </p>
            </div>

            {/* Forces */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300">
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => toggleSection("strengths")}
              >
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-success mr-2" />
                  <h4 className="text-lg font-semibold text-gray-800">Points forts</h4>
                </div>
                {expandedSections.strengths ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {expandedSections.strengths && (
                <div className="p-4 border-t border-gray-100">
                  {strengths.length > 0 ? (
                    <ul className="space-y-3">
                      {strengths.map((strength, index) => (
                        <li
                          key={index}
                          className="flex items-start slide-in-right"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success-100 flex items-center justify-center mr-3">
                            <CheckCircle className="h-4 w-4 text-success" />
                          </div>
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">Aucun point fort spécifique identifié</p>
                  )}
                </div>
              )}
            </div>

            {/* Lacunes */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300">
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => toggleSection("gaps")}
              >
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <h4 className="text-lg font-semibold text-gray-800">Points à améliorer</h4>
                </div>
                {expandedSections.gaps ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {expandedSections.gaps && (
                <div className="p-4 border-t border-gray-100">
                  {gaps.length > 0 ? (
                    <ul className="space-y-3">
                      {gaps.map((gap, index) => (
                        <li
                          key={index}
                          className="flex items-start slide-in-right"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-3">
                            <XCircle className="h-4 w-4 text-red-500" />
                          </div>
                          <span className="text-gray-700">{gap}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">Aucune lacune majeure identifiée</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compétences */}
        {activeTab === "skills" && (
          <div className="space-y-8 fade-in">
            {/* Compétences techniques */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300">
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => toggleSection("skills")}
              >
                <div className="flex items-center">
                  <Code className="w-5 h-5 text-primary mr-2" />
                  <h4 className="text-lg font-semibold text-gray-800">Compétences techniques</h4>
                </div>
                {expandedSections.skills ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {expandedSections.skills && (
                <div className="p-4 border-t border-gray-100">
                  {technicalSkills.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {technicalSkills.map((skill, index) => (
                        <div
                          key={index}
                          className="bg-primary-50 border border-primary-100 rounded-lg p-3 flex items-center justify-between hover:bg-primary-100 transition-colors duration-200 skill-item"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <span className="text-primary font-medium">{skill}</span>
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Aucune compétence technique identifiée</p>
                  )}
                </div>
              )}
            </div>

            {/* Compétences personnelles */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300">
              <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center">
                  <Heart className="w-5 h-5 text-primary mr-2" />
                  <h4 className="text-lg font-semibold text-gray-800">Compétences personnelles</h4>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100">
                {softSkills.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {softSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="bg-primary-50 border border-primary-100 rounded-lg p-3 flex items-center justify-between hover:bg-primary-100 transition-colors duration-200 skill-item"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <span className="text-primary font-medium">{skill}</span>
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Aucune compétence personnelle identifiée</p>
                )}
              </div>
            </div>

            {/* Graphique de compétences - Version simplifiée et garantie visible */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h5 className="font-medium text-gray-700 mb-6">Répartition des compétences</h5>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-700">Techniques</div>
                  <div className="font-bold text-3xl text-primary">{technicalSkills.length || 0}</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-700">Personnelles</div>
                  <div className="font-bold text-3xl text-success">{softSkills.length || 0}</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-700">Forces</div>
                  <div className="font-bold text-3xl text-success">{strengths.length || 0}</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-700">Lacunes</div>
                  <div className="font-bold text-3xl text-red-500">{gaps.length || 0}</div>
                </div>
              </div>

              <div className="h-64 flex items-end justify-around gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                {/* Barre pour compétences techniques */}
                <div className="flex flex-col items-center w-full max-w-[80px]">
                  <div className="w-full bg-gray-200 rounded-lg relative" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-lg"
                      style={{
                        height: `${technicalSkills.length ? Math.max(10, (technicalSkills.length / (technicalSkills.length + softSkills.length || 1)) * 100) : 10}%`,
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 flex justify-center -mt-8">
                        <span className="bg-primary text-white px-2 py-1 rounded-full text-xs font-bold">
                          {Math.round(
                            (technicalSkills.length / (technicalSkills.length + softSkills.length || 1)) * 100,
                          ) || 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium mt-3 text-gray-700">Techniques</p>
                </div>

                {/* Barre pour compétences personnelles */}
                <div className="flex flex-col items-center w-full max-w-[80px]">
                  <div className="w-full bg-gray-200 rounded-lg relative" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-success rounded-lg"
                      style={{
                        height: `${softSkills.length ? Math.max(10, (softSkills.length / (technicalSkills.length + softSkills.length || 1)) * 100) : 10}%`,
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 flex justify-center -mt-8">
                        <span className="bg-success text-white px-2 py-1 rounded-full text-xs font-bold">
                          {Math.round((softSkills.length / (technicalSkills.length + softSkills.length || 1)) * 100) ||
                            0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium mt-3 text-gray-700">Personnelles</p>
                </div>

                {/* Barre pour forces */}
                <div className="flex flex-col items-center w-full max-w-[80px]">
                  <div className="w-full bg-gray-200 rounded-lg relative" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-success rounded-lg"
                      style={{
                        height: `${strengths.length ? Math.max(10, (strengths.length / (strengths.length + gaps.length || 1)) * 100) : 10}%`,
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 flex justify-center -mt-8">
                        <span className="bg-success text-white px-2 py-1 rounded-full text-xs font-bold">
                          {Math.round((strengths.length / (strengths.length + gaps.length || 1)) * 100) || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium mt-3 text-gray-700">Forces</p>
                </div>

                {/* Barre pour lacunes */}
                <div className="flex flex-col items-center w-full max-w-[80px]">
                  <div className="w-full bg-gray-200 rounded-lg relative" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-red-500 rounded-lg"
                      style={{
                        height: `${gaps.length ? Math.max(10, (gaps.length / (strengths.length + gaps.length || 1)) * 100) : 10}%`,
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 flex justify-center -mt-8">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          {Math.round((gaps.length / (strengths.length + gaps.length || 1)) * 100) || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium mt-3 text-gray-700">Lacunes</p>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-gray-500">
                Répartition basée sur {technicalSkills.length + softSkills.length} compétences identifiées et{" "}
                {strengths.length + gaps.length} points d'analyse
              </div>
            </div>
          </div>
        )}

        {/* Formation */}
        {activeTab === "education" && (
          <div className="space-y-8 fade-in">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300">
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => toggleSection("education")}
              >
                <div className="flex items-center">
                  <GraduationCap className="w-5 h-5 text-primary mr-2" />
                  <h4 className="text-lg font-semibold text-gray-800">Formation</h4>
                </div>
                {expandedSections.education ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {expandedSections.education && (
                <div className="p-4 border-t border-gray-100">
                  {education.length > 0 ? (
                    <div className="space-y-4">
                      {education.map((edu, index) => (
                        <div
                          key={index}
                          className="bg-primary-50 border border-primary-100 p-4 rounded-lg hover:shadow-md transition-all duration-200 education-item"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex items-start">
                            <div className="bg-primary-100 rounded-full p-2 mr-3">
                              <GraduationCap className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{edu.degree}</div>
                              <div className="text-gray-700 flex items-center">
                                <span>{edu.institution}</span>
                                <span className="mx-2">•</span>
                                <span className="text-primary font-medium">{edu.year}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Aucune formation identifiée</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommandations */}
        {activeTab === "recommendations" && (
          <div className="space-y-8 fade-in">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300">
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => toggleSection("recommendations")}
              >
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-primary mr-2" />
                  <h4 className="text-lg font-semibold text-gray-800">Recommandations pour l'entretien</h4>
                </div>
                {expandedSections.recommendations ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {expandedSections.recommendations && (
                <div className="p-4 border-t border-gray-100">
                  <div className="bg-primary-50 border border-primary-100 p-5 rounded-lg">
                    {focusAreas.length > 0 ? (
                      <div>
                        <p className="mb-4 text-gray-700">Concentrez-vous sur ces domaines lors de l'entretien :</p>
                        <ul className="space-y-3">
                          {focusAreas.map((area, index) => (
                            <li
                              key={index}
                              className="flex items-start recommendation-item"
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mr-3 mt-0.5">
                                <ArrowUpRight className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <span className="text-gray-800 font-medium">{area}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-gray-700">
                        Le profil du candidat semble bien correspondre aux exigences du poste. Concentrez-vous sur la
                        validation des compétences techniques et de l'expérience lors de l'entretien.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        
      </div>
    </div>
  )
}
