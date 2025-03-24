// frontend/components/billing/PaymentMethodsCard.jsx
import React from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';

const PaymentMethodsCard = ({ 
  paymentMethods, 
  processingAction, 
  showAddCardForm,
  onAddPaymentMethod,
  onSetDefaultPaymentMethod,
  onDeletePaymentMethod
}) => {
  return (
    <>
      <ul className="divide-y divide-gray-200">
        {paymentMethods.map((method) => (
          <li key={method.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} se terminant par {method.last4}
                  </p>
                  <p className="text-sm text-gray-500">
                    Expire {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {method.isDefault ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" /> Par défaut
                  </span>
                ) : (
                  <button
                    onClick={() => onSetDefaultPaymentMethod(method.id)}
                    disabled={processingAction}
                    className="text-xs text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Définir par défaut
                  </button>
                )}
                {!method.isDefault && (
                  <button
                    onClick={() => onDeletePaymentMethod(method.id)}
                    disabled={processingAction}
                    className="text-xs text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
                  
      {paymentMethods.length === 0 && !showAddCardForm && (
        <div className="px-6 py-8 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
            <CreditCard className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Aucune méthode de paiement enregistrée.
          </p>
          <button
            onClick={onAddPaymentMethod}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Ajouter une carte
          </button>
        </div>
      )}
    </>
  );
};

export default PaymentMethodsCard;