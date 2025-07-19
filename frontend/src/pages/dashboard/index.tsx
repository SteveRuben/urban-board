// frontend/pages/dashboard.tsx (mise à jour avec service backend)
import { useState, useEffect, MouseEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Calendar, Clock, ArrowDown, BarChart2, RefreshCw, Plus, ChevronDown, AlertCircle, BotIcon, UserPlus } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import dashboardService from '@/services/dashboard-service';

// Import des composants dashboard existants
import CandidateScoreChart from '@/components/dashboard/candidate-score-chart';
import DashboardOverviewCard from '@/components/dashboard/dashboard-overview-card';
import InterviewsByStatusChart from '@/components/dashboard/interviews-by-status-chart';
import JobPositionPieChart from '@/components/dashboard/job-position-pie-chart';
import RecentInterviewsList from '@/components/dashboard/recent-interviews-list';
import SkillsHeatmap from '@/components/dashboard/skills-heatmap';

// Types pour compatibilité avec les composants existants
type TimeRangeType = 'week' | 'month' | 'quarter' | 'year';

interface DashboardData {
  overview: {
    totalInterviews: number;
    completedInterviews: number;
    scheduledInterviews: number;
    inProgressInterviews: number;
    averageScore: number;
  };
  recentInterviews: any[];
  interviewsByStatus: Array<{ name: string; value: number }>;
  jobPositionData: Array<{ name: string; value: number }>;
  candidateScoreData: any[];
  skillsHeatmapData: any[];
}

