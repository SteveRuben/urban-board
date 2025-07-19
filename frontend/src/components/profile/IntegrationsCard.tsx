// components/profile/IntegrationsCard.tsx (version améliorée)
import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {Integration} from '@/types';


interface IntegrationItemProps {
  integration: Integration;
  processingAction: boolean;
  onConnectIntegration: (id: string) => void;
}

interface IntegrationsCardProps {
  integrations: Integration[];
  processingAction: boolean;
  onConnectIntegration: (id: string) => void;
}

interface CategoryData {
  title: string;
  integrations: Integration[];
}

interface Categories {
  [key: string]: CategoryData;
}

const IntegrationItem: React.FC<IntegrationItemProps> = ({ 
  integration, 
  processingAction, 
  onConnectIntegration 
}) => {
  // Format date
  const formatDate = (dateString: string | null): string | null => {
    if (!dateString) return null;
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
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
          <p className="text-xs text-gray-500 mb-1">{integration.description}</p>
          {integration.connected ? (
            <p className="text-xs text-green-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Connecté {integration.connectionDate && `depuis le ${formatDate(integration.connectionDate)}`}
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
        {processingAction ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {integration.connected ? 'Déconnecter' : 'Connecter'}
      </button>
    </div>
  );
};

const IntegrationsCard: React.FC<IntegrationsCardProps> = ({
  integrations,
  processingAction,
  onConnectIntegration
}) => {
  // Regrouper les intégrations par catégorie
  const categories: Categories = {
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
    .reduce<Categories>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return (
    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Intégrations</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Connectez RecruteIA à vos outils préférés pour améliorer votre productivité
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
          <svg className="h-5 w-5 text-indigo-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-gray-500">
            Les intégrations permettent à RecruteIA de fonctionner avec vos autres outils. Nous accédons uniquement aux données nécessaires et ne partagerons jamais vos informations sans votre permission.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsCard;