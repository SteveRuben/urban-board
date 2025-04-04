// frontend/components/billing/NoPlanCard.jsx
import React from 'react';

const NoPlanCard = ({ onChangePlan }) => {
  return (
    <div className="mt-8 bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Aucun abonnement actif
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Vous n'avez pas d'abonnement actif. Choisissez un plan pour accéder à toutes les fonctionnalités de RecruteIA.</p>
        </div>
        <div className="mt-5">
          <button
            onClick={onChangePlan}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Voir les plans disponibles
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoPlanCard;