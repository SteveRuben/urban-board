"use client"

import { useState, useEffect, type ReactElement } from "react"
import Head from "next/head"
import Link from "next/link"
import { 
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Star,
  Play,
  CheckCircle,
  Code,
  Zap,
  BookOpen,
  Award,
  Calendar,
  Users,
  ArrowRight,
  ChevronRight,
  BarChart3,
  Activity,
  Lightbulb,
  FireExtinguisher
} from "lucide-react"
import { CodingPlatformService } from "@/services/coding-platform-service"
import Layout from "@/components/layout/layout"
import type { NextPageWithLayout } from "@/types/page"
import { Exercise, ProgrammingLanguage } from "@/types/coding-plateform"

interface UserStats {
  totalExercises: number
  completedExercises: number
  totalChallenges: number
  completedChallenges: number
  currentStreak: number
  longestStreak: number
  totalCodeTime: number
  favoriteLanguage: ProgrammingLanguage
  skillLevel: string
  weeklyProgress: Array<{
    day: string
    exercises: number
    timeSpent: number
  }>
}

interface RecentActivity {
  id: string
  type: 'completed' | 'started' | 'failed'
  exerciseTitle: string
  challengeTitle: string
  timestamp: string
  difficulty: string
  language: ProgrammingLanguage
}

