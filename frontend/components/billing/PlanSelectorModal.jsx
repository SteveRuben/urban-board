// frontend/components/billing/PlanSelectorModal.jsx
import React from 'react';
import { CheckCircle } from 'lucide-react';

const PlanSelectorModal = ({
  selectedPlan,
  billingPeriod,
  availablePlans,
  processingAction,
  currentPlan,
  onClose,
  onSelectPlan,
  onChangeBillingPeriod,
  onConfirm
}) => {
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !processingAction && onClose()}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
          <div>
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Changer de plan
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Sélectionnez le plan qui correspond le mieux à vos besoins.
              </p>
            </div>
          </div>
          
          {/* Toggle période de facturation */}
          <div className="mt-4 flex justify-center">
            <div className="relative bg-gray-100 rounded-lg p-1 flex shadow-sm">
              <button
                onClick={() => onChangeBillingPeriod('monthly')}
                disabled={processingAction}
                className={`relative py-2 px-6 text-sm font-medium rounded-md whitespace-nowrap focus:outline-none ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Mensuel
              </button>
              <button
                onClick={() => onChangeBillingPeriod('annual')}
                disabled={processingAction}
                className={`relative py-2 px-6 ml-0.5 text-sm font-medium rounded-md whitespace-nowrap focus:outline-none ${
                  billingPeriod === 'annual'
                    ? 'bg-white text-gray-900 shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Annuel
                <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  -20%
                </span>
              </button>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            {availablePlans.map((plan) => (
              <div 
                key={plan.id}
                onClick={() => !processingAction && onSelectPlan(plan)}
                className={`relative rounded-lg border p-4 cursor-pointer hover:border-indigo-300 ${
                  selectedPlan?.id === plan.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-300'
                } ${processingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                    
                    <p className="mt-4">
                      <span className="text-2xl font-bold text-gray-900">
                        {billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice}€
                      </span>
                      <span className="text-base font-medium text-gray-500">
                        {billingPeriod === 'monthly' ? '/mois' : '/an'}
                      </span>
                    </p>
                    
                    <ul className="mt-4 space-y-2">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mr-1" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-sm text-indigo-600">+ {plan.features.length - 3} autres fonctionnalités</li>
                      )}
                    </ul>
                  </div>
                  
                  {currentPlan?.id === plan.id && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Plan actuel
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={processingAction}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={processingAction || !selectedPlan || (selectedPlan.id === currentPlan?.id && billingPeriod === currentPlan?.billingPeriod)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-black hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingAction ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                  Traitement...
                </span>
              ) : (
                'Confirmer le changement'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSelectorModal;