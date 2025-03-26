// components/ui/Spinner.jsx
import React from 'react';
import PropTypes from 'prop-types';

const Spinner = ({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}) => {
  // Configuration des tailles
  const sizeStyles = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  // Configuration des couleurs
  const colorStyles = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-amber-500',
    info: 'text-blue-600',
    light: 'text-gray-300',
    dark: 'text-gray-800',
    white: 'text-white',
  };

  // Assembler les classes
  const spinnerClasses = `
    animate-spin
    ${sizeStyles[size]}
    ${colorStyles[color]}
    ${className}
  `;

  return (
    <svg
      className={spinnerClasses}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
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
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'white']),
  className: PropTypes.string,
};

export default Spinner;