// components/onboarding/steps/DomainStep.tsx
import React from 'react';

interface DomainData {
  domain: string;
  is_primary: boolean;
}

interface DomainStepProps {
  domains: DomainData[];
  handleDomainChange: (index: number, value: string) => void;
  addDomain: () => void;
  removeDomain: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const DomainStep: React.FC<DomainStepProps> = ({
  domains,
  handleDomainChange,
  addDomain,
  removeDomain,
  nextStep,
  prevStep
}) => {
  return (
    <>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Domaines associés à votre organisation
          </label>
          <p className="mt-1 text-sm text-gray-500">
            Ajoutez les domaines emails utilisés par votre organisation pour faciliter l'ajout de membres.
          </p>
          
          {domains.map((domain, index) => (
            <div key={index} className="mt-3 flex">
              <input
                type="text"
                value={domain.domain}
                onChange={(e) => handleDomainChange(index, e.target.value)}
                className="flex-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="exemple.com"
              />
              {index === 0 ? (
                <span className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-50">
                  Principal
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => removeDomain(index)}
                  className="ml-2 inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addDomain}
            className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un domaine
          </button>
        </div>
      </div>
      
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
          onClick={nextStep}
          disabled={domains.some(d => !d.domain)}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          Continuer
        </button>
      </div>
    </>
  );
};

export default DomainStep;