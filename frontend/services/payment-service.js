// frontend/services/payment-service.js
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const PaymentService = {
  // Récupérer les méthodes de paiement de l'utilisateur
  getPaymentMethods: async () => {
    try {
      const response = await axios.get(`${API_URL}/payment-methods`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Adapter le format à celui attendu par le composant
      return response.data.data.map(method => ({
        id: method.id,
        type: method.type,
        brand: method.brand || 'visa',
        last4: method.last4,
        expMonth: method.exp_month,
        expYear: method.exp_year,
        isDefault: method.is_default
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des méthodes de paiement:', error);
      throw error;
    }
  },
  
  // Ajouter une méthode de paiement
  addPaymentMethod: async (cardDetails) => {
    try {
      // Dans une implémentation réelle, il faudrait utiliser l'API Stripe.js
      // pour tokeniser la carte avant de l'envoyer au serveur
      const response = await axios.post(`${API_URL}/payment-methods`, 
        cardDetails,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la méthode de paiement:', error);
      throw error;
    }
  },
  
  // Définir une méthode de paiement par défaut
  setDefaultPaymentMethod: async (methodId) => {
    try {
      const response = await axios.post(`${API_URL}/payment-methods/${methodId}/set-default`, 
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la définition de la méthode par défaut:', error);
      throw error;
    }
  },
  
  // Supprimer une méthode de paiement
  deletePaymentMethod: async (methodId) => {
    try {
      const response = await axios.delete(`${API_URL}/payment-methods/${methodId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la méthode de paiement:', error);
      throw error;
    }
  }
};