// frontend/components/layout/AuthLayout.jsx
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="text-sm text-gray-600">Retour à l'accueil</span>
        </Link>
        
        <Link href="/" className="flex items-center justify-center">
          <img
            className="h-12 w-auto"
            src="/logo.svg"
            alt="RecruteIA"
          />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          RecruteIA
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} RecruteIA. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;