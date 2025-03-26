// components/ui/Switch.jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Switch = forwardRef(({
  id,
  name,
  checked = false,
  onChange,
  disabled = false,
  label,
  labelPosition = 'right',
  size = 'md',
  color = 'primary',
  className = '',
  labelClassName = '',
  switchClassName = '',
  thumbClassName = '',
  ...props
}, ref) => {
  // Configuration des tailles
  const sizeStyles = {
    sm: {
      switch: 'w-8 h-4',
      thumb: 'h-3 w-3',
      translate: 'translate-x-4',
      label: 'text-sm',
    },
    md: {
      switch: 'w-11 h-6',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5',
      label: 'text-base',
    },
    lg: {
      switch: 'w-14 h-7',
      thumb: 'h-6 w-6',
      translate: 'translate-x-7',
      label: 'text-lg',
    },
  };

  // Configuration des couleurs
  const colorStyles = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    danger: 'bg-red-600',
    warning: 'bg-amber-500',
    info: 'bg-blue-600',
  };

  const { switch: switchSize, thumb: thumbSize, translate, label: labelSize } = sizeStyles[size];

  // Générer un ID si non fourni
  const switchId = id || name || `switch-${Math.random().toString(36).substr(2, 9)}`;

  // Créer le composant Switch avec son label
  const switchComponent = (
    <button
      ref={ref}
      id={switchId}
      type="button"
      role="switch"
      aria-checked={checked}
      name={name}
      onClick={disabled ? undefined : () => onChange(!checked)}
      className={`
        relative inline-flex flex-shrink-0 transition-colors ease-in-out duration-200
        ${switchSize}
        ${checked ? colorStyles[color] : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500
        ${switchClassName}
      `}
      disabled={disabled}
      {...props}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block rounded-full bg-white shadow transform transition ease-in-out duration-200
          ${thumbSize}
          ${checked ? translate : 'translate-x-0'}
          ${thumbClassName}
        `}
      />
    </button>
  );

  // Si pas de label, retourner juste le switch
  if (!label) {
    return <div className={className}>{switchComponent}</div>;
  }

  // Retourner le switch avec le label, selon la position
  return (
    <div className={`flex items-center ${className}`}>
      {labelPosition === 'left' && (
        <label 
          htmlFor={switchId} 
          className={`mr-3 ${labelSize} ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'} ${labelClassName}`}
        >
          {label}
        </label>
      )}
      
      {switchComponent}
      
      {labelPosition === 'right' && (
        <label 
          htmlFor={switchId} 
          className={`ml-3 ${labelSize} ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'} ${labelClassName}`}
        >
          {label}
        </label>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';

Switch.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  label: PropTypes.node,
  labelPosition: PropTypes.oneOf(['left', 'right']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info']),
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  switchClassName: PropTypes.string,
  thumbClassName: PropTypes.string,
};

export default Switch;