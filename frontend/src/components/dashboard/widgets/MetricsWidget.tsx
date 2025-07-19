// tsx/src/components/dashboard/widgets/MetricsWidget.tsx
'use client'

import React from 'react'
import { 
  TrendingUpIcon, 
  TrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline'

interface MetricData {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  subtitle?: string
  icon: React.ComponentType<any>
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal'
  progress?: number
}

interface MetricsWidgetProps {
  metrics: MetricData[]
  className?: string
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    progress: 'bg-blue-500'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    progress: 'bg-green-500'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    progress: 'bg-purple-500'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    progress: 'bg-orange-500'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    progress: 'bg-red-500'
  },
  teal: {
    bg: 'bg-teal-100',
    text: 'text-teal-600',
    progress: 'bg-teal-500'
  }
}

export default function MetricsWidget({ metrics, className = '' }: MetricsWidgetProps) {
  const getTrendIcon = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUpIcon className="w-4 h-4 text-green-500" />
      case 'decrease':
        return <TrendingDownIcon className="w-4 h-4 text-red-500" />
      default:
        return <MinusIcon className="w-4 h-4 text-gray-400" />
    }
  }

  const getTrendColor = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {metrics.map((metric, index) => {
        const colors = colorClasses[metric.color]
        const IconComponent = metric.icon

        return (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 ${colors.bg} rounded-lg`}>
                <IconComponent className={`w-6 h-6 ${colors.text}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                
                {/* Changement/Tendance */}
                {metric.change !== undefined && (
                  <div className="flex items-center mt-1">
                    {getTrendIcon(metric.changeType)}
                    <span className={`text-sm ml-1 ${getTrendColor(metric.changeType)}`}>
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                )}
                
                {/* Sous-titre */}
                {metric.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
                )}
                
                {/* Barre de progression */}
                {metric.progress !== undefined && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${colors.progress} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(metric.progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {metric.progress}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}