const DashboardPage = () => {
  // Utiliser notre hook dashboard
  const { dashboardData: backendData, loading: backendLoading, error: backendError, refetch } = useDashboard();

  // États locaux pour compatibilité avec l'interface existante
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('month');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [interviewMenuOpen, setInterviewMenuOpen] = useState<boolean>(false);

  // Convertir les données backend vers le format attendu par les composants existants
  useEffect(() => {
    if (backendData) {
      const convertedData: DashboardData = {
        overview: {
          totalInterviews: backendData.stats.total_interviews,
          completedInterviews: backendData.stats.total_interviews - backendData.stats.pending_reviews,
          scheduledInterviews: backendData.stats.scheduled_this_week,
          inProgressInterviews: backendData.stats.pending_reviews,
          averageScore: backendData.stats.success_rate / 10 // Convertir pourcentage en note sur 10
        },
        recentInterviews: backendData.recent_interviews.map(interview => ({
          id: interview.id,
          candidate_name: interview.candidate_name,
          job_role: interview.position,
          status: interview.status,
          date: interview.date,
          score: interview.score,
          skills: null // Les compétences détaillées ne sont pas dans notre format backend
        })),
        interviewsByStatus: [
          { name: 'Planifiés', value: backendData.stats.scheduled_this_week },
          { name: 'En cours', value: backendData.stats.pending_reviews },
          { name: 'Terminés', value: backendData.stats.total_interviews - backendData.stats.pending_reviews },
          { name: 'Annulés', value: 0 }
        ],
        jobPositionData: [
          { name: 'Développeur Frontend', value: 12 },
          { name: 'Développeur Backend', value: 8 },
          { name: 'DevOps Engineer', value: 6 },
          { name: 'Data Scientist', value: 4 },
          { name: 'UX Designer', value: 3 }
        ],
        candidateScoreData: backendData.recent_interviews
          .filter(interview => interview.score)
          .slice(0, 10)
          .map(interview => ({
            name: interview.candidate_name,
            score: interview.score,
            position: interview.position
          })),
        skillsHeatmapData: [] // Données de heatmap simplifiées pour l'instant
      };

      setDashboardData(convertedData);
    }

    setLoading(backendLoading);
    setError(backendError);
  }, [backendData, backendLoading, backendError]);

  // Fonction pour fermer les menus ouverts en cas de clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpen(false);
      setInterviewMenuOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Gestionnaire de clic pour le menu de plage temporelle
  const handleTimeMenuClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
    setInterviewMenuOpen(false);
  };

  // Gestionnaire de clic pour le menu d'entretien
  const handleInterviewMenuClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setInterviewMenuOpen(!interviewMenuOpen);
    setMenuOpen(false);
  };

  // Gestionnaire pour le bouton de rafraîchissement
  const handleRefresh = () => {
    refetch(); // Utiliser la fonction refetch du hook
  };

  // Formater le texte de plage de temps pour l'affichage
  const getTimeRangeText = (): string => {
    switch (timeRange) {
      case 'week': return '7 derniers jours';
      case 'month': return '30 derniers jours';
      case 'quarter': return '90 derniers jours';
      case 'year': return '12 derniers mois';
      default: return '30 derniers jours';
    }
  };

  return (
    <>
      <Head>
        <title>Tableau de bord - RecruteIA</title>
        <meta name="description" content="Tableau de bord analytique des entretiens et candidats" />
      </Head>
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête du dashboard style Notion */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>

              {/* Menu d'action */}
              <div className="flex mt-4 md:mt-0 space-x-2">
                {/* Filtre de plage de temps */}
                <div className="relative">
                  <button
                    className="flex items-center px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={handleTimeMenuClick}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{getTimeRangeText()}</span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </button>

                  {menuOpen && (
                    <div className="absolute z-10 right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${timeRange === 'week' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => {
                          setTimeRange('week');
                          setMenuOpen(false);
                        }}
                      >
                        7 derniers jours
                      </button>
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${timeRange === 'month' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => {
                          setTimeRange('month');
                          setMenuOpen(false);
                        }}
                      >
                        30 derniers jours
                      </button>
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${timeRange === 'quarter' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => {
                          setTimeRange('quarter');
                          setMenuOpen(false);
                        }}
                      >
                        90 derniers jours
                      </button>
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${timeRange === 'year' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => {
                          setTimeRange('year');
                          setMenuOpen(false);
                        }}
                      >
                        12 derniers mois
                      </button>
                    </div>
                  )}
                </div>

                {/* Bouton de rafraîchissement */}
                <button
                  className="p-2 text-gray-700 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-5 w-5" />
                </button>

                {/* Nouveau menu d'entretien avec options */}
                <div className="relative">
                  <button
                    className="flex items-center px-3 py-2 text-sm bg-primary-600 text-black rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={handleInterviewMenuClick}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nouvel entretien
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>

                  {interviewMenuOpen && (
                    <div className="absolute z-10 right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                      <Link
                        href="/interviews/new?mode=ai_solo"
                        className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                      >
                        <div className="p-1 bg-blue-100 rounded-full mr-3">
                          <BotIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Entretien IA autonome</div>
                          <div className="text-xs text-gray-500">L'IA mène l'entretien seule avec le candidat</div>
                        </div>
                      </Link>
                      <Link
                        href="/interviews/new?mode=ai_assisted"
                        className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <div className="p-1 bg-green-100 rounded-full mr-3">
                          <UserPlus className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Entretien assisté par IA</div>
                          <div className="text-xs text-gray-500">Vous menez l'entretien avec l'assistance de l'IA</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>


            <p className="text-gray-500">
              Visualisation et analyse des entretiens, scores et données des candidats
            </p>
          </div>

          {/* Indicateur de chargement */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Chargement des données...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full text-red-600 mb-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-black rounded-md hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </button>
            </div>
          ) : (
            dashboardData && (
              <>
                {/* Cartes d'aperçu style Notion */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <DashboardOverviewCard
                    title="Total des entretiens"
                    value={dashboardData.overview.totalInterviews}
                    icon="total"
                    color="blue"
                    showChange={true}
                    previousValue={dashboardData.overview.totalInterviews * 0.9} // Simulation pour démo
                    increaseIsGood={true}
                  />
                  <DashboardOverviewCard
                    title="Entretiens terminés"
                    value={dashboardData.overview.completedInterviews}
                    icon="completed"
                    color="green"
                    showChange={true}
                    previousValue={dashboardData.overview.completedInterviews * 0.85} // Simulation pour démo
                    increaseIsGood={true}
                  />
                  <DashboardOverviewCard
                    title="Entretiens planifiés"
                    value={dashboardData.overview.scheduledInterviews}
                    icon="scheduled"
                    color="yellow"
                  />
                  <DashboardOverviewCard
                    title="Score moyen"
                    value={`${dashboardData.overview.averageScore}/10`}
                    icon="score"
                    color="purple"
                    showChange={true}
                    previousValue={dashboardData.overview.averageScore * 0.98} // Simulation pour démo
                    increaseIsGood={true}
                  />
                </div>

                {/* Sections de graphiques avec style Notion */}
                <div className="space-y-8">
                  {/* Section 1: Graphiques principaux */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Graphique des scores des candidats récents */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden lg:col-span-2 hover:shadow-sm transition-shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Scores des candidats récents</h2>
                      </div>
                      <div className="p-6 h-80">
                        <CandidateScoreChart data={dashboardData.candidateScoreData} />
                      </div>
                    </div>

                    {/* Graphique de répartition par statut */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Entretiens par statut</h2>
                      </div>
                      <div className="p-6 h-80">
                        <InterviewsByStatusChart data={dashboardData.interviewsByStatus} />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Entretiens récents et répartition par poste */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Entretiens récents */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden lg:col-span-2 hover:shadow-sm transition-shadow">
                      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">Entretiens récents</h2>
                        <Link href="/interviews" className="text-sm text-primary-600 hover:text-primary-700">
                          Voir tous →
                        </Link>
                      </div>
                      <div className="p-6">
                        <RecentInterviewsList interviews={dashboardData.recentInterviews} />
                      </div>
                    </div>

                    {/* Graphique de répartition par poste */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Entretiens par poste</h2>
                      </div>
                      <div className="p-6 h-80">
                        <JobPositionPieChart data={dashboardData.jobPositionData} />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Heatmap des compétences par poste */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Performance moyenne par compétence et poste</h2>
                    </div>
                    <div className="p-6">
                      <SkillsHeatmap data={dashboardData.skillsHeatmapData} />
                    </div>
                  </div>

                  {/* Section 4: Actions rapides */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Analyse CV */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Analyse de CV</h2>
                      </div>
                      <div className="p-6">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 mb-4">
                            <BarChart2 className="h-6 w-6" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Analyse IA</h3>
                          <p className="text-gray-600 mb-4 text-sm">
                            Analysez automatiquement les CV avec scoring intelligent
                          </p>
                          <Link
                            href="/cv-analysis"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            Analyser un CV
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Tests de Coding */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Tests de Coding</h2>
                      </div>
                      <div className="p-6">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full text-purple-600 mb-4">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Évaluation technique</h3>
                          <p className="text-gray-600 mb-4 text-sm">
                            Créez et gérez des tests de programmation
                          </p>
                          <Link
                            href="/coding-admin"
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                          >
                            Gérer les tests
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Rapports */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Rapports</h2>
                      </div>
                      <div className="p-6">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full text-green-600 mb-4">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
                          <p className="text-gray-600 mb-4 text-sm">
                            Consultez les rapports détaillés et métriques
                          </p>
                          <Link
                            href="/reports"
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            Voir rapports
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Activité récente */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Activité récente</h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Entretien terminé avec Marie Dubois - Score: 87/100</span>
                          <span className="text-xs text-gray-400">Il y a 2h</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Nouveau CV analysé - Développeur Frontend</span>
                          <span className="text-xs text-gray-400">Il y a 4h</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Test de coding créé - Algorithmes avancés</span>
                          <span className="text-xs text-gray-400">Il y a 1j</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Entretien planifié avec Pierre Martin</span>
                          <span className="text-xs text-gray-400">Il y a 2j</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </>
  );
};

// Définir le layout pour cette page
DashboardPage.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default DashboardPage;