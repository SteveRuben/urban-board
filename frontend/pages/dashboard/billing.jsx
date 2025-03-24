// frontend/pages/dashboard/billing.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useNotification } from '../../contexts/NotificationContext';
import { SubscriptionService } from '../../services/subscription-service';
import { PaymentService } from '../../services/payment-service';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Composants
import CurrentPlanCard from '../../components/billing/CurrentPlanCard';
import NoPlanCard from '../../components/billing/NoPlanCard';
import BillingHistoryCard from '../../components/billing/BillingHistoryCard';
import AddCardForm from '../../components/billing/AddCardForm';
import PlanSelectorModal from '../../components/billing/PlanSelectorModal';
import CancelSubscriptionModal from '../../components/billing/CancelSubscriptionModal';
import PaymentMethodsCard from '../../components/billing/PaymentMethodsCard';

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
  const [availablePlans, setAvailablePlans] = useState([]);
  
  // Charger les données de l'utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Charger les plans disponibles
        const plans = await SubscriptionService.getPlans();
        setAvailablePlans(plans.map(plan => ({
          id: plan.id.toString(),
          name: plan.name,
          monthlyPrice: plan.price_monthly,
          annualPrice: plan.price_yearly,
          description: plan.description || `Plan ${plan.name}`,
          features: plan.features
            .filter(feature => feature.included)
            .map(feature => feature.feature)
        })));
        
        // Essayer de charger l'abonnement actuel
        try {
          const subscription = await SubscriptionService.getCurrentSubscription();
          setCurrentPlan(subscription);
          setBillingPeriod(subscription.billingPeriod);
        } catch (error) {
          // L'utilisateur n'a peut-être pas d'abonnement actif
          console.log('Aucun abonnement actif trouvé');
        }
        
        // Charger l'historique de facturation
        try {
          const history = await SubscriptionService.getBillingHistory();
          setBillingHistory(history);
        } catch (error) {
          console.error('Impossible de charger l\'historique de facturation', error);
          setBillingHistory([]);
        }
        
        // Charger les méthodes de paiement
        try {
          const methods = await PaymentService.getPaymentMethods();
          setPaymentMethods(methods);
        } catch (error) {
          console.error('Impossible de charger les méthodes de paiement', error);
          setPaymentMethods([]);
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showToast('error', 'Impossible de charger les informations d\'abonnement');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [showToast]);

  const handleChangePlan = () => {
    setShowPlanSelector(true);
    // Sélectionner le plan actuel par défaut si disponible
    if (currentPlan) {
      const current = availablePlans.find(plan => plan.id === currentPlan.id.toString());
      setSelectedPlan(current || availablePlans[0]);
      // Hériter de la période de facturation actuelle
      setBillingPeriod(currentPlan.billingPeriod);
    } else {
      setSelectedPlan(availablePlans[0]);
      setBillingPeriod('monthly');
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleChangeBillingPeriod = (period) => {
    setBillingPeriod(period);
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) return;
    
    setProcessingAction(true);
    
    try {
      // Si l'utilisateur n'a pas d'abonnement actif, rediriger vers Stripe Checkout
      if (!currentPlan || currentPlan.status === 'expired') {
        const checkoutUrl = await SubscriptionService.getCheckoutSession(
          selectedPlan.id,
          billingPeriod
        );
        
        // Rediriger vers la page de paiement Stripe
        window.location.href = checkoutUrl;
        return;
      }
      
      // Sinon, mettre à jour l'abonnement existant
      const response = await SubscriptionService.changePlan(
        selectedPlan.id,
        billingPeriod
      );
      
      // Mettre à jour l'état local avec le nouveau plan
      // Note: idéalement, rechargez les données depuis l'API
      const updatedSubscription = await SubscriptionService.getCurrentSubscription();
      setCurrentPlan(updatedSubscription);
      
      // Notifier l'utilisateur
      showToast('success', `Votre abonnement a été mis à jour vers le plan ${selectedPlan.name}`);
      
      // Fermer le sélecteur de plan
      setShowPlanSelector(false);
    } catch (error) {
      console.error('Erreur lors du changement de plan:', error);
      showToast('error', 'Erreur lors du changement de plan: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentPlan) return;
    
    setProcessingAction(true);
    
    try {
      await SubscriptionService.cancelSubscription(
        currentPlan.id,
        cancelReason
      );
      
      // Mettre à jour l'état local
      setCurrentPlan({
        ...currentPlan,
        status: 'canceled'
      });
      
      // Notifier l'utilisateur
      showToast('info', 'Votre abonnement a été annulé et prendra fin à la prochaine date de facturation');
      
      // Fermer la boîte de dialogue
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      showToast('error', 'Erreur lors de l\'annulation de l\'abonnement: ' + (error.response?.data?.message || error.message));
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
      // Préparer les données pour l'API
      const cardData = {
        card_number: newCard.cardNumber,
        cardholder_name: newCard.cardholderName,
        exp_month: newCard.expiryMonth,
        exp_year: newCard.expiryYear,
        cvv: newCard.cvv
      };
      
      // Envoyer la demande à l'API
      const response = await PaymentService.addPaymentMethod(cardData);
      
      // Recharger les méthodes de paiement
      const methods = await PaymentService.getPaymentMethods();
      setPaymentMethods(methods);
      
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
      showToast('error', 'Erreur lors de l\'ajout de la carte: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (methodId) => {
    setProcessingAction(true);
    
    try {
      await PaymentService.setDefaultPaymentMethod(methodId);
      
      // Mettre à jour l'état local
      setPaymentMethods(paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === methodId
      })));
      
      // Notifier l'utilisateur
      showToast('success', 'Méthode de paiement par défaut mise à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la méthode par défaut:', error);
      showToast('error', 'Erreur lors de la mise à jour de la méthode par défaut: ' + (error.response?.data?.message || error.message));
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
      
      // Envoyer la demande à l'API
      await PaymentService.deletePaymentMethod(methodId);
      
      // Mettre à jour l'état local
      setPaymentMethods(paymentMethods.filter(method => method.id !== methodId));
      
      // Notifier l'utilisateur
      showToast('success', 'Méthode de paiement supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression de la méthode de paiement:', error);
      showToast('error', 'Erreur lors de la suppression de la méthode de paiement: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancelCardForm = () => {
    setShowAddCardForm(false);
    setNewCard({
      cardNumber: '',
      cardholderName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: ''
    });
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
        {currentPlan ? (
          <CurrentPlanCard 
            currentPlan={currentPlan}
            processingAction={processingAction}
            onChangePlan={handleChangePlan}
            onShowCancelDialog={() => setShowCancelDialog(true)}
          />
        ) : (
          <NoPlanCard onChangePlan={handleChangePlan} />
        )}
        
        {/* Historique de facturation */}
        <BillingHistoryCard billingHistory={billingHistory} />
        
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
            {showAddCardForm ? (
              <AddCardForm 
                newCard={newCard}
                processingAction={processingAction}
                onCardInputChange={handleCardInputChange}
                onSubmitNewCard={handleSubmitNewCard}
                onCancel={handleCancelCardForm}
              />
            ) : (
              <PaymentMethodsCard 
                paymentMethods={paymentMethods}
                processingAction={processingAction}
                showAddCardForm={showAddCardForm}
                onAddPaymentMethod={handleAddPaymentMethod}
                onSetDefaultPaymentMethod={handleSetDefaultPaymentMethod}
                onDeletePaymentMethod={handleDeletePaymentMethod}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        {showPlanSelector && (
          <PlanSelectorModal 
            selectedPlan={selectedPlan}
            billingPeriod={billingPeriod}
            availablePlans={availablePlans}
            processingAction={processingAction}
            currentPlan={currentPlan}
            onClose={() => setShowPlanSelector(false)}
            onSelectPlan={handleSelectPlan}
            onChangeBillingPeriod={handleChangeBillingPeriod}
            onConfirm={handleConfirmPlanChange}
          />
        )}

        {showCancelDialog && (
          <CancelSubscriptionModal 
            cancelReason={cancelReason}
            cancelReasons={cancelReasons}
            processingAction={processingAction}
            currentPlan={currentPlan}
            onClose={() => setShowCancelDialog(false)}
            onChangeReason={setCancelReason}
            onConfirmCancel={handleCancelSubscription}
          />
        )}
      </div>
    </div>
  );
};

BillingPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default BillingPage;