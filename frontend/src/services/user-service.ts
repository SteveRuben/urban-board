// frontend/services/user-service.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthUrlResponse, LoginHistoryEntry, NotificationPreferences, PasswordData, ProfileData, TokenResponse, TwoFactorSetupData, TwoFactorVerificationData } from '../types';


// Extension de AxiosRequestConfig pour ajouter la propriété _retry
interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Configuration d'axios avec les intercepteurs pour gérer automatiquement les tokens
export const api: AxiosInstance = axios.create({
  baseURL: '/api'
});

// Ajouter un intercepteur pour les requêtes
api.interceptors.request.use(
    // @ts-ignore
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Ajouter un intercepteur pour les réponses
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: any) => {
    const originalRequest = error.config as RetryableRequestConfig;
    
    // Si l'erreur est 401 (non autorisé) et que la requête n'a pas déjà été retentée
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Tenter de rafraîchir le token
        const response = await axios.post<TokenResponse>('/api/auth/refresh', {
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
          
          if (axios.defaults.headers.common) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          }
          
          // Retenter la requête originale avec le nouveau token
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          }
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
   * @returns {Promise<ProfileData>} Les données du profil
   */
  static async getProfile(): Promise<ProfileData> {
    try {
      const response = await api.get<ProfileData>('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  /**
   * Met à jour les informations de profil de l'utilisateur
   * @param {ProfileData} profileData - Les données de profil à mettre à jour
   * @returns {Promise<ProfileData>} Les données du profil mises à jour
   */
  static async updateProfile(profileData: Partial<ProfileData>): Promise<ProfileData> {
    try {
      const response = await api.put<ProfileData>('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  /**
   * Met à jour l'avatar de l'utilisateur
   * @param {FormData} formData - Les données du formulaire contenant l'avatar
   * @returns {Promise<ProfileData>} Les données du profil mises à jour
   */
  static async updateAvatar(formData: FormData): Promise<ProfileData> {
    try {
      const response = await api.post<ProfileData>('/users/profile/avatar', formData, {
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
   * @param {PasswordData} passwordData - Les données du mot de passe à mettre à jour
   * @returns {Promise<any>} La réponse de l'API
   */
  static async updatePassword(passwordData: PasswordData): Promise<any> {
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
   * @returns {Promise<TwoFactorSetupData>} Les données de configuration 2FA
   */
  static async initTwoFactorSetup(): Promise<TwoFactorSetupData> {
    try {
      const response = await api.post<TwoFactorSetupData>('/users/profile/2fa/init');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'authentification à deux facteurs:", error);
      throw error;
    }
  }

  /**
   * Vérifie le code d'authentification à deux facteurs
   * @param {TwoFactorVerificationData} verificationData - Les données de vérification
   * @returns {Promise<any>} La réponse de vérification
   */
  static async verifyTwoFactor(verificationData: TwoFactorVerificationData): Promise<any> {
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
   * @returns {Promise<any>} La réponse de l'API
   */
  static async disableTwoFactor(): Promise<any> {
    try {
      const response = await api.post('/users/profile/2fa/disable');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la désactivation de l'authentification à deux facteurs:", error);
      throw error;
    }
  }

  /**
   * Met à jour les préférences de notification de l'utilisateur
   * @param {NotificationPreferences} preferences - Les préférences de notification
   * @returns {Promise<NotificationPreferences>} Les préférences mises à jour
   */
  static async updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    try {
      const response = await api.put<NotificationPreferences>('/users/profile/notifications', preferences);
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
  static async getIntegrationAuthUrl(integrationId: string): Promise<string> {
    try {
      const response = await api.get<AuthUrlResponse>(`/integrations/${integrationId}/auth-url`);
      return response.data.authUrl;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'URL d'authentification:", error);
      throw error;
    }
  }

  /**
   * Déconnecte une intégration
   * @param {string} integrationId - L'identifiant de l'intégration
   * @returns {Promise<any>} La réponse de l'API
   */
  static async disconnectIntegration(integrationId: string): Promise<any> {
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
   * @returns {Promise<LoginHistoryEntry[]>} L'historique des connexions
   */
  static async getLoginHistory(): Promise<LoginHistoryEntry[]> {
    try {
      const response = await api.get<LoginHistoryEntry[]>('/users/profile/login-history');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique des connexions:", error);
      throw error;
    }
  }
}

export default UserService;