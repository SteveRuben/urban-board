"use client"

import { useState, useEffect, type ReactElement } from "react"
import Head from "next/head"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye,
  Code,
  Settings,
  BookOpen,
  Target,
  Clock,
  ChevronDown,
  MoreVertical,
  Copy,
  Archive,
  Upload
} from "lucide-react"
import { CodingPlatformService } from "@/services/coding-platform-service"
import Layout from "@/components/layout/layout"
import type { NextPageWithLayout } from "@/types/page"
import { ChallengeDifficulty, Exercise, ProgrammingLanguage } from "@/types/coding-plateform"

const AdminExercisesPage: NextPageWithLayout = () => {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalExercises, setTotalExercises] = useState<number>(0)
  const [filters, setFilters] = useState<{
    language?: ProgrammingLanguage
    difficulty?: ChallengeDifficulty
    keywords?: string
  }>({})
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)

  // Form state for creating exercise
  const [newExercise, setNewExercise] = useState({
    title: '',
    description: '',
    language: 'python' as ProgrammingLanguage,
    difficulty: 'beginner' as ChallengeDifficulty,
    order_index: 1
  })

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async (page = 1, newFilters = filters) => {
    try {
      setLoading(true)
      setError(null)

      const response = await CodingPlatformService.getExercises({
        page,
        per_page: 15,
        language: newFilters.language,
        difficulty: newFilters.difficulty,
      })

      setExercises(response.data)
      setCurrentPage(response.pagination.page)
      setTotalPages(response.pagination.pages)
      setTotalExercises(response.pagination.total)
    } catch (err) {
      console.error("Error fetching exercises:", err)
      setError("Impossible de charger les exercices. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    const newFilters = { ...filters }
    if (value === "" || value === undefined) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    setFilters(newFilters)
    setCurrentPage(1)
    fetchExercises(1, newFilters)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchExercises(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const clearFilters = () => {
    setFilters({})
    setCurrentPage(1)
    fetchExercises(1, {})
  }

  const handleSelectExercise = (exerciseId: number) => {
    const newSelected = new Set(selectedExercises)
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId)
    } else {
      newSelected.add(exerciseId)
    }
    setSelectedExercises(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedExercises.size === exercises.length) {
      setSelectedExercises(new Set())
    } else {
      setSelectedExercises(new Set(exercises.map(ex => ex.id)))
    }
  }

  const handleCreateExercise = async () => {
    try {
      setIsCreating(true)
      setError(null)

      await CodingPlatformService.createExercise(newExercise)
      
      // Reset form
      setNewExercise({
        title: '',
        description: '',
        language: 'python' as ProgrammingLanguage,
        difficulty: 'beginner' as ChallengeDifficulty,
        order_index: 1
      })
      setShowCreateModal(false)
      
      // Refresh list
      await fetchExercises()
      
    } catch (err) {
      console.error("Error creating exercise:", err)
      setError("Erreur lors de la création de l'exercice.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteExercise = async (exerciseId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet exercice ? Cette action est irréversible.")) {
      return
    }

    try {
      await CodingPlatformService.deleteExercise(exerciseId)
      await fetchExercises()
    } catch (err) {
      console.error("Error deleting exercise:", err)
      setError("Erreur lors de la suppression de l'exercice.")
    }
  }

  const getDifficultyColor = (difficulty: ChallengeDifficulty) => {
    const colors = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-orange-100 text-orange-800',
      'expert': 'bg-red-100 text-red-800'
    }
    return colors[difficulty] || 'bg-gray-100 text-gray-800'
  }

  const getLanguageIcon = (language: ProgrammingLanguage) => {
    const icons = {
      'python': '🐍',
      'javascript': '⚡',
      'java': '☕',
      'cpp': '⚙️',
      'c': '🔧'
    }
    return icons[language] || '💻'
  }

  return (
    <>
      <Head>
        <title>Administration - Exercices | Coding Platform</title>
        <meta name="description" content="Gestion des exercices de programmation" />
      </Head>

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestion des Exercices</h1>
                <p className="text-gray-600 mt-1">
                  Créez et gérez les exercices de programmation
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nouvel Exercice
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filters & Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un exercice..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.keywords || ""}
                    onChange={(e) => handleFilterChange("keywords", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.language || ""}
                  onChange={(e) => handleFilterChange("language", e.target.value)}
                >
                  <option value="">Tous les langages</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                </select>

                <select
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.difficulty || ""}
                  onChange={(e) => handleFilterChange("difficulty", e.target.value)}
                >
                  <option value="">Toutes difficultés</option>
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                  <option value="expert">Expert</option>
                </select>

                <button
                  onClick={clearFilters}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Effacer
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm font-medium">Total Exercices</p>
                  <p className="text-2xl font-bold text-gray-900">{totalExercises}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm font-medium">Challenges Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {exercises.reduce((sum, ex) => sum + ex.challenge_count, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Code className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm font-medium">Langages</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm font-medium">Page Actuelle</p>
                  <p className="text-2xl font-bold text-gray-900">{currentPage}/{totalPages}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <svg className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Bulk Actions */}
          {selectedExercises.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium">
                    {selectedExercises.size} exercice(s) sélectionné(s)
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
                    <Archive className="h-4 w-4 mr-2" />
                    Archiver
                  </button>
                  <button className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exercises Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedExercises.size === exercises.length && exercises.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exercice
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Langage
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulté
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Challenges
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créé le
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="w-4 h-4 bg-gray-200 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      </tr>
                    ))
                  ) : exercises.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun exercice trouvé</h3>
                          <p className="text-gray-500 mb-4">Commencez par créer votre premier exercice.</p>
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Créer un exercice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    exercises.map((exercise) => (
                      <tr
                        key={exercise.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedExercises.has(exercise.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedExercises.has(exercise.id)}
                            onChange={() => handleSelectExercise(exercise.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{getLanguageIcon(exercise.language)}</div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{exercise.title}</div>
                              <div className="text-sm text-gray-500 max-w-md truncate">
                                {exercise.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {CodingPlatformService.getLanguageLabel(exercise.language)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                            {CodingPlatformService.getDifficultyLabel(exercise.difficulty)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{exercise.challenge_count}</span>
                            <span className="text-sm text-gray-500 ml-1">challenges</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(exercise.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/admin/exercises/${exercise.id}`}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/admin/exercises/${exercise.id}/edit`}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteExercise(exercise.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && exercises.length > 0 && totalPages > 1 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Affichage de {((currentPage - 1) * 15) + 1} à {Math.min(currentPage * 15, totalExercises)} sur {totalExercises} exercices
                  </div>
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                      }`}
                    >
                      Précédent
                    </button>

                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            page === currentPage
                              ? "bg-blue-600 text-white"
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
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                      }`}
                    >
                      Suivant
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Exercise Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Créer un nouvel exercice</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                    <input
                      type="text"
                      value={newExercise.title}
                      onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Structures de données avancées"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newExercise.description}
                      onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Description de l'exercice..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Langage</label>
                      <select
                        value={newExercise.language}
                        onChange={(e) => setNewExercise({ ...newExercise, language: e.target.value as ProgrammingLanguage })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="c">C</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulté</label>
                      <select
                        value={newExercise.difficulty}
                        onChange={(e) => setNewExercise({ ...newExercise, difficulty: e.target.value as ChallengeDifficulty })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="beginner">Débutant</option>
                        <option value="intermediate">Intermédiaire</option>
                        <option value="advanced">Avancé</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateExercise}
                    disabled={isCreating || !newExercise.title.trim()}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      isCreating || !newExercise.title.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isCreating ? 'Création...' : 'Créer l\'exercice'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

AdminExercisesPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>
export default AdminExercisesPage