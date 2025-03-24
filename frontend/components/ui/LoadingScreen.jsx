// frontend/components/ui/LoadingScreen.jsx
import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-700">Chargement...</h2>
        <p className="mt-2 text-sm text-gray-500">Veuillez patienter</p>
      </div>
    </div>
  );
};

export default LoadingScreen;