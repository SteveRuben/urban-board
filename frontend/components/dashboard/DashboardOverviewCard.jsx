// components/dashboard/DashboardOverviewCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Users, CheckCircle, Clock, BarChart } from 'lucide-react';

/**
 * Carte d'aperçu pour le tableau de bord, style Notion
 */
const DashboardOverviewCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  previousValue,
  increaseIsGood = true,
  showChange = false
}) => {
  // Calculer le pourcentage de changement
  const calculateChange = () => {
    if (!previousValue || previousValue === 0) return null;
    
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      value: change.toFixed(1),
      isPositive: change >= 0
    };
  };

  const change = showChange ? calculateChange() : null;
  
  // Déterminer la couleur des changements
  const getChangeColor = (change) => {
    if (!change) return '';
    
    const isPositive = change.isPositive;
    const isGood = (isPositive && increaseIsGood) || (!isPositive && !increaseIsGood);
    
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  // Configurer l'icône
  const getIcon = () => {
    const size = 16;
    
    switch (icon) {
      case 'total':
        return <Users size={size} />;
      case 'completed':
        return <CheckCircle size={size} />;
      case 'scheduled':
        return <Clock size={size} />;
      case 'score':
        return <BarChart size={size} />;
      default:
        return null;
    }
  };

  // Couleurs pour différents thèmes de carte
  const colorStyles = {
    blue: {
      bgGradient: 'from-blue-50 to-white',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      border: 'border-blue-100',
    },
    green: {
      bgGradient: 'from-green-50 to-white',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      border: 'border-green-100',
    },
    purple: {
      bgGradient: 'from-purple-50 to-white',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      border: 'border-purple-100',
    },
    yellow: {
      bgGradient: 'from-amber-50 to-white',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      border: 'border-amber-100',
    },
    red: {
      bgGradient: 'from-red-50 to-white',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      border: 'border-red-100',
    },
    gray: {
      bgGradient: 'from-gray-50 to-white',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      border: 'border-gray-100',
    }
  };

  const { bgGradient, iconBg, iconColor, border } = colorStyles[color] || colorStyles.blue;

  return (
    <div className={`bg-gradient-to-br ${bgGradient} p-6 rounded-lg border ${border} shadow-sm hover:shadow transition-shadow duration-200`}>
      <div className="flex items-center mb-3">
        <div className={`flex items-center justify-center h-7 w-7 rounded-md ${iconBg} ${iconColor}`}>
          {getIcon()}
        </div>
        <h3 className="ml-2 text-sm font-medium text-gray-700">{title}</h3>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold text-gray-900">
            {value}
          </div>
          
          {change && (
            <div className={`text-xs font-medium mt-1 flex items-center ${getChangeColor(change)}`}>
              {change.isPositive ? (
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {Math.abs(change.value)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

DashboardOverviewCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.oneOf(['total', 'completed', 'scheduled', 'score']),
  color: PropTypes.oneOf(['blue', 'green', 'purple', 'yellow', 'red', 'gray']),
  previousValue: PropTypes.number,
  increaseIsGood: PropTypes.bool,
  showChange: PropTypes.bool
};

export default DashboardOverviewCard;