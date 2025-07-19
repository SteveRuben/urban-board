import { v4 as uuidv4 } from 'uuid';
import { LogoData, TokenResponse } from '@/types';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
// Extension de AxiosRequestConfig pour ajouter la propriété _retry
interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Configuration d'axios avec les intercepteurs pour gérer automatiquement les tokens
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  maxRedirects: 0, // Handle redirects manually
});

// Ajouter un intercepteur pour les requêtes
// Intercepteur (version améliorée)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['X-Request-ID'] = uuidv4(); // Add unique request ID
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

    if (error.response?.status === 308) {
      const redirectUrl = error.response.headers.location;
      if (redirectUrl) {
        return api.request({
          ...originalRequest,
          url: redirectUrl,
          headers: {
            ...originalRequest.headers,
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
      }
    }

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

export class OrganizationService {

  /**
    * Met à jour l'avatar de l'utilisateur
    * @param {FormData} formData - Les données du formulaire contenant l'avatar
    * @returns {Promise<LogoData>} Les données du profil mises à jour
    */
  static async uploadLogo(formData: FormData): Promise<LogoData> {
    try {
      const response = await api.post<LogoData>('/organizations/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Request-ID': uuidv4()
        },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'upload du logo de l'organisation':", error);
      throw error;
    }
  }

  static async createOrganization(data: any): Promise<any> {
    try {
      const response = await api.post('http://localhost:5000/api/organizations', data, {
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': uuidv4() // Track this specific request
        },
        params: {
          _t: Date.now()
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Request failed:', {
          url: error.config?.url,
          status: error.response?.status,
          headers: error.response?.headers
        });
      }
      throw error;
    }
  }
}

export default OrganizationService;