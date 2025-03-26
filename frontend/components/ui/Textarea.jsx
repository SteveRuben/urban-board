// components/ui/Textarea.jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Textarea = forwardRef(({
  label,
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = '',
  rows = 4,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helpText,
  maxLength,
  showCharCount = false,
  size = 'md',
  className = '',
  containerClassName = '',
  labelClassName = '',
  textareaClassName = '',
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

  // Classes de base pour le textarea
  const baseTextareaClasses = `
    block w-full border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-offset-0
    transition duration-150 ease-in-out
    ${sizeStyles[size]}
    ${error 
      ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
    ${textareaClassName}
  `;

  // Générer un ID si non fourni
  const textareaId = id || name;

  // Calcul du nombre de caractères pour l'indicateur
  const charCount = value ? value.length : 0;

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <label 
            htmlFor={textareaId} 
            className={`block text-sm font-medium text-gray-700 ${labelClassName}`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {showCharCount && maxLength && (
            <span className={`text-xs ${charCount > maxLength ? 'text-red-500' : 'text-gray-500'}`}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        maxLength={maxLength}
        className={baseTextareaClasses}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...props}
      />
      
      {error && (
        <p 
          id={`${textareaId}-error`} 
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
      
      {/* Afficher le compteur de caractères en bas si demandé et pas affiché en haut */}
      {showCharCount && maxLength && !label && (
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${charCount > maxLength ? 'text-red-500' : 'text-gray-500'}`}>
            {charCount}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  error: PropTypes.string,
  helpText: PropTypes.string,
  maxLength: PropTypes.number,
  showCharCount: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  textareaClassName: PropTypes.string,
  errorClassName: PropTypes.string,
  helpTextClassName: PropTypes.string,
};

export default Textarea;