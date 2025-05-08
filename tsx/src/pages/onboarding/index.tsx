// pages/onboarding/index.tsx
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import OnboardingComponent from '@/components/onboarding/OnboardingComponent';
import { useAuth } from '@/provider/auth';

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Rediriger vers le dashboard si l'utilisateur a déjà complété l'onboarding
    /* if (!loading && user?.onboarding_completed) {
      router.push('/dashboard');
    } */
      router.push('/dashboard');
  }, [user, loading, router]);

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <OnboardingComponent userId={user.id} email={user.email} />;
};

export default OnboardingPage;