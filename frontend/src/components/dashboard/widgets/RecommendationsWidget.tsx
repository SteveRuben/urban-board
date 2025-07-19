// tsx/src/components/dashboard/widgets/RecommendationsWidget.tsx
'use client'

import React, { useState } from 'react'
import { 
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface Recommendation {
  id: string
  title: string
  description: string
  action: string
  priority: 'high' | 'medium' | 'low'
  category: string
  icon: string
  badge?: string
  dismissible?: boolean
}

interface RecommendationsWidgetProps {
  recommendations: Recommendation[]
  title?: string
  className?: string
  maxRecommendations?: number
  onDismiss?: (recommendationId: string) => void
  onAction?: (recommendation: Recommendation) => void
}

const priorityConfig = {
  high: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    icon: ExclamationTriangleIcon
  },
  medium: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    icon: LightBulbIcon
  },
  low: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    icon: InformationCircleIcon
  }
}

export default function RecommendationsWidget({
  recommendations,
  title = "Recommandations Intelligentes",
  className = '',
  maxRecommendations = 5,
  onDismiss,
  onAction
}: RecommendationsWidgetProps) {
  
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  
  const visibleRecommendations = recommendations
    .filter(rec => !dismissedIds.has(rec.id))
    .slice(0, maxRecommendations)
  
  const handleDismiss = (recommendationId: string) => {
    setDismissedIds(prev => new Set([...prev, recommendationId]))
    onDismiss?.(recommendationId)
  }
  
  const handleAction = (recommendation: Recommendation) => {
    onAction?.(recommendation)
    
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'recommendation_action', {
        recommendation_id: recommendation.id,
        recommendation_category: recommendation.category,
        recommendation_priority: recommendation.priority
      })
    }
    
    // Navigation
    window.location.href = recommendation.action
  }

  if (visibleRecommendations.length === 0) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SparklesIcon className="w-5 h-5 text-yellow-500 mr-2" />
          {title}
        </h3>
        <div className="text-center py-8 text-gray-500">
          <CheckIcon className="w-12 h-12 mx-auto mb-4 text-green-300" />
          <p className="text-lg font-medium mb-2">Tout est parfait !</p>
          <p className="text-sm">Aucune recommandation pour le moment. Continuez votre excellent travail !</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <SparklesIcon className="w-5 h-5 text-yellow-500 mr-2" />
          {title}
        </h3>
        {recommendations.length > maxRecommendations && (
          <span className="text-sm text-gray-500">
            {visibleRecommendations.length} sur {recommendations.length}
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        {visibleRecommendations.map((recommendation) => {
          const config = priorityConfig[recommendation.priority]
          const PriorityIcon = config.icon
          
          return (
            <div
              key={recommendation.id}
              className={`
                relative p-4 rounded-lg border transition-all hover:shadow-sm
                ${config.bgColor} ${config.borderColor}
              `}
            >
              {/* Bouton de fermeture */}
              {recommendation.dismissible !== false && (
                <button
                  onClick={() => handleDismiss(recommendation.id)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/50"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
              
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-3 ${config.bgColor.replace('50', '100')}`}>
                  <PriorityIcon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                
                <div className="flex-1 pr-6">
                  <div className="flex items-center mb-2">
                    <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                    
                    {/* Badge de priorité */}
                    <span className={`
                      ml-2 px-2 py-1 text-xs rounded-full font-medium
                      ${recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                        recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }
                    `}>
                      {recommendation.priority === 'high' ? 'Urgent' :
                       recommendation.priority === 'medium' ? 'Important' : 'Info'}
                    </span>
                    
                    {/* Badge personnalisé */}
                    {recommendation.badge && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        {recommendation.badge}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    {recommendation.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded">
                      {recommendation.category}
                    </span>
                    
                    <button
                      onClick={() => handleAction(recommendation)}
                      className={`
                        px-3 py-1 text-sm font-medium rounded-lg transition-colors
                        ${recommendation.priority === 'high' ? 'bg-red-600 hover:bg-red-700 text-white' :
                          recommendation.priority === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                          'bg-blue-600 hover:bg-blue-700 text-white'
                        }
                      `}
                    >
                      Agir →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Résumé des recommandations par priorité */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex space-x-4">
            {Object.entries(
              recommendations.reduce((acc, rec) => {
                acc[rec.priority] = (acc[rec.priority] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            ).map(([priority, count]) => (
              <div key={priority} className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  priority === 'high' ? 'bg-red-500' :
                  priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <span className="text-gray-600">
                  {count} {priority === 'high' ? 'urgent' : priority === 'medium' ? 'important' : 'info'}
                </span>
              </div>
            ))}
          </div>
          
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            Voir toutes les recommandations
          </button>
        </div>
      </div>
    </div>
  )
}