// components/ui/Select.jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Select = forwardRef(({
  label,
  id,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Sélectionner...',
  required = false,
  disabled = false,
  error,
  helpText,
  size = 'md',
  className = '',
  containerClassName = '',
  labelClassName = '',
  selectClassName = '',
  errorClassName = '',
  helpTextClassName = '',
  ...props
}, ref) => {
  // Configuration des tailles
  const sizeStyles = {
    sm: 'py-1.5 pl-3 pr-8 text-sm',
    md: 'py-2 pl-4 pr-8 text-base',
    lg: 'py-2.5 pl-4 pr-8 text-lg',
  };

  // Classes de base pour le select
  const baseSelectClasses = `
    block w-full bg-white border rounded-md shadow-sm appearance-none
    focus:outline-none focus:ring-2 focus:ring-offset-0
    transition duration-150 ease-in-out
    ${sizeStyles[size]}
    ${error 
      ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
    ${selectClassName}
  `;

  // Générer un ID si non fourni
  const selectId = id || name;

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label 
          htmlFor={selectId} 
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={baseSelectClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option) => {
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;
            
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
        
        {/* Flèche déroulante personnalisée */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg 
            className="h-5 w-5" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      </div>
      
      {error && (
        <p 
          id={`${selectId}-error`} 
          className={`mt-1 text-sm text-red-600 ${errorClassName}`}
        >
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className={`mt-1 text-sm text-gray-500 ${helpTextClassName}`}>
          {helpText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.node.isRequired,
      }),
    ])
  ),
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  helpText: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  selectClassName: PropTypes.string,
  errorClassName: PropTypes.string,
  helpTextClassName: PropTypes.string,
};

export default Select;