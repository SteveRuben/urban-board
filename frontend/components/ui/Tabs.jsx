// components/ui/Tabs.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const TabContext = React.createContext({
  activeTab: '',
  setActiveTab: () => {},
});

const Tabs = ({
  children,
  defaultTab,
  value,
  onChange,
  variant = 'line',
  orientation = 'horizontal',
  className = '',
  ...props
}) => {
  // État local pour le contrôle si non contrôlé par le parent
  const [localActiveTab, setLocalActiveTab] = useState(defaultTab);

  // Tableau pour stocker tous les onglets
  const [tabsMap, setTabsMap] = useState({});

  // Déterminer si nous sommes en mode contrôlé ou non
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : localActiveTab;

  // Mettre à jour le state local si le defaultTab change
  useEffect(() => {
    if (!isControlled && defaultTab !== undefined) {
      setLocalActiveTab(defaultTab);
    }
  }, [defaultTab, isControlled]);

  // Gestionnaire de changement d'onglet
  const handleTabChange = (tabId) => {
    if (!isControlled) {
      setLocalActiveTab(tabId);
    }
    
    if (onChange) {
      onChange(tabId);
    }
  };

  // Enregistrer un nouvel onglet
  const registerTab = (tabId, tabLabel) => {
    setTabsMap(prev => ({
      ...prev,
      [tabId]: tabLabel
    }));
  };

  // Valeurs du contexte
  const tabContextValue = {
    activeTab,
    setActiveTab: handleTabChange,
    registerTab,
    variant,
    orientation,
  };

  return (
    <TabContext.Provider value={tabContextValue}>
      <div 
        className={`${className}`}
        role="tablist"
        aria-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    </TabContext.Provider>
  );
};

const TabList = ({
  children,
  className = '',
  ...props
}) => {
  const { orientation } = React.useContext(TabContext);

  return (
    <div 
      className={`
        flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const Tab = ({
  id,
  label,
  icon,
  disabled = false,
  className = '',
  ...props
}) => {
  const { activeTab, setActiveTab, variant, orientation } = React.useContext(TabContext);
  const isActive = activeTab === id;

  // Styles des variantes
  const variantStyles = {
    line: {
      active: 'border-b-2 border-primary-600 text-primary-600',
      inactive: 'text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300',
      disabled: 'text-gray-300 cursor-not-allowed',
      base: 'pb-2 border-b',
    },
    filled: {
      active: 'bg-primary-600 text-black',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      disabled: 'bg-gray-100 text-gray-300 cursor-not-allowed',
      base: 'rounded-md',
    },
    pills: {
      active: 'bg-primary-100 text-primary-800 border border-primary-200',
      inactive: 'text-gray-600 hover:bg-gray-100',
      disabled: 'text-gray-300 cursor-not-allowed',
      base: 'rounded-full',
    },
    buttonFilled: {
      active: 'bg-primary-600 text-black rounded-md',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md',
      disabled: 'bg-gray-100 text-gray-300 cursor-not-allowed rounded-md',
      base: '',
    },
    buttonOutline: {
      active: 'border-2 border-primary-600 text-primary-600 rounded-md',
      inactive: 'border border-gray-300 text-gray-600 hover:border-gray-400 rounded-md',
      disabled: 'border border-gray-200 text-gray-300 cursor-not-allowed rounded-md',
      base: '',
    },
  };

  const { base, active, inactive, disabled: disabledStyle } = variantStyles[variant] || variantStyles.line;
  const style = disabled ? disabledStyle : isActive ? active : inactive;

  // Styles d'orientation
  const orientationStyles = {
    horizontal: 'px-4 py-2',
    vertical: 'px-4 py-2 text-left',
  };

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(id);
    }
  };

  // Enregistrer l'onglet dans le parent
  React.useEffect(() => {
    // La logique d'enregistrement serait ici
  }, [id, label]);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      id={`tab-${id}`}
      disabled={disabled}
      onClick={handleClick}
      className={`
        font-medium transition-colors focus:outline-none
        ${base} ${style} ${orientationStyles[orientation]} 
        ${className}
      `}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
};

const TabPanels = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

const TabPanel = ({
  id,
  children,
  className = '',
  ...props
}) => {
  const { activeTab } = React.useContext(TabContext);
  const isActive = activeTab === id;

  // Ne rien rendre si le panel n'est pas actif
  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      id={`panel-${id}`}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

// Définir les prop types
Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  defaultTab: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  variant: PropTypes.oneOf(['line', 'filled', 'pills', 'buttonFilled', 'buttonOutline']),
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  className: PropTypes.string,
};

TabList.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Tab.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.node.isRequired,
  icon: PropTypes.node,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

TabPanels.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TabPanel.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// Attacher les sous-composants à Tabs
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panels = TabPanels;
Tabs.Panel = TabPanel;

export default Tabs;