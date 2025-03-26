// components/ui/Modal.jsx
import React, { Fragment, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  titleClassName = '',
  zIndex = 50,
  initialFocus,
  closeBtnAriaLabel = 'Fermer',
  ...props
}) => {
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const initialFocusRef = useRef(null);

  // Configuration des tailles
  const sizeStyles = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  // Gérer le focus initial
  useEffect(() => {
    if (!isOpen) return;

    const focusElement = initialFocus 
      ? initialFocus.current 
      : contentRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

    if (focusElement) {
      initialFocusRef.current = document.activeElement;
      setTimeout(() => {
        focusElement.focus();
      }, 0);
    }

    return () => {
      if (initialFocusRef.current) {
        initialFocusRef.current.focus();
      }
    };
  }, [isOpen, initialFocus]);

  // Gérer l'appui sur la touche Echap
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Empêcher le défilement du body quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Cliquer en dehors de la modale
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === modalRef.current) {
      onClose();
    }
  };

  // Ne rien rendre si la modale n'est pas ouverte
  if (!isOpen) return null;

  // Utiliser createPortal pour rendre la modale au niveau du body
  return createPortal(
    <div
      ref={modalRef}
      className={`fixed inset-0 flex items-center justify-center z-${zIndex} overflow-y-auto ${overlayClassName}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      {...props}
    >
      {/* Overlay / Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      {/* Conteneur de la modale */}
      <div
        ref={contentRef}
        className={`
          relative bg-white rounded-lg shadow-xl w-full m-4
          transform transition-all
          ${sizeStyles[size]} 
          ${className}
        `}
      >
        {/* Bouton de fermeture (si activé) */}
        {showCloseButton && (
          <button
            type="button"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
            onClick={onClose}
            aria-label={closeBtnAriaLabel}
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* En-tête (si titre fourni) */}
        {title && (
          <div className={`px-6 py-4 border-b border-gray-200 ${headerClassName}`}>
            <h3 className={`text-lg font-medium text-gray-900 ${titleClassName}`}>
              {title}
            </h3>
          </div>
        )}

        {/* Corps */}
        <div className={`p-6 ${title ? '' : 'pt-8'} ${bodyClassName}`}>
          {children}
        </div>

        {/* Pied de page (si footer fourni) */}
        {footer && (
          <div className={`px-6 py-4 border-t border-gray-200 ${footerClassName}`}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full']),
  closeOnEsc: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  className: PropTypes.string,
  overlayClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  titleClassName: PropTypes.string,
  zIndex: PropTypes.number,
  initialFocus: PropTypes.shape({ current: PropTypes.any }),
  closeBtnAriaLabel: PropTypes.string,
};

export default Modal;