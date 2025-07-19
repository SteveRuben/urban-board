// Page de démonstration publique du dashboard
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Play, Lock, Star, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

// Composant de démonstration du dashboard avec données simulées
const DashboardDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Données de démonstration
  const demoStats = {
    total_interviews: 127,
    pending_reviews: 8,
    completed_today: 5,
    success_rate: 84.2,
    total_candidates: 342,
    active_positions: 12
  };

  const demoInterviews = [
    {
      id: 1,
      candidate_name: 'Marie Dubois',
      position: 'Développeur Frontend',
      date: '2025-01-19T14:30:00Z',
      status: 'completed',
      score: 87
    },
    {
      id: 2,
      candidate_name: 'Pierre Martin',
      position: 'Développeur Backend',
      date: '2025-01-19T10:00:00Z',
      status: 'in_progress',
      score: null
    },
    {
      id: 3,
      candidate_name: 'Sophie Laurent',
      position: 'DevOps Engineer',
      date: '2025-01-18T16:00:00Z',
      status: 'completed',
      score: 92
    }
  ];

  const demoAlerts = [
    {
      id: 1,
      type: 'warning',
      message: '3 entretiens en attente de review depuis plus de 24h',
      created_at: '2025-01-19T08:00:00Z'
    },
    {
      id: 2,
      type: 'success',
      message: 'Objectif mensuel d\'entretiens atteint (127/120)',
      created_at: '2025-01-19T16:00:00Z'
    }
  ];

  return (
    <>
      <Head>
        <title>Démonstration Dashboard - RecruteIA</title>
        <meta name="description" content="Découvrez le tableau de bord RecruteIA avec des données réelles. Essayez gratuitement notre plateforme d'entretiens IA." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Banner de démonstration */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Play className="h-5 w-5" />
                <span className="font-medium">Mode Démonstration</span>
                <span className="text-indigo-200">•</span>
                <span className="text-sm">Explorez toutes les fonctionnalités gratuitement</span>
              </div>
              <Link href="/auth/register" className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header de la démo */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tableau de bord RecruteIA
            </h1>
            <p className="text-gray-600 mb-6">
              Découvrez comment RecruteIA transforme vos processus de recrutement avec l'intelligence artificielle
            </p>
            
            {/* Onglets de démonstration */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: 'Vue d\'ensemble', icon: TrendingUp },
                  { id: 'interviews', name: 'Entretiens', icon: Users },
                  { id: 'analytics', name: 'Analytiques', icon: Star }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenu de la démonstration */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Alertes */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Alertes intelligentes</h2>
                <div className="space-y-3">
                  {demoAlerts.map(alert => (
                    <div 
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                        'bg-green-50 border-green-400'
                      }`}
                    >
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistiques principales */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Métriques clés</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Entretiens</p>
                        <p className="text-2xl font-bold text-gray-900">{demoStats.total_interviews}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">En Attente</p>
                        <p className="text-2xl font-bold text-gray-900">{demoStats.pending_reviews}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Terminés Aujourd'hui</p>
                        <p className="text-2xl font-bold text-gray-900">{demoStats.completed_today}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Taux de Réussite</p>
                        <p className="text-2xl font-bold text-gray-900">{demoStats.success_rate}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interviews' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Entretiens récents</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium">Derniers entretiens</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {demoInterviews.map(interview => (
                    <div key={interview.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{interview.candidate_name}</p>
                        <p className="text-sm text-gray-600">{interview.position}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(interview.date).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                          interview.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {interview.status === 'completed' ? 'Terminé' :
                           interview.status === 'in_progress' ? 'En cours' :
                           'Planifié'}
                        </span>
                        {interview.score && (
                          <p className="text-sm font-bold text-gray-900 mt-1">
                            Score: {interview.score}/100
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Analytiques avancées
              </h3>
              <p className="text-gray-600 mb-6">
                Accédez à des analyses détaillées, des rapports personnalisés et des insights IA
              </p>
              <Link 
                href="/auth/register"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
              >
                Débloquer les analytiques
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">
              Prêt à révolutionner vos entretiens ?
            </h2>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Rejoignez plus de 1000+ entreprises qui utilisent RecruteIA pour optimiser leurs processus de recrutement avec l'intelligence artificielle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register"
                className="inline-flex items-center px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link 
                href="/contact"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-colors"
              >
                Demander une démo
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default DashboardDemo;