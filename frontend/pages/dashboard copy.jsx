// frontend/pages/dashboard.jsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardOverviewCard from '../components/dashboard/DashboardOverviewCard';
import RecentInterviewsList from '../components/dashboard/RecentInterviewsList';
import CandidateScoreChart from '../components/dashboard/CandidateScoreChart';
import JobPositionPieChart from '../components/dashboard/JobPositionPieChart';
import InterviewsByStatusChart from '../components/dashboard/InterviewsByStatusChart';
import SkillsHeatmap from '../components/dashboard/SkillsHeatmap';
import axios from 'axios';
import withAuth from '../hooks/withAuth';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'quarter', 'year'

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // En environnement de développement, utiliser des données fictives
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler un délai réseau
          
          const mockData = generateMockDashboardData(timeRange);
          setDashboardData(mockData);
        } else {
          // En production, appeler l'API
          const response = await axios.get(`/api/dashboard?timeRange=${timeRange}`);
          setDashboardData(response.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données du tableau de bord:', err);
        setError('Impossible de charger les données du tableau de bord. Veuillez réessayer.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [timeRange]);

  // Générer des données fictives pour le développement
  const generateMockDashboardData = (range) => {
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
        candidate_name: `Candidat ${i+1}`,
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

  return (
    <>
      <Head>
        <title>Tableau de bord - RecruteIA</title>
        <meta name="description" content="Tableau de bord analytique des entretiens et candidats" />
      </Head>

      <div className="bg-gray-50 py-6 min-h-screen">
        <div className="container mx-auto px-4">
          {/* En-tête et filtres */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Tableau de bord</h1>
              <p className="text-gray-600">Analyse et suivi de vos entretiens</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="quarter">90 derniers jours</option>
                <option value="year">12 derniers mois</option>
              </select>
            </div>
          </div>

          {/* Contenu du tableau de bord */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-600 text-black rounded-md hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <>
              {/* Cartes d'aperçu */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <DashboardOverviewCard 
                  title="Total des entretiens"
                  value={dashboardData.overview.totalInterviews}
                  icon="total"
                  color="blue"
                />
                <DashboardOverviewCard 
                  title="Entretiens terminés"
                  value={dashboardData.overview.completedInterviews}
                  icon="completed"
                  color="green"
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
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Graphique des scores des candidats récents */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-2">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800">Scores des candidats récents</h2>
                  </div>
                  <div className="p-4 h-80">
                    <CandidateScoreChart data={dashboardData.candidateScoreData} />
                  </div>
                </div>
                
                {/* Graphique de répartition par statut */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800">Entretiens par statut</h2>
                  </div>
                  <div className="p-4 h-80">
                    <InterviewsByStatusChart data={dashboardData.interviewsByStatus} />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Entretiens récents */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-2">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800">Entretiens récents</h2>
                  </div>
                  <div className="p-4">
                    <RecentInterviewsList interviews={dashboardData.recentInterviews} />
                  </div>
                </div>
                
                {/* Graphique de répartition par poste */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800">Entretiens par poste</h2>
                  </div>
                  <div className="p-4 h-80">
                    <JobPositionPieChart data={dashboardData.jobPositionData} />
                  </div>
                </div>
              </div>
              
              {/* Heatmap des compétences par poste */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-800">Performance moyenne par compétence et poste</h2>
                </div>
                <div className="p-4">
                  <SkillsHeatmap data={dashboardData.skillsHeatmapData} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

DashboardPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default withAuth(DashboardPage);