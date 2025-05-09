// components/onboarding/OnboardingComponent.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import StepIndicator from './StepIndicator';
import OrganizationInfoStep from './steps/OrganizationInfoStep';
import DomainStep from './steps/DomainStep';
import SummaryStep from './steps/SummaryStep';
import OrganizationService from '@/services/organization-service';


// Types
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

interface OnboardingComponentProps {
  userId: string;
  email: string;
}

// Composant principal d'onboarding
const OnboardingComponent: React.FC<OnboardingComponentProps> = ({ userId, email }) => {
  // Récupérer le domaine de l'email pour suggestion
  const emailDomain = email.split('@')[1] || '';
  
  // États
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    name: '',
    slug: '',
    logo_url: null,
    domains: [{ domain: emailDomain, is_primary: true }]
  });
  
  const router = useRouter();
  
  // Fonction de mise à jour des données
  const updateOrganizationData = (data: Partial<OrganizationData>) => {
    setOrganizationData({ ...organizationData, ...data });
  };
  
  // Gestion des domaines
  const handleDomainChange = (index: number, value: string) => {
    const updatedDomains = [...organizationData.domains];
    updatedDomains[index].domain = value;
    setOrganizationData({ ...organizationData, domains: updatedDomains });
  };
  
  const addDomain = () => {
    setOrganizationData({
      ...organizationData,
      domains: [...organizationData.domains, { domain: '', is_primary: false }]
    });
  };
  
  const removeDomain = (index: number) => {
    const updatedDomains = organizationData.domains.filter((_, i) => i !== index);
    setOrganizationData({ ...organizationData, domains: updatedDomains });
  };
  
  // Gestion du logo
  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    const uploadedLogo = await OrganizationService.uploadLogo(formData);
    setOrganizationData({ ...organizationData, logo_url: uploadedLogo.logo_url });
    setLoading(false);
  };
  
  // Génération automatique du slug à partir du nom
  useEffect(() => {
    if (organizationData.name) {
      const slug = organizationData.name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      setOrganizationData({ ...organizationData, slug });
    }
  }, [organizationData.name]);
  
  // Soumission du formulaire
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await OrganizationService.createOrganization({
        ...organizationData,
        user_id: userId
      });      
      // Redirection vers le dashboard après succès
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };
  
  // Navigation entre les étapes
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Bienvenue sur RecruteIA
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Configurons votre organisation en quelques étapes
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Indicateur d'étape */}
          <StepIndicator currentStep={step} totalSteps={3} />
          
          {/* Étape 1: Informations de l'organisation */}
          {step === 1 && (
            <OrganizationInfoStep 
              organizationData={organizationData}
              updateOrganizationData={updateOrganizationData}
              handleLogoUpload={handleLogoUpload}
              nextStep={nextStep}
            />
          )}
          
          {/* Étape 2: Domaines */}
          {step === 2 && (
            <DomainStep 
              domains={organizationData.domains}
              handleDomainChange={handleDomainChange}
              addDomain={addDomain}
              removeDomain={removeDomain}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )}
          
          {/* Étape 3: Résumé et confirmation */}
          {step === 3 && (
            <SummaryStep 
              organizationData={organizationData}
              handleSubmit={handleSubmit}
              prevStep={prevStep}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingComponent;