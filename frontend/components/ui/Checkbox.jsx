// components/ui/Checkbox.jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Checkbox = forwardRef(({
  id,
  name,
  label,
  value,
  checked,
  onChange,
  onBlur,
  disabled = false,
  error,
  helpText,
  size = 'md',
  color = 'primary',
  className = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  helpTextClassName = '',
  ...props
}, ref) => {
  // Configuration des tailles
  const sizeStyles = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const labelSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  // Configuration des couleurs
  const colorStyles = {
    primary: 'text-primary-600 focus:ring-primary-500',
    secondary: 'text-gray-600 focus:ring-gray-500',
    success: 'text-green-600 focus:ring-green-500',
    danger: 'text-red-600 focus:ring-red-500',
    warning: 'text-amber-500 focus:ring-amber-500',
    info: 'text-blue-600 focus:ring-blue-500',
  };

  // Générer un ID si non fourni
  const checkboxId = id || `checkbox-${name}-${value}`;

  return (
    <div className={`${className}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            name={name}
            type="checkbox"
            value={value}
            checked={checked}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={`
              rounded border-gray-300 
              ${colorStyles[color]} 
              ${sizeStyles[size]}
              ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
              ${error ? 'border-red-300' : ''}
              ${inputClassName}
            `}
            {...props}
          />
        </div>

        {label && (
          <div className="ml-2 text-sm">
            <label 
              htmlFor={checkboxId} 
              className={`
                font-medium 
                ${labelSizeStyles[size]} 
                ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}
                ${labelClassName}
              `}
            >
              {label}
            </label>
            
            {helpText && !error && (
              <p className={`text-gray-500 ${helpTextClassName}`}>
                {helpText}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p 
          className={`mt-1 text-sm text-red-600 ${errorClassName}`}
        >
          {error}
        </p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

Checkbox.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.node,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool
  ]),
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  helpText: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info']),
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  errorClassName: PropTypes.string,
  helpTextClassName: PropTypes.string,
};

export default Checkbox;