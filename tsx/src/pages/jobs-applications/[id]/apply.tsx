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
  Building,
  Upload,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  User,
  Eye,
  Calendar,
  Clock,
  Euro,
} from "lucide-react"
import { JobService } from "@/services/jobs-service"
import type { JobPosting, JobApplicationFormData } from "@/types/jobs"
import Layout from "@/components/layout/layout"
import type { NextPageWithLayout } from "@/types/page"

const JobApplicationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { id } = router.query
  const [job, setJob] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // État du formulaire de candidature
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

  if (submitSuccess) {
    return (
      <>
        <Head>
          <title>Candidature envoyée - {job.title}</title>
        </Head>
        <div className="bg-gray-50 min-h-screen">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md">
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-4xl mx-auto text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Candidature envoyée avec succès !</h1>
                <p className="text-xl">
                  Votre candidature pour le poste de {job.title} a été transmise à l'équipe de recrutement.
                </p>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Et maintenant ?</h2>
                <div className="space-y-4 text-left">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <Mail className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Confirmation par email</h3>
                      <p className="text-gray-600 text-sm">
                        Vous recevrez un email de confirmation dans les prochaines minutes à l'adresse{" "}
                        <span className="font-medium">{applicationData.candidate_email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <Eye className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Examen de votre candidature</h3>
                      <p className="text-gray-600 text-sm">
                        Notre équipe de recrutement examinera votre candidature dans les 5 jours ouvrables.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <Phone className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Prise de contact</h3>
                      <p className="text-gray-600 text-sm">
                        Si votre profil correspond à nos attentes, nous vous contacterons pour un premier entretien.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href={`/jobs-applications/${id}`}
                      className="px-6 py-3 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      Voir l'offre d'emploi
                    </Link>
                    <Link
                      href="/jobs-applications"
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Voir d'autres offres
                    </Link>
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
        <title>
          Postuler - {job.title} - {job.organization_name}
        </title>
        <meta name="description" content={`Postulez pour le poste de ${job.title} chez ${job.organization_name}`} />
      </Head>

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-700 text-black shadow-md">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <Link
                href={`/jobs-applications/${id}`}
                className="inline-flex items-center text-black hover:text-black/80 mb-4 bg-white/20 px-4 py-2 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour à l'offre
              </Link>

              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">Postuler pour ce poste</h1>
                <p className="text-xl">Complétez le formulaire ci-dessous pour envoyer votre candidature</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulaire principal */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations de candidature</h2>

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
                          className={`flex items-center justify-center w-full border-2 border-dashed rounded-lg px-4 py-8 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
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
                                  Glissez-déposez votre CV ici ou{" "}
                                  <span className="text-primary-600">parcourez vos fichiers</span>
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
                        rows={8}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Parlez-nous de votre motivation pour ce poste et pourquoi vous seriez le candidat idéal..."
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Une lettre de motivation personnalisée augmente vos chances d'être remarqué
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                      <Link
                        href={`/jobs-applications/${id}`}
                        className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium w-full sm:w-auto text-center"
                      >
                        Annuler
                      </Link>
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

              {/* Sidebar avec informations sur l'offre */}
              <div className="space-y-6">
                {/* Résumé de l'offre */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Offre d'emploi
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{job.title}</h4>
                      <p className="text-gray-600 flex items-center text-sm">
                        <Building className="h-4 w-4 mr-1" />
                        {job.organization_name}
                      </p>
                    </div>

                    {job.location && (
                      <p className="text-gray-600 flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </p>
                    )}

                    {job.employment_type && (
                      <p className="text-gray-600 flex items-center text-sm">
                        <Briefcase className="h-4 w-4 mr-1" />
                        {job.employment_type}
                      </p>
                    )}

                    {job.remote_policy && (
                      <p className="text-gray-600 flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.remote_policy === "Remote"
                          ? "Télétravail"
                          : job.remote_policy === "Hybrid"
                            ? "Hybride"
                            : "Sur site"}
                      </p>
                    )}

                    {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency) && (
                      <p className="text-gray-600 flex items-center text-sm">
                        <Euro className="h-4 w-4 mr-1" />
                        {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency)}
                      </p>
                    )}

                    <p className="text-gray-600 flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Publiée le {formatDate(job.published_at || job.created_at)}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href={`/jobs-applications/${id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Voir les détails de l'offre →
                    </Link>
                  </div>
                </div>

                {/* Conseils */}
                <div className="bg-primary-50 rounded-lg p-6 border border-primary-100">
                  <h3 className="text-lg font-semibold text-primary-900 mb-4">Conseils pour votre candidature</h3>
                  <ul className="space-y-2 text-sm text-primary-800">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      Personnalisez votre lettre de motivation en fonction du poste
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      Assurez-vous que votre CV est à jour et bien formaté
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      Mettez en avant vos compétences pertinentes pour ce poste
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      Relisez votre candidature avant de l'envoyer
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

JobApplicationPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>
export default JobApplicationPage
