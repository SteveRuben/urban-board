// frontend/services/subscription-service.js
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const SubscriptionService = {
  // Récupérer les plans disponibles
  getPlans: async () => {
    try {
      const response = await axios.get(`${API_URL}/subscriptions/plans`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des plans:', error);
      throw error;
    }
  },

  // Récupérer l'abonnement actuel de l'utilisateur
  getCurrentSubscription: async () => {
    try {
      const response = await axios.get(`${API_URL}/subscriptions/current`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Adapter le format de données à celui attendu par le composant
      const subscription = response.data.data;
      const plan = subscription.plan;
      
      // Calculer le pourcentage d'utilisation (à adapter selon les données de l'API)
      const formatSubscriptionData = {
        id: plan.id,
        name: plan.name,
        price: subscription.billing_cycle === 'monthly' ? plan.price_monthly : plan.price_yearly,
        billingPeriod: subscription.billing_cycle,
        startDate: subscription.start_date,
        nextBillingDate: subscription.end_date,
        status: subscription.status,
        features: plan.features.filter(f => f.included).map(f => f.feature),
        // Ces données devront provenir d'une autre API pour l'utilisation réelle
        usageStats: {
          interviews: {
            used: 0, 
            total: 0,
            percentage: 0
          },
          positions: {
            used: 0,
            total: 0,
            percentage: 0
          }
        }
      };
      
      return formatSubscriptionData;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'abonnement:', error);
      throw error;
    }
  },
  
  // Récupérer l'historique de facturation
  getBillingHistory: async () => {
    try {
      const response = await axios.get(`${API_URL}/subscriptions/payments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Adapter le format des paiements à celui attendu par le composant
      return response.data.data.map(payment => ({
        id: payment.external_payment_id || `INV-${payment.id}`,
        date: payment.payment_date,
        amount: payment.amount,
        status: payment.payment_status === 'completed' ? 'paid' : 'pending',
        downloadUrl: payment.invoice_url || '#'
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique de facturation:', error);
      throw error;
    }
  },
  
  // Changer de plan
  changePlan: async (planId, billingCycle) => {
    try {
      const response = await axios.post(`${API_URL}/subscriptions/change-plan`, 
        { plan_id: planId, billing_cycle: billingCycle },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors du changement de plan:', error);
      throw error;
    }
  },
  
  // Annuler l'abonnement
  cancelSubscription: async (subscriptionId, reason) => {
    try {
      const response = await axios.post(`${API_URL}/subscriptions/${subscriptionId}/cancel`, 
        { reason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      throw error;
    }
  },
  
  // Obtenir un checkout URL pour paiement
  getCheckoutSession: async (planId, billingCycle) => {
    try {
      const response = await axios.post(`${API_URL}/subscriptions`, 
        { plan_id: planId, billing_cycle: billingCycle },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data.checkout_url;
    } catch (error) {
      console.error('Erreur lors de la création de la session de paiement:', error);
      throw error;
    }
  }
};

