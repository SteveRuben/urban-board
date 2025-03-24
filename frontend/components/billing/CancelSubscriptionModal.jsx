// frontend/components/billing/CancelSubscriptionModal.jsx
import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const CancelSubscriptionModal = ({
  cancelReason,
  cancelReasons,
  processingAction,
  currentPlan,
  onClose,
  onChangeReason,
  onConfirmCancel
}) => {
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !processingAction && onClose()}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Annuler votre abonnement
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir annuler votre abonnement ? Vous aurez accès à votre compte jusqu'à la fin de la période de facturation ({new Date(currentPlan?.nextBillingDate).toLocaleDateString('fr-FR')}).
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700">
              Pourquoi souhaitez-vous annuler ? (facultatif)
            </label>
            <select
              id="cancelReason"
              name="cancelReason"
              value={cancelReason}
              onChange={(e) => onChangeReason(e.target.value)}
              disabled={processingAction}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Sélectionnez une raison --</option>
              {cancelReasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mt-6 bg-gray-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  Si vous changez d'avis, vous pouvez réactiver votre abonnement à tout moment avant la fin de la période en cours.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              onClick={onConfirmCancel}
              disabled={processingAction}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingAction ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                  Traitement...
                </span>
              ) : (
                'Annuler l\'abonnement'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={processingAction}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelSubscriptionModal;