// tsx/src/components/personality-ai/PersonalityAIDashboard.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CpuChipIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  PuzzlePieceIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

interface PersonalityStats {
  total_interviews_with_personality: number
  completed_interviews: number
  completion_rate: number
  personality_insights: {
    total_profiles: number
    trait_averages: {
      openness: number
      conscientiousness: number
      extraversion: number
      agreeableness: number
      neuroticism: number
    }
    communication_style_distribution: Record<string, number>
    gender_distribution: Record<string, number>
    top_motivation_factors: [string, number][]
  }
  adaptation_effectiveness: {
    total_adaptations: number
    average_effectiveness: number
  }
  recent_interviews: Array<{
    id: string
    job_title: string
    candidate_name: string
    status: string
    personality_summary: string
    created_at: string
  }>
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  path: string
  color: string
  badge?: string
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export default function PersonalityAIDashboard() {
  const [stats, setStats] = useState<PersonalityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/interviews/personality-dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.dashboard)
      } else {
        setError('Erreur lors du chargement des données')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'create-personality-interview',
      title: 'Nouvel Entretien IA',
      description: 'Créer un entretien avec analyse de personnalité',
      icon: CpuChipIcon,
      path: '/interviews/create?type=personality',
      color: 'bg-purple-500',
      badge: 'Recommandé'
    },
    {
      id: 'analyze-personality',
      title: 'Analyser Personnalité',
      description: 'Analyser un profil existant',
      icon: ChartBarIcon,
      path: '/personality-ai/analyze',
      color: 'bg-blue-500'
    },
    {
      id: 'team-recommendations',
      title: 'Recommandations Équipe',
      description: 'Suggestions de complémentarité',
      icon: PuzzlePieceIcon,
      path: '/personality-ai/team-recommendations',
      color: 'bg-green-500'
    },
    {
      id: 'bias-detection',
      title: 'Vérifier les Biais',
      description: 'Analyser l\'équité des évaluations',
      icon: ShieldCheckIcon,
      path: '/personality-ai/bias-detection',
      color: 'bg-orange-500'
    }
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Aucune donnée disponible
        </div>
      </div>
    )
  }

  // Préparer les données pour les graphiques
  const traitData = Object.entries(stats.personality_insights.trait_averages).map(([trait, value]) => ({
    trait: trait.charAt(0).toUpperCase() + trait.slice(1),
    value: Math.round(value * 100)
  }))

  const communicationData = Object.entries(stats.personality_insights.communication_style_distribution).map(([style, count]) => ({
    name: style.charAt(0).toUpperCase() + style.slice(1),
    value: count
  }))

  const genderData = Object.entries(stats.personality_insights.gender_distribution).map(([gender, count]) => ({
    name: gender === 'non-spécifié' ? 'Non spécifié' : gender.charAt(0).toUpperCase() + gender.slice(1),
    value: count
  }))

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="w-8 h-8 text-purple-500 mr-3" />
            Dashboard IA Spécialisée
          </h1>
          <p className="text-gray-600 mt-1">
            Analyse de personnalité et entretiens adaptatifs
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CpuChipIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entretiens IA</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_interviews_with_personality}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Profils Analysés</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.personality_insights.total_profiles}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUpIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taux de Réussite</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(stats.completion_rate)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Efficacité IA</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(stats.adaptation_effectiveness.average_effectiveness * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => window.location.href = action.path}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex items-center mb-3">
                <div className={`p-2 ${action.color} rounded-lg`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                {action.badge && (
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    {action.badge}
                  </span>
                )}
              </div>
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traits de personnalité moyens */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Traits de Personnalité Moyens (Big Five)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={traitData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trait" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
              <Bar dataKey="value" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution des styles de communication */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Styles de Communication
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={communicationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {communicationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Entretiens récents */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Entretiens Récents avec IA Spécialisée
        </h3>
        {stats.recent_interviews.length > 0 ? (
          <div className="space-y-4">
            {stats.recent_interviews.map((interview) => (
              <div key={interview.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-900">{interview.job_title}</h4>
                    <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                      interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                      interview.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {interview.status === 'completed' ? 'Terminé' :
                       interview.status === 'in_progress' ? 'En cours' : 'Planifié'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Candidat: {interview.candidate_name}
                  </p>
                  {interview.personality_summary && (
                    <p className="text-sm text-gray-500 mt-1">
                      {interview.personality_summary}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(interview.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Voir détails →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CpuChipIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun entretien avec IA spécialisée pour le moment</p>
            <button 
              onClick={() => window.location.href = '/interviews/create?type=personality'}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Créer votre premier entretien IA
            </button>
          </div>
        )}
      </div>

      {/* Facteurs de motivation populaires */}
      {stats.personality_insights.top_motivation_factors.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Facteurs de Motivation les Plus Courants
          </h3>
          <div className="space-y-3">
            {stats.personality_insights.top_motivation_factors.map(([factor, count], index) => (
              <div key={factor} className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{factor}</span>
                    <span className="text-sm text-gray-500">{count} candidats</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(count / Math.max(...stats.personality_insights.top_motivation_factors.map(([, c]) => c))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}