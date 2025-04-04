// frontend/services/user-service.js
import axios from 'axios';

// Configuration d'axios avec les intercepteurs pour gérer automatiquement les tokens
const api = axios.create({
  baseURL: '/api'
});

// Ajouter un intercepteur pour les requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Ajouter un intercepteur pour les réponses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si l'erreur est 401 (non autorisé) et que la requête n'a pas déjà été retentée
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Tenter de rafraîchir le token
        const response = await axios.post('/api/auth/refresh', {
          refresh_token: refreshToken
        });
        
        // Si le rafraîchissement a réussi
        if (response.data.tokens) {
          const { access_token, refresh_token } = response.data.tokens;
          
          // Mettre à jour les tokens
          localStorage.setItem('accessToken', access_token);
          localStorage.setItem('refreshToken', refresh_token);
          
          // Mettre à jour le header d'autorisation pour toutes les requêtes futures
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          
          // Retenter la requête originale avec le nouveau token
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        
        // Rediriger vers la page de connexion
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export class UserService {
  /**
   * Récupère les informations de profil de l'utilisateur
   * @returns {Promise<Object>} Les données du profil
   */
  static async getProfile() {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  /**
   * Met à jour les informations de profil de l'utilisateur
   * @param {Object} profileData - Les données de profil à mettre à jour
   * @returns {Promise<Object>} Les données du profil mises à jour
   */
  static async updateProfile(profileData) {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  /**
   * Met à jour l'avatar de l'utilisateur
   * @param {FormData} formData - Les données du formulaire contenant l'avatar
   * @returns {Promise<Object>} Les données du profil mises à jour
   */
  static async updateAvatar(formData) {
    try {
      const response = await api.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'avatar:", error);
      throw error;
    }
  }

  /**
   * Met à jour le mot de passe de l'utilisateur
   * @param {Object} passwordData - Les données du mot de passe à mettre à jour
   * @returns {Promise<Object>} La réponse de l'API
   */
  static async updatePassword(passwordData) {
    try {
      const response = await api.post('/users/profile/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      throw error;
    }
  }

  /**
   * Initialise la configuration de l'authentification à deux facteurs
   * @returns {Promise<Object>} Les données de configuration 2FA
   */
  static async initTwoFactorSetup() {
    try {
      const response = await api.post('/users/profile/2fa/init');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'authentification à deux facteurs:", error);
      throw error;
    }
  }

  /**
   * Vérifie le code d'authentification à deux facteurs
   * @param {Object} verificationData - Les données de vérification
   * @returns {Promise<Object>} La réponse de vérification
   */
  static async verifyTwoFactor(verificationData) {
    try {
      const response = await api.post('/users/profile/2fa/verify', verificationData);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification à deux facteurs:", error);
      throw error;
    }
  }

  /**
   * Désactive l'authentification à deux facteurs
   * @returns {Promise<Object>} La réponse de l'API
   */
  static async disableTwoFactor() {
    try {
      const response = await api.post('/users/profile/2fa');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la désactivation de l'authentification à deux facteurs:", error);
      throw error;
    }
  }

  /**
   * Met à jour les préférences de notification de l'utilisateur
   * @param {Object} preferences - Les préférences de notification
   * @returns {Promise<Object>} Les préférences mises à jour
   */
  static async updateNotificationPreferences(preferences) {
    try {
      const response = await api.put('/users/profile/notifications', preferences);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences de notification:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL d'authentification pour une intégration
   * @param {string} integrationId - L'identifiant de l'intégration
   * @returns {Promise<string>} L'URL d'authentification
   */
  static async getIntegrationAuthUrl(integrationId) {
    try {
      const response = await api.get(`/integrations/${integrationId}/auth-url`);
      return response.data.authUrl;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'URL d'authentification:", error);
      throw error;
    }
  }

  /**
   * Déconnecte une intégration
   * @param {string} integrationId - L'identifiant de l'intégration
   * @returns {Promise<Object>} La réponse de l'API
   */
  static async disconnectIntegration(integrationId) {
    try {
      const response = await api.delete(`/integrations/${integrationId}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la déconnexion de l'intégration:", error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des connexions de l'utilisateur
   * @returns {Promise<Array>} L'historique des connexions
   */
  static async getLoginHistory() {
    try {
      const response = await api.get('/users/profile/login-history');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique des connexions:", error);
      throw error;
    }
  }
}

export default UserService;