// components/ui/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';

const Button = ({
  children,
  type = 'button',
  color = 'primary',
  size = 'md',
  variant = 'filled',
  className = '',
  disabled = false,
  loading = false,
  icon,
  onClick,
  ...props
}) => {
  // Base classes
  let baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Couleur
  const colorClasses = {
    primary: {
      filled: 'bg-primary-600 text-black hover:bg-primary-700 focus:ring-primary-500',
      outlined: 'border border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    },
    secondary: {
      filled: 'bg-gray-600 text-black hover:bg-gray-700 focus:ring-gray-500',
      outlined: 'border border-gray-600 text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
    },
    success: {
      filled: 'bg-green-600 text-black hover:bg-green-700 focus:ring-green-500',
      outlined: 'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
      ghost: 'text-green-600 hover:bg-green-50 focus:ring-green-500',
    },
    danger: {
      filled: 'bg-red-600 text-black hover:bg-red-700 focus:ring-red-500',
      outlined: 'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
      ghost: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
    },
    warning: {
      filled: 'bg-amber-500 text-black hover:bg-amber-600 focus:ring-amber-500',
      outlined: 'border border-amber-500 text-amber-500 hover:bg-amber-50 focus:ring-amber-500',
      ghost: 'text-amber-500 hover:bg-amber-50 focus:ring-amber-500',
    },
    info: {
      filled: 'bg-blue-500 text-black hover:bg-blue-600 focus:ring-blue-500',
      outlined: 'border border-blue-500 text-blue-500 hover:bg-blue-50 focus:ring-blue-500',
      ghost: 'text-blue-500 hover:bg-blue-50 focus:ring-blue-500',
    },
    light: {
      filled: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-200',
      outlined: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-200',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-200',
    },
  };
  
  // Taille
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-base',
  };
  
  // Ajouter les classes selon les props
  const buttonClasses = `
    ${baseClasses}
    ${colorClasses[color][variant]}
    ${sizeClasses[size]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;
  
  // Gérer le spinner pour l'état de chargement
  const loadingSpinner = (
    <svg 
      className="animate-spin -ml-1 mr-2 h-4 w-4" 
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
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && loadingSpinner}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  variant: PropTypes.oneOf(['filled', 'outlined', 'ghost']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
  onClick: PropTypes.func,
};

export default Button;