// components/profile/IntegrationsCard.jsx
import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const IntegrationItem = ({ 
  integration, 
  processingAction, 
  onConnectIntegration 
}) => {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center">
        <div className="h-12 w-12 relative flex-shrink-0">
          <Image
            src={integration.icon}
            alt={integration.name}
            layout="fill"
            objectFit="contain"
          />
        </div>
        <div className="ml-4">
          <h4 className="text-sm font-medium text-gray-900">{integration.name}</h4>
          {integration.connected ? (
            <p className="text-xs text-green-600">
              Connecté depuis le {formatDate(integration.connectionDate)}
            </p>
          ) : (
            <p className="text-xs text-gray-500">Non connecté</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onConnectIntegration(integration.id)}
        disabled={processingAction}
        className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          integration.connected
            ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500'
            : 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
        }`}
      >
        {integration.connected ? 'Déconnecter' : 'Connecter'}
      </button>
    </div>
  );
};

const IntegrationsCard = ({
  integrations,
  processingAction,
  onConnectIntegration
}) => {
  // Regrouper les intégrations par catégorie
  const categories = {
    calendars: {
      title: 'Calendriers',
      integrations: integrations.filter(i => ['calendar', 'microsoft'].includes(i.id))
    },
    ats: {
      title: 'Systèmes de suivi de candidatures',
      integrations: integrations.filter(i => ['ats'].includes(i.id))
    },
    communication: {
      title: 'Communication',
      integrations: integrations.filter(i => ['slack'].includes(i.id))
    },
    other: {
      title: 'Autres intégrations',
      integrations: integrations.filter(i => !['calendar', 'microsoft', 'ats', 'slack'].includes(i.id))
    }
  };

  // Filtrer les catégories vides
  const filteredCategories = Object.entries(categories)
    .filter(([_, { integrations }]) => integrations.length > 0)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return (
    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Intégrations</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Connectez RecruteIA à vos outils préférés
        </p>
      </div>

      <div className="border-t border-gray-200">
        {Object.entries(filteredCategories).map(([key, { title, integrations: categoryIntegrations }]) => (
          <div key={key} className="px-4 py-5 sm:px-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">{title}</h3>
            <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
              {categoryIntegrations.map((integration) => (
                <IntegrationItem
                  key={integration.id}
                  integration={integration}
                  processingAction={processingAction}
                  onConnectIntegration={onConnectIntegration}
                />
              ))}
            </div>
          </div>
        ))}

        {Object.keys(filteredCategories).length === 0 && (
          <div className="px-4 py-5 sm:px-6">
            <p className="text-sm text-gray-500">Aucune intégration disponible pour le moment.</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-gray-500">
            Les intégrations permettent à RecruteIA de fonctionner avec vos autres outils. Nous ne partagerons jamais vos données sans votre permission.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsCard;