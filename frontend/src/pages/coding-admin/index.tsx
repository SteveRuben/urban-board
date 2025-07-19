// Page d'administration des exercices de coding
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Play, 
  Code, 
  Clock, 
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { codingService, type CodingExercise, type CodingStats } from '@/services/coding-service';

const CodingAdminPage = () => {
  const [exercises, setExercises] = useState<CodingExercise[]>([]);
  const [stats, setStats] = useState<CodingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [serviceStatus, setServiceStatus] = useState<'loading' | 'healthy' | 'degraded' | 'error'>('loading');

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Vérifier l'état du service
        const healthCheck = await codingService.healthCheck();
        setServiceStatus(healthCheck.status);
        
        // Charger les langages supportés
        const languagesResponse = await codingService.getSupportedLanguages();
        setSupportedLanguages(languagesResponse.languages);
        
        // Charger les exercices
        const exercisesResponse = await codingService.getExercises({
          per_page: 50
        });
        setExercises(exercisesResponse.data);
        
        // Charger les statistiques
        const statsResponse = await codingService.getCodingStats();
        setStats(statsResponse.stats);
        
      } catch (error) {
        console.error('Failed to load coding admin data:', error);
        setServiceStatus('error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrer les exercices
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !selectedDifficulty || exercise.difficulty === selectedDifficulty;
    const matchesLanguage = !selectedLanguage || exercise.supported_languages.includes(selectedLanguage);
    
    return matchesSearch && matchesDifficulty && matchesLanguage;
  });

  const handleDeleteExercise = async (exerciseId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      return;
    }

    try {
      // TODO: Implémenter la suppression
      console.log('Delete exercise:', exerciseId);
      // Recharger la liste
      const exercisesResponse = await codingService.getExercises({ per_page: 50 });
      setExercises(exercisesResponse.data);
    } catch (error) {
      console.error('Failed to delete exercise:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'bg-green-100 text-green-800';
      case 'moyen': return 'bg-yellow-100 text-yellow-800';
      case 'difficile': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Head>
        <title>Administration Coding - RecruteIA</title>
        <meta name="description" content="Gestion des exercices de programmation et tests techniques" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tests de Coding</h1>
                <p className="text-gray-600 mt-1">
                  Gérez vos exercices de programmation et évaluez les compétences techniques
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                {/* Indicateur de statut */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  serviceStatus === 'healthy' ? 'bg-green-100 text-green-800' :
                  serviceStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                  serviceStatus === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {serviceStatus === 'healthy' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Service actif
                    </>
                  ) : serviceStatus === 'degraded' ? (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Mode dégradé
                    </>
                  ) : serviceStatus === 'error' ? (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Service indisponible
                    </>
                  ) : (
                    'Chargement...'
                  )}
                </div>
                
                <Link
                  href="/coding-admin/exercises/new"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel exercice
                </Link>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Code className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Soumissions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_submissions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Taux de Réussite</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.success_rate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Exercices Actifs</p>
                    <p className="text-2xl font-bold text-gray-900">{exercises.filter(e => e.is_active).length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Langages</p>
                    <p className="text-2xl font-bold text-gray-900">{supportedLanguages.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtres et recherche */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un exercice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Filtre par difficulté */}
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Toutes les difficultés</option>
                  <option value="facile">Facile</option>
                  <option value="moyen">Moyen</option>
                  <option value="difficile">Difficile</option>
                </select>

                {/* Filtre par langage */}
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Tous les langages</option>
                  {supportedLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>

                {/* Bouton de réinitialisation */}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDifficulty('');
                    setSelectedLanguage('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Liste des exercices */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Exercices ({filteredExercises.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des exercices...</p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="p-12 text-center">
                <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun exercice trouvé</h3>
                <p className="text-gray-600 mb-6">
                  {exercises.length === 0 
                    ? "Commencez par créer votre premier exercice de programmation"
                    : "Aucun exercice ne correspond à vos critères de recherche"
                  }
                </p>
                <Link
                  href="/coding-admin/exercises/new"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un exercice
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredExercises.map((exercise) => (
                  <div key={exercise.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{exercise.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty}
                          </span>
                          {!exercise.is_active && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              Inactif
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">{exercise.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Code className="h-4 w-4 mr-1" />
                            {exercise.supported_languages.join(', ')}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {exercise.estimated_time} min
                          </div>
                          <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            {exercise.points} pts
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-6">
                        <Link
                          href={`/demo/coding-platform?exercise=${exercise.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Tester l'exercice"
                        >
                          <Play className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/coding-admin/exercises/${exercise.id}/edit`}
                          className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Modifier l'exercice"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Supprimer l'exercice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/demo/coding-platform"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Tester la plateforme</h3>
                  <p className="text-sm text-gray-600">Essayez les exercices en mode démo</p>
                </div>
              </div>
            </Link>

            <Link
              href="/coding-admin/submissions"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Voir les soumissions</h3>
                  <p className="text-sm text-gray-600">Analysez les résultats des candidats</p>
                </div>
              </div>
            </Link>

            <Link
              href="/coding-admin/settings"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Filter className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Configuration</h3>
                  <p className="text-sm text-gray-600">Paramètres de la plateforme</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

// Définir le layout pour cette page
CodingAdminPage.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default CodingAdminPage;