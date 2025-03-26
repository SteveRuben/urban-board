// components/ui/Badge.jsx
import React from 'react';
import PropTypes from 'prop-types';

const Badge = ({
  children,
  color = 'default',
  variant = 'filled',
  size = 'md',
  rounded = 'full',
  className = '',
  ...props
}) => {
  // Configuration des couleurs
  const colorStyles = {
    default: {
      filled: 'bg-gray-100 text-gray-800',
      outlined: 'bg-transparent text-gray-800 border border-gray-300',
    },
    primary: {
      filled: 'bg-primary-100 text-primary-800',
      outlined: 'bg-transparent text-primary-800 border border-primary-300',
    },
    secondary: {
      filled: 'bg-gray-100 text-gray-800',
      outlined: 'bg-transparent text-gray-800 border border-gray-300',
    },
    success: {
      filled: 'bg-green-100 text-green-800',
      outlined: 'bg-transparent text-green-800 border border-green-300',
    },
    danger: {
      filled: 'bg-red-100 text-red-800',
      outlined: 'bg-transparent text-red-800 border border-red-300',
    },
    warning: {
      filled: 'bg-amber-100 text-amber-800',
      outlined: 'bg-transparent text-amber-800 border border-amber-300',
    },
    info: {
      filled: 'bg-blue-100 text-blue-800',
      outlined: 'bg-transparent text-blue-800 border border-blue-300',
    },
    indigo: {
      filled: 'bg-indigo-100 text-indigo-800',
      outlined: 'bg-transparent text-indigo-800 border border-indigo-300',
    },
    purple: {
      filled: 'bg-purple-100 text-purple-800',
      outlined: 'bg-transparent text-purple-800 border border-purple-300',
    },
    pink: {
      filled: 'bg-pink-100 text-pink-800',
      outlined: 'bg-transparent text-pink-800 border border-pink-300',
    },
    yellow: {
      filled: 'bg-yellow-100 text-yellow-800',
      outlined: 'bg-transparent text-yellow-800 border border-yellow-300',
    },
    blue: {
      filled: 'bg-blue-100 text-blue-800',
      outlined: 'bg-transparent text-blue-800 border border-blue-300',
    },
    green: {
      filled: 'bg-green-100 text-green-800',
      outlined: 'bg-transparent text-green-800 border border-green-300',
    },
    red: {
      filled: 'bg-red-100 text-red-800',
      outlined: 'bg-transparent text-red-800 border border-red-300',
    },
  };

  // Configuration des tailles
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
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
  const badgeClasses = `
    inline-flex items-center font-medium
    ${colorStyles[color][variant]}
    ${sizeStyles[size]}
    ${roundedStyles[rounded]}
    ${className}
  `;

  return (
    <span className={badgeClasses} {...props}>
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.oneOf([
    'default', 'primary', 'secondary', 'success', 'danger',
    'warning', 'info', 'indigo', 'purple', 'pink', 'yellow',
    'blue', 'green', 'red'
  ]),
  variant: PropTypes.oneOf(['filled', 'outlined']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'full']),
  className: PropTypes.string,
};

export default Badge;