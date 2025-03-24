// services/user-service.js
import axios from 'axios';
// import { API_URL } from '../config/constants'; ${API_URL}

export class UserService {
  /**
   * Récupère les informations de profil de l'utilisateur
   * @returns {Promise<Object>} Les données du profil
   */
  static async getProfile() {
    try {
      const response = await axios.get(`/api/users/profile`);
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
      const response = await axios.put(`/api/users/profile`, profileData);
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
      const response = await axios.post(`/api/users/profile/avatar`, formData, {
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
      const response = await axios.put(`/api/users/profile/password`, passwordData);
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
      const response = await axios.post(`/api/users/profile/2fa/init`);
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
      const response = await axios.post(`/api/users/profile/2fa/verify`, verificationData);
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
      const response = await axios.delete(`/api/users/profile/2fa`);
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
      const response = await axios.put(`/api/users/profile/notifications`, preferences);
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
      const response = await axios.get(`/api/integrations/${integrationId}/auth-url`);
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
      const response = await axios.delete(`/api/integrations/${integrationId}`);
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
      const response = await axios.get(`/api/users/profile/login-history`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique des connexions:", error);
      throw error;
    }
  }
}

export default UserService;