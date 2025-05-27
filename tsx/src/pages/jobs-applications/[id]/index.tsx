"use client"

import type React from "react"

import { useState, useEffect, type ReactElement } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  Euro,
  Building,
  Calendar,
  Users,
  Upload,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  User,
  X,
  ChevronRight,
} from "lucide-react"
import { JobService } from "@/services/jobs-service"
import type { JobPosting, JobApplicationFormData } from "@/types/jobs"
import Layout from "@/components/layout/layout"
import type { NextPageWithLayout } from "@/types/page"

// Ajouter ces styles CSS pour l'animation au début du composant, juste après les imports

const PublicJobDetailPage: NextPageWithLayout = () => {
  // Ajouter ce style pour les animations
  const fadeInUpStyle = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
  `

  const router = useRouter()
  const { id } = router.query
  const [job, setJob] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // État du formulaire de candidature
  const [showApplicationForm, setShowApplicationForm] = useState<boolean>(false)
  const [applicationData, setApplicationData] = useState<JobApplicationFormData>({
    candidate_name: "",
    candidate_email: "",
    candidate_phone: "",
    cover_letter: "",
  })
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false)
  const [uploading, setUploading] = useState<boolean>(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const fetchJobDetails = async () => {
    if (!id || typeof id !== "string") return
    try {
      setLoading(true)
      setError(null)

      const response = await JobService.getPublicJobPosting(id)
      setJob(response)
    } catch (err) {
      console.error("Erreur lors de la récupération des détails:", err)
      setError("Impossible de charger les détails de l'offre. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobDetails()
  }, [id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setApplicationData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const error = JobService.validateResumeFile(file)
      if (error) {
        setValidationErrors((prev) => ({
          ...prev,
          resume: error,
        }))
        e.target.value = ""
        return
      }
      setResumeFile(file)
      setValidationErrors((prev) => ({
        ...prev,
        resume: "",
      }))
    }
  }

  const validateForm = (): boolean => {
    const errors = JobService.validateApplicationData(applicationData)
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const finalApplicationData = { ...applicationData }

      // Upload du CV si fourni
      if (resumeFile) {
        setUploading(true)
        const uploadResult = await JobService.uploadResume(resumeFile)
        finalApplicationData.resume_url = uploadResult.file_url
        setUploading(false)
      }

      // Envoyer la candidature
      await JobService.applyToJob(id as string, finalApplicationData)

      setSubmitSuccess(true)
      setShowApplicationForm(false)

      // Réinitialiser le formulaire
      setApplicationData({
        candidate_name: "",
        candidate_email: "",
        candidate_phone: "",
        cover_letter: "",
      })
      setResumeFile(null)
    } catch (err: any) {
      setSubmitError(err.message || "Erreur lors de l'envoi de la candidature")
      setUploading(false)
    } finally {
      setSubmitting(false)
    }
  }

  // Helper pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Helper pour formater le salaire
  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return null
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`
    if (min) return `À partir de ${min.toLocaleString()} ${currency}`
    return `Jusqu'à ${max?.toLocaleString()} ${currency}`
  }

  if (loading) {
    return (
      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-100">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-500 text-lg">Chargement des détails de l'offre...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-100">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Offre non trouvée</h2>
              <p className="text-gray-500 mb-6 text-lg">
                {error || "Cette offre d'emploi n'existe pas ou n'est plus disponible."}
              </p>
              <Link
                href="/jobs-applications"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition duration-300 font-medium"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour aux offres
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>
          {job.title} - {job.organization_name}
        </title>
        <meta name="description" content={job.description.substring(0, 160)} />
        <style>{fadeInUpStyle}</style>
      </Head>

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-700 text-black shadow-md">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/jobs-applications"
                className="inline-flex items-center text-black hover:text-black/80 mb-4 bg-white/20 px-4 py-2 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour aux offres
              </Link>

              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                  <div className="flex items-center mb-4">
                    <Building className="h-5 w-5 mr-2" />
                    <span className="text-lg font-medium">{job.organization_name}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {job.location && (
                      <span className="flex items-center bg-white/20 px-3 py-1 rounded-full text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </span>
                    )}

                    {job.employment_type && (
                      <span className="flex items-center bg-white/20 px-3 py-1 rounded-full text-sm">
                        <Briefcase className="h-4 w-4 mr-1" />
                        {job.employment_type}
                      </span>
                    )}

                    {job.remote_policy && (
                      <span className="flex items-center bg-white/20 px-3 py-1 rounded-full text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.remote_policy === "Remote"
                          ? "Télétravail"
                          : job.remote_policy === "Hybrid"
                            ? "Hybride"
                            : "Sur site"}
                      </span>
                    )}

                    <span className="flex items-center bg-white/20 px-3 py-1 rounded-full text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Publiée le {formatDate(job.published_at || job.created_at)}
                    </span>

                    <span className="flex items-center bg-white/20 px-3 py-1 rounded-full text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      {job.application_count} candidature{job.application_count > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="mt-6 lg:mt-0 lg:ml-8">
                  {submitSuccess ? (
                    <div className="bg-white rounded-lg p-4 text-center border-2 border-green-500 shadow-lg">
                      <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                      <p className="text-green-800 font-medium text-lg">Candidature envoyée !</p>
                      <p className="text-green-600">Vous recevrez un email de confirmation.</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowApplicationForm(true)}
                      className="w-full lg:w-auto px-8 py-3 bg-white text-primary-700 rounded-lg hover:bg-white/90 font-medium transition-colors shadow-md flex items-center justify-center"
                    >
                      Postuler maintenant
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contenu principal */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Description du poste
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                  </div>
                </div>

                {/* Responsabilités */}
                {job.responsibilities && (
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                      Responsabilités
                    </h2>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{job.responsibilities}</p>
                    </div>
                  </div>
                )}

                {/* Exigences */}
                {job.requirements && (
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                      Exigences
                    </h2>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Informations sur l'offre */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Informations
                  </h3>
                  <div className="space-y-4">
                    {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency) && (
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          <Euro className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Salaire</p>
                          <p className="font-medium text-gray-900">
                            {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <Briefcase className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Type de contrat</p>
                        <p className="font-medium text-gray-900">{job.employment_type || "Non spécifié"}</p>
                      </div>
                    </div>

                    {job.remote_policy && (
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          <Clock className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Politique de télétravail</p>
                          <p className="font-medium text-gray-900">
                            {job.remote_policy === "Remote"
                              ? "Télétravail complet"
                              : job.remote_policy === "Hybrid"
                                ? "Télétravail hybride"
                                : "Travail sur site"}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <Calendar className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date de publication</p>
                        <p className="font-medium text-gray-900">{formatDate(job.published_at || job.created_at)}</p>
                      </div>
                    </div>

                    {job.closes_at && (
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          <Calendar className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date de clôture</p>
                          <p className="font-medium text-gray-900">{formatDate(job.closes_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Candidatures */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Candidatures
                  </h3>
                  <div className="text-center">
                    <div className="bg-primary-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-10 w-10 text-primary-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{job.application_count}</p>
                    <p className="text-sm text-gray-500">
                      candidature{job.application_count > 1 ? "s" : ""} reçue{job.application_count > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                {!submitSuccess && (
                  <div className="bg-gradient-to-r from-primary-600 to-secondary-700 rounded-lg shadow-md p-6 text-black text-center">
                    <h3 className="text-lg font-semibold mb-3">Intéressé(e) par ce poste ?</h3>
                    <p className="mb-4">N'attendez plus et postulez dès maintenant pour rejoindre notre équipe !</p>
                    <button
                      onClick={() => setShowApplicationForm(true)}
                      className="w-full px-6 py-3 bg-white text-primary-700 rounded-lg hover:bg-white/90 font-medium transition-colors shadow-md"
                    >
                      Postuler maintenant
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de candidature */}
        {showApplicationForm && (
          <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 transition-opacity duration-300">
            <div
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn relative"
              style={{
                boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 15px -6px rgba(0, 0, 0, 0.1)",
                transform: "translateY(0)",
                animation: "fadeInUp 0.3s ease-out",
              }}
            >
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-2xl font-bold text-gray-900">Postuler à cette offre</h2>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-100">
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      <Briefcase className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-lg">{job.title}</h3>
                      <p className="text-gray-600 flex items-center">
                        <Building className="h-4 w-4 mr-1 inline" />
                        {job.organization_name}
                      </p>
                      {job.location && (
                        <p className="text-gray-600 text-sm mt-1 flex items-center">
                          <MapPin className="h-4 w-4 mr-1 inline" />
                          {job.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Erreur lors de l'envoi</p>
                      <p className="text-sm">{submitError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="candidate_name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nom complet <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <User className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          id="candidate_name"
                          name="candidate_name"
                          value={applicationData.candidate_name}
                          onChange={handleInputChange}
                          className={`pl-10 w-full border rounded-lg px-3 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                            validationErrors.candidate_name ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="Votre nom complet"
                        />
                      </div>
                      {validationErrors.candidate_name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                          {validationErrors.candidate_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="candidate_email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          type="email"
                          id="candidate_email"
                          name="candidate_email"
                          value={applicationData.candidate_email}
                          onChange={handleInputChange}
                          className={`pl-10 w-full border rounded-lg px-3 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                            validationErrors.candidate_email ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="votre.email@exemple.com"
                        />
                      </div>
                      {validationErrors.candidate_email && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                          {validationErrors.candidate_email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="candidate_phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Phone className="h-5 w-5" />
                      </div>
                      <input
                        type="tel"
                        id="candidate_phone"
                        name="candidate_phone"
                        value={applicationData.candidate_phone}
                        onChange={handleInputChange}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Nous pourrons vous contacter plus facilement</p>
                  </div>

                  <div>
                    <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">
                      CV (PDF, DOC, DOCX)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="resume"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="resume"
                        className={`flex items-center justify-center w-full border-2 border-dashed rounded-lg px-4 py-6 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                          validationErrors.resume
                            ? "border-red-300 bg-red-50"
                            : resumeFile
                              ? "border-green-300 bg-green-50"
                              : "border-gray-300"
                        }`}
                      >
                        <div className="text-center">
                          {resumeFile ? (
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <FileText className="h-8 w-8 text-green-600" />
                              </div>
                              <p className="text-green-600 font-medium">{resumeFile.name}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Fichier sélectionné • <span className="text-primary-600 underline">Changer</span>
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Upload className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-600 font-medium">
                                Glissez-déposez votre CV ici ou <span className="text-primary-600">parcourez</span>
                              </p>
                              <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (max 16MB)</p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                    {validationErrors.resume && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        {validationErrors.resume}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="cover_letter" className="block text-sm font-medium text-gray-700 mb-2">
                      Lettre de motivation
                    </label>
                    <textarea
                      id="cover_letter"
                      name="cover_letter"
                      value={applicationData.cover_letter}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Parlez-nous de votre motivation pour ce poste et pourquoi vous seriez le candidat idéal..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Une lettre de motivation personnalisée augmente vos chances d'être remarqué
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowApplicationForm(false)}
                      className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium w-full sm:w-auto"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || uploading}
                      className="flex items-center justify-center px-8 py-3 bg-primary-600 text-black rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium shadow-md w-full sm:w-auto"
                    >
                      {submitting || uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                          {uploading ? "Upload en cours..." : "Envoi en cours..."}
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Envoyer ma candidature
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

PublicJobDetailPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>
export default PublicJobDetailPage
