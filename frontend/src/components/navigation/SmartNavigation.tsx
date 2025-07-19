// tsx/src/components/navigation/SmartNavigation.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  ChartBarIcon, 
  MicrophoneIcon, 
  CpuChipIcon, 
  RobotIcon,
  UsersIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  BellIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline'
import { 
  ChartBarIcon as ChartBarSolid,
  MicrophoneIcon as MicrophoneSolid,
  CpuChipIcon as CpuChipSolid
} from '@heroicons/react/24/solid'

interface MenuItem {
  id: string
  title: string
  icon: string
  path: string
  order: number
  category?: string
  badge?: string
  badge_color?: string
  description?: string
  children?: MenuItem[]
  notification_count?: number
  stats?: {
    profiles?: number
    interviews?: number
  }
  featured?: boolean
}

interface MenuStructure {
  primary_navigation: MenuItem[]
  secondary_navigation: MenuItem[]
}

interface UserStats {
  total_interviews: number
  personality_interviews: number
  recent_interviews: number
  personality_profiles: number
  ai_assistants: number
  has_used_personality_ai: boolean
  experience_level: string
}

interface SmartNavigationProps {
  className?: string
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const iconMap = {
  'chart-bar': ChartBarIcon,
  'microphone': MicrophoneIcon,
  'cpu-chip': CpuChipIcon,
  'robot': RobotIcon,
  'users': UsersIcon,
  'user-group': UserGroupIcon,
  'cog-6-tooth': Cog6ToothIcon,
  'question-mark-circle': QuestionMarkCircleIcon,
  'plus-circle': PlusCircleIcon,
  'chart-pie': ChartBarIcon,
  'list-bullet': ChartBarIcon,
  'calendar-days': ChartBarIcon,
  'document-duplicate': ChartBarIcon,
  'chat-bubble-left-right': ChartBarIcon,
  'question-mark-circle': QuestionMarkCircleIcon,
  'shield-check': ChartBarIcon,
  'puzzle-piece': ChartBarIcon,
  'document-chart-bar': ChartBarIcon
}

const solidIconMap = {
  'chart-bar': ChartBarSolid,
  'microphone': MicrophoneSolid,
  'cpu-chip': CpuChipSolid
}

export default function SmartNavigation({ 
  className = '', 
  collapsed = false, 
  onToggleCollapse 
}: SmartNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [menuStructure, setMenuStructure] = useState<MenuStructure | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MenuItem[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(true)

  // Charger la structure de menu
  useEffect(() => {
    loadMenuStructure()
  }, [])

  const loadMenuStructure = async () => {
    try {
      const response = await fetch('/api/navigation/menu-structure', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMenuStructure(data.menu_structure)
        setUserStats(data.user_stats)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du menu:', error)
    } finally {
      setLoading(false)
    }
  }

  // Recherche dans le menu
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch('/api/navigation/search-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ query })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results)
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
    }
  }

  // Vérifier si un élément est actif
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  // Obtenir l'icône appropriée
  const getIcon = (iconName: string, isActive: boolean = false) => {
    const IconComponent = isActive && solidIconMap[iconName] 
      ? solidIconMap[iconName] 
      : iconMap[iconName] || ChartBarIcon
    
    return IconComponent
  }

  // Rendu d'un élément de menu
  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const Icon = getIcon(item.icon, isActive(item.path))
    const hasChildren = item.children && item.children.length > 0
    const itemIsActive = isActive(item.path)
    
    return (
      <div key={item.id} className={`menu-item level-${level}`}>
        <div
          className={`
            flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
            ${itemIsActive 
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
              : 'text-gray-700 hover:bg-gray-100'
            }
            ${level > 0 ? 'ml-4 text-sm' : ''}
          `}
          onClick={() => router.push(item.path)}
        >
          <Icon className={`w-5 h-5 mr-3 ${itemIsActive ? 'text-blue-600' : 'text-gray-500'}`} />
          
          {!collapsed && (
            <>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium">{item.title}</span>
                  
                  {/* Badge */}
                  {item.badge && (
                    <span className={`
                      ml-2 px-2 py-1 text-xs rounded-full
                      ${item.badge_color === 'green' ? 'bg-green-100 text-green-800' :
                        item.badge_color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        item.badge_color === 'purple' ? 'bg-purple-100 text-purple-800' :
                        item.badge_color === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    `}>
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Notification count */}
                  {item.notification_count && item.notification_count > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {item.notification_count}
                    </span>
                  )}
                </div>
                
                {/* Description */}
                {item.description && level === 0 && (
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                )}
                
                {/* Stats */}
                {item.stats && (
                  <div className="flex space-x-4 mt-1 text-xs text-gray-500">
                    {item.stats.profiles && (
                      <span>{item.stats.profiles} profils</span>
                    )}
                    {item.stats.interviews && (
                      <span>{item.stats.interviews} entretiens</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Featured indicator */}
              {item.featured && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              )}
            </>
          )}
        </div>
        
        {/* Children */}
        {hasChildren && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // Rendu de la barre de recherche
  const renderSearchBar = () => (
    <div className="relative mb-4">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowSearch(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {/* Résultats de recherche */}
      {showSearch && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => {
                router.push(result.path)
                setShowSearch(false)
                setSearchQuery('')
              }}
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{result.title}</h4>
                  <p className="text-sm text-gray-500">{result.description}</p>
                  {result.category && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {result.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Rendu des statistiques utilisateur
  const renderUserStats = () => {
    if (!userStats || collapsed) return null

    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">Votre Activité</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center">
            <div className="font-bold text-blue-600">{userStats.total_interviews}</div>
            <div className="text-gray-600">Entretiens</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-purple-600">{userStats.personality_interviews}</div>
            <div className="text-gray-600">IA Spécialisée</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-600">{userStats.personality_profiles}</div>
            <div className="text-gray-600">Profils</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-orange-600">{userStats.ai_assistants}</div>
            <div className="text-gray-600">Assistants</div>
          </div>
        </div>
        
        {/* Badge de niveau */}
        <div className="mt-3 text-center">
          <span className={`
            inline-block px-3 py-1 text-xs rounded-full
            ${userStats.experience_level === 'nouveau' ? 'bg-yellow-100 text-yellow-800' :
              userStats.experience_level === 'débutant' ? 'bg-blue-100 text-blue-800' :
              userStats.experience_level === 'intermédiaire' ? 'bg-green-100 text-green-800' :
              userStats.experience_level === 'expérimenté' ? 'bg-purple-100 text-purple-800' :
              'bg-red-100 text-red-800'
            }
          `}>
            Niveau: {userStats.experience_level}
          </span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="space-y-4 p-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!menuStructure) {
    return (
      <div className={`${className} p-4`}>
        <div className="text-center text-gray-500">
          Erreur lors du chargement du menu
        </div>
      </div>
    )
  }

  return (
    <nav className={`${className} h-full overflow-y-auto`}>
      <div className="p-4">
        {/* Barre de recherche */}
        {!collapsed && renderSearchBar()}
        
        {/* Statistiques utilisateur */}
        {renderUserStats()}
        
        {/* Navigation principale */}
        <div className="space-y-2 mb-8">
          <h2 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider ${collapsed ? 'hidden' : ''}`}>
            Navigation
          </h2>
          {menuStructure.primary_navigation
            .sort((a, b) => a.order - b.order)
            .map(item => renderMenuItem(item))
          }
        </div>
        
        {/* Navigation secondaire */}
        <div className="space-y-2 border-t border-gray-200 pt-4">
          <h2 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider ${collapsed ? 'hidden' : ''}`}>
            Paramètres
          </h2>
          {menuStructure.secondary_navigation.map(item => renderMenuItem(item))}
        </div>
      </div>
      
      {/* Overlay pour fermer la recherche */}
      {showSearch && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSearch(false)}
        />
      )}
    </nav>
  )
}