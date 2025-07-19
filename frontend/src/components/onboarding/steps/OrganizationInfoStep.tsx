// components/onboarding/steps/OrganizationInfoStep.tsx
import React from 'react';
import Image from 'next/image';

interface OrganizationData {
  name: string;
  slug: string;
  logo_url: string | null;
}

interface OrganizationInfoStepProps {
  organizationData: OrganizationData;
  updateOrganizationData: (data: Partial<OrganizationData>) => void;
  handleLogoUpload: (file: File) => void;
  nextStep: () => void;
}

const OrganizationInfoStep: React.FC<OrganizationInfoStepProps> = ({
  organizationData,
  updateOrganizationData,
  handleLogoUpload,
  nextStep
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateOrganizationData({ [name]: value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nom de l'organisation
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              required
              value={organizationData.name}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            URL personnalisée
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              recrute-ia.com/
            </span>
            <input
              type="text"
              name="slug"
              id="slug"
              value={organizationData.slug}
              onChange={handleChange}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Logo (optionnel)
          </label>
          <div className="mt-1 flex items-center">
            <span className="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
              {organizationData.logo_url ? (
                <Image
                  src={organizationData.logo_url}
                  alt="Logo"
                  width={48}
                  height={48}
                />
              ) : (
                <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </span>
            <input
              type="file"
              id="logo"
              name="logo"
              accept="image/*"
              onChange={handleFileUpload}
              className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <button
          type="button"
          onClick={nextStep}
          disabled={!organizationData.name || !organizationData.slug}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          Continuer
        </button>
      </div>
    </>
  );
};

export default OrganizationInfoStep;
