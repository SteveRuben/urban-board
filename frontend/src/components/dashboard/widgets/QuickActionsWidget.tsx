// tsx/src/components/dashboard/widgets/QuickActionsWidget.tsx
'use client'

import React from 'react'
import { 
  PlusCircleIcon,
  CpuChipIcon,
  ChartBarIcon,
  UserGroupIcon,
  RobotIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface QuickAction {
  id: string
  title: string
  description: string
  action: string
  icon: string
  color: string
  category: string
  badge?: string
  featured?: boolean
}

interface QuickActionsWidgetProps {
  actions: QuickAction[]
  title?: string
  className?: string
  maxActions?: number
}

const iconMap = {
  'plus-circle': PlusCircleIcon,
  'cpu-chip': CpuChipIcon,
  'chart-bar': ChartBarIcon,
  'users': UserGroupIcon,
  'robot': RobotIcon,
  'sparkles': SparklesIcon
}

const colorClasses = {
  blue: 'bg-blue-500 hover:bg-blue-600',
  purple: 'bg-purple-500 hover:bg-purple-600',
  green: 'bg-green-500 hover:bg-green-600',
  teal: 'bg-teal-500 hover:bg-teal-600',
  indigo: 'bg-indigo-500 hover:bg-indigo-600',
  orange: 'bg-orange-500 hover:bg-orange-600',
  red: 'bg-red-500 hover:bg-red-600'
}

export default function QuickActionsWidget({ 
  actions, 
  title = "Actions Rapides", 
  className = '',
  maxActions = 6
}: QuickActionsWidgetProps) {
  
  const displayActions = actions.slice(0, maxActions)
  
  const handleActionClick = (action: QuickAction) => {
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'quick_action_click', {
        action_id: action.id,
        action_category: action.category
      })
    }
    
    // Navigation
    window.location.href = action.action
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <SparklesIcon className="w-5 h-5 text-yellow-500 mr-2" />
          {title}
        </h2>
        {actions.length > maxActions && (
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Voir tout ({actions.length})
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayActions.map((action) => {
          const IconComponent = iconMap[action.icon as keyof typeof iconMap] || PlusCircleIcon
          const colorClass = colorClasses[action.color as keyof typeof colorClasses] || colorClasses.blue
          
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`
                relative p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm 
                transition-all text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${action.featured ? 'ring-2 ring-yellow-200 bg-yellow-50' : ''}
              `}
            >
              {/* Badge featured */}
              {action.featured && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
                  ⭐ Recommandé
                </div>
              )}
              
              <div className="flex items-center mb-3">
                <div className={`p-2 ${colorClass} rounded-lg transition-colors`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                {action.badge && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {action.badge}
                  </span>
                )}
              </div>
              
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {action.description}
              </p>
              
              {/* Catégorie */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {action.category}
                </span>
                <span className="text-blue-600 group-hover:text-blue-800 text-sm font-medium">
                  →
                </span>
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Actions supplémentaires si nécessaire */}
      {displayActions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Aucune action disponible</p>
          <p className="text-sm">Les actions rapides apparaîtront ici selon votre activité</p>
        </div>
      )}
    </div>
  )
}