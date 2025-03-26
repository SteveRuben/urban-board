// components/ui/IconButton.jsx
import React from 'react';
import PropTypes from 'prop-types';

const IconButton = ({
  icon,
  color = 'default',
  size = 'md',
  variant = 'solid',
  rounded = 'full',
  className = '',
  disabled = false,
  loading = false,
  label,
  onClick,
  ...props
}) => {
  // Configuration des styles selon le type
  const colorStyles = {
    default: {
      solid: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    },
    primary: {
      solid: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    },
    secondary: {
      solid: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-600 text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
    },
    danger: {
      solid: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      outline: 'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
      ghost: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
    },
    success: {
      solid: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      outline: 'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
      ghost: 'text-green-600 hover:bg-green-50 focus:ring-green-500',
    },
    warning: {
      solid: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500',
      outline: 'border border-amber-500 text-amber-500 hover:bg-amber-50 focus:ring-amber-500',
      ghost: 'text-amber-500 hover:bg-amber-50 focus:ring-amber-500',
    },
    info: {
      solid: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
      outline: 'border border-blue-500 text-blue-500 hover:bg-blue-50 focus:ring-blue-500',
      ghost: 'text-blue-500 hover:bg-blue-50 focus:ring-blue-500',
    },
  };

  // Configuration des tailles
  const sizeStyles = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3',
  };

  // Configuration des tailles d'icônes
  const iconSizeStyles = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7',
  };

  // Configuration des arrondis
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  // Assembler les classes
  const buttonClasses = `
    inline-flex items-center justify-center
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${colorStyles[color][variant]}
    ${sizeStyles[size]}
    ${roundedStyles[rounded]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  // Gérer le spinner pour l'état de chargement
  const loadingSpinner = (
    <svg 
      className={`animate-spin ${iconSizeStyles[size]}`}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Cloner l'icône avec les classes de taille appropriées
  const iconElement = React.isValidElement(icon) 
    ? React.cloneElement(icon, { 
        className: `${iconSizeStyles[size]} ${icon.props.className || ''}` 
      })
    : null;

  return (
    <button
      type="button"
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={label}
      {...props}
    >
      {loading ? loadingSpinner : iconElement}
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
};

IconButton.propTypes = {
  icon: PropTypes.node.isRequired,
  color: PropTypes.oneOf(['default', 'primary', 'secondary', 'danger', 'success', 'warning', 'info']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  variant: PropTypes.oneOf(['solid', 'outline', 'ghost']),
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'full']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  label: PropTypes.string,
  onClick: PropTypes.func,
};

export default IconButton;