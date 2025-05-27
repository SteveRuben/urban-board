"use client"

import { useState, useEffect, type ReactElement } from "react"
import Head from "next/head"
import Link from "next/link"
import { Search, Filter, MapPin, Briefcase, Clock, Euro, Building, Calendar, ChevronRight } from "lucide-react"
import { JobService } from "@/services/jobs-service"
import type { JobPosting, PublicJobFilters } from "@/types/jobs"
import Layout from "@/components/layout/layout"
import type { NextPageWithLayout } from "@/types/page"

const PublicJobsPage: NextPageWithLayout = () => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalJobs, setTotalJobs] = useState<number>(0)
  const [filters, setFilters] = useState<PublicJobFilters>({})
  const [showFilters, setShowFilters] = useState<boolean>(false)

  const fetchPublicJobs = async (page = 1, newFilters = filters) => {
    try {
      setLoading(true)
      setError(null)

      const response = await JobService.getPublicJobPostings({
        page,
        per_page: 12,
        filters: newFilters,
      })

      setJobPostings(response.data)
      setCurrentPage(response.pagination.page)
      setTotalPages(response.pagination.pages)
      setTotalJobs(response.pagination.total)
    } catch (err) {
      console.error("Erreur lors de la récupération des offres:", err)
      setError("Impossible de charger les offres d'emploi. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPublicJobs()
  }, [])

  const handleFilterChange = (key: keyof PublicJobFilters, value: string | number | undefined) => {
    const newFilters = { ...filters }
    if (value === "" || value === undefined) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    setFilters(newFilters)
    setCurrentPage(1)
    fetchPublicJobs(1, newFilters)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchPublicJobs(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const clearFilters = () => {
    setFilters({})
    setCurrentPage(1)
    fetchPublicJobs(1, {})
  }

  // Helper pour formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? "s" : ""}`
    return date.toLocaleDateString("fr-FR")
  }

  // Helper pour formater le salaire
  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return null
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`
    if (min) return `À partir de ${min.toLocaleString()} ${currency}`
    return `Jusqu'à ${max?.toLocaleString()} ${currency}`
  }

  return (
    <>
      <Head>
        <title>Offres d'emploi disponibles</title>
        <meta name="description" content="Découvrez toutes les offres d'emploi disponibles et postulez en ligne" />
      </Head>

      <div className="bg-gray-50 min-h-screen py-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-700 text-black shadow-md">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">Trouvez votre prochain emploi</h1>
                <p className="text-xl">
                  Découvrez {totalJobs} offre{totalJobs > 1 ? "s" : ""} d'emploi disponible{totalJobs > 1 ? "s" : ""}{" "}
                  dans nos entreprises partenaires
                </p>
              </div>

              {/* Barre de recherche principale */}
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Titre du poste, compétences, entreprise..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={filters.keywords || ""}
                      onChange={(e) => handleFilterChange("keywords", e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Localisation"
                      className="w-full md:w-64 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={filters.location || ""}
                      onChange={(e) => handleFilterChange("location", e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center px-6 py-3 bg-white text-primary-700 font-medium rounded-lg hover:bg-gray-100 transition duration-300"
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    Filtres
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Filtres avancés */}
            {showFilters && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de contrat</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={filters.employment_type || ""}
                      onChange={(e) => handleFilterChange("employment_type", e.target.value)}
                    >
                      <option value="">Tous</option>
                      <option value="Full-time">Temps plein</option>
                      <option value="Part-time">Temps partiel</option>
                      <option value="Contract">Contrat</option>
                      <option value="Internship">Stage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Télétravail</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={filters.remote_policy || ""}
                      onChange={(e) => handleFilterChange("remote_policy", e.target.value)}
                    >
                      <option value="">Indifférent</option>
                      <option value="Remote">100% remote</option>
                      <option value="Hybrid">Hybride</option>
                      <option value="On-site">Sur site</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salaire minimum (€)</label>
                    <input
                      type="number"
                      placeholder="30000"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={filters.salary_min || ""}
                      onChange={(e) =>
                        handleFilterChange("salary_min", e.target.value ? Number.parseInt(e.target.value) : undefined)
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700 transition duration-300 font-medium"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* Résultats */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Liste des offres */}
              <div className="flex-1">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse border border-gray-100">
                        <div className="flex justify-between">
                          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="flex gap-2 mb-4">
                          <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                          <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                          <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                        <div className="flex justify-between items-end">
                          <div className="h-6 bg-gray-200 rounded-full w-32"></div>
                          <div className="h-10 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : jobPostings.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune offre trouvée</h3>
                    <p className="text-gray-500 mb-4">
                      Aucune offre d'emploi ne correspond à vos critères de recherche.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700 transition duration-300 font-medium"
                    >
                      Voir toutes les offres
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {jobPostings.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 hover:text-primary-600 transition-colors">
                                  {job.title}
                                </h2>
                                <div className="flex items-center text-gray-600 mb-2">
                                  <Building className="h-4 w-4 mr-2 text-primary-500" />
                                  <span>{job.organization_name}</span>
                                </div>
                              </div>
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                Publiée
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                              {job.location && (
                                <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                  <MapPin className="h-4 w-4 mr-1 text-primary-500" />
                                  {job.location}
                                </span>
                              )}

                              {job.employment_type && (
                                <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                  <Briefcase className="h-4 w-4 mr-1 text-primary-500" />
                                  {job.employment_type}
                                </span>
                              )}

                              {job.remote_policy && (
                                <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                  <Clock className="h-4 w-4 mr-1 text-primary-500" />
                                  {job.remote_policy === "Remote"
                                    ? "Télétravail"
                                    : job.remote_policy === "Hybrid"
                                      ? "Hybride"
                                      : "Sur site"}
                                </span>
                              )}

                              {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency) && (
                                <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                  <Euro className="h-4 w-4 mr-1 text-primary-500" />
                                  {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency)}
                                </span>
                              )}

                              <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                <Calendar className="h-4 w-4 mr-1 text-primary-500" />
                                {formatDate(job.published_at || job.created_at)}
                              </span>
                            </div>

                            <p className="text-gray-700 mb-4 line-clamp-2">
                              {job.description.length > 150
                                ? `${job.description.substring(0, 150)}...`
                                : job.description}
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {job.is_featured && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                                  Offre mise en avant
                                </span>
                              )}
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                {job.application_count} candidature{job.application_count > 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 lg:mt-0 lg:ml-6">
                            <Link
                              href={`/jobs-applications/${job.id}`}
                              className="inline-flex items-center px-6 py-3 bg-primary-600 text-black rounded-md hover:bg-primary-700 transition duration-300 font-medium"
                            >
                              Voir l'offre
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {!loading && jobPostings.length > 0 && totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                        }`}
                      >
                        Précédent
                      </button>

                      {/* Pages */}
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${
                              page === currentPage
                                ? "bg-primary-600 text-black"
                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          currentPage === totalPages
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                        }`}
                      >
                        Suivant
                      </button>
                    </nav>
                  </div>
                )}
              </div>

              {/* Sidebar avec stats */}
              <div className="lg:w-80">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Statistiques</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="text-gray-600">Total des offres</span>
                      <span className="font-semibold text-gray-900 bg-primary-50 px-3 py-1 rounded-full">
                        {totalJobs}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="text-gray-600">Page actuelle</span>
                      <span className="font-semibold text-gray-900 bg-primary-50 px-3 py-1 rounded-full">
                        {currentPage} / {totalPages}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Offres affichées</span>
                      <span className="font-semibold text-gray-900 bg-primary-50 px-3 py-1 rounded-full">
                        {jobPostings.length}
                      </span>
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

PublicJobsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>
export default PublicJobsPage
