// tsx/src/components/dashboard/ModernDashboard.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  ChartBarIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  SparklesIcon,
  BoltIcon,
  EyeIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CpuChipIcon,
  RobotIcon
} from '@heroicons/react/24/outline'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

interface DashboardData {
  overview: {
    total_interviews: number
    recent_interviews: number
    completion_rate: number
    growth_rate: number
    status_distribution: Record<string, number>
    active_interviews: number
    scheduled_interviews: number
  }
  interviews: {
    type_distribution: Record<string, number>
    experience_distribution: Record<string, number>
    top_positions: Array<{position: string, count: number}>
    average_duration_minutes: number
    total_hours_conducted: number
  }
  personality_ai: {
    personality_interviews: number
    personality_profiles: number
    communication_style_distribution: Record<string, number>
    trait_averages: Record<string, number>
    average_confidence: number
    adaptations_count: number
    adoption_rate: number
  }
  ai_assistants: {
    total_assistants: number
    recent_assistants: number
    type_distribution: Record<string, number>
    total_usage: number
    top_assistants: Array<{name: string, usage_count: number, type: string}>
  }
  trends: {
    timeline_data: Array<{
      date: string
      interviews: number
      personality_profiles: number
      period_label: string
    }>
    trend_direction: 'up' | 'down' | 'stable'
  }
  recommendations: Array<{
    id: string
    title: string
    description: string
    action: string
    priority: 'high' | 'medium' | 'low'
    category: string
    icon: string
    badge?: string
  }>
  quick_actions: Array<{
    id: string
    title: string
    description: string
    action: string
    icon: string
    color: string
    category: string
    badge?: string
  }>
  recent_activity: Array<{
    id: string
    type: string
    title: string
    description: string
    timestamp: string
    link: string
    metadata: Record<string, any>
  }>
  performance_insights: {
    productivity: {
      interviews_per_day: number
      productivity_score: number
    }
    quality: {
      personality_analysis_rate: number
      quality_score: number
    }
    efficiency: {
      completion_rate: number
      efficiency_score: number
    }
    suggestions: Array<{
      type: string
      title: string
      description: string
      action: string
    }>
  }
}

interface ModernDashboardProps {
  className?: string
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

const timeRangeOptions = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '1y', label: '1 an' }
]