const UserDashboardPage: NextPageWithLayout = () => {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch public exercises
      const exercisesResponse = await CodingPlatformService.getPublicExercises({
        page: 1,
        per_page: 12
      })
      setExercises(exercisesResponse.data)

      // Get recommended exercises (for demo, just take the first few)
      setRecommendedExercises(exercisesResponse.data.slice(0, 4))

      // Mock user stats (in real app, this would come from a user stats API)
      setUserStats({
        totalExercises: 25,
        completedExercises: 8,
        totalChallenges: 67,
        completedChallenges: 23,
        currentStreak: 5,
        longestStreak: 12,
        totalCodeTime: 1240, // minutes
        favoriteLanguage: 'python',
        skillLevel: 'Intermediate',
        weeklyProgress: [
          { day: 'Lun', exercises: 2, timeSpent: 45 },
          { day: 'Mar', exercises: 1, timeSpent: 30 },
          { day: 'Mer', exercises: 3, timeSpent: 75 },
          { day: 'Jeu', exercises: 0, timeSpent: 0 },
          { day: 'Ven', exercises: 2, timeSpent: 60 },
          { day: 'Sam', exercises: 1, timeSpent: 25 },
          { day: 'Dim', exercises: 2, timeSpent: 50 }
        ]
      })

      // Mock recent activities
      setRecentActivities([
        {
          id: '1',
          type: 'completed',
          exerciseTitle: 'Structures de données',
          challengeTitle: 'Listes chaînées',
          timestamp: '2024-01-15T14:30:00Z',
          difficulty: 'intermediate',
          language: 'python'
        },
        {
          id: '2',
          type: 'started',
          exerciseTitle: 'Algorithmes de tri',
          challengeTitle: 'Tri par insertion',
          timestamp: '2024-01-15T10:15:00Z',
          difficulty: 'beginner',
          language: 'javascript'
        },
        {
          id: '3',
          type: 'completed',
          exerciseTitle: 'Récursion',
          challengeTitle: 'Factorielle',
          timestamp: '2024-01-14T16:45:00Z',
          difficulty: 'beginner',
          language: 'python'
        }
      ])

    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError("Impossible de charger les données du tableau de bord.")
    } finally {
      setLoading(false)
    }
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

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'beginner': 'text-green-600 bg-green-100',
      'intermediate': 'text-yellow-600 bg-yellow-100',
      'advanced': 'text-orange-600 bg-orange-100',
      'expert': 'text-red-600 bg-red-100'
    }
    return colors[difficulty as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'started':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'failed':
        return <Target className="h-4 w-4 text-red-500" />
      default:
        return <Code className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    const diffInDays = Math.floor(diffInHours / 24)
    return `Il y a ${diffInDays}j`
  }

  const progressPercentage = userStats 
    ? Math.round((userStats.completedExercises / userStats.totalExercises) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-6"></div>
          <p className="text-gray-600 text-lg">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Mon Tableau de Bord | Coding Platform</title>
        <meta name="description" content="Suivez votre progression et découvrez de nouveaux défis de programmation" />
      </Head>

      <div className="bg-gray-50 min-h-screen">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-8 lg:mb-0">
                  <h1 className="text-4xl font-bold mb-2">
                    Bonjour ! 👋
                  </h1>
                  <p className="text-xl text-blue-100 mb-4">
                    Prêt à relever de nouveaux défis de programmation ?
                  </p>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <FireExtinguisher className="h-5 w-5 mr-2 text-orange-300" />
                      <span className="text-blue-100">
                        {userStats?.currentStreak} jours de série
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-yellow-300" />
                      <span className="text-blue-100">
                        Niveau {userStats?.skillLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 min-w-[300px]">
                  <h3 className="text-lg font-semibold mb-4">Progression globale</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Exercices terminés</span>
                        <span>{userStats?.completedExercises}/{userStats?.totalExercises}</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-white h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{userStats?.completedChallenges}</div>
                        <div className="text-blue-200">Challenges</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{Math.round((userStats?.totalCodeTime || 0) / 60)}h</div>
                        <div className="text-blue-200">Code temps</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                <svg className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-600 text-sm font-medium">Série actuelle</p>
                        <p className="text-2xl font-bold text-gray-900">{userStats?.currentStreak} jours</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-600 text-sm font-medium">Précision</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {userStats ? Math.round((userStats.completedChallenges / (userStats.completedChallenges + 5)) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Code className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-600 text-sm font-medium">Langage favori</p>
                        <p className="text-lg font-bold text-gray-900 flex items-center">
                          {getLanguageIcon(userStats?.favoriteLanguage || 'python')}
                          <span className="ml-2">{CodingPlatformService.getLanguageLabel(userStats?.favoriteLanguage || 'python')}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Exercises */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <Lightbulb className="h-6 w-6 mr-3 text-yellow-500" />
                      Recommandé pour vous
                    </h2>
                    <Link
                      href="/exercises"
                      className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Voir tous
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendedExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{getLanguageIcon(exercise.language)}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                              {CodingPlatformService.getDifficultyLabel(exercise.difficulty)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {exercise.challenge_count} challenges
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2">{exercise.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {exercise.description}
                        </p>
                        
                        <Link
                          href={`/exercises/${exercise.id}`}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full justify-center"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Commencer
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Progress Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <BarChart3 className="h-6 w-6 mr-3 text-green-500" />
                    Activité de la semaine
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Exercices terminés cette semaine</span>
                      <span className="font-semibold text-gray-900">
                        {userStats?.weeklyProgress.reduce((sum, day) => sum + day.exercises, 0)} exercices
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {userStats?.weeklyProgress.map((day, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs text-gray-500 mb-2">{day.day}</div>
                          <div className="relative">
                            <div 
                              className="bg-blue-100 rounded-lg mx-auto"
                              style={{ 
                                width: '100%',
                                height: `${Math.max(20, day.exercises * 15)}px`,
                                backgroundColor: day.exercises > 0 ? '#3B82F6' : '#E5E7EB'
                              }}
                            ></div>
                            <div className="text-xs mt-1 font-medium text-gray-700">
                              {day.exercises}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
                      <span>Temps total codé</span>
                      <span className="font-semibold text-gray-900">
                        {userStats?.weeklyProgress.reduce((sum, day) => sum + day.timeSpent, 0)} minutes
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-purple-500" />
                    Activité récente
                  </h3>
                  
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">
                              {activity.type === 'completed' ? 'Terminé' : 
                               activity.type === 'started' ? 'Commencé' : 'Échoué'}
                            </span>
                            {' '}le challenge "{activity.challengeTitle}"
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.exerciseTitle} • {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-lg">{getLanguageIcon(activity.language)}</span>
                          <span className={`px-1 py-0.5 rounded text-xs ${getDifficultyColor(activity.difficulty)}`}>
                            {activity.difficulty}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    href="/profile"
                    className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-4 pt-4 border-t"
                  >
                    Voir tout l'historique
                  </Link>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                    Actions rapides
                  </h3>
                  
                  <div className="space-y-3">
                    <Link
                      href="/exercises"
                      className="flex items-center w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <BookOpen className="h-5 w-5 mr-3" />
                      <span className="font-medium">Parcourir les exercices</span>
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Link>
                    
                    <Link
                      href="/leaderboard"
                      className="flex items-center w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <Trophy className="h-5 w-5 mr-3" />
                      <span className="font-medium">Classement</span>
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Link>
                    
                    <Link
                      href="/profile"
                      className="flex items-center w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Users className="h-5 w-5 mr-3" />
                      <span className="font-medium">Mon profil</span>
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Link>
                  </div>
                </div>

                {/* Achievement */}
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
                  <div className="flex items-center mb-4">
                    <Award className="h-8 w-8 mr-3" />
                    <div>
                      <h3 className="font-bold text-lg">Nouveau badge !</h3>
                      <p className="text-yellow-100 text-sm">Série de 5 jours</p>
                    </div>
                  </div>
                  <p className="text-yellow-100 text-sm mb-4">
                    Félicitations ! Vous avez maintenu une série de 5 jours consécutifs.
                  </p>
                  <Link
                    href="/achievements"
                    className="inline-flex items-center text-white font-medium hover:text-yellow-100 text-sm"
                  >
                    Voir tous les badges
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

UserDashboardPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>
export default UserDashboardPage