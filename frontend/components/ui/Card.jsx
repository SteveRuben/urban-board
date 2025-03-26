// components/ui/Card.jsx
import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  className = '', 
  hoverable = false,
  ...props 
}) => {
  return (
    <div 
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200
        ${hoverable ? 'transition-shadow hover:shadow-md' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ 
  children, 
  className = '', 
  bordered = true,
  ...props 
}) => {
  return (
    <div 
      className={`
        px-6 py-4
        ${bordered ? 'border-b border-gray-200' : ''}
        ${className}
      `} 
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <h3 
      className={`text-lg font-medium text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

const CardSubtitle = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <h4 
      className={`text-sm text-gray-600 mt-1 ${className}`}
      {...props}
    >
      {children}
    </h4>
  );
};

const CardBody = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div 
      className={`px-6 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardFooter = ({ 
  children, 
  className = '', 
  bordered = true,
  ...props 
}) => {
  return (
    <div 
      className={`
        px-6 py-4
        ${bordered ? 'border-t border-gray-200' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

// Attacher les sous-composants à Card
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;
Card.Body = CardBody;
Card.Footer = CardFooter;

// PropTypes
Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hoverable: PropTypes.bool
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  bordered: PropTypes.bool
};

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

CardSubtitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

CardBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  bordered: PropTypes.bool
};

export default Card;