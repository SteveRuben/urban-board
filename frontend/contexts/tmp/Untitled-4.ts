// frontend/pages/dashboard/billing.jsx
import React, { useState, useEffect } from 'react';
import { CreditCard, Package, Calendar, AlertTriangle, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useNotification } from '../../contexts/NotificationContext';

const BillingPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useNotification();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasons] = useState([
    { id: 'too_expensive', label: 'Trop cher pour mon budget' },
    { id: 'missing_features', label: 'Fonctionnalités manquantes' },
    { id: 'not_using', label: 'Je n\'utilise pas suffisamment le service' },
    { id: 'switching', label: 'Je passe à un autre service' },
    { id: 'other', label: 'Autre raison' }
  ]);
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });
  
  // Mock data - à remplacer par des appels API réels
  useEffect(() => {
    // Simuler un appel API
    const fetchUserSubscription = async () => {
      try {
        // En production, cet appel serait remplacé par une vraie requête API
        // const response = await fetch('/api/subscription');
        // const data = await response.json();
        
        // Simulons les données pour la démo
        setTimeout(() => {
          setCurrentPlan({
            id: 'pro',
            name: 'Pro',
            price: 149,
            billingPeriod: 'monthly',
            startDate: '2023-01-15',
            nextBillingDate: '2023-04-15',
            status: 'active',
            features: [
              'Jusqu\'à 50 entretiens par mois',
              'Analyse de CV avancée',
              '5 postes configurables',
              'Questions personnalisées',
              'Rapports détaillés',
              'Analyse biométrique basique',
              'Support prioritaire'
            ],
            usageStats: {
              interviews: {
                used: 27,
                total: 50,
                percentage: 54
              },
              positions: {
                used: 3,
                total: 5,
                percentage: 60
              }
            }
          });
          
          setBillingHistory([
            {
              id: 'INV-2023-0012',
              date: '2023-03-15',
              amount: 149,
              status: 'paid',
              downloadUrl: '#'
            },
            {
              id: 'INV-2023-0008',
              date: '2023-02-15',
              amount: 149,
              status: 'paid',
              downloadUrl: '#'
            },
            {
              id: 'INV-2023-0004',
              date: '2023-01-15',
              amount: 149,
              status: 'paid',
              downloadUrl: '#'
            }
          ]);
          
          setPaymentMethods([
            {
              id: 'pm_1LkD2j',
              type: 'card',
              brand: 'visa',
              last4: '4242',
              expMonth: 12,
              expYear: 2025,
              isDefault: true
            }
          ]);
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des données d\'abonnement:', error);
        showToast('error', 'Impossible de charger les informations d\'abonnement');
        setLoading(false);
      }
    };

    fetchUserSubscription();
  }, [showToast]);
  
  // Plans disponibles pour changement
  const availablePlans = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 49,
      annualPrice: 490,
      description: 'Parfait pour les petites entreprises et les startups',
      features: [
        'Jusqu\'à 10 entretiens par mois',
        'Analyse de CV basique',
        '1 poste configurable',
        'Rapports standards',
        'Email support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 149,
      annualPrice: 1490,
      description: 'Idéal pour les entreprises en croissance',
      features: [
        'Jusqu\'à 50 entretiens par mois',
        'Analyse de CV avancée',
        '5 postes configurables',
        'Questions personnalisées',
        'Rapports détaillés',
        'Analyse biométrique basique',
        'Support prioritaire'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 499,
      annualPrice: 4990,
      description: 'Solution complète pour les grandes organisations',
      features: [
        'Entretiens illimités',
        'Analyse de CV et de compétences avancée',
        'Postes illimités',
        'Questions personnalisées avancées',
        'Analyse biométrique complète',
        'Intégration ATS complète',
        'API dédiée',
        'Manager de compte dédié'
      ]
    }
  ];

  const handleChangePlan = () => {
    setShowPlanSelector(true);
    // Sélectionner le plan actuel par défaut
    const current = availablePlans.find(plan => plan.id === currentPlan.id);
    setSelectedPlan(current);
    // Hériter de la période de facturation actuelle
    setBillingPeriod(currentPlan.billingPeriod);
  };

  const handleConfirmPlanChange = async () => {
    // Simuler un appel API pour changer de plan
    setProcessingAction(true);
    
    try {
      // Ici, vous feriez un appel API pour changer le plan
      // await fetch('/api/subscription/change-plan', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     planId: selectedPlan.id,
      //     billingPeriod: billingPeriod
      //   })
      // });
      
      // Simuler le délai d'appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mettre à jour l'état local avec le nouveau plan
      setCurrentPlan({
        ...currentPlan,
        id: selectedPlan.id,
        name: selectedPlan.name,
        price: billingPeriod === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice,
        billingPeriod: billingPeriod,
        features: selectedPlan.features,
        // Mise à jour des limites en fonction du nouveau plan
        usageStats: {
          interviews: {
            used: currentPlan.usageStats.interviews.used,
            total: selectedPlan.id === 'starter' ? 10 : selectedPlan.id === 'pro' ? 50 : 999,
            percentage: selectedPlan.id === 'starter' 
              ? (currentPlan.usageStats.interviews.used / 10) * 100 
              : selectedPlan.id === 'pro' 
                ? (currentPlan.usageStats.interviews.used / 50) * 100 
                : (currentPlan.usageStats.interviews.used / 999) * 100
          },
          positions: {
            used: currentPlan.usageStats.positions.used,
            total: selectedPlan.id === 'starter' ? 1 : selectedPlan.id === 'pro' ? 5 : 999,
            percentage: selectedPlan.id === 'starter' 
              ? (currentPlan.usageStats.positions.used / 1) * 100 
              : selectedPlan.id === 'pro' 
                ? (currentPlan.usageStats.positions.used / 5) * 100 
                : (currentPlan.usageStats.positions.used / 999) * 100
          }
        }
      });
      
      // Notifier l'utilisateur
      showToast('success', `Votre abonnement a été mis à jour vers le plan ${selectedPlan.name}`);
      
      // Fermer le sélecteur de plan
      setShowPlanSelector(false);
    } catch (error) {
      console.error('Erreur lors du changement de plan:', error);
      showToast('error', 'Erreur lors du changement de plan');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancelSubscription = async () => {
    setProcessingAction(true);
    
    try {
      // Ici, vous feriez un appel API pour annuler l'abonnement
      // await fetch('/api/subscription/cancel', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ reason: cancelReason })
      // });
      
      // Simuler le délai d'appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mettre à jour l'état local
      setCurrentPlan({
        ...currentPlan,
        status: 'canceled',
        // La fin de l'abonnement sera à la prochaine date de facturation
      });
      
      // Notifier l'utilisateur
      showToast('info', 'Votre abonnement a été annulé et prendra fin à la prochaine date de facturation');
      
      // Fermer la boîte de dialogue
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      showToast('error', 'Erreur lors de l\'annulation de l\'abonnement');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleAddPaymentMethod = () => {
    setShowAddCardForm(true);
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setNewCard({
      ...newCard,
      [name]: value
    });
  };

  const handleSubmitNewCard = async (e) => {
    e.preventDefault();
    setProcessingAction(true);
    
    try {
      // Ici, vous feriez un appel API pour ajouter la carte
      // await fetch('/api/payment-methods', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newCard)
      // });
      
      // Simuler le délai d'appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Ajouter la nouvelle carte à l'état local
      const last4 = newCard.cardNumber.slice(-4);
      const newPaymentMethod = {
        id: `pm_${Date.now()}`,
        type: 'card',
        brand: 'visa', // Dans une implémentation réelle, cela serait déterminé par l'API de paiement
        last4,
        expMonth: parseInt(newCard.expiryMonth),
        expYear: parseInt(newCard.expiryYear),
        isDefault: paymentMethods.length === 0 // Si c'est la première carte, la définir comme par défaut
      };
      
      setPaymentMethods([...paymentMethods, newPaymentMethod]);
      
      // Réinitialiser le formulaire
      setNewCard({
        cardNumber: '',
        cardholderName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: ''
      });
      
      // Notifier l'utilisateur
      showToast('success', 'Nouvelle carte ajoutée avec succès');
      
      // Fermer le formulaire
      setShowAddCardForm(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la carte:', error);
      showToast('error', 'Erreur lors de l\'ajout de la carte');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (methodId) => {
    setProcessingAction(true);
    
    try {
      // Ici, vous feriez un appel API pour définir la méthode par défaut
      // await fetch(`/api/payment-methods/${methodId}/set-default`, {
      //   method: 'POST'
      // });
      
      // Simuler le délai d'appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mettre à jour l'état local
      setPaymentMethods(paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === methodId
      })));
      
      // Notifier l'utilisateur
      showToast('success', 'Méthode de paiement par défaut mise à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la méthode par défaut:', error);
      showToast('error', 'Erreur lors de la mise à jour de la méthode par défaut');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId) => {
    setProcessingAction(true);
    
    try {
      // Vérifier si c'est la seule méthode de paiement
      if (paymentMethods.length === 1) {
        showToast('error', 'Vous ne pouvez pas supprimer votre seule méthode de paiement');
        setProcessingAction(false);
        return;
      }
      
      // Vérifier si c'est la méthode par défaut
      const isDefault = paymentMethods.find(m => m.id === methodId)?.isDefault;
      if (isDefault) {
        showToast('error', 'Vous ne pouvez pas supprimer votre méthode de paiement par défaut');
        setProcessingAction(false);
        return;
      }
      
      // Ici, vous feriez un appel API pour supprimer la méthode
      // await fetch(`/api/payment-methods/${methodId}`, {
      //   method: 'DELETE'
      // });
      
      // Simuler le délai d'appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mettre à jour l'état local
      setPaymentMethods(paymentMethods.filter(method => method.id !== methodId));
      
      // Notifier l'utilisateur
      showToast('success', 'Méthode de paiement supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression de la méthode de paiement:', error);
      showToast('error', 'Erreur lors de la suppression de la méthode de paiement');
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Facturation</h1>
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Facturation et abonnement</h1>
        
        {/* Résumé du plan actuel */}
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
                        onClick={handleChangePlan}
                        disabled={processingAction}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingAction ? 'Traitement en cours...' : 'Changer de plan'}
                      </button>
                      <button 
                        onClick={() => setShowCancelDialog(true)}
                        disabled={processingAction}
                        className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Annuler l'abonnement
                      </button>
                    </>
                  )}
                  
                  {currentPlan.status === 'canceled' && (
                    <button 
                      onClick={handleChangePlan}
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
        
        {/* Historique de facturation */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Historique de facturation</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Vos factures récentes
            </p>
          </div>
          
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Facture
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingHistory.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.amount}€
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href={invoice.downloadUrl} className="text-indigo-600 hover:text-indigo-900">
                          Télécharger
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {billingHistory.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-gray-500">
                  Aucune facture disponible pour le moment.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Méthodes de paiement */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg leading-6 font-medium text-gray-900">Méthodes de paiement</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Vos moyens de paiement enregistrés
              </p>
            </div>
            <button 
              onClick={handleAddPaymentMethod}
              disabled={processingAction || showAddCardForm}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ajouter une carte
            </button>
          </div>
          
          {/* Liste des méthodes de paiement */}
          <div className="border-t border-gray-200">
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
                          onClick={() => handleSetDefaultPaymentMethod(method.id)}
                          disabled={processingAction}
                          className="text-xs text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Définir par défaut
                        </button>
                      )}
                      {!method.isDefault && (
                        <button
                          onClick={() => handleDeletePaymentMethod(method.id)}
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
                  onClick={handleAddPaymentMethod}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Ajouter une carte
                </button>
              </div>
            )}

            {/* Formulaire d'ajout de carte */}
            {showAddCardForm && (
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Ajouter une nouvelle carte</h3>
                <form onSubmit={handleSubmitNewCard} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700">
                      Nom du titulaire
                    </label>
                    <input
                      type="text"
                      name="cardholderName"
                      id="cardholderName"
                      value={newCard.cardholderName}
                      onChange={handleCardInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                      Numéro de carte
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      id="cardNumber"
                      value={newCard.cardNumber}
                      onChange={handleCardInputChange}
                      required
                      maxLength="16"
                      pattern="[0-9]{16}"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700">
                        Mois d'expiration
                      </label>
                      <select
                        name="expiryMonth"
                        id="expiryMonth"
                        value={newCard.expiryMonth}
                        onChange={handleCardInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                            {(i + 1).toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700">
                        Année d'expiration
                      </label>
                      <select
                        name="expiryYear"
                        id="expiryYear"
                        value={newCard.expiryYear}
                        onChange={handleCardInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">AAAA</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        id="cvv"
                        value={newCard.cvv}
                        onChange={handleCardInputChange}
                        required
                        maxLength="3"
                        pattern="[0-9]{3}"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center">
                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                    <p className="ml-2 text-xs text-gray-500">
                      Vos données de paiement sont traitées de manière sécurisée. Nous ne stockons pas les détails de votre carte.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddCardForm(false)}
                      disabled={processingAction}
                      className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={processingAction}
                      className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingAction ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                          Traitement...
                        </span>
                      ) : (
                        'Ajouter la carte'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Dialogs modaux */}
        {/* Sélecteur de plan */}
        {showPlanSelector && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !processingAction && setShowPlanSelector(false)}></div>
              
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
                      onClick={() => setBillingPeriod('monthly')}
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
                      onClick={() => setBillingPeriod('annual')}
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
                      onClick={() => !processingAction && setSelectedPlan(plan)}
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
                        
                        {currentPlan.id === plan.id && (
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
                    onClick={() => setShowPlanSelector(false)}
                    disabled={processingAction}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPlanChange}
                    disabled={processingAction || !selectedPlan || (selectedPlan.id === currentPlan.id && billingPeriod === currentPlan.billingPeriod)}
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
        )}

        {/* Dialogue d'annulation */}
        {showCancelDialog && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !processingAction && setShowCancelDialog(false)}></div>
              
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
                        Êtes-vous sûr de vouloir annuler votre abonnement ? Vous aurez accès à votre compte jusqu'à la fin de la période de facturation ({new Date(currentPlan.nextBillingDate).toLocaleDateString('fr-FR')}).
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
                    onChange={(e) => setCancelReason(e.target.value)}
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
                    onClick={handleCancelSubscription}
                    disabled={processingAction}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-black hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    onClick={() => setShowCancelDialog(false)}
                    disabled={processingAction}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Retour
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage;