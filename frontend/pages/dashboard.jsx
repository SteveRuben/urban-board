// frontend/pages/dashboard.jsx (mise à jour avec style Notion)
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardOverviewCard from '../components/dashboard/DashboardOverviewCard';
import RecentInterviewsList from '../components/dashboard/RecentInterviewsList';
import CandidateScoreChart from '../components/dashboard/CandidateScoreChart';
import JobPositionPieChart from '../components/dashboard/JobPositionPieChart';
import InterviewsByStatusChart from '../components/dashboard/InterviewsByStatusChart';
import SkillsHeatmap from '../components/dashboard/SkillsHeatmap';
import axios from 'axios';
import withAuth from '../hooks/withAuth';
import { Calendar, Clock, ArrowDown, BarChart2, RefreshCw, Plus, ChevronDown } from 'lucide-react';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // En environnement de développement, utiliser des données fictives
        const response = await axios.get(`/api/dashboard?timeRange=${timeRange}`);
        setDashboardData(response.data);

        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données du tableau de bord:', err);
        setError('Impossible de charger les données du tableau de bord. Veuillez réessayer.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

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
  const handleTimeMenuClick = (e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
    setInterviewMenuOpen(false);
  };

  // Gestionnaire de clic pour le menu d'entretien
  const handleInterviewMenuClick = (e) => {
    e.stopPropagation();
    setInterviewMenuOpen(!interviewMenuOpen);
    setMenuOpen(false);
  };

  // Générer des données fictives pour le développement (fonction existante)
  const generateMockDashboardData = (range) => {
    // Code existant pour générer des données fictives
    // Laissé intact pour maintenir la fonctionnalité

    // Nombre de jours à considérer en fonction de la plage de temps
    const daysToConsider =
      range === 'week' ? 7 :
        range === 'month' ? 30 :
          range === 'quarter' ? 90 :
            365; // year

    // Générer un ensemble d'entretiens fictifs
    const now = new Date();
    const interviews = [];
    const jobPositions = [
      'Développeur Front-end',
      'Développeur Back-end',
      'DevOps Engineer',
      'Data Scientist',
      'UX Designer',
      'Product Manager',
      'Chef de projet'
    ];

    const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];

    // Générer environ 30-50 entretiens pour les données fictives
    const numInterviews = 30 + Math.floor(Math.random() * 20);

    for (let i = 0; i < numInterviews; i++) {
      // Date aléatoire dans la plage spécifiée
      const date = new Date();
      date.setDate(now.getDate() - Math.floor(Math.random() * daysToConsider));

      // Poste aléatoire
      const jobRole = jobPositions[Math.floor(Math.random() * jobPositions.length)];

      // Statut aléatoire
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      // Score aléatoire pour les entretiens terminés
      const score = status === 'completed' ? Math.round((5 + Math.random() * 5) * 10) / 10 : null;

      // Compétences avec scores aléatoires pour les entretiens terminés
      const skills = status === 'completed' ? {
        'Technique': Math.round((3 + Math.random() * 2) * 10) / 10,
        'Communication': Math.round((3 + Math.random() * 2) * 10) / 10,
        'Résolution de problèmes': Math.round((3 + Math.random() * 2) * 10) / 10,
        'Travail d\'équipe': Math.round((3 + Math.random() * 2) * 10) / 10,
        'Adaptabilité': Math.round((3 + Math.random() * 2) * 10) / 10
      } : null;

      interviews.push({
        id: `int-${i}`,
        candidate_name: `Candidat ${i + 1}`,
        job_role: jobRole,
        status: status,
        date: date.toISOString(),
        score: score,
        skills: skills
      });
    }

    // Trier par date (plus récents en premier)
    interviews.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculer les statistiques d'aperçu
    const totalInterviews = interviews.length;
    const completedInterviews = interviews.filter(i => i.status === 'completed').length;
    const scheduledInterviews = interviews.filter(i => i.status === 'scheduled').length;
    const inProgressInterviews = interviews.filter(i => i.status === 'in_progress').length;

    // Calculer le score moyen
    const completedWithScores = interviews.filter(i => i.status === 'completed' && i.score !== null);
    const averageScore = completedWithScores.length > 0
      ? completedWithScores.reduce((sum, i) => sum + i.score, 0) / completedWithScores.length
      : 0;

    // Données pour le graphique camembert des postes
    const jobPositionCounts = {};
    interviews.forEach(interview => {
      if (!jobPositionCounts[interview.job_role]) {
        jobPositionCounts[interview.job_role] = 0;
      }
      jobPositionCounts[interview.job_role]++;
    });

    const jobPositionData = Object.keys(jobPositionCounts).map(job => ({
      name: job,
      value: jobPositionCounts[job]
    }));

    // Données pour le graphique des scores des candidats
    const candidateScoreData = completedWithScores
      .slice(0, 10) // Top 10 derniers entretiens avec scores
      .map(interview => ({
        name: interview.candidate_name,
        score: interview.score,
        position: interview.job_role
      }))
      .reverse(); // Pour avoir l'ordre chronologique

    // Données pour la heatmap des compétences
    // Collecter toutes les compétences et calculer les scores moyens par poste
    const skillsByPosition = {};

    completedWithScores.forEach(interview => {
      if (interview.skills) {
        const position = interview.job_role;

        if (!skillsByPosition[position]) {
          skillsByPosition[position] = {
            count: 0,
            skills: {}
          };
        }

        skillsByPosition[position].count++;

        Object.entries(interview.skills).forEach(([skill, score]) => {
          if (!skillsByPosition[position].skills[skill]) {
            skillsByPosition[position].skills[skill] = 0;
          }
          skillsByPosition[position].skills[skill] += score;
        });
      }
    });

    // Calculer les moyennes
    Object.keys(skillsByPosition).forEach(position => {
      const positionData = skillsByPosition[position];
      Object.keys(positionData.skills).forEach(skill => {
        positionData.skills[skill] = Math.round((positionData.skills[skill] / positionData.count) * 10) / 10;
      });
    });

    // Transformer en format utilisable pour la heatmap
    const skillsHeatmapData = [];

    Object.entries(skillsByPosition).forEach(([position, data]) => {
      Object.entries(data.skills).forEach(([skill, score]) => {
        skillsHeatmapData.push({
          position,
          skill,
          score
        });
      });
    });

    return {
      overview: {
        totalInterviews,
        completedInterviews,
        scheduledInterviews,
        inProgressInterviews,
        averageScore: Math.round(averageScore * 10) / 10
      },
      recentInterviews: interviews.slice(0, 5), // 5 derniers entretiens
      interviewsByStatus: [
        { name: 'Planifiés', value: scheduledInterviews },
        { name: 'En cours', value: inProgressInterviews },
        { name: 'Terminés', value: completedInterviews },
        { name: 'Annulés', value: interviews.filter(i => i.status === 'cancelled').length }
      ],
      jobPositionData,
      candidateScoreData,
      skillsHeatmapData
    };
  };

  // Formater le texte de plage de temps pour l'affichage
  const getTimeRangeText = () => {
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
                  onClick={() => {
                    setLoading(true);
                    const mockData = generateMockDashboardData(timeRange);
                    setDashboardData(mockData);
                    setLoading(false);
                  }}
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

                {/* Section 4: Analyse CV (Nouveau) */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Analyse de CV</h2>
                  </div>
                  <div className="p-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 mb-4">
                        <BarChart2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Analyse automatique de CV</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Chargez un CV pour analyser automatiquement les compétences, l'expérience et obtenir des questions d'entretien personnalisées.
                      </p>
                      <Link
                        href="/interviews/new"
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Démarrer une analyse
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

DashboardPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default withAuth(DashboardPage);