export default function ModernDashboard({ className = '' }: ModernDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/dashboard/comprehensive?time_range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardData(data.dashboard)
      } else {
        setError('Erreur lors du chargement des données')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const refreshDashboard = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  // Métriques calculées
  const computedMetrics = useMemo(() => {
    if (!dashboardData) return null

    return {
      totalActivity: dashboardData.overview.recent_interviews + dashboardData.personality_ai.personality_profiles,
      aiAdoptionRate: dashboardData.personality_ai.adoption_rate,
      overallScore: Math.round(
        (dashboardData.performance_insights.productivity?.productivity_score || 0 +
         dashboardData.performance_insights.quality?.quality_score || 0 +
         dashboardData.performance_insights.efficiency?.efficiency_score || 0) / 3
      )
    }
  }, [dashboardData])

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="space-y-6 p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className={`${className} p-6`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <div className="text-red-700">{error}</div>
          <button 
            onClick={loadDashboardData}
            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className={`${className} p-6`}>
        <div className="text-center text-gray-500">
          Aucune donnée disponible
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* En-tête avec contrôles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="w-8 h-8 text-blue-500 mr-3" />
            Dashboard Intelligent
          </h1>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble de votre activité RecruteIA
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Sélecteur de période */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Bouton de rafraîchissement */}
          <button
            onClick={refreshDashboard}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Entretiens totaux */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entretiens</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.overview.recent_interviews}
              </p>
              <div className="flex items-center mt-1">
                {dashboardData.overview.growth_rate >= 0 ? (
                  <TrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${
                  dashboardData.overview.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(dashboardData.overview.growth_rate)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* IA Spécialisée */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CpuChipIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">IA Spécialisée</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.personality_ai.personality_interviews}
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData.personality_ai.adoption_rate}% adoption
              </p>
            </div>
          </div>
        </div>

        {/* Taux de complétion */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <BoltIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taux de Réussite</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.overview.completion_rate}%
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dashboardData.overview.completion_rate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Score global */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Score Global</p>
              <p className="text-2xl font-bold text-gray-900">
                {computedMetrics?.overallScore || 0}/100
              </p>
              <p className="text-sm text-gray-500">Performance générale</p>
            </div>
          </div>
        </div>
      </div>      {
/* Actions rapides */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardData.quick_actions.slice(0, 4).map((action) => (
            <button
              key={action.id}
              onClick={() => window.location.href = action.action}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex items-center mb-3">
                <div className={`p-2 ${
                  action.color === 'blue' ? 'bg-blue-500' :
                  action.color === 'purple' ? 'bg-purple-500' :
                  action.color === 'green' ? 'bg-green-500' :
                  action.color === 'teal' ? 'bg-teal-500' :
                  action.color === 'indigo' ? 'bg-indigo-500' :
                  'bg-gray-500'
                } rounded-lg`}>
                  <div className="w-5 h-5 text-white">
                    {/* Icône dynamique basée sur action.icon */}
                    {action.icon === 'plus-circle' && <span>+</span>}
                    {action.icon === 'cpu-chip' && <CpuChipIcon className="w-5 h-5" />}
                    {action.icon === 'chart-bar' && <ChartBarIcon className="w-5 h-5" />}
                    {action.icon === 'users' && <UserGroupIcon className="w-5 h-5" />}
                    {action.icon === 'robot' && <RobotIcon className="w-5 h-5" />}
                  </div>
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

      {/* Graphiques et analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendances temporelles */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tendances</h3>
            <div className="flex items-center">
              {dashboardData.trends.trend_direction === 'up' && (
                <TrendingUpIcon className="w-5 h-5 text-green-500 mr-2" />
              )}
              {dashboardData.trends.trend_direction === 'down' && (
                <TrendingDownIcon className="w-5 h-5 text-red-500 mr-2" />
              )}
              <span className="text-sm text-gray-600 capitalize">
                {dashboardData.trends.trend_direction === 'up' ? 'En hausse' :
                 dashboardData.trends.trend_direction === 'down' ? 'En baisse' : 'Stable'}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dashboardData.trends.timeline_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period_label" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="interviews" 
                stackId="1"
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
                name="Entretiens"
              />
              <Area 
                type="monotone" 
                dataKey="personality_profiles" 
                stackId="1"
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.3}
                name="Profils IA"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution des styles de communication */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Styles de Communication
          </h3>
          {Object.keys(dashboardData.personality_ai.communication_style_distribution).length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(dashboardData.personality_ai.communication_style_distribution).map(([style, count]) => ({
                    name: style.charAt(0).toUpperCase() + style.slice(1),
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(dashboardData.personality_ai.communication_style_distribution).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <CpuChipIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune donnée de personnalité disponible</p>
                <button 
                  onClick={() => window.location.href = '/interviews/create?type=personality'}
                  className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Créer un entretien IA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommandations et activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommandations intelligentes */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SparklesIcon className="w-5 h-5 text-yellow-500 mr-2" />
            Recommandations
          </h3>
          {dashboardData.recommendations.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recommendations.slice(0, 4).map((rec) => (
                <div key={rec.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg mr-3 ${
                    rec.priority === 'high' ? 'bg-red-100' :
                    rec.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <div className={`w-4 h-4 ${
                      rec.priority === 'high' ? 'text-red-600' :
                      rec.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {rec.icon === 'rocket-launch' && <span>🚀</span>}
                      {rec.icon === 'cpu-chip' && <CpuChipIcon className="w-4 h-4" />}
                      {rec.icon === 'robot' && <RobotIcon className="w-4 h-4" />}
                      {rec.icon === 'users' && <UserGroupIcon className="w-4 h-4" />}
                      {rec.icon === 'chart-bar' && <ChartBarIcon className="w-4 h-4" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      {rec.badge && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {rec.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    <button 
                      onClick={() => window.location.href = rec.action}
                      className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
                    >
                      Voir →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune recommandation pour le moment</p>
            </div>
          )}
        </div>

        {/* Activité récente */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 text-gray-500 mr-2" />
            Activité Récente
          </h3>
          {dashboardData.recent_activity.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {dashboardData.recent_activity.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <div className="w-4 h-4 text-gray-600">
                      {activity.type.includes('interview') && <span>🎤</span>}
                      {activity.type.includes('personality') && <span>🧠</span>}
                      {activity.type.includes('assistant') && <span>🤖</span>}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{activity.title}</h4>
                    <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button 
                    onClick={() => window.location.href = activity.link}
                    className="text-blue-600 hover:text-blue-800 ml-2"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune activité récente</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights de performance */}
      {dashboardData.performance_insights && Object.keys(dashboardData.performance_insights).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights de Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Productivité */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {dashboardData.performance_insights.productivity?.productivity_score || 0}
              </div>
              <div className="text-sm text-gray-600 mb-2">Score Productivité</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dashboardData.performance_insights.productivity?.productivity_score || 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {dashboardData.performance_insights.productivity?.interviews_per_day || 0} entretiens/jour
              </div>
            </div>

            {/* Qualité */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {dashboardData.performance_insights.quality?.quality_score || 0}
              </div>
              <div className="text-sm text-gray-600 mb-2">Score Qualité</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dashboardData.performance_insights.quality?.quality_score || 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {dashboardData.performance_insights.quality?.personality_analysis_rate || 0}% avec IA
              </div>
            </div>

            {/* Efficacité */}
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {dashboardData.performance_insights.efficiency?.efficiency_score || 0}
              </div>
              <div className="text-sm text-gray-600 mb-2">Score Efficacité</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dashboardData.performance_insights.efficiency?.efficiency_score || 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {dashboardData.performance_insights.efficiency?.completion_rate || 0}% complétés
              </div>
            </div>
          </div>

          {/* Suggestions d'amélioration */}
          {dashboardData.performance_insights.suggestions && dashboardData.performance_insights.suggestions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Suggestions d'Amélioration</h4>
              <div className="space-y-2">
                {dashboardData.performance_insights.suggestions.slice(0, 3).map((suggestion, index) => (
                  <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <div className="p-1 bg-blue-100 rounded mr-3">
                      <BoltIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
                      <p className="text-sm text-gray-600">{suggestion.description}</p>
                    </div>
                    <button 
                      onClick={() => window.location.href = suggestion.action}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Agir →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}