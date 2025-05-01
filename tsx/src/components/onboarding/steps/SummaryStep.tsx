// components/onboarding/steps/SummaryStep.tsx
import React from 'react';

interface OrganizationData {
  name: string;
  slug: string;
  logo_url: string | null;
  domains: DomainData[];
}

interface DomainData {
  domain: string;
  is_primary: boolean;
}

interface SummaryStepProps {
  organizationData: OrganizationData;
  handleSubmit: () => void;
  prevStep: () => void;
  loading: boolean;
  error: string | null;
}

const SummaryStep: React.FC<SummaryStepProps> = ({
  organizationData,
  handleSubmit,
  prevStep,
  loading,
  error
}) => {
  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Récapitulatif</h3>
          <p className="mt-1 text-sm text-gray-500">
            Vérifiez les informations avant de finaliser la création de votre organisation.
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <dl className="space-y-4">
            <div className="sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Organisation</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{organizationData.name}</dd>
            </div>
            <div className="sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">URL</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">recrute-ia.com/{organizationData.slug}</dd>
            </div>
            <div className="sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Domaines</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                  {organizationData.domains.map((domain, index) => (
                    <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        {domain.is_primary && (
                          <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Principal
                          </span>
                        )}
                        {domain.domain}
                      </div>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? 'Création en cours...' : 'Créer mon organisation'}
        </button>
      </div>
    </>
  );
};

export default SummaryStep;