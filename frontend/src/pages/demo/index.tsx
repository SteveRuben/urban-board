// Page d'index pour les démonstrations - redirige vers le hub des fonctionnalités
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const DemoIndex = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirection automatique vers la page des fonctionnalités
    router.replace('/demo/features');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirection vers les démonstrations...</p>
      </div>
    </div>
  );
};

export default DemoIndex;