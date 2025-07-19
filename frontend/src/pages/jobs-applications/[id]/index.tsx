"use client"

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
  AlertCircle,
  FileText,
  ChevronRight,
  Eye,
  Download,
  ExternalLink,
} from "lucide-react"
import { JobService } from "@/services/jobs-service"
import type { JobPosting } from "@/types/jobs"
import Layout from "@/components/layout/layout"
import type { NextPageWithLayout } from "@/types/page"

const PublicJobDetailPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { id } = router.query
  const [job, setJob] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // État du fichier d'offre
  const [fileUrls, setFileUrls] = useState<{
    file_available: boolean
    download_url?: string
    preview_url?: string
    filename?: string
  } | null>(null)
  const [loadingFile, setLoadingFile] = useState<boolean>(false)

  const fetchJobDetails = async () => {
    if (!id || typeof id !== "string") return
    try {
      setLoading(true)
      setError(null)

      const response = await JobService.getPublicJobPosting(id)
      setJob(response)

      // Essayer de récupérer les URLs du fichier si l'offre a été créée depuis un fichier
      if (response.source === "imported") {
        await fetchFileUrls(id)
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des détails:", err)
      setError("Impossible de charger les détails de l'offre. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const fetchFileUrls = async (jobId: string) => {
    try {
      setLoadingFile(true)
      const urls = await JobService.getJobPostingFileUrls(jobId)
      setFileUrls(urls)
    } catch (err) {
      console.error("Erreur lors de la récupération des URLs du fichier:", err)
      // Ne pas afficher d'erreur si le fichier n'est pas disponible
    } finally {
      setLoadingFile(false)
    }
  }

  const handlePreviewFile = async () => {
    if (!id || typeof id !== "string") return
    try {
      await JobService.previewJobPostingFile(id)
    } catch (err: any) {
      console.error("Erreur lors de la prévisualisation:", err)
      setError("Impossible de prévisualiser le fichier. Veuillez réessayer.")
    }
  }

  const handleDownloadFile = async () => {
    if (!id || typeof id !== "string") return
    try {
      await JobService.downloadJobPostingFile(id, fileUrls?.filename)
    } catch (err: any) {
      console.error("Erreur lors du téléchargement:", err)
      setError("Impossible de télécharger le fichier. Veuillez réessayer.")
    }
  }

  useEffect(() => {
    fetchJobDetails()
  }, [id])

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

                  {/* Fichier d'offre si disponible */}
                  {fileUrls && fileUrls.file_available && (
                    <div className="bg-white/20 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          <div>
                            <p className="font-medium">Fichier d'offre disponible</p>
                            <p className="text-sm opacity-90">{fileUrls.filename}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handlePreviewFile}
                            className="flex items-center px-3 py-1 bg-white/30 rounded-md hover:bg-white/40 transition-colors text-sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Prévisualiser
                          </button>
                          <button
                            onClick={handleDownloadFile}
                            className="flex items-center px-3 py-1 bg-white/30 rounded-md hover:bg-white/40 transition-colors text-sm"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 lg:mt-0 lg:ml-8">
                  <Link
                    href={`/jobs-applications/${id}/apply`}
                    className="w-full lg:w-auto px-8 py-3 bg-white text-primary-700 rounded-lg hover:bg-white/90 font-medium transition-colors shadow-md flex items-center justify-center"
                  >
                    Postuler maintenant
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Link>
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

                {/* Fichier d'offre intégré */}
                {fileUrls && fileUrls.file_available && (
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                      <h2 className="text-xl font-semibold text-gray-900">Document d'offre complet</h2>
                      <div className="flex space-x-2">
                        <button
                          onClick={handlePreviewFile}
                          className="flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors text-sm"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ouvrir
                        </button>
                        <button
                          onClick={handleDownloadFile}
                          className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Télécharger
                        </button>
                      </div>
                    </div>
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Document complet de l'offre d'emploi disponible</p>
                      <p className="text-sm text-gray-500 mb-4">{fileUrls.filename}</p>
                      <button
                        onClick={handlePreviewFile}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700 transition-colors font-medium"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Consulter le document
                      </button>
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
                <div className="bg-gradient-to-r from-primary-600 to-secondary-700 rounded-lg shadow-md p-6 text-black text-center">
                  <h3 className="text-lg font-semibold mb-3">Intéressé(e) par ce poste ?</h3>
                  <p className="mb-4">N'attendez plus et postulez dès maintenant pour rejoindre notre équipe !</p>
                  <Link
                    href={`/jobs-applications/${id}/apply`}
                    className="w-full px-6 py-3 bg-white text-primary-700 rounded-lg hover:bg-white/90 font-medium transition-colors shadow-md inline-block"
                  >
                    Postuler maintenant
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

PublicJobDetailPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>
export default PublicJobDetailPage
