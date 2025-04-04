// frontend/components/billing/CurrentPlanCard.jsx
import React from 'react';
import { Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

const CurrentPlanCard = ({ 
  currentPlan, 
  processingAction, 
  onChangePlan, 
  onShowCancelDialog 
}) => {
  if (!currentPlan) return null;
  
  return (
    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg leading-6 font-medium text-gray-900">Votre plan actuel</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Détails et utilisation de votre abonnement
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
          currentPlan.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : currentPlan.status === 'canceled' 
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
        }`}>
          {currentPlan.status === 'active' ? (
            <>
              <CheckCircle className="mr-1 h-4 w-4" />
              Actif
            </>
          ) : currentPlan.status === 'canceled' ? (
            <>
              <AlertTriangle className="mr-1 h-4 w-4" />
              Annulé - Fin le {new Date(currentPlan.nextBillingDate).toLocaleDateString('fr-FR')}
            </>
          ) : (
            <>
              <AlertTriangle className="mr-1 h-4 w-4" />
              Suspendu
            </>
          )}
        </span>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{currentPlan.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {currentPlan.billingPeriod === 'monthly' ? 'Facturation mensuelle' : 'Facturation annuelle'}
            </p>
            
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-900">{currentPlan.price}€</p>
              <p className="text-sm text-gray-500">{currentPlan.billingPeriod === 'monthly' ? 'par mois' : 'par an'}</p>
            </div>
            
            <div className="mt-6 flex items-center text-sm text-gray-500">
              <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>
                {currentPlan.status === 'active' 
                  ? `Prochain renouvellement le ${new Date(currentPlan.nextBillingDate).toLocaleDateString('fr-FR')}`
                  : `Fin de service le ${new Date(currentPlan.nextBillingDate).toLocaleDateString('fr-FR')}`
                }
              </span>
            </div>
            
            <div className="mt-6">
              {currentPlan.status === 'active' && (
                <>
                  <button 
                    onClick={onChangePlan}
                    disabled={processingAction}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingAction ? 'Traitement en cours...' : 'Changer de plan'}
                  </button>
                  <button 
                    onClick={onShowCancelDialog}
                    disabled={processingAction}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler l'abonnement
                  </button>
                </>
              )}
              
              {currentPlan.status === 'canceled' && (
                <button 
                  onClick={onChangePlan}
                  disabled={processingAction}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingAction ? 'Traitement en cours...' : 'Réactiver l\'abonnement'}
                </button>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Utilisation actuelle</h3>
            
            <div className="mt-4 space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Entretiens</p>
                  <p className="text-sm font-medium text-gray-500">
                    {currentPlan.usageStats.interviews.used} / {currentPlan.usageStats.interviews.total}
                  </p>
                </div>
                <div className="mt-2 relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${currentPlan.usageStats.interviews.percentage}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-black justify-center ${
                        currentPlan.usageStats.interviews.percentage > 90 ? 'bg-red-500' : 'bg-indigo-500'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Postes configurés</p>
                  <p className="text-sm font-medium text-gray-500">
                    {currentPlan.usageStats.positions.used} / {currentPlan.usageStats.positions.total}
                  </p>
                </div>
                <div className="mt-2 relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${currentPlan.usageStats.positions.percentage}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-black justify-center ${
                        currentPlan.usageStats.positions.percentage > 90 ? 'bg-red-500' : 'bg-indigo-500'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Fonctionnalités incluses</h3>
              <ul className="mt-2 space-y-1">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mr-1" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentPlanCard;