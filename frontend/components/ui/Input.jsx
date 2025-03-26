// components/ui/Input.jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Input = forwardRef(({
  type = 'text',
  label,
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = '',
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helpText,
  leftIcon,
  rightIcon,
  size = 'md',
  className = '',
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  helpTextClassName = '',
  ...props
}, ref) => {
  // Configuration des tailles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-2.5 text-lg',
  };

  // Classes de base pour l'input
  const baseInputClasses = `
    block w-full border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-offset-0
    transition duration-150 ease-in-out
    ${sizeStyles[size]}
    ${error 
      ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${inputClassName}
  `;

  // Générer un ID si non fourni
  const inputId = id || name;

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={baseInputClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p 
          id={`${inputId}-error`} 
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

Input.displayName = 'Input';

Input.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  error: PropTypes.string,
  helpText: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  errorClassName: PropTypes.string,
  helpTextClassName: PropTypes.string,
};

export default Input;