// pages/admin/exercises/index.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash, Eye, Search, Filter, Code, BookOpen } from 'lucide-react';
import { CodingPlatformService } from '@/services/coding-platform-service';
import { ChallengeDifficulty, Exercise, ProgrammingLanguage } from '@/types/coding-plateform';

export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    per_page: 20,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await CodingPlatformService.getExercises({
        page: pagination.page,
        per_page: pagination.per_page,
        language: languageFilter !== 'all' ? languageFilter as ProgrammingLanguage : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter as ChallengeDifficulty : undefined
      });
      
      setExercises(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erreur lors de la récupération des exercices:', err);
      setError('Impossible de charger les exercices. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [pagination.page, languageFilter, difficultyFilter]);

  const filteredExercises = searchTerm 
    ? exercises.filter(exercise => 
        exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        exercise.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : exercises;

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet exercice ? Cette action supprimera également tous les challenges associés.')) {
      return;
    }
    
    try {
      await CodingPlatformService.deleteExercise(exerciseId);
      setExercises(prev => prev.filter(exercise => exercise.id !== exerciseId));
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }));
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Impossible de supprimer l\'exercice. Veuillez réessayer.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getDifficultyBadgeClass = (difficulty: ChallengeDifficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* En-tête de la page */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Exercices de codage</h1>
                <p className="text-gray-600">
                  Gérez les exercices et challenges de votre plateforme
                </p>
              </div>
              <Link
                href="/coding-admin/exercises/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Nouvel exercice
              </Link>
            </div>

            {/* Filtres et recherche */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="relative flex-grow lg:max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rechercher un exercice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <label htmlFor="language-filter" className="text-gray-700 text-sm">Langage :</label>
                  </div>
                  <select
                    id="language-filter"
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                  >
                    <option value="all">Tous</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <label htmlFor="difficulty-filter" className="text-gray-700 text-sm">Difficulté :</label>
                  </div>
                  <select
                    id="difficulty-filter"
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                  >
                    <option value="all">Toutes</option>
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Liste des exercices */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500">Chargement des exercices...</p>
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Aucun exercice trouvé.</p>
                  <Link
                    href="/admin/exercises/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Créer un exercice
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exercice
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Langage
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Difficulté
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Challenges
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date de création
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredExercises.map((exercise) => (
                        <tr key={exercise.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <Code className="h-8 w-8 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{exercise.title}</div>
                                <div className="text-sm text-gray-500 mt-1 max-w-md truncate">
                                  {exercise.description}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Ordre: {exercise.order_index}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                              {CodingPlatformService.getLanguageLabel(exercise.language)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-md ${getDifficultyBadgeClass(exercise.difficulty)}`}>
                              {CodingPlatformService.getDifficultyLabel(exercise.difficulty)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">{exercise.challenge_count}</span>
                              {exercise.challenge_count > 0 && (
                                <Link
                                  href={`/admin/exercises/${exercise.id}`}
                                  className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  Gérer
                                </Link>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(exercise.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link
                                href={`/coding-admin/exercises/${exercise.id}`}
                                className="text-blue-600 hover:text-blue-800"
                                title="Voir les détails"
                              >
                                <Eye className="h-5 w-5" />
                              </Link>
                              
                              <Link
                                href={`/coding-admin/exercises/${exercise.id}/edit`}
                                className="text-gray-600 hover:text-gray-800"
                                title="Modifier"
                              >
                                <Edit className="h-5 w-5" />
                              </Link>
                              
                              <button
                                onClick={() => handleDeleteExercise(exercise.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Supprimer"
                              >
                                <Trash className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && filteredExercises.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{((pagination.page - 1) * pagination.per_page) + 1}</span> à{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.per_page, pagination.total)}
                  </span>{' '}
                  sur <span className="font-medium">{pagination.total}</span> résultats
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Précédent
                  </button>
                  
                  {/* Pages numérotées */}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-md ${
                          pagination.page === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page >= pagination.pages